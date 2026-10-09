import { pool } from "../config/db";
import { redis } from "../config/redis";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

const CACHE_KEY = "products:all";
const COLUMNS = "id, slug, name, description, price_cents, currency, stock, image_url, category";

/** Cache-aside: Redis first, Postgres on miss or if Redis is down. */
export async function listProducts() {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn("[cache] read failed, falling back to Postgres:", (err as Error).message);
  }
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM products WHERE is_active = TRUE ORDER BY created_at DESC`);
  try {
    await redis.set(CACHE_KEY, JSON.stringify(rows), "EX", env.PRODUCT_CACHE_TTL_SECONDS);
  } catch (err) {
    console.warn("[cache] write failed:", (err as Error).message);
  }
  return rows;
}

export async function invalidateProductCache() {
  try { await redis.del(CACHE_KEY); } catch (err) { console.warn("[cache] invalidate failed:", (err as Error).message); }
}

export async function getProductBySlug(slug: string) {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM products WHERE slug = $1 AND is_active = TRUE`, [slug]);
  return rows[0] ?? null;
}

export async function getActiveProduct(id: string) {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM products WHERE id = $1 AND is_active = TRUE`, [id]);
  return rows[0] ?? null;
}

export async function createProduct(p: any) {
  const { rows } = await pool.query(
    `INSERT INTO products (slug, name, category, description, price_cents, currency, stock, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${COLUMNS}, is_active`,
    [p.slug, p.name, p.category, p.description, p.price_cents, p.currency, p.stock, p.image_url ?? null]
  );
  await invalidateProductCache();
  return rows[0];
}

const UPDATABLE = ["slug", "name", "category", "description", "price_cents", "stock", "image_url", "is_active"] as const;
export async function updateProduct(id: string, patch: Record<string, unknown>) {
  const sets: string[] = [];
  const values: unknown[] = [id];
  for (const col of UPDATABLE) {
    if (col in patch) { values.push(patch[col]); sets.push(`${col} = $${values.length}`); }
  }
  const { rows } = await pool.query(`UPDATE products SET ${sets.join(", ")} WHERE id = $1 RETURNING ${COLUMNS}, is_active`, values);
  if (!rows[0]) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  await invalidateProductCache();
  return rows[0];
}
