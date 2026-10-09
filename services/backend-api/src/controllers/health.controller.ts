import { Request, Response } from "express";
import { pool } from "../config/db";
import { redis } from "../config/redis";

export const live = (_req: Request, res: Response) => res.json({ status: "ok" });

export async function ready(_req: Request, res: Response) {
  try {
    await pool.query("SELECT 1");
    await redis.ping();
    res.json({ status: "ready", postgres: "up", redis: "up" });
  } catch (err) {
    res.status(503).json({ status: "unavailable", error: (err as Error).message });
  }
}
