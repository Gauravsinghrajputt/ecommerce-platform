import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function EmptyCart({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <ShoppingBag aria-hidden className="h-10 w-10 text-ink-muted" />
      <h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">Add something you like and it will wait for you here.</p>
      <Link href="/products" onClick={onNavigate} className="btn-primary mt-6">Browse the shop</Link>
    </div>
  );
}
