import IORedis from "ioredis";
import { env } from "./env";

// maxRetriesPerRequest must be null for BullMQ compatibility
export const redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
redis.on("error", (err) => console.error("Redis error", err.message));
