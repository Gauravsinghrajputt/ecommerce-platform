"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { z } from "zod";
import { shippingFor } from "@/lib/brand";
import type { Product } from "@/lib/types";

const KEY = "ministore.cart.v1";

const cartItemSchema = z.object({
  productId: z.string(), slug: z.string(), name: z.string(),
  price_cents: z.number(), currency: z.string(), image_url: z.string().nullable(),
  stock: z.number(), quantity: z.number().int().min(1),
});
export type CartItem = z.infer<typeof cartItemSchema>;

interface CartContextValue {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (product: Product, qty?: number) => "added" | "limit";
  setQuantity: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [message, setMessage] = useState("");

  // Load once on the client (avoids a server/client hydration mismatch), then persist every change.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = z.array(cartItemSchema).safeParse(raw ? JSON.parse(raw) : []);
      if (parsed.success) setItems(parsed.data);
    } catch { /* corrupt or blocked storage: start with an empty cart */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage full/blocked */ }
  }, [items, hydrated]);

  const announce = (text: string) => setMessage(`${text} ${Date.now() % 2 ? "\u00a0" : ""}`); // nbsp toggle re-announces identical text

  const add = useCallback((product: Product, qty = 1): "added" | "limit" => {
    const current = items.find((i) => i.productId === product.id)?.quantity ?? 0;
    const next = Math.min(current + qty, product.stock);
    if (next <= current) { announce(`No more ${product.name} available.`); return "limit"; }
    const item: CartItem = {
      productId: product.id, slug: product.slug, name: product.name, price_cents: product.price_cents,
      currency: product.currency, image_url: product.image_url, stock: product.stock, quantity: next,
    };
    setItems((prev) => (prev.some((i) => i.productId === product.id) ? prev.map((i) => (i.productId === product.id ? item : i)) : [...prev, item]));
    announce(`${product.name} added to cart. ${next} in cart.`);
    return "added";
  }, [items]);

  const setQuantity = useCallback((productId: string, qty: number) => {
    setItems((prev) => prev.flatMap((i) => {
      if (i.productId !== productId) return [i];
      const q = Math.min(Math.max(qty, 0), i.stock);
      return q === 0 ? [] : [{ ...i, quantity: q }];
    }));
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    announce("Item removed from cart.");
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotalCents = items.reduce((s, i) => s + i.price_cents * i.quantity, 0);
    const shippingCents = shippingFor(subtotalCents);
    return {
      items, hydrated, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents,
      count: items.reduce((n, i) => n + i.quantity, 0),
      drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false),
      add, setQuantity, remove, clear,
    };
  }, [items, hydrated, drawerOpen, add, setQuantity, remove, clear]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <div aria-live="polite" role="status" className="sr-only">{message}</div>
    </CartContext.Provider>
  );
}
