"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";
import CartLines from "./CartLines";
import CartSummary from "./CartSummary";
import EmptyCart from "./EmptyCart";
import FreeShippingBar from "./FreeShippingBar";

export default function CartView() {
  const { items, hydrated, subtotalCents } = useCart();
  if (!hydrated) return <div aria-hidden className="mt-8 space-y-4">{[0, 1].map((i) => <div key={i} className="skeleton h-28" />)}</div>;
  if (items.length === 0) return <EmptyCart />;
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
      <CartLines />
      <aside className="h-fit space-y-4 rounded-card border border-line bg-surface p-5 shadow-card lg:sticky lg:top-24">
        <FreeShippingBar subtotalCents={subtotalCents} />
        <CartSummary />
        <Link href="/checkout" className="btn-primary w-full">Continue to checkout</Link>
        <Link href="/products" className="btn-secondary w-full">Keep shopping</Link>
      </aside>
    </div>
  );
}
