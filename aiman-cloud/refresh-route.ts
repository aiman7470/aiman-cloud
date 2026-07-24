import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken, verifyRefreshToken } from "@/lib/auth";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "@/lib/session";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return NextResponse.json({ error: "No session." }, { status: 401 });

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return NextResponse.json({ error: "Session expired." }, { status: 401 });

  const session = await prisma.session.findUnique({ where: { refreshToken } });
  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return NextResponse.json({ error: "Session expired." }, { status: 401 });

  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions(60 * 15));
  return res;
}
