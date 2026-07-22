import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me";
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || "30d";

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function refreshTokenExpiryDate(): Date {
  // Mirrors REFRESH_TTL for DB-stored session expiry (assumes "Nd" or "Nm" format, default 30 days)
  const match = /^(\d+)([dhm])$/.exec(REFRESH_TTL);
  const now = new Date();
  if (!match) {
    now.setDate(now.getDate() + 30);
    return now;
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === "d") now.setDate(now.getDate() + value);
  else if (unit === "h") now.setHours(now.getHours() + value);
  else now.setMinutes(now.getMinutes() + value);
  return now;
}
