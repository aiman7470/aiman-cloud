import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { buildStorageKey, saveBuffer, sha256, categoryFromMime } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");
  const view = searchParams.get("view"); // "trash" | "favorites" | null
  const category = searchParams.get("category");

  const where: any = { ownerId: user.id };

  if (view === "trash") {
    where.isTrashed = true;
  } else {
    where.isTrashed = false;
    if (folderId) where.folderId = folderId;
    else if (folderId === null && searchParams.has("folderId")) where.folderId = null;
  }

  if (view === "favorites") where.isFavorite = true;
  if (category) where.category = category;

  const files = await prisma.file.findMany({
    where,
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });

  const folders = view
    ? []
    : await prisma.folder.findMany({
        where: { ownerId: user.id, isTrashed: false, parentId: folderId || null },
        orderBy: { name: "asc" },
      });

  return NextResponse.json({
    files: files.map(serializeFile),
    folders: folders.map(serializeFolder),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const folderId = (form.get("folderId") as string) || null;

  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

  const maxMb = parseInt(process.env.MAX_UPLOAD_SIZE_MB || "2048", 10);
  if (file.size > maxMb * 1024 * 1024) {
    return NextResponse.json({ error: `File exceeds the ${maxMb}MB upload limit.` }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const checksum = sha256(buffer);

  // Duplicate detection: same owner, same checksum, not trashed
  const duplicate = await prisma.file.findFirst({
    where: { ownerId: user.id, checksum, isTrashed: false },
  });

  const storageKey = buildStorageKey(user.id, file.name);
  await saveBuffer(storageKey, buffer);

  const created = await prisma.file.create({
    data: {
      name: file.name,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      extension: file.name.includes(".") ? file.name.split(".").pop()! : "",
      category: categoryFromMime(file.type || ""),
      size: BigInt(file.size),
      storageKey,
      checksum,
      folderId: folderId || null,
      ownerId: user.id,
    },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: "file.upload", target: file.name },
  });

  return NextResponse.json({
    file: serializeFile(created),
    duplicateOf: duplicate ? { id: duplicate.id, name: duplicate.name } : null,
  });
}

function serializeFile(f: any) {
  return { ...f, size: f.size.toString() };
}
function serializeFolder(f: any) {
  return f;
}
