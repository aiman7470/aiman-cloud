import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signAccessToken, signRefreshToken, refreshTokenExpiryDate } from "@/lib/auth";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = (await req.json()) as {
      email?: string;
      password?: string;
      rememberMe?: boolean;
    };

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: req.headers.get("user-agent") ?? undefined,
        expiresAt: refreshTokenExpiryDate(),
      },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: "auth.login", target: user.email },
    });

    const refreshMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, theme: user.theme, avatarUrl: user.avatarUrl },
    });
    res.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions(60 * 15));
    res.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions(refreshMaxAge));
    return res;
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
