// Rename the store, change shipping rules or copy HERE and nowhere else.
export const brand = {
  name: "Mini Store",
  tagline: "Considered basics for your bag, desk and day.",
  description: "A small demo store: apparel, bags, desk gear and drinkware.",
  currency: "INR",
  freeShippingThresholdCents: 99_900, // ₹999
  flatShippingCents: 7_900,           // ₹79 below the threshold
  returnDays: 7,
  demoNotice: "Demo store. No real payments are taken.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const shippingFor = (subtotalCents: number) =>
  subtotalCents === 0 || subtotalCents >= brand.freeShippingThresholdCents ? 0 : brand.flatShippingCents;
