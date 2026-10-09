import { pool } from "../config/db";
import { redis } from "../config/redis";

// Cart = Redis hash  cart:{userId}  ->  { productId: quantity }.  HSET/HDEL are atomic per field.
const key = (userId: string) => `cart:${userId}`;
const CART_TTL_SECONDS = 7 * 24 * 3600;

export async function setItem(userId: string, productId: string, quantity: number) {
  await redis.multi().hset(key(userId), productId, quantity).expire(key(userId), CART_TTL_SECONDS).exec();
}
export async function removeItem(userId: string, productId: string) {
  await redis.hdel(key(userId), productId);
}
export async function clear(userId: string) {
  await redis.del(key(userId));
}
export async function getRaw(userId: string): Promise<Record<string, number>> {
  const raw = await redis.hgetall(key(userId));
  return Object.fromEntries(Object.entries(raw).map(([id, q]) => [id, Number(q)]));
}

/** Cart enriched with live product data (prices always come from Postgres, never from the client). */
export async function getCart(userId: string) {
  const raw = await getRaw(userId);
  const ids = Object.keys(raw);
  if (!ids.length) return { items: [], totalCents: 0, currency: "INR" };

  const { rows } = await pool.query(
    `SELECT id, slug, name, price_cents, currency, stock FROM products WHERE id = ANY($1::uuid[]) AND is_active = TRUE`,
    [ids]
  );
  const byId = new Map(rows.map((r) => [r.id, r]));
  const stale = ids.filter((id) => !byId.has(id));
  if (stale.length) await redis.hdel(key(userId), ...stale); // product deleted/deactivated

  const items = ids.filter((id) => byId.has(id)).map((id) => {
    const p = byId.get(id)!;
    return {
      productId: id, slug: p.slug, name: p.name, priceCents: p.price_cents, currency: p.currency,
      stock: p.stock, quantity: raw[id], lineTotalCents: p.price_cents * raw[id],
    };
  });
  return { items, totalCents: items.reduce((s, i) => s + i.lineTotalCents, 0), currency: items[0]?.currency ?? "INR" };
}
