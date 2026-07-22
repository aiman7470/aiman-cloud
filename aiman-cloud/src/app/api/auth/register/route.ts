import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signAccessToken, signRefreshToken, refreshTokenExpiryDate } from "@/lib/auth";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body as { name?: string; email?: string; password?: string };

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        settings: { create: {} },
        folders: {
          create: [{ name: "Photos" }, { name: "Videos" }, { name: "Documents" }],
        },
      },
    });

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
      data: { userId: user.id, action: "auth.register", target: user.email },
    });

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, theme: user.theme },
    });
    res.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions(60 * 15));
    res.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions(60 * 60 * 24 * 30));
    return res;
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
