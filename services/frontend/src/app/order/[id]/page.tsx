import type { Metadata } from "next";
import OrderView from "@/components/OrderView";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };

export default function OrderPage({ params }: { params: { id: string } }) {
  return <div className="container-page py-10"><OrderView id={params.id} /></div>;
}
