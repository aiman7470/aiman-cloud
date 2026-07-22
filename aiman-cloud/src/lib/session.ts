import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "./auth";
import { prisma } from "./prisma";

export const ACCESS_COOKIE = "aiman_access";
export const REFRESH_COOKIE = "aiman_refresh";

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Resolve the current user from the access-token cookie on an API route. */
export async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  return user;
}

/** Resolve the current user in a Server Component using next/headers. */
export async function getCurrentUserFromCookies() {
  const store = cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  return user;
}
