import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.note.findFirst({ where: { id: params.id, ownerId: user.id } });
  if (!existing) return NextResponse.json({ error: "Note not found." }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  if (typeof body.title === "string") data.title = body.title;
  if (typeof body.contentMd === "string") data.contentMd = body.contentMd;
  if (typeof body.isPinned === "boolean") data.isPinned = body.isPinned;
  if (typeof body.isArchived === "boolean") data.isArchived = body.isArchived;

  const updated = await prisma.note.update({ where: { id: params.id }, data });
  return NextResponse.json({ note: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.note.findFirst({ where: { id: params.id, ownerId: user.id } });
  if (!existing) return NextResponse.json({ error: "Note not found." }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  if (permanent || existing.isTrashed) {
    await prisma.note.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, permanent: true });
  }

  await prisma.note.update({ where: { id: params.id }, data: { isTrashed: true, trashedAt: new Date() } });
  return NextResponse.json({ ok: true, permanent: false });
}
