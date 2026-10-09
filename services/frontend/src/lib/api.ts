// Typed catalogue client. SERVER-ONLY in practice: it uses react `cache()` and the internal Docker URL.
import { cache } from "react";
import { z } from "zod";
import { DEMO_PRODUCTS } from "./demo-data";
import { productSchema, type Product } from "./types";

export type CatalogSource = "api" | "demo";
export interface Catalog { products: Product[]; source: CatalogSource }

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Server components talk to the API over the Docker network; browsers use the public URL.
export const apiBaseUrl = () =>
  (typeof window === "undefined" ? process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL : process.env.NEXT_PUBLIC_API_URL) ??
  "http://localhost:4000";

/** Demo mode, or an unreachable / misbehaving API, serves the bundled demo data. Memoised per request. */
export const getCatalog = cache(async (): Promise<Catalog> => {
  if (DEMO_MODE) return { products: DEMO_PRODUCTS, source: "demo" };
  try {
    const res = await fetch(`${apiBaseUrl()}/api/v1/products`, { next: { revalidate: 30 }, signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const json: unknown = await res.json();
    const products = z.object({ data: z.array(productSchema) }).parse(json).data;
    return { products, source: "api" };
  } catch {
    return { products: DEMO_PRODUCTS, source: "demo" };
  }
});

export async function getProduct(slug: string): Promise<{ product: Product | null; source: CatalogSource }> {
  const { products, source } = await getCatalog();
  return { product: products.find((p) => p.slug === slug) ?? null, source };
}

export function relatedTo(product: Product, all: Product[], limit = 4): Product[] {
  const same = all.filter((p) => p.category === product.category && p.id !== product.id);
  const rest = all.filter((p) => p.category !== product.category);
  return [...same, ...rest].slice(0, limit);
}
