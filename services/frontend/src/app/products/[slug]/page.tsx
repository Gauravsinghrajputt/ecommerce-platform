import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, ChevronRight, RotateCcw, Truck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import ProductPurchase from "@/components/ProductPurchase";
import StockStatus from "@/components/StockStatus";
import { getCatalog, getProduct, relatedTo } from "@/lib/api";
import { brand } from "@/lib/brand";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/format";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await getProduct(params.slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description: product.description, type: "website", url: `/products/${product.slug}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const { product } = await getProduct(params.slug);
  if (!product) notFound();
  const { products } = await getCatalog();
  const related = relatedTo(product, products);

  // Structured data describes only facts we have: no ratings, reviews or sales counts.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.slug,
    category: categoryLabel(product.category),
    ...(product.image_url ? { image: new URL(product.image_url, brand.siteUrl).toString() } : {}),
    offers: {
      "@type": "Offer",
      url: `${brand.siteUrl}/products/${product.slug}`,
      priceCurrency: product.currency,
      price: (product.price_cents / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-page py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-ink-muted">
        <Link href="/products" className="hover:text-accent">Shop</Link><ChevronRight aria-hidden className="h-3.5 w-3.5" />
        <Link href={`/products?category=${product.category}`} className="hover:text-accent">{categoryLabel(product.category)}</Link><ChevronRight aria-hidden className="h-3.5 w-3.5" />
        <span aria-current="page" className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-card border border-line">
          <ProductImage src={product.image_url} alt={product.name} sizes="(min-width: 768px) 50vw, 100vw" priority />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{categoryLabel(product.category)}</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-2xl font-semibold">{formatPrice(product.price_cents, product.currency)}</p>
          <div className="mt-4"><StockStatus stock={product.stock} /></div>
          <p className="mt-5 leading-relaxed text-ink-soft">{product.description}</p>
          <ProductPurchase product={product} />
          <div className="mt-8 divide-y divide-line border-y border-line">
            {[
              { title: "Delivery", icon: Truck, body: `Free over ${formatPrice(brand.freeShippingThresholdCents)}, otherwise a flat ${formatPrice(brand.flatShippingCents)}. This is a demo store, so nothing is actually shipped.` },
              { title: "Returns", icon: RotateCcw, body: `Unused items can be returned within ${brand.returnDays} days.` },
            ].map(({ title, icon: Icon, body }) => (
              <details key={title} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3"><Icon aria-hidden className="h-5 w-5 text-accent" />{title}</span>
                  <ChevronDown aria-hidden className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 pl-8 text-sm leading-relaxed text-ink-soft">{body}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      <section aria-labelledby="related" className="mt-20">
        <h2 id="related" className="text-2xl font-semibold">You might also like</h2>
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">{related.map((p) => <ProductCard key={p.id} product={p} />)}</ul>
      </section>
    </div>
  );
}
