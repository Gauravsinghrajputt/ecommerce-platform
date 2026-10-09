"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, SearchX } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { getOrder, type DemoOrder } from "@/lib/orders";
import ProductImage from "./ProductImage";

export default function OrderView({ id }: { id: string }) {
  const [order, setOrder] = useState<DemoOrder | null | undefined>(undefined);
  useEffect(() => setOrder(getOrder(id)), [id]);

  if (order === undefined) return <div aria-hidden className="skeleton mt-8 h-96" />;
  if (order === null) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <SearchX aria-hidden className="h-10 w-10 text-ink-muted" />
        <h1 className="mt-4 text-2xl font-semibold">We can't find that order</h1>
        <p className="mt-2 max-w-md text-sm text-ink-soft">Demo orders are stored in the browser they were placed in, so this link only works on that device.</p>
        <Link href="/products" className="btn-primary mt-6">Back to the shop</Link>
      </div>
    );
  }
  const a = order.customer;
  return (
    <div>
      <CheckCircle2 aria-hidden className="h-10 w-10 text-success" />
      <h1 className="mt-4 text-3xl font-semibold">Thanks, {a.name.split(" ")[0]}. Your demo order is placed.</h1>
      <p className="mt-2 text-ink-soft">Order number <strong className="font-semibold text-ink">{order.id}</strong>. A confirmation would be sent to {a.email}.</p>
      <p className="mt-3 inline-block rounded-control bg-accent-soft px-3 py-2 text-sm text-accent-dark">Demo order: no payment was taken and nothing will be shipped.</p>

      <div className="mt-10 grid gap-8 md:grid-cols-[1fr_20rem]">
        <section aria-labelledby="items-title">
          <h2 id="items-title" className="font-display text-xl font-semibold">Items</h2>
          <ul className="mt-2 divide-y divide-line">
            {order.items.map((i) => (
              <li key={i.productId} className="flex items-center gap-4 py-3">
                <div className="w-16 shrink-0 overflow-hidden rounded-control border border-line"><ProductImage src={i.image_url} alt="" sizes="64px" /></div>
                <p className="min-w-0 flex-1"><Link href={`/products/${i.slug}`} className="font-medium hover:text-accent">{i.name}</Link><span className="block text-sm text-ink-muted">Qty {i.quantity}</span></p>
                <p className="tabular-nums">{formatPrice(i.price_cents * i.quantity, order.currency)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotalCents, order.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd className="tabular-nums">{order.shippingCents === 0 ? "Free" : formatPrice(order.shippingCents, order.currency)}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(order.totalCents, order.currency)}</dd></div>
          </dl>
        </section>
        <section aria-labelledby="addr-title" className="h-fit rounded-card border border-line bg-surface p-5">
          <h2 id="addr-title" className="font-display text-xl font-semibold">Delivery address</h2>
          <address className="mt-3 text-sm not-italic leading-relaxed text-ink-soft">
            {a.name}<br />{a.line1}<br />{a.line2 && <>{a.line2}<br /></>}{a.city}, {a.state} {a.pin}<br />Mobile: {a.phone}
          </address>
        </section>
      </div>
      <Link href="/products" className="btn-secondary mt-10">Continue shopping</Link>
    </div>
  );
}
