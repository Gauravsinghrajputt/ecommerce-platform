import type { CategorySlug } from "./types";

export const categories: { slug: CategorySlug; label: string; blurb: string; coverSlug: string }[] = [
  { slug: "apparel", label: "Apparel", blurb: "Tees, sweatshirts and light layers", coverSlug: "classic-tee" },
  { slug: "bags", label: "Bags", blurb: "Carry-alls for work and weekends", coverSlug: "canvas-backpack" },
  { slug: "home-desk", label: "Home & Desk", blurb: "Small upgrades for where you work", coverSlug: "desk-lamp" },
  { slug: "drinkware", label: "Drinkware", blurb: "Mugs, bottles and tumblers", coverSlug: "steel-bottle" },
];

export const categoryLabel = (slug: CategorySlug) => categories.find((c) => c.slug === slug)?.label ?? slug;
