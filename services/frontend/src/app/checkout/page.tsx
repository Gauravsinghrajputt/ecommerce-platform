import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return <div className="container-page py-10"><h1 className="text-3xl font-semibold">Checkout</h1><CheckoutForm /></div>;
}
