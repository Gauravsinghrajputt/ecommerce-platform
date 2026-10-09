"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { brand } from "@/lib/brand";
import { checkoutSchema, type CheckoutInput } from "@/lib/checkout-schema";
import { formatPrice } from "@/lib/format";
import { INDIAN_STATES } from "@/lib/indian-states";
import { newOrderId, saveOrder } from "@/lib/orders";
import { useCart } from "./cart/CartProvider";
import CartSummary from "./cart/CartSummary";
import EmptyCart from "./cart/EmptyCart";
import ProductImage from "./ProductImage";

type Errors = Partial<Record<keyof CheckoutInput, string>>;
type FormState = Record<keyof CheckoutInput, string>;
const EMPTY: FormState = { name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", pin: "" };

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-ink-muted">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

export default function CheckoutForm() {
  const router = useRouter();
  const { items, hydrated, subtotalCents, shippingCents, totalCents, clear } = useCart();
  const [v, setV] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});

  if (!hydrated) return <div aria-hidden className="skeleton mt-8 h-96" />;
  if (items.length === 0) return <EmptyCart />;

  const bind = (k: keyof CheckoutInput) => ({
    id: k, name: k, value: v[k],
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${k}-error` : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setV({ ...v, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: undefined }); },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = checkoutSchema.safeParse(v);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) { const k = issue.path[0] as keyof CheckoutInput; next[k] ??= issue.message; }
      setErrors(next);
      const firstKey = Object.keys(next)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }
    const id = newOrderId();
    saveOrder({
      id, createdAt: new Date().toISOString(), currency: brand.currency,
      items: items.map((i) => ({ productId: i.productId, slug: i.slug, name: i.name, price_cents: i.price_cents, quantity: i.quantity, image_url: i.image_url })),
      subtotalCents, shippingCents, totalCents, customer: parsed.data,
    });
    clear();
    router.push(`/order/${id}`);
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-10">
        <fieldset className="space-y-4">
          <legend className="font-display text-xl font-semibold">Contact</legend>
          <Field id="name" label="Full name" error={errors.name}><input {...bind("name")} autoComplete="name" className="input" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="email" label="Email" error={errors.email}><input {...bind("email")} type="email" autoComplete="email" inputMode="email" className="input" /></Field>
            <Field id="phone" label="Mobile number" error={errors.phone} hint="10 digits, no country code"><input {...bind("phone")} type="tel" autoComplete="tel-national" inputMode="numeric" maxLength={10} className="input" /></Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-xl font-semibold">Delivery address</legend>
          <Field id="line1" label="Address" error={errors.line1}><input {...bind("line1")} autoComplete="address-line1" className="input" /></Field>
          <Field id="line2" label="Apartment, landmark (optional)" error={errors.line2}><input {...bind("line2")} autoComplete="address-line2" className="input" /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="city" label="City" error={errors.city}><input {...bind("city")} autoComplete="address-level2" className="input" /></Field>
            <Field id="state" label="State" error={errors.state}>
              <select {...bind("state")} autoComplete="address-level1" className="input"><option value="">Select state</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
            <Field id="pin" label="PIN code" error={errors.pin}><input {...bind("pin")} autoComplete="postal-code" inputMode="numeric" maxLength={6} className="input" /></Field>
          </div>
        </fieldset>

        <section aria-labelledby="pay-title" className="rounded-card border border-dashed border-line bg-surface p-5">
          <h2 id="pay-title" className="flex items-center gap-2 font-display text-xl font-semibold"><ShieldCheck aria-hidden className="h-5 w-5 text-accent" />Demo payment</h2>
          <p className="mt-2 text-sm text-ink-soft">This is a demo store. No card or UPI details are collected and no money moves. Placing the order creates a sample order saved in this browser only.</p>
        </section>
      </div>

      <aside aria-labelledby="summary-title" className="h-fit space-y-4 rounded-card border border-line bg-surface p-5 shadow-card lg:sticky lg:top-24">
        <h2 id="summary-title" className="font-display text-xl font-semibold">Order summary</h2>
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={i.productId} className="flex items-center gap-3 py-3">
              <div className="w-14 shrink-0 overflow-hidden rounded-control border border-line"><ProductImage src={i.image_url} alt="" sizes="56px" /></div>
              <p className="min-w-0 flex-1 text-sm"><span className="font-medium">{i.name}</span><span className="block text-ink-muted">Qty {i.quantity}</span></p>
              <p className="text-sm tabular-nums">{formatPrice(i.price_cents * i.quantity, i.currency)}</p>
            </li>
          ))}
        </ul>
        <CartSummary />
        <button type="submit" className="btn-primary w-full">Place demo order</button>
        <Link href="/cart" className="block text-center text-sm text-ink-soft hover:text-accent">Back to cart</Link>
      </aside>
    </form>
  );
}
