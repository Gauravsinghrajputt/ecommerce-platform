import { Truck } from "lucide-react";
import { brand } from "@/lib/brand";
import { formatPrice } from "@/lib/format";

export default function FreeShippingBar({ subtotalCents }: { subtotalCents: number }) {
  const goal = brand.freeShippingThresholdCents;
  const pct = Math.min(100, Math.round((subtotalCents / goal) * 100));
  const unlocked = subtotalCents >= goal;
  return (
    <div>
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        <Truck aria-hidden className="h-4 w-4 text-accent" />
        {unlocked ? "You've unlocked free delivery." : <>Add <strong className="text-ink">{formatPrice(goal - subtotalCents)}</strong> more for free delivery.</>}
      </p>
      <div role="progressbar" aria-label="Progress to free delivery" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="mt-2 h-1.5 overflow-hidden rounded-pill bg-sand">
        <div className="h-full rounded-pill bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
