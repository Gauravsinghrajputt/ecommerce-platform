"use client";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "./cart/CartProvider";
import QuantityStepper from "./cart/QuantityStepper";

export default function ProductPurchase({ product }: { product: Product }) {
  const { add, openDrawer } = useCart();
  const [qty, setQty] = useState(1);
  const out = product.stock <= 0;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      {!out && <QuantityStepper label="Quantity" value={qty} max={Math.min(product.stock, 10)} onChange={setQty} />}
      <button type="button" disabled={out} className="btn-primary min-w-48 flex-1 sm:flex-none"
        onClick={() => { if (add(product, qty) === "added") openDrawer(); }}>
        <ShoppingBag aria-hidden className="h-4 w-4" />{out ? "Out of stock" : "Add to cart"}
      </button>
    </div>
  );
}
