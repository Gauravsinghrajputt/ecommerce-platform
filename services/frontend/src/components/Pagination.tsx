import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildShopHref, type ShopParams } from "@/lib/catalog";

export default function Pagination({ params, page, pageCount }: { params: ShopParams; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const link = "btn-secondary px-4 py-2";
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-between">
      {page > 1 ? <Link href={buildShopHref({ ...params, page: page - 1 })} className={link} rel="prev"><ChevronLeft aria-hidden className="h-4 w-4" />Previous</Link> : <span />}
      <p className="text-sm text-ink-soft">Page {page} of {pageCount}</p>
      {page < pageCount ? <Link href={buildShopHref({ ...params, page: page + 1 })} className={link} rel="next">Next<ChevronRight aria-hidden className="h-4 w-4" /></Link> : <span />}
    </nav>
  );
}
