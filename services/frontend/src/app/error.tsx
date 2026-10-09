"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center" role="alert">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-ink-soft">That didn't load properly. Try again, or head back to the shop.</p>
      <div className="mt-8 flex gap-3"><button type="button" onClick={reset} className="btn-primary">Try again</button><Link href="/" className="btn-secondary">Go home</Link></div>
    </div>
  );
}
