import { pool } from "../config/db";
import { AppError, isUniqueViolation } from "../utils/errors";
import { withTransaction } from "../utils/tx";
import * as cart from "./cart.service";
import { createGatewayOrder, keyId } from "./payment.service";
import { invalidateProductCache } from "./product.service";

const checkoutResponse = (r: any, replayed = false) => ({
  orderId: r.id as string,
  status: r.status as string,
  totalCents: r.total_cents as number,
  currency: (r.currency as string).trim(),
  gateway: { provider: r.provider as string, orderId: r.provider_order_id as string, keyId: keyId() },
  replayed,
});

async function findByIdempotencyKey(userId: string, key: string) {
  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.total_cents, o.currency, p.provider, p.provider_order_id
       FROM orders o JOIN payments p ON p.order_id = o.id
      WHERE o.user_id = $1 AND o.idempotency_key = $2`,
    [userId, key]
  );
  return rows[0];
}

/**
 * Validate cart -> reserve stock -> create order -> create gateway order, in ONE DB transaction.
 * If the gateway call fails we ROLLBACK, so stock is never leaked.
 */
export async function checkout(userId: string, idempotencyKey?: string) {
  if (idempotencyKey) {
    const existing = await findByIdempotencyKey(userId, idempotencyKey);
    if (existing) return checkoutResponse(existing, true);
  }

  const raw = await cart.getRaw(userId);
  // Sorted lock order => concurrent checkouts can't deadlock on product rows.
  const entries = Object.entries(raw).sort(([a], [b]) => a.localeCompare(b));
  if (!entries.length) throw new AppError(400, "CART_EMPTY", "Your cart is empty");

  try {
    const result = await withTransaction(async (client) => {
      let total = 0;
      let currency: string | undefined;
      const lines: { productId: string; quantity: number; unitPrice: number }[] = [];

      for (const [productId, quantity] of entries) {
        // Atomic check-and-decrement: no oversell even under concurrency.
        const { rows } = await client.query(
          `UPDATE products SET stock = stock - $2
            WHERE id = $1 AND is_active = TRUE AND stock >= $2
        RETURNING price_cents, currency`,
          [productId, quantity]
        );
        if (!rows[0]) throw new AppError(409, "INSUFFICIENT_STOCK", "An item in your cart is unavailable or out of stock", { productId });
        const cur = (rows[0].currency as string).trim();
        if (currency && currency !== cur) throw new AppError(400, "MIXED_CURRENCY", "Cart contains mixed currencies");
        currency = cur;
        total += rows[0].price_cents * quantity;
        lines.push({ productId, quantity, unitPrice: rows[0].price_cents });
      }

      const { rows: [order] } = await client.query(
        `INSERT INTO orders (user_id, status, total_cents, currency, idempotency_key)
         VALUES ($1, 'PENDING_PAYMENT', $2, $3, $4) RETURNING id, status, total_cents, currency`,
        [userId, total, currency, idempotencyKey ?? null]
      );
      for (const l of lines) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents) VALUES ($1,$2,$3,$4)`,
          [order.id, l.productId, l.quantity, l.unitPrice]
        );
      }

      const gw = await createGatewayOrder({ amountCents: total, currency: currency!, receipt: order.id });
      await client.query(
        `INSERT INTO payments (order_id, provider, provider_order_id, status, amount_cents, currency)
         VALUES ($1, 'razorpay', $2, 'created', $3, $4)`,
        [order.id, gw.id, total, currency]
      );
      return checkoutResponse({ ...order, provider: "razorpay", provider_order_id: gw.id });
    });
    await invalidateProductCache(); // stock changed
    return result;
  } catch (err) {
    // Two identical requests raced: the loser hits the unique index; hand it the winner's order.
    if (idempotencyKey && isUniqueViolation(err, "uq_orders_user_idem")) {
      const existing = await findByIdempotencyKey(userId, idempotencyKey);
      if (existing) return checkoutResponse(existing, true);
    }
    throw err;
  }
}

export async function getOrder(orderId: string, requester: { id: string; role: string }) {
  const { rows } = await pool.query(
    `SELECT o.id, o.user_id, o.status, o.total_cents, o.currency, o.created_at,
            p.provider, p.provider_order_id, p.status AS payment_status
       FROM orders o LEFT JOIN payments p ON p.order_id = o.id WHERE o.id = $1`,
    [orderId]
  );
  const o = rows[0];
  if (!o || (o.user_id !== requester.id && requester.role !== "admin")) throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  const { rows: items } = await pool.query(
    `SELECT oi.product_id, pr.name, oi.quantity, oi.unit_price_cents
       FROM order_items oi JOIN products pr ON pr.id = oi.product_id WHERE oi.order_id = $1`,
    [orderId]
  );
  return {
    id: o.id, status: o.status, totalCents: o.total_cents, currency: o.currency.trim(), createdAt: o.created_at,
    payment: { provider: o.provider, providerOrderId: o.provider_order_id, status: o.payment_status },
    items: items.map((i) => ({ productId: i.product_id, name: i.name, quantity: i.quantity, unitPriceCents: i.unit_price_cents })),
  };
}

export async function listOrders(userId: string) {
  const { rows } = await pool.query(
    `SELECT id, status, total_cents, currency, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return rows.map((o) => ({ id: o.id, status: o.status, totalCents: o.total_cents, currency: o.currency.trim(), createdAt: o.created_at }));
}
