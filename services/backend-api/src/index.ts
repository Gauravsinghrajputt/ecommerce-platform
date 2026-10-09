import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { pool } from "./config/db";
import { redis } from "./config/redis";
import { paymentQueue } from "./services/queue.service";
import routes from "./routes";
import webhookRoutes from "./routes/webhook.routes";
import { errorHandler, notFound } from "./middleware/error";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());

// MUST come before express.json(): signature verification needs the untouched raw bytes.
app.use("/api/v1/webhooks", express.raw({ type: "application/json", limit: "1mb" }), webhookRoutes);

app.use(express.json({ limit: "1mb" }));
app.use(routes);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.API_PORT, () =>
  console.log(`[backend-api] listening on :${env.API_PORT} (${env.NODE_ENV}, payments=${env.PAYMENT_MODE})`)
);

function shutdown(signal: string) {
  console.log(`[backend-api] ${signal} received, shutting down`);
  server.close(async () => {
    await paymentQueue.close();
    await pool.end();
    redis.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
