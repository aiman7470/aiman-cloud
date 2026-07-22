import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { readBuffer } from "@/lib/storage";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = await prisma.file.findFirst({ where: { id: params.id, ownerId: user.id } });
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const buffer = await readBuffer(file.storageKey);

  await prisma.activityLog.create({
    data: { userId: user.id, action: "file.download", target: file.name },
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
      "Content-Length": String(file.size),
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
