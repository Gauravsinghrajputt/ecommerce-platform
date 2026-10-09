import Link from "next/link";
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import { getCatalog } from "@/lib/api";
import { brand } from "@/lib/brand";
import { categories } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

const FEATURED = ["classic-tee", "canvas-backpack", "steel-bottle", "desk-lamp"];

export default async function Home() {
  const { products } = await getCatalog();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const featured = FEATURED.map((s) => bySlug.get(s)).filter((p): p is Product => p !== undefined);
  const shown = featured.length >= 4 ? featured : products.slice(0, 4);
  const count = (slug: string) => products.filter((p) => p.category === slug).length;

  return (
    <>
      <section className="container-page grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">New in the shop</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{brand.tagline}</h1>
          <p className="mt-4 max-w-md text-lg text-ink-soft">Twelve everyday pieces across apparel, bags, desk gear and drinkware. Simple shapes, plain colours, fair prices.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="btn-primary">Shop the collection<ArrowRight aria-hidden className="h-4 w-4" /></Link>
            <Link href="/products?sort=price-asc" className="btn-secondary">Lowest prices first</Link>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4">
          {shown.map((p, i) => (
            <li key={p.id} className={i % 2 === 1 ? "mt-6" : ""}>
              <Link href={`/products/${p.slug}`} className="block overflow-hidden rounded-card border border-line" aria-label={p.name}>
                <ProductImage src={p.image_url} alt="" sizes="(min-width: 768px) 25vw, 45vw" priority={i < 2} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cats" className="container-page py-8">
        <h2 id="cats" className="text-2xl font-semibold">Shop by category</h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((c) => {
            const cover = bySlug.get(c.coverSlug);
            return (
              <li key={c.slug}>
                <Link href={`/products?category=${c.slug}`} className="group block overflow-hidden rounded-card border border-line bg-surface transition-shadow hover:shadow-card">
                  <ProductImage src={cover?.image_url ?? null} alt="" sizes="(min-width: 1024px) 25vw, 50vw" className="aspect-[4/3]" />
                  <div className="p-4">
                    <h3 className="font-sans text-base font-semibold group-hover:text-accent">{c.label}</h3>
                    <p className="mt-0.5 text-sm text-ink-soft">{c.blurb}</p>
                    <p className="mt-2 text-xs text-ink-muted">{count(c.slug)} products</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="featured" className="container-page py-12">
        <div className="flex items-end justify-between gap-4">
          <h2 id="featured" className="text-2xl font-semibold">Everyday favourites</h2>
          <Link href="/products" className="text-sm font-semibold text-accent hover:text-accent-dark">View all</Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {shown.map((p) => <ProductCard key={p.id} product={p} />)}
        </ul>
      </section>

      <section aria-label="Delivery, returns and checkout" className="border-y border-line bg-surface">
        <ul className="container-page grid gap-6 py-8 sm:grid-cols-3">
          <li className="flex gap-3"><Truck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><p className="text-sm"><strong className="block font-semibold">Free delivery over {formatPrice(brand.freeShippingThresholdCents)}</strong><span className="text-ink-soft">Otherwise a flat {formatPrice(brand.flatShippingCents)}.</span></p></li>
          <li className="flex gap-3"><RotateCcw aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><p className="text-sm"><strong className="block font-semibold">{brand.returnDays}-day returns</strong><span className="text-ink-soft">On unused items in original packaging.</span></p></li>
          <li className="flex gap-3"><ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><p className="text-sm"><strong className="block font-semibold">Checkout that asks for little</strong><span className="text-ink-soft">Guest checkout. In this demo no payment is taken.</span></p></li>
        </ul>
      </section>
    </>
  );
}
