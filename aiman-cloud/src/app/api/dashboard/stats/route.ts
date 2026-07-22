import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [sizeAgg, imageCount, videoCount, documentCount, noteCount, recentFiles, favorites, recentActivity] =
    await Promise.all([
      prisma.file.aggregate({ where: { ownerId: user.id, isTrashed: false }, _sum: { size: true } }),
      prisma.file.count({ where: { ownerId: user.id, isTrashed: false, category: "IMAGE" } }),
      prisma.file.count({ where: { ownerId: user.id, isTrashed: false, category: "VIDEO" } }),
      prisma.file.count({ where: { ownerId: user.id, isTrashed: false, category: "DOCUMENT" } }),
      prisma.note.count({ where: { ownerId: user.id, isTrashed: false } }),
      prisma.file.findMany({
        where: { ownerId: user.id, isTrashed: false },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.file.findMany({
        where: { ownerId: user.id, isTrashed: false, isFavorite: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.activityLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const used = sizeAgg._sum.size ? sizeAgg._sum.size.toString() : "0";

  // 7-day storage growth graph
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const recentUploads = await prisma.file.findMany({
    where: { ownerId: user.id, isTrashed: false, createdAt: { gte: sevenDaysAgo } },
    select: { size: true, createdAt: true },
  });
  const dayBuckets: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    dayBuckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const u of recentUploads) {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (key in dayBuckets) dayBuckets[key] += Number(u.size);
  }

  return NextResponse.json({
    storageUsed: used,
    storageQuota: user.storageQuota.toString(),
    totals: { images: imageCount, videos: videoCount, documents: documentCount, notes: noteCount },
    recentFiles: recentFiles.map((f) => ({ ...f, size: f.size.toString() })),
    favorites: favorites.map((f) => ({ ...f, size: f.size.toString() })),
    recentActivity,
    storageGraph: Object.entries(dayBuckets).map(([date, bytes]) => ({ date, bytes })),
  });
}
