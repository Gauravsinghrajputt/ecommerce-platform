import { Job, Worker } from "bullmq";
import IORedis from "ioredis";
import { Pool, PoolClient } from "pg";

const PAYMENT_QUEUE = "payment-webhooks-queue";
const PRODUCT_CACHE_KEY = "products:all";

const redisUrl = process.env.REDIS_URL;
const databaseUrl = process.env.DATABASE_URL;
const ORDER_EXPIRY_MINUTES = Number(process.env.ORDER_EXPIRY_MINUTES ?? 30);
if (!redisUrl || !databaseUrl) {
  console.error("REDIS_URL and DATABASE_URL are required");
  process.exit(1);
}

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const pool = new Pool({ connectionString: databaseUrl, max: 5 });

// ---------------------------------------------------------------- helpers
async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

/** Give back the stock an order had reserved. Callers MUST only call this right after winning a status transition. */
async function restoreStock(c: PoolClient, orderId: string) {
  await c.query(
    `UPDATE products p SET stock = p.stock + oi.quantity
       FROM order_items oi WHERE oi.order_id = $1 AND oi.product_id = p.id`,
    [orderId]
  );
}

/** Re-reserve stock for an order we had already released (late payment). All-or-nothing via SAVEPOINT. */
async function tryReserveStock(c: PoolClient, orderId: string): Promise<boolean> {
  await c.query("SAVEPOINT reserve");
  const { rows } = await c.query(`SELECT product_id, quantity FROM order_items WHERE order_id = $1 ORDER BY product_id`, [orderId]);
  for (const it of rows) {
    const r = await c.query(`UPDATE products SET stock = stock - $2 WHERE id = $1 AND stock >= $2`, [it.product_id, it.quantity]);
    if (r.rowCount === 0) {
      await c.query("ROLLBACK TO SAVEPOINT reserve");
      return false;
    }
  }
  await c.query("RELEASE SAVEPOINT reserve");
  return true;
}

interface Effects { clearCartFor?: string; stockChanged?: boolean }

// ---------------------------------------------------------------- event handlers
async function onPaymentCaptured(c: PoolClient, gatewayOrderId: string, paymentId?: string): Promise<Effects> {
  const { rows } = await c.query(
    `SELECT p.id AS payment_id, o.id AS order_id, o.user_id, o.status
       FROM payments p JOIN orders o ON o.id = p.order_id
      WHERE p.provider_order_id = $1 FOR UPDATE OF p, o`,
    [gatewayOrderId]
  );
  const row = rows[0];
  if (!row) { console.warn(`[worker] no payment row for gateway order ${gatewayOrderId}`); return {}; }

  await c.query(`UPDATE payments SET status = 'captured', provider_payment_id = COALESCE($2, provider_payment_id) WHERE id = $1`, [
    row.payment_id, paymentId ?? null,
  ]);

  if (row.status === "PENDING_PAYMENT") {
    await c.query(`UPDATE orders SET status = 'PAID' WHERE id = $1`, [row.order_id]);
    console.log(`[worker] order ${row.order_id} -> PAID`);
    return { clearCartFor: row.user_id };
  }
  if (row.status === "FAILED" || row.status === "CANCELLED") {
    // Money arrived for an order we had already released (e.g. retry succeeded after an earlier failed attempt).
    if (await tryReserveStock(c, row.order_id)) {
      await c.query(`UPDATE orders SET status = 'PAID' WHERE id = $1`, [row.order_id]);
      console.log(`[worker] order ${row.order_id} recovered ${row.status} -> PAID`);
      return { clearCartFor: row.user_id, stockChanged: true };
    }
    console.error(`[worker] ACTION REQUIRED: payment captured for order ${row.order_id} (${row.status}) but stock is gone -> refund manually`);
  }
  return {}; // already PAID/SHIPPED/...: duplicate, nothing to do
}

