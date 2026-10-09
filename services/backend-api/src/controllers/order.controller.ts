import { randomUUID } from "crypto";
import { env } from "../config/env";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";
import * as orders from "../services/order.service";
import { ingestEvent } from "../services/webhook.service";

export const checkout = asyncHandler(async (req, res) => {
  const key = req.header("idempotency-key") ?? undefined;
  if (key !== undefined && (key.length < 8 || key.length > 100)) {
    throw new AppError(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must be 8-100 characters");
  }
  const result = await orders.checkout(req.user!.id, key);
  res.status(result.replayed ? 200 : 201).json({ data: result });
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ data: await orders.getOrder(req.params.id, req.user!) });
});

export const list = asyncHandler(async (req, res) => {
  res.json({ data: await orders.listOrders(req.user!.id) });
});

/**
 * DEV ONLY (PAYMENT_MODE=mock): stands in for the gateway by pushing a synthetic event through the
 * SAME ingestion path as the real webhook (store -> enqueue -> worker), minus the signature check.
 */
export const mockPay = asyncHandler(async (req, res) => {
  if (env.PAYMENT_MODE !== "mock") throw new AppError(404, "NOT_FOUND", "Route not found");
  const order = await orders.getOrder(req.params.id, req.user!);
  const captured = req.body.outcome === "captured";
  const payload = {
    event: captured ? "payment.captured" : "payment.failed",
    payload: {
      payment: {
        entity: {
          id: `pay_mock_${randomUUID().slice(0, 12)}`,
          order_id: order.payment.providerOrderId,
          amount: order.totalCents,
          currency: order.currency,
          status: captured ? "captured" : "failed",
        },
      },
    },
  };
  await ingestEvent("razorpay", `evt_mock_${randomUUID()}`, payload);
  res.status(202).json({ data: { accepted: true, event: payload.event } });
});
