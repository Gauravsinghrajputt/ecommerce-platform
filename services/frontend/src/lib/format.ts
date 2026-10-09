import { brand } from "./brand";

// Intl en-IN currency format. Whole rupees show without ".00".
export function formatPrice(cents: number, currency: string = brand.currency): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}