async function onPaymentFailed(c: PoolClient, gatewayOrderId: string): Promise<Effects> {
  const { rows } = await c.query(
    `SELECT p.id AS payment_id, o.id AS order_id FROM payments p JOIN orders o ON o.id = p.order_id
      WHERE p.provider_order_id = $1 FOR UPDATE OF p, o`,
    [gatewayOrderId]
  );
  const row = rows[0];
  if (!row) { console.warn(`[worker] no payment row for gateway order ${gatewayOrderId}`); return {}; }

  await c.query(`UPDATE payments SET status = 'failed' WHERE id = $1 AND status <> 'captured'`, [row.payment_id]);
  // Only the request that actually flips PENDING_PAYMENT -> FAILED restores stock (=> idempotent).
  const flipped = await c.query(`UPDATE orders SET status = 'FAILED' WHERE id = $1 AND status = 'PENDING_PAYMENT' RETURNING id`, [row.order_id]);
  if (flipped.rowCount) {
    await restoreStock(c, row.order_id);
    console.log(`[worker] order ${row.order_id} -> FAILED, stock restored`);
    return { stockChanged: true };
  }
  return {};
}

async function dispatch(c: PoolClient, evt: any): Promise<Effects> {
  const payment = evt?.payload?.payment?.entity;
  const gatewayOrderId: string | undefined = payment?.order_id ?? evt?.payload?.order?.entity?.id;
  switch (evt?.event) {
    case "payment.captured":
    case "order.paid": // Razorpay sends both for a successful payment; handling is idempotent
      if (!gatewayOrderId) return {};
      return onPaymentCaptured(c, gatewayOrderId, payment?.id);
    case "payment.failed":
      if (!gatewayOrderId) return {};
      return onPaymentFailed(c, gatewayOrderId);
    default:
      console.log(`[worker] ignoring event type '${evt?.event}'`);
      return {};
  }
}

// ---------------------------------------------------------------- queue consumer
async function processWebhook(job: Job<{ webhookEventId: string }>) {
  const effects = await tx(async (c) => {
    // Row lock serialises duplicate deliveries; `processed` makes re-runs no-ops.
    const { rows } = await c.query(`SELECT payload, processed FROM webhook_events WHERE id = $1 FOR UPDATE`, [job.data.webhookEventId]);
    if (!rows[0] || rows[0].processed) return {} as Effects;
    const out = await dispatch(c, rows[0].payload);
    await c.query(`UPDATE webhook_events SET processed = TRUE WHERE id = $1`, [job.data.webhookEventId]);
    return out;
  });

  // Redis side-effects AFTER the DB commit succeeded.
  if (effects.clearCartFor) await connection.del(`cart:${effects.clearCartFor}`);
  if (effects.stockChanged) await connection.del(PRODUCT_CACHE_KEY);
}

const worker = new Worker(PAYMENT_QUEUE, processWebhook, { connection, concurrency: 5 });
worker.on("completed", (job) => console.log(`[worker] job ${job.id} (${job.name}) done`));
worker.on("failed", (job, err) => console.error(`[worker] job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`));

// ---------------------------------------------------------------- abandoned-order reaper
// Unpaid orders hold stock. Cancel them after ORDER_EXPIRY_MINUTES. Safe to run on many replicas (guarded UPDATE).
async function expirePendingOrders() {
  const { rows } = await pool.query(
    `SELECT id FROM orders WHERE status = 'PENDING_PAYMENT' AND created_at < now() - make_interval(mins => $1::int) LIMIT 100`,
    [ORDER_EXPIRY_MINUTES]
  );
  let released = 0;
  for (const { id } of rows) {
    await tx(async (c) => {
      const r = await c.query(`UPDATE orders SET status = 'CANCELLED' WHERE id = $1 AND status = 'PENDING_PAYMENT' RETURNING id`, [id]);
      if (r.rowCount) { await restoreStock(c, id); released++; }
    });
  }
  if (released) {
    await connection.del(PRODUCT_CACHE_KEY);
    console.log(`[worker] expired ${released} unpaid order(s), stock restored`);
  }
}
const reaper = setInterval(() => expirePendingOrders().catch((e) => console.error("[worker] reaper error", e)), 60_000);

console.log(`[worker] started: queue='${PAYMENT_QUEUE}', unpaid orders expire after ${ORDER_EXPIRY_MINUTES} min`);

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} received, shutting down`);
  clearInterval(reaper);
  await worker.close();
  await pool.end();
  connection.disconnect();
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
