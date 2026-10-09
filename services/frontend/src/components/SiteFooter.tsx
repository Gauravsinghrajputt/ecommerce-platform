import Link from "next/link";
import { brand } from "@/lib/brand";
import { categories } from "@/lib/categories";

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-xl font-semibold">{brand.name}</p>
          <p className="mt-2 max-w-xs text-sm text-ink-soft">{brand.tagline}</p>
        </div>
        <nav aria-label="Shop categories">
          <h2 className="font-sans text-sm font-semibold">Shop</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link href="/products" className="hover:text-accent">All products</Link></li>
            {categories.map((c) => <li key={c.slug}><Link href={`/products?category=${c.slug}`} className="hover:text-accent">{c.label}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Store">
          <h2 className="font-sans text-sm font-semibold">Your order</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link href="/cart" className="hover:text-accent">Cart</Link></li>
            <li><Link href="/checkout" className="hover:text-accent">Checkout</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="container-page py-4 text-xs text-ink-muted">{brand.demoNotice} Products, prices and orders shown here are sample data.</p>
      </div>
    </footer>
  );
}
