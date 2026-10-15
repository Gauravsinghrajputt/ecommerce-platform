"use client";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "./cart/CartProvider";

// Shown on hover/focus where hover exists (desktop), always visible on touch screens.
export default function QuickAdd({ product }: { product: Product }) {
  const { add, openDrawer, items } = useCart();
  if (product.stock <= 0) return null;
  const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  return (
    <button
      type="button"
      disabled={inCart >= product.stock}
      aria-label={inCart >= product.stock ? `${product.name}: all available units are in your cart` : `Add ${product.name} to cart`}
      onClick={() => { if (add(product, 1) === "added") openDrawer(); }}
      className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-pill bg-surface text-ink shadow-card transition-all hover:bg-accent hover:text-white disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-ink [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:translate-y-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100"
    >
      <Plus aria-hidden className="h-5 w-5" />
    </button>
  );
}
