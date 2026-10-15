"use client";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "./cart/CartProvider";
import QuantityStepper from "./cart/QuantityStepper";

export default function ProductPurchase({ product }: { product: Product }) {
  const { add, openDrawer, items, hydrated } = useCart();
  const [qty, setQty] = useState(1);

  // What the cart already holds counts against stock, so the stepper never offers more than can be added.
  const inCart = hydrated ? items.find((i) => i.productId === product.id)?.quantity ?? 0 : 0;
  const remaining = Math.max(product.stock - inCart, 0);
  const max = Math.min(remaining, 10);
  const quantity = Math.min(Math.max(qty, 1), Math.max(max, 1));
  const out = product.stock <= 0;
  const allInCart = !out && remaining === 0;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-4">
        {!out && !allInCart && <QuantityStepper label="Quantity" value={quantity} max={max} onChange={setQty} />}
        <button type="button" disabled={out || allInCart} className="btn-primary min-w-48 flex-1 sm:flex-none"
          onClick={() => { if (add(product, quantity) === "added") { setQty(1); openDrawer(); } }}>
          <ShoppingBag aria-hidden className="h-4 w-4" />{out ? "Out of stock" : allInCart ? "Maximum in cart" : "Add to cart"}
        </button>
      </div>
      {inCart > 0 && !out && (
        <p className="mt-3 text-sm text-ink-soft">
          {inCart} in your cart{allInCart ? `. That's all we have in stock.` : "."}
        </p>
      )}
    </div>
  );
}
