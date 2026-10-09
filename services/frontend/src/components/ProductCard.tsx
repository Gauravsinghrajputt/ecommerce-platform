import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import ProductImage from "./ProductImage";
import { LOW_STOCK } from "./StockStatus";

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const out = product.stock <= 0;
  return (
    <li className="group">
      <Link href={`/products/${product.slug}`} className="block rounded-card focus-visible:outline-offset-4">
        <div className="relative overflow-hidden rounded-card border border-line">
          <ProductImage src={product.image_url} alt="" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" priority={priority}
            className={out ? "opacity-60" : "transition-transform duration-300 group-hover:scale-[1.03]"} />
          {(out || product.stock <= LOW_STOCK) && (
            <span className="absolute left-3 top-3 rounded-pill bg-surface px-2.5 py-1 text-xs font-semibold text-ink shadow-card">
              {out ? "Out of stock" : `Only ${product.stock} left`}
            </span>
          )}
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-muted">{categoryLabel(product.category)}</p>
        <h3 className="mt-0.5 font-sans text-base font-semibold text-ink group-hover:text-accent">{product.name}</h3>
        <p className="mt-1 text-sm text-ink-soft">{formatPrice(product.price_cents, product.currency)}</p>
      </Link>
    </li>
  );
}
