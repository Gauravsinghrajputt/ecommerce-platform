import { brand } from "@/lib/brand";
import { formatPrice } from "@/lib/format";

export default function AnnouncementBar() {
  return (
    <div className="bg-ink text-paper">
      <p className="container-page flex flex-wrap justify-center gap-x-6 gap-y-0.5 py-2 text-center text-xs font-medium">
        <span>Free delivery over {formatPrice(brand.freeShippingThresholdCents)}</span>
        <span>{brand.returnDays}-day returns</span>
        <span className="text-paper/70">Demo store: no real payments</span>
      </p>
    </div>
  );
}
