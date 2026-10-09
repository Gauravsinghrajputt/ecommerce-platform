import { CookieOptions, Request, Response } from "express";
import { env } from "../config/env";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";
import * as auth from "../services/auth.service";

const COOKIE = "refresh_token";
const cookieOpts: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax",
  path: "/api/v1/auth", // browser only sends it to auth endpoints
};

const respond = (res: Response, t: { user: auth.PublicUser; accessToken: string; refreshToken: string }) => {
  res.cookie(COOKIE, t.refreshToken, { ...cookieOpts, maxAge: auth.refreshCookieMaxAgeMs });
  res.json({ data: { accessToken: t.accessToken, expiresIn: env.ACCESS_TOKEN_TTL_SECONDS, user: t.user } });
};

export const register = asyncHandler(async (req, res) => {
  res.status(201).json({ data: { user: await auth.register(req.body) } });
});

export const login = asyncHandler(async (req, res) => {
  respond(res, await auth.login(req.body.email, req.body.password));
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    respond(res, await auth.refresh(req.cookies?.[COOKIE]));
  } catch (err) {
    res.clearCookie(COOKIE, cookieOpts);
    throw err;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await auth.logout(req.cookies?.[COOKIE]);
  res.clearCookie(COOKIE, cookieOpts);
  res.status(204).end();
});

export const me = asyncHandler(async (req, res) => {
  const user = await auth.getUser(req.user!.id);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
  res.json({ data: { user } });
});
