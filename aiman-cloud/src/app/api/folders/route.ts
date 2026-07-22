import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view");

  const folders = await prisma.folder.findMany({
    where: {
      ownerId: user.id,
      isTrashed: view === "trash",
      ...(view === "favorites" ? { isFavorite: true } : {}),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, parentId, color } = (await req.json()) as {
    name?: string;
    parentId?: string | null;
    color?: string;
  };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
  }

  const folder = await prisma.folder.create({
    data: {
      name: name.trim(),
      parentId: parentId || null,
      color: color || "#F5A623",
      ownerId: user.id,
    },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: "folder.create", target: folder.name },
  });

  return NextResponse.json({ folder });
}
