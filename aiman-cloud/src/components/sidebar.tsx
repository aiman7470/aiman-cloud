"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Star,
  StickyNote,
  Trash2,
  Settings,
  HardDrive,
} from "lucide-react";
import { LogoWordmark } from "./logo";
import { cn, formatBytes } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/files", label: "My Files", icon: FolderOpen },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/trash", label: "Trash", icon: Trash2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ storageUsed, storageQuota }: { storageUsed: number; storageQuota: number }) {
  const pathname = usePathname();
  const pct = storageQuota > 0 ? Math.min(100, (storageUsed / storageQuota) * 100) : 0;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-black/5 bg-white/40 px-4 py-6 dark:border-white/5 dark:bg-white/[0.02] lg:flex">
      <Link href="/dashboard" className="px-2">
        <LogoWordmark />
      </Link>

      <nav className="mt-9 flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-amber-500/15 to-teal-400/10 text-amber-600 dark:text-amber-400"
                  : "text-midnight-600 hover:bg-black/5 dark:text-cloudlight-200/70 dark:hover:bg-white/5"
              )}
            >
              <Icon size={17} className={active ? "text-amber-500" : "opacity-70"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="glass-card mt-4 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-midnight-600 dark:text-cloudlight-200/70">
          <HardDrive size={13} /> Storage
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-teal-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-midnight-500/70 dark:text-cloudlight-200/40">
          {formatBytes(storageUsed)} of {formatBytes(storageQuota)} used
        </p>
      </div>
    </aside>
  );
}
