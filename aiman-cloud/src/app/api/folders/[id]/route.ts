import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { deleteObject } from "@/lib/storage";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.folder.findFirst({ where: { id: params.id, ownerId: user.id } });
  if (!existing) return NextResponse.json({ error: "Folder not found." }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.color === "string") data.color = body.color;
  if (typeof body.isFavorite === "boolean") data.isFavorite = body.isFavorite;
  if (body.parentId !== undefined) data.parentId = body.parentId || null;

  const updated = await prisma.folder.update({ where: { id: params.id }, data });
  return NextResponse.json({ folder: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.folder.findFirst({ where: { id: params.id, ownerId: user.id } });
  if (!existing) return NextResponse.json({ error: "Folder not found." }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  if (permanent || existing.isTrashed) {
    const files = await prisma.file.findMany({ where: { folderId: params.id } });
    for (const f of files) {
      await deleteObject(f.storageKey).catch(() => {});
    }
    await prisma.folder.delete({ where: { id: params.id } }); // cascades files (folderId -> SetNull is on File; children folders cascade)
    return NextResponse.json({ ok: true, permanent: true });
  }

  await prisma.folder.update({
    where: { id: params.id },
    data: { isTrashed: true, trashedAt: new Date() },
  });
  await prisma.file.updateMany({
    where: { folderId: params.id },
    data: { isTrashed: true, trashedAt: new Date() },
  });

  return NextResponse.json({ ok: true, permanent: false });
}
