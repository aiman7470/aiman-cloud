import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = await prisma.file.findFirst({ where: { id: params.id, ownerId: user.id } });
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const updated = await prisma.file.update({
    where: { id: params.id },
    data: { isTrashed: false, trashedAt: null },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: "file.restore", target: file.name },
  });

  return NextResponse.json({ file: { ...updated, size: updated.size.toString() } });
}
