import { z } from "zod";
import { categoryLabel } from "./categories";
import { CATEGORY_SLUGS, type Product } from "./types";

export const SORTS = ["newest", "price-asc", "price-desc"] as const;
export const SORT_LABELS: Record<(typeof SORTS)[number], string> = {
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};
export const PAGE_SIZE = 8;

// Every field falls back to a safe default, so a hand-edited URL can never crash the page.
export const shopParamsSchema = z.object({
  category: z.enum(CATEGORY_SLUGS).optional().catch(undefined),
  sort: z.enum(SORTS).catch("newest"),
  q: z.string().trim().max(80).catch(""),
  page: z.coerce.number().int().min(1).catch(1),
});
export type ShopParams = z.infer<typeof shopParamsSchema>;

export type RawSearchParams = Record<string, string | string[] | undefined>;
export function parseShopParams(raw: RawSearchParams): ShopParams {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return shopParamsSchema.parse({ category: first(raw.category), sort: first(raw.sort), q: first(raw.q), page: first(raw.page) });
}

export function buildShopHref(p: Partial<ShopParams>): string {
  const sp = new URLSearchParams();
  if (p.category) sp.set("category", p.category);
  if (p.q) sp.set("q", p.q);
  if (p.sort && p.sort !== "newest") sp.set("sort", p.sort);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const qs = sp.toString();
  return qs ? `/products?${qs}` : "/products";
}

export function queryProducts(all: Product[], p: ShopParams) {
  const tokens = p.q.toLowerCase().split(/\s+/).filter(Boolean);
  let list = all.filter((x) => !p.category || x.category === p.category);
  if (tokens.length) {
    list = list.filter((x) => {
      const hay = `${x.name} ${x.description} ${categoryLabel(x.category)}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }
  if (p.sort === "price-asc") list = [...list].sort((a, b) => a.price_cents - b.price_cents);
  if (p.sort === "price-desc") list = [...list].sort((a, b) => b.price_cents - a.price_cents);

  const total = list.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(p.page, pageCount);
  return { items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, page, pageCount };
}
