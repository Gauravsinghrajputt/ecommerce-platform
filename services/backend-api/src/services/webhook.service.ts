import { createHmac, timingSafeEqual } from "crypto";
import { pool } from "../config/db";
import { paymentQueue } from "./queue.service";

/** Razorpay signs the RAW body: hex(HMAC_SHA256(body, webhook_secret)) in X-Razorpay-Signature. */
export function verifyRazorpaySignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Audit + idempotency + enqueue.
 *  - UNIQUE(provider, event_id) makes gateway retries harmless.
 *  - jobId = webhook_events.id so the queue never holds two jobs for the same event.
 *  - If a previous attempt stored the event but failed to enqueue, a retry re-enqueues it.
 */
export async function ingestEvent(provider: string, eventId: string, payload: any) {
  const inserted = await pool.query(
    `INSERT INTO webhook_events (provider, event_id, payload) VALUES ($1,$2,$3)
     ON CONFLICT (provider, event_id) DO NOTHING RETURNING id`,
    [provider, eventId, JSON.stringify(payload)]
  );
  let id: string | undefined = inserted.rows[0]?.id;
  const duplicate = !id;
  if (!id) {
    const { rows } = await pool.query(`SELECT id, processed FROM webhook_events WHERE provider=$1 AND event_id=$2`, [provider, eventId]);
    if (rows[0].processed) return { duplicate: true, enqueued: false };
    id = rows[0].id as string;
  }
  await paymentQueue.add(String(payload?.event ?? "unknown"), { webhookEventId: id }, { jobId: id });
  return { duplicate, enqueued: true };
}
