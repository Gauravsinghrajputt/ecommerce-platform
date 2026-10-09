import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { pool } from "../config/db";
import { env } from "../config/env";
import { AppError, isUniqueViolation } from "../utils/errors";
import type { Role } from "../middleware/authenticate";

export interface PublicUser { id: string; email: string; fullName: string; role: Role }
const toUser = (r: any): PublicUser => ({ id: r.id, email: r.email, fullName: r.full_name, role: r.role });

// Used to equalise timing when the e-mail does not exist (avoids user enumeration via response time)
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);
const REFRESH_TTL_SECONDS = env.REFRESH_TOKEN_TTL_DAYS * 24 * 3600;

export const refreshCookieMaxAgeMs = REFRESH_TTL_SECONDS * 1000;

function signAccess(user: { id: string; role: Role }) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: env.ACCESS_TOKEN_TTL_SECONDS });
}

async function signRefresh(userId: string) {
  const jti = randomUUID();
  await pool.query(`INSERT INTO refresh_tokens (id, user_id, expires_at) VALUES ($1, $2, now() + make_interval(secs => $3))`, [
    jti, userId, REFRESH_TTL_SECONDS,
  ]);
  return jwt.sign({}, env.JWT_REFRESH_SECRET, { subject: userId, jwtid: jti, expiresIn: REFRESH_TTL_SECONDS });
}

async function issueTokens(user: PublicUser) {
  return { user, accessToken: signAccess(user), refreshToken: await signRefresh(user.id) };
}

export async function register(input: { email: string; password: string; fullName: string; role: Role; adminCode?: string }) {
  if (input.role === "admin" && (!env.ADMIN_REGISTRATION_CODE || input.adminCode !== env.ADMIN_REGISTRATION_CODE)) {
    throw new AppError(403, "ADMIN_CODE_INVALID", "Invalid admin registration code");
  }
  const hash = await bcrypt.hash(input.password, 12);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1,$2,$3,$4)
       RETURNING id, email, full_name, role`,
      [input.email, hash, input.fullName, input.role]
    );
    return toUser(rows[0]);
  } catch (err) {
    if (isUniqueViolation(err)) throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists");
    throw err;
  }
}

export async function login(email: string, password: string) {
  const { rows } = await pool.query(`SELECT id, email, full_name, role, password_hash FROM users WHERE email = $1`, [email]);
  const row = rows[0];
  const ok = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  return issueTokens(toUser(row));
}

/** Refresh-token rotation with reuse detection. */
export async function refresh(token: string | undefined) {
  if (!token) throw new AppError(401, "NO_REFRESH_TOKEN", "Missing refresh token");
  let claims: jwt.JwtPayload;
  try {
    claims = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  } catch {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Invalid or expired refresh token");
  }
  const userId = claims.sub as string;
  // Atomic: only one request can consume a given token.
  const { rows } = await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now()
      WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > now() RETURNING id`,
    [claims.jti, userId]
  );
  if (!rows[0]) {
    // Token already used/revoked => possible theft. Kill every session of this user.
    await pool.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
    throw new AppError(401, "REFRESH_TOKEN_REUSED", "Refresh token is no longer valid");
  }
  const user = await getUser(userId);
  if (!user) throw new AppError(401, "USER_NOT_FOUND", "User no longer exists");
  return issueTokens(user);
}

export async function logout(token: string | undefined) {
  if (!token) return;
  try {
    const claims = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
    await pool.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`, [claims.jti]);
  } catch { /* already invalid: nothing to revoke */ }
}

export async function getUser(id: string): Promise<PublicUser | null> {
  const { rows } = await pool.query(`SELECT id, email, full_name, role FROM users WHERE id = $1`, [id]);
  return rows[0] ? toUser(rows[0]) : null;
}
