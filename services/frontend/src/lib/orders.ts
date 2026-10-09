import { z } from "zod";
import { checkoutSchema } from "./checkout-schema";

// Phase A: demo orders live in this browser's localStorage. (Phase B swaps this for the real orders API.)
const KEY = "ministore.orders.v1";

export const demoOrderSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  items: z.array(z.object({
    productId: z.string(), slug: z.string(), name: z.string(),
    price_cents: z.number(), quantity: z.number(), image_url: z.string().nullable(),
  })),
  subtotalCents: z.number(),
  shippingCents: z.number(),
  totalCents: z.number(),
  currency: z.string(),
  customer: checkoutSchema,
});
export type DemoOrder = z.infer<typeof demoOrderSchema>;

function readAll(): DemoOrder[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = z.array(demoOrderSchema).safeParse(raw ? JSON.parse(raw) : []);
    return parsed.success ? parsed.data : [];
  } catch { return []; }
}

export const getOrder = (id: string) => readAll().find((o) => o.id === id) ?? null;

export function saveOrder(order: DemoOrder) {
  try { localStorage.setItem(KEY, JSON.stringify([order, ...readAll()].slice(0, 20))); } catch { /* storage full/blocked */ }
}

export const newOrderId = () => `MS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
