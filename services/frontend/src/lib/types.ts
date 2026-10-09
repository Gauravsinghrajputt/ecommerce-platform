import { z } from "zod";

export const CATEGORY_SLUGS = ["apparel", "bags", "home-desk", "drinkware"] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

// Runtime-validated: if the API ever returns an unexpected shape we fall back to demo data instead of crashing.
export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  category: z.enum(CATEGORY_SLUGS),
  description: z.string(),
  price_cents: z.number().int().nonnegative(),
  currency: z.string().transform((c) => c.trim()),
  stock: z.number().int().nonnegative(),
  image_url: z.string().nullable(),
});
export type Product = z.infer<typeof productSchema>;

export type User = { id: string; email: string; fullName: string; role: "customer" | "admin" };
