import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import ShopControls from "@/components/ShopControls";
import { getCatalog } from "@/lib/api";
import { PAGE_SIZE, parseShopParams, queryProducts, type RawSearchParams } from "@/lib/catalog";
import { categoryLabel } from "@/lib/categories";

export async function generateMetadata({ searchParams }: { searchParams: RawSearchParams }): Promise<Metadata> {
  const p = parseShopParams(searchParams);
  const title = p.category ? categoryLabel(p.category) : "Shop all products";
  return { title, description: `Browse ${p.category ? categoryLabel(p.category).toLowerCase() : "everything"} in the demo store.`, alternates: { canonical: p.category ? `/products?category=${p.category}` : "/products" } };
}

export default async function ShopPage({ searchParams }: { searchParams: RawSearchParams }) {
  const params = parseShopParams(searchParams);
  const { products } = await getCatalog();
  const { items, total, page, pageCount } = queryProducts(products, params);
  const filtered = Boolean(params.q || params.category);

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-semibold">{params.category ? categoryLabel(params.category) : "All products"}</h1>
      <div className="mt-6"><ShopControls params={params} /></div>
      <p role="status" aria-live="polite" className="mt-6 text-sm text-ink-muted">
        {total === 0 ? "No products found" : `Showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + items.length} of ${total} products`}
      </p>
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <SearchX aria-hidden className="h-10 w-10 text-ink-muted" />
          <h2 className="mt-4 text-xl font-semibold">Nothing matches that</h2>
          <p className="mt-1 text-sm text-ink-soft">{filtered ? "Try a different word or clear the filters." : "There are no products to show yet."}</p>
          {filtered && <Link href="/products" className="btn-primary mt-6">Clear filters</Link>}
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
        </ul>
      )}
      <Pagination params={params} page={page} pageCount={pageCount} />
    </div>
  );
}
