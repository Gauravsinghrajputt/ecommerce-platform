import clsx from "clsx";
import Link from "next/link";
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import { getCatalog } from "@/lib/api";
import { brand } from "@/lib/brand";
import { categories } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import { plural } from "@/lib/text";

const BUDGET_CENTS = 100_000;

export default async function Home() {
  const { products } = await getCatalog();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const [newest, second] = products; // catalogue is ordered newest first
  const justAdded = products.slice(0, 4);
  const budget = products.filter((p) => p.stock > 0 && p.price_cents < BUDGET_CENTS).sort((a, b) => a.price_cents - b.price_cents).slice(0, 4);
  const countIn = (slug: string) => products.filter((p) => p.category === slug).length;

  return (
    <>
      <section className="container-page grid items-center gap-12 py-12 md:grid-cols-[1.05fr_1fr] md:py-20">
        <div className="animate-fade-up">
          {newest && (
            <Link href={`/products/${newest.slug}`} className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface py-1.5 pl-1.5 pr-4 text-sm hover:bg-sand">
              <span className="rounded-pill bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">New</span>
              {newest.name}
            </Link>
          )}
          <h1 className="mt-6 text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">{brand.tagline}</h1>
          <p className="mt-5 max-w-md text-lg text-ink-soft">
            {plural(products.length, "product")} in {plural(categories.length, "category", "categories")}. Free delivery over {formatPrice(brand.freeShippingThresholdCents)}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="btn-primary">Shop all products<ArrowRight aria-hidden className="h-4 w-4" /></Link>
            <a href="#categories" className="btn-secondary">Browse categories</a>
          </div>
        </div>

        {newest && (
          <div className="animate-fade-up relative pb-14 sm:pb-20" style={{ animationDelay: "120ms" }}>
            <Link href={`/products/${newest.slug}`} className="relative block w-[80%] overflow-hidden rounded-card border border-line shadow-card" aria-label={newest.name}>
              <ProductImage src={newest.image_url} alt="" sizes="(min-width: 768px) 40vw, 80vw" priority />
              <span className="absolute bottom-3 left-3 rounded-control bg-surface px-3 py-2 text-sm shadow-card">
                <span className="block font-semibold">{newest.name}</span>
                <span className="block text-ink-muted">{formatPrice(newest.price_cents, newest.currency)}</span>
              </span>
            </Link>
            {second && (
              <Link href={`/products/${second.slug}`} aria-label={second.name} className="absolute bottom-0 right-0 block w-[46%] overflow-hidden rounded-card border-4 border-paper shadow-pop">
                <ProductImage src={second.image_url} alt="" sizes="(min-width: 768px) 20vw, 40vw" priority />
              </Link>
            )}
          </div>
        )}
      </section>

      <section id="categories" aria-labelledby="cats" className="container-page scroll-mt-24 py-10">
        <h2 id="cats" className="text-2xl font-semibold sm:text-3xl">Shop by category</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {categories.map((c, i) => (
            <li key={c.slug} className={clsx(i === 0 && "lg:col-span-2 lg:row-span-2")}>
              <Link href={`/products?category=${c.slug}`} className="group relative block h-full overflow-hidden rounded-card border border-line">
                <ProductImage src={bySlug.get(c.coverSlug)?.image_url ?? null} alt="" sizes={i === 0 ? "(min-width: 1024px) 50vw, 50vw" : "(min-width: 1024px) 25vw, 50vw"} className="transition-transform duration-500 group-hover:scale-[1.04]" />
                <span className="absolute bottom-3 left-3 rounded-control bg-surface px-3 py-2 shadow-card">
                  <span className="block font-sans text-sm font-semibold group-hover:text-accent">{c.label}</span>
                  <span className="block text-xs text-ink-muted">{plural(countIn(c.slug), "product")}</span>
                </span>
              </Link>
            </li>
          ))}
          {/* Fills the 4th small slot beside the large tile (2 cols x 2 rows = large + 4 small); full-width banner on phones. */}
          <li className="col-span-2 lg:col-span-1">
            <Link href="/products" className="group flex h-full min-h-28 flex-col justify-between rounded-card bg-ink p-5 text-paper transition-colors hover:bg-accent-dark">
              <span className="font-display text-xl font-semibold">All products</span>
              <span className="mt-6 flex items-center justify-between text-sm">
                <span>{plural(products.length, "product")}</span>
                <ArrowRight aria-hidden className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <section aria-labelledby="new" className="container-page py-12">
        <div className="flex items-end justify-between gap-4">
          <h2 id="new" className="text-2xl font-semibold sm:text-3xl">Just added</h2>
          <Link href="/products" className="text-sm font-semibold text-accent hover:text-accent-dark">View all</Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">{justAdded.map((p) => <ProductCard key={p.id} product={p} />)}</ul>
      </section>

      {budget.length > 0 && (
        <section aria-labelledby="budget" className="container-page py-8">
          <div className="flex items-end justify-between gap-4">
            <h2 id="budget" className="text-2xl font-semibold sm:text-3xl">Under {formatPrice(BUDGET_CENTS)}</h2>
            <Link href="/products?sort=price-asc" className="text-sm font-semibold text-accent hover:text-accent-dark">Sort everything by price</Link>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">{budget.map((p) => <ProductCard key={p.id} product={p} />)}</ul>
        </section>
      )}

      <section aria-label="Delivery, returns and checkout" className="mt-12 border-y border-line bg-surface">
        <ul className="container-page grid gap-8 py-10 sm:grid-cols-3">
          {[
            { icon: Truck, title: `Free delivery over ${formatPrice(brand.freeShippingThresholdCents)}`, body: `Otherwise a flat ${formatPrice(brand.flatShippingCents)}.` },
            { icon: RotateCcw, title: `${brand.returnDays}-day returns`, body: "Unused items can be sent back." },
            { icon: ShieldCheck, title: "Guest checkout", body: "No account needed. In this demo, no payment is taken." },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-accent-soft"><Icon aria-hidden className="h-5 w-5 text-accent-dark" /></span>
              <p className="text-sm"><strong className="block font-semibold">{title}</strong><span className="text-ink-soft">{body}</span></p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
