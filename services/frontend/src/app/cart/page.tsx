import type { Metadata } from "next";
import CartView from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default function CartPage() {
  return <div className="container-page py-10"><h1 className="text-3xl font-semibold">Your cart</h1><CartView /></div>;
}
