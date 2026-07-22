import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view"); // "archived" | "trash" | null

  const notes = await prisma.note.findMany({
    where: {
      ownerId: user.id,
      isTrashed: view === "trash",
      ...(view === "archived" ? { isArchived: true } : view !== "trash" ? { isArchived: false } : {}),
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, contentMd } = (await req.json()) as { title?: string; contentMd?: string };

  const note = await prisma.note.create({
    data: {
      title: title?.trim() || "Untitled note",
      contentMd: contentMd || "",
      ownerId: user.id,
    },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: "note.create", target: note.title },
  });

  return NextResponse.json({ note });
}
