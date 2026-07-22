import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ files: [], folders: [], notes: [] });

  const [files, folders, notes] = await Promise.all([
    prisma.file.findMany({
      where: { ownerId: user.id, isTrashed: false, name: { contains: q, mode: "insensitive" } },
      take: 20,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.folder.findMany({
      where: { ownerId: user.id, isTrashed: false, name: { contains: q, mode: "insensitive" } },
      take: 10,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.note.findMany({
      where: {
        ownerId: user.id,
        isTrashed: false,
        OR: [{ title: { contains: q, mode: "insensitive" } }, { contentMd: { contains: q, mode: "insensitive" } }],
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    files: files.map((f) => ({ ...f, size: f.size.toString() })),
    folders,
    notes,
  });
}
