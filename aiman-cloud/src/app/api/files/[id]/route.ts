import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { deleteObject } from "@/lib/storage";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.file.findFirst({ where: { id: params.id, ownerId: user.id } });
  if (!existing) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.isFavorite === "boolean") data.isFavorite = body.isFavorite;
  if (body.folderId !== undefined) data.folderId = body.folderId || null;

  const updated = await prisma.file.update({ where: { id: params.id }, data });

  await prisma.activityLog.create({
    data: { userId: user.id, action: "file.update", target: updated.name },
  });

  return NextResponse.json({ file: { ...updated, size: updated.size.toString() } });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.file.findFirst({ where: { id: params.id, ownerId: user.id } });
  if (!existing) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  if (permanent || existing.isTrashed) {
    await deleteObject(existing.storageKey).catch(() => {});
    await prisma.file.delete({ where: { id: params.id } });
    await prisma.activityLog.create({
      data: { userId: user.id, action: "file.delete.permanent", target: existing.name },
    });
    return NextResponse.json({ ok: true, permanent: true });
  }

  await prisma.file.update({
    where: { id: params.id },
    data: { isTrashed: true, trashedAt: new Date() },
  });
  await prisma.activityLog.create({
    data: { userId: user.id, action: "file.trash", target: existing.name },
  });
  return NextResponse.json({ ok: true, permanent: false });
}
