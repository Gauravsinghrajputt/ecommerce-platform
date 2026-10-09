import { Queue } from "bullmq";
import { redis } from "../config/redis";

export const PAYMENT_QUEUE = "payment-webhooks-queue";

// Producer side: API enqueues, worker-service consumes.
export const paymentQueue = new Queue(PAYMENT_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});
