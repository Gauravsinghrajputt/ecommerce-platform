"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import CartLines from "./CartLines";
import CartSummary from "./CartSummary";
import EmptyCart from "./EmptyCart";
import FreeShippingBar from "./FreeShippingBar";
import { useCart } from "./CartProvider";

// Native <dialog>: focus trap, Escape to close and inert background come from the browser.
export default function CartDrawer() {
  const { drawerOpen, closeDrawer, items, subtotalCents, hydrated } = useCart();
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (drawerOpen && !d.open) d.showModal();
    if (!drawerOpen && d.open) d.close();
  }, [drawerOpen]);
  useEffect(() => { closeDrawer(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <dialog
      ref={ref}
      aria-labelledby="cart-drawer-title"
      onClose={closeDrawer}
      onClick={(e) => { if (e.target === ref.current) closeDrawer(); }}
      className="m-0 ml-auto h-full max-h-full w-full max-w-md bg-paper p-0 text-ink shadow-pop backdrop:bg-ink/40 open:flex open:flex-col"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="cart-drawer-title" className="text-xl font-semibold">Your cart</h2>
        <button type="button" onClick={closeDrawer} aria-label="Close cart" className="rounded-control p-2 hover:bg-sand"><X aria-hidden className="h-5 w-5" /></button>
      </div>
      {!hydrated ? null : items.length === 0 ? (
        <div className="flex-1 overflow-y-auto px-5"><EmptyCart onNavigate={closeDrawer} /></div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-5"><CartLines onNavigate={closeDrawer} /></div>
          <div className="space-y-4 border-t border-line bg-surface px-5 py-4">
            <FreeShippingBar subtotalCents={subtotalCents} />
            <CartSummary />
            <Link href="/checkout" className="btn-primary w-full">Checkout</Link>
            <Link href="/cart" className="btn-secondary w-full">View cart</Link>
          </div>
        </>
      )}
    </dialog>
  );
}
