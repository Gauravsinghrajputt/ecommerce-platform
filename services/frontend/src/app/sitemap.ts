import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/api";
import { brand } from "@/lib/brand";
import { categories } from "@/lib/categories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products } = await getCatalog();
  const url = (path: string) => `${brand.siteUrl}${path}`;
  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/products"), changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: url(`/products?category=${c.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: url(`/products/${p.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
