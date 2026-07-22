import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserFromCookies } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import {
  Image as ImageIcon,
  Video,
  FileText,
  StickyNote,
  UploadCloud,
  FolderPlus,
  Star,
  Clock,
  Inbox,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUserFromCookies();
  if (!user) redirect("/login");

  const [sizeAgg, images, videos, documents, notes, recentFiles, favorites, activity] = await Promise.all([
    prisma.file.aggregate({ where: { ownerId: user.id, isTrashed: false }, _sum: { size: true } }),
    prisma.file.count({ where: { ownerId: user.id, isTrashed: false, category: "IMAGE" } }),
    prisma.file.count({ where: { ownerId: user.id, isTrashed: false, category: "VIDEO" } }),
    prisma.file.count({ where: { ownerId: user.id, isTrashed: false, category: "DOCUMENT" } }),
    prisma.note.count({ where: { ownerId: user.id, isTrashed: false } }),
    prisma.file.findMany({ where: { ownerId: user.id, isTrashed: false }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.file.findMany({
      where: { ownerId: user.id, isTrashed: false, isFavorite: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.activityLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const used = Number(sizeAgg._sum.size || 0);
  const quota = Number(user.storageQuota);
  const remaining = Math.max(0, quota - used);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const recentUploads = await prisma.file.findMany({
    where: { ownerId: user.id, isTrashed: false, createdAt: { gte: sevenDaysAgo } },
    select: { size: true, createdAt: true },
  });
  const buckets: { label: string; bytes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const bytes = recentUploads
      .filter((u) => u.createdAt.toISOString().slice(0, 10) === key)
      .reduce((sum, u) => sum + Number(u.size), 0);
    buckets.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), bytes });
  }
  const maxBytes = Math.max(...buckets.map((b) => b.bytes), 1);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-midnight-500/60 dark:text-cloudlight-200/40">
            Here's what's happening in your private space.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/files" className="btn-secondary">
            <FolderPlus size={15} /> New folder
          </Link>
          <Link href="/files" className="btn-primary">
            <UploadCloud size={15} /> Quick upload
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={UploadCloud} label="Storage used" value={formatBytes(used)} />
        <StatCard icon={Inbox} label="Storage free" value={formatBytes(remaining)} accent="teal" />
        <StatCard icon={ImageIcon} label="Photos" value={images} />
        <StatCard icon={Video} label="Videos" value={videos} accent="teal" />
        <StatCard icon={FileText} label="Documents" value={documents} />
        <StatCard icon={StickyNote} label="Notes" value={notes} accent="teal" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="font-display text-sm font-semibold">Storage activity — last 7 days</h2>
          <div className="mt-6 flex h-32 items-end gap-3">
            {buckets.map((b) => (
              <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-24 w-full items-end overflow-hidden rounded-lg bg-black/[0.03] dark:bg-white/[0.04]">
                  <div
                    className="w-full rounded-lg bg-gradient-to-t from-amber-500 to-teal-400 transition-all"
                    style={{ height: `${Math.max(4, (b.bytes / maxBytes) * 100)}%` }}
                    title={formatBytes(b.bytes)}
                  />
                </div>
                <span className="text-[10px] text-midnight-500/50 dark:text-cloudlight-200/35">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold">
            <Clock size={14} className="text-amber-500" /> Recent activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-xs text-midnight-500/50 dark:text-cloudlight-200/35">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="text-xs">
                  <p className="text-midnight-700 dark:text-cloudlight-100/80">
                    {describeAction(a.action)} {a.target && <span className="font-medium">“{a.target}”</span>}
                  </p>
                  <p className="text-midnight-500/45 dark:text-cloudlight-200/30">{formatRelativeTime(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold">Recent uploads</h2>
            <Link href="/files" className="text-xs font-medium text-amber-500 hover:underline">
              View all
            </Link>
          </div>
          {recentFiles.length === 0 ? (
            <EmptyState icon={UploadCloud} title="No files yet" description="Upload your first file to see it here." />
          ) : (
            <div className="space-y-2">
              {recentFiles.map((f) => (
                <div key={f.id} className="glass-card flex items-center justify-between px-4 py-2.5">
                  <p className="truncate text-sm">{f.name}</p>
                  <span className="shrink-0 text-xs text-midnight-500/50 dark:text-cloudlight-200/35">
                    {formatBytes(Number(f.size))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold">Favorites</h2>
            <Link href="/favorites" className="text-xs font-medium text-amber-500 hover:underline">
              View all
            </Link>
          </div>
          {favorites.length === 0 ? (
            <EmptyState icon={Star} title="No favorites yet" description="Star files to pin them here for quick access." />
          ) : (
            <div className="space-y-2">
              {favorites.map((f) => (
                <div key={f.id} className="glass-card flex items-center justify-between px-4 py-2.5">
                  <p className="truncate text-sm">{f.name}</p>
                  <Star size={13} className="shrink-0 fill-amber-500 text-amber-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function describeAction(action: string): string {
  const map: Record<string, string> = {
    "auth.login": "Signed in",
    "auth.register": "Created account",
    "file.upload": "Uploaded",
    "file.download": "Downloaded",
    "file.trash": "Moved to trash",
    "file.restore": "Restored",
    "file.delete.permanent": "Permanently deleted",
    "file.update": "Updated",
    "folder.create": "Created folder",
    "note.create": "Created note",
    "profile.update": "Updated profile",
    "account.seeded": "Account created",
  };
  return map[action] || action;
}
