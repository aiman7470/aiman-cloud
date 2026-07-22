import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: any = {};

  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.theme === "string" && ["dark", "light"].includes(body.theme)) data.theme = body.theme;
  if (typeof body.language === "string") data.language = body.language;
  if (typeof body.timezone === "string") data.timezone = body.timezone;

  if (body.newEmail && typeof body.newEmail === "string") {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(body.newEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const conflict = await prisma.user.findUnique({ where: { email: body.newEmail.toLowerCase() } });
    if (conflict && conflict.id !== user.id) {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }
    data.email = body.newEmail.toLowerCase();
  }

  if (body.newPassword) {
    if (!body.currentPassword) {
      return NextResponse.json({ error: "Current password is required to set a new one." }, { status: 400 });
    }
    const valid = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }
    if (String(body.newPassword).length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    data.passwordHash = await hashPassword(body.newPassword);
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data });

  await prisma.activityLog.create({
    data: { userId: user.id, action: "profile.update", target: updated.email },
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      theme: updated.theme,
      language: updated.language,
      timezone: updated.timezone,
    },
  });
}
