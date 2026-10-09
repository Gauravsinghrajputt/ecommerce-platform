import { randomUUID } from "crypto";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

export const MOCK_KEY_ID = "rzp_test_mock";
export const keyId = () => (env.PAYMENT_MODE === "mock" ? MOCK_KEY_ID : env.RAZORPAY_KEY_ID);

/** Creates a Razorpay Order (amount in paise). In mock mode no network call is made. */
export async function createGatewayOrder(p: { amountCents: number; currency: string; receipt: string }): Promise<{ id: string }> {
  if (env.PAYMENT_MODE === "mock") return { id: `order_mock_${randomUUID().replace(/-/g, "").slice(0, 14)}` };

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64"),
    },
    body: JSON.stringify({ amount: p.amountCents, currency: p.currency, receipt: p.receipt, notes: { orderId: p.receipt } }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    console.error("[razorpay] order creation failed", res.status, await res.text());
    throw new AppError(502, "PAYMENT_GATEWAY_ERROR", "Could not initialise payment, please try again");
  }
  return (await res.json()) as { id: string };
}
