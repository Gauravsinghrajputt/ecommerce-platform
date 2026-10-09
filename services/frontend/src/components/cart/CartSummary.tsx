"use client";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";

export default function CartSummary() {
  const { subtotalCents, shippingCents, totalCents } = useCart();
  const row = "flex justify-between text-sm";
  return (
    <dl className="space-y-2">
      <div className={row}><dt className="text-ink-soft">Subtotal</dt><dd className="tabular-nums">{formatPrice(subtotalCents)}</dd></div>
      <div className={row}><dt className="text-ink-soft">Delivery</dt><dd className="tabular-nums">{shippingCents === 0 ? "Free" : formatPrice(shippingCents)}</dd></div>
      <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(totalCents)}</dd></div>
    </dl>
  );
}
