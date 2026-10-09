"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { brand } from "@/lib/brand";
import { categories } from "@/lib/categories";
import { useCart } from "./cart/CartProvider";
import DemoBadge from "./DemoBadge";

function SearchForm({ id }: { id: string }) {
  return (
    <form action="/products" role="search" className="relative w-full">
      <label htmlFor={id} className="sr-only">Search products</label>
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      <input id={id} name="q" type="search" placeholder="Search products" autoComplete="off" className="input pl-9" />
    </form>
  );
}

export default function SiteHeader({ isDemo }: { isDemo: boolean }) {
  const { count, hydrated, openDrawer } = useCart();
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  useEffect(() => setMenu(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <button type="button" className="rounded-control p-2 hover:bg-sand md:hidden" aria-expanded={menu} aria-controls="mobile-menu"
          aria-label={menu ? "Close menu" : "Open menu"} onClick={() => setMenu((m) => !m)}>
          {menu ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
        </button>
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-tight">{brand.name}</span>
          {isDemo && <DemoBadge />}
        </Link>
        <nav aria-label="Main" className="ml-4 hidden items-center gap-5 text-sm font-medium md:flex">
          <Link href="/products" className="hover:text-accent">Shop</Link>
          {categories.map((c) => <Link key={c.slug} href={`/products?category=${c.slug}`} className="text-ink-soft hover:text-accent">{c.label}</Link>)}
        </nav>
        <div className="ml-auto hidden w-64 md:block"><SearchForm id="header-search" /></div>
        <button type="button" onClick={openDrawer} className="relative ml-auto rounded-control p-2 hover:bg-sand md:ml-0" aria-label={`Open cart, ${hydrated ? count : 0} items`}>
          <ShoppingBag aria-hidden className="h-5 w-5" />
          {hydrated && count > 0 && <span aria-hidden className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-pill bg-accent px-1 text-[11px] font-bold text-white">{count}</span>}
        </button>
      </div>
      {menu && (
        <div id="mobile-menu" className="border-t border-line bg-paper md:hidden">
          <div className="container-page space-y-4 py-4">
            <SearchForm id="mobile-search" />
            <nav aria-label="Mobile" className="grid gap-1 text-base font-medium">
              <Link href="/products" className="rounded-control px-2 py-2.5 hover:bg-sand">All products</Link>
              {categories.map((c) => <Link key={c.slug} href={`/products?category=${c.slug}`} className="rounded-control px-2 py-2.5 text-ink-soft hover:bg-sand">{c.label}</Link>)}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
