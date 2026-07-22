"use client";

import Link from "next/link";
import { Folder as FolderIcon, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface FolderItem {
  id: string;
  name: string;
  color: string;
}

export function FolderCard({
  folder,
  onRename,
  onDelete,
}: {
  folder: FolderItem;
  onRename: (f: FolderItem) => void;
  onDelete: (f: FolderItem) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="glass-card group flex items-center gap-3 px-4 py-3">
      <Link href={`/files?folderId=${folder.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${folder.color}22`, color: folder.color }}
        >
          <FolderIcon size={16} fill={folder.color} strokeWidth={1.5} />
        </div>
        <p className="truncate text-sm font-medium">{folder.name}</p>
      </Link>
      <div ref={menuRef} className="relative shrink-0">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="rounded-lg p-1.5 text-midnight-500/50 opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100 dark:hover:bg-white/5"
        >
          <MoreVertical size={15} />
        </button>
        {menuOpen && (
          <div className="glass-card animate-scale-in absolute right-0 top-8 z-20 w-36 bg-cloudlight-50/95 p-1.5 shadow-glass dark:bg-midnight-800/95">
            <button onClick={() => onRename(folder)} className="btn-ghost w-full justify-start">
              Rename
            </button>
            <button onClick={() => onDelete(folder)} className="btn-ghost w-full justify-start text-red-400 hover:bg-red-500/10">
              Move to trash
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
