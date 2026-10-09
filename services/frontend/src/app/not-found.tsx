import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold">We couldn't find that page</h1>
      <p className="mt-2 max-w-md text-ink-soft">The link may be old, or the product may no longer be available.</p>
      <Link href="/products" className="btn-primary mt-8">Browse the shop</Link>
    </div>
  );
}
