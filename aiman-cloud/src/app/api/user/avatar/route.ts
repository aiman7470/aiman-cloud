import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { buildStorageKey, saveBuffer, readBuffer, deleteObject } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No image provided." }, { status: 400 });
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Profile picture must be an image." }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 8MB." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = buildStorageKey(`avatars/${user.id}`, file.name);
  await saveBuffer(storageKey, buffer, file.type);

  if (user.avatarUrl) {
    const [oldKey] = user.avatarUrl.split("|");
    await deleteObject(oldKey).catch(() => {});
  }

  await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: `${storageKey}|${file.type}` } });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !user.avatarUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [storageKey, mimeType] = user.avatarUrl.split("|");
  const buffer = await readBuffer(storageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeType || "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}
