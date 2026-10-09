import { createHash } from "crypto";
import { env } from "../config/env";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";
import { ingestEvent, verifyRazorpaySignature } from "../services/webhook.service";

// Mounted with express.raw(): the HMAC must be computed over the exact bytes Razorpay sent.
export const razorpay = asyncHandler(async (req, res) => {
  const raw = req.body;
  const signature = req.header("x-razorpay-signature");
  if (!env.RAZORPAY_WEBHOOK_SECRET) throw new AppError(503, "WEBHOOK_NOT_CONFIGURED", "Webhook secret is not configured");
  if (!Buffer.isBuffer(raw) || !signature || !verifyRazorpaySignature(raw, signature, env.RAZORPAY_WEBHOOK_SECRET)) {
    throw new AppError(400, "INVALID_SIGNATURE", "Signature verification failed");
  }

  let payload: any;
  try { payload = JSON.parse(raw.toString("utf8")); } catch { throw new AppError(400, "INVALID_JSON", "Malformed JSON body"); }

  // Razorpay sends a unique id per event in X-Razorpay-Event-Id (stable across its retries).
  const eventId = req.header("x-razorpay-event-id") ?? createHash("sha256").update(raw).digest("hex");
  await ingestEvent("razorpay", eventId, payload);

  // ACK immediately: heavy lifting happens in the worker.
  res.status(200).json({ received: true });
});
