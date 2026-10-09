"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";
import { SORTS, SORT_LABELS, buildShopHref, type ShopParams } from "@/lib/catalog";
import { categories } from "@/lib/categories";

// All filter state lives in the URL, so every view is shareable and back/forward just works.
export default function ShopControls({ params }: { params: ShopParams }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(params.q);
  const mounted = useRef(false);

  useEffect(() => setQ(params.q), [params.q]);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (q.trim() === params.q) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(sp.toString());
      if (q.trim()) next.set("q", q.trim()); else next.delete("q");
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const chip = (active: boolean) => clsx("rounded-pill border px-4 py-2 text-sm font-medium transition-colors", active ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:bg-sand");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="shop-search" className="sr-only">Search products</label>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input id="shop-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" autoComplete="off" className="input pl-9" />
        </div>
        <div className="sm:w-56">
          <label htmlFor="shop-sort" className="sr-only">Sort by</label>
          <select id="shop-sort" value={params.sort} className="input" onChange={(e) => router.push(buildShopHref({ ...params, sort: e.target.value as ShopParams["sort"], page: 1 }))}>
            {SORTS.map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
          </select>
        </div>
      </div>
      <nav aria-label="Categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={buildShopHref({ ...params, category: undefined, page: 1 })} aria-current={!params.category ? "page" : undefined} className={clsx(chip(!params.category), "shrink-0")}>All</Link>
        {categories.map((c) => (
          <Link key={c.slug} href={buildShopHref({ ...params, category: c.slug, page: 1 })} aria-current={params.category === c.slug ? "page" : undefined} className={clsx(chip(params.category === c.slug), "shrink-0")}>{c.label}</Link>
        ))}
      </nav>
    </div>
  );
}
