import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

export type Role = "customer" | "admin";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return next(new AppError(401, "UNAUTHENTICATED", "Missing access token"));
  try {
    const claims = jwt.verify(header.slice(7), env.JWT_SECRET) as jwt.JwtPayload;
    req.user = { id: claims.sub as string, role: claims.role as Role };
    next();
  } catch {
    next(new AppError(401, "INVALID_TOKEN", "Invalid or expired access token"));
  }
};

export const requireRole =
  (roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    if (!roles.includes(req.user.role)) return next(new AppError(403, "FORBIDDEN", "Insufficient permissions"));
    next();
  };
