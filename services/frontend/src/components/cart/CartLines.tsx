"use client";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import ProductImage from "../ProductImage";
import { useCart } from "./CartProvider";
import QuantityStepper from "./QuantityStepper";

export default function CartLines({ onNavigate }: { onNavigate?: () => void }) {
  const { items, setQuantity, remove } = useCart();
  return (
    <ul className="divide-y divide-line">
      {items.map((i) => (
        <li key={i.productId} className="flex gap-4 py-4">
          <Link href={`/products/${i.slug}`} onClick={onNavigate} className="w-20 shrink-0 overflow-hidden rounded-control border border-line sm:w-24">
            <ProductImage src={i.image_url} alt="" sizes="96px" />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex justify-between gap-3">
              <Link href={`/products/${i.slug}`} onClick={onNavigate} className="font-semibold text-ink hover:text-accent">{i.name}</Link>
              <p className="shrink-0 font-semibold tabular-nums">{formatPrice(i.price_cents * i.quantity, i.currency)}</p>
            </div>
            <p className="text-sm text-ink-muted">{formatPrice(i.price_cents, i.currency)} each</p>
            <div className="mt-auto flex items-center justify-between pt-3">
              <QuantityStepper label={`Quantity for ${i.name}`} value={i.quantity} max={i.stock} onChange={(q) => setQuantity(i.productId, q)} />
              <button type="button" onClick={() => remove(i.productId)} className="inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-sm text-ink-muted hover:text-danger">
                <Trash2 aria-hidden className="h-4 w-4" /><span>Remove<span className="sr-only"> {i.name}</span></span>
              </button>
            </div>
            {i.quantity >= i.stock && <p className="mt-2 text-xs text-warn">Maximum available quantity.</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
