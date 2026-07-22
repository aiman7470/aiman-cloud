"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileArchive,
  File as FileIcon,
  Star,
  MoreVertical,
  Download,
  Pencil,
  Trash2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { formatBytes, formatRelativeTime, cn } from "@/lib/utils";

export interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  category: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "ARCHIVE" | "OTHER";
  size: string;
  isFavorite: boolean;
  isTrashed: boolean;
  updatedAt: string;
}

const CATEGORY_ICON: Record<FileItem["category"], any> = {
  IMAGE: FileImage,
  VIDEO: FileVideo,
  AUDIO: FileAudio,
  DOCUMENT: FileText,
  ARCHIVE: FileArchive,
  OTHER: FileIcon,
};

const CATEGORY_COLOR: Record<FileItem["category"], string> = {
  IMAGE: "text-amber-500 bg-amber-500/10",
  VIDEO: "text-teal-400 bg-teal-400/10",
  AUDIO: "text-purple-400 bg-purple-400/10",
  DOCUMENT: "text-blue-400 bg-blue-400/10",
  ARCHIVE: "text-orange-400 bg-orange-400/10",
  OTHER: "text-midnight-400 bg-midnight-400/10",
};

export function FileCard({
  file,
  view = "grid",
  onToggleFavorite,
  onRename,
  onDelete,
  onRestore,
  onPermanentDelete,
}: {
  file: FileItem;
  view?: "grid" | "list";
  onToggleFavorite: (f: FileItem) => void;
  onRename: (f: FileItem) => void;
  onDelete: (f: FileItem) => void;
  onRestore?: (f: FileItem) => void;
  onPermanentDelete?: (f: FileItem) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const Icon = CATEGORY_ICON[file.category];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isImage = file.category === "IMAGE";

  if (view === "list") {
    return (
      <div className="glass-card group flex items-center gap-3 px-4 py-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", CATEGORY_COLOR[file.category])}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-midnight-500/50 dark:text-cloudlight-200/35">
            {formatBytes(Number(file.size))} · {formatRelativeTime(file.updatedAt)}
          </p>
        </div>
        {file.isFavorite && <Star size={14} className="fill-amber-500 text-amber-500" />}
        <FileMenu
          file={file}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          menuRef={menuRef}
          onToggleFavorite={onToggleFavorite}
          onRename={onRename}
          onDelete={onDelete}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
      </div>
    );
  }

  return (
    <div className="glass-card group relative flex flex-col overflow-hidden">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-black/[0.02] dark:bg-white/[0.03]">
        {isImage ? (
          <img
            src={`/api/files/${file.id}/download`}
            alt={file.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon size={30} className={CATEGORY_COLOR[file.category].split(" ")[0]} />
        )}
        {file.isFavorite && (
          <Star size={13} className="absolute right-2.5 top-2.5 fill-amber-500 text-amber-500 drop-shadow" />
        )}
      </div>
      <div className="flex items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{file.name}</p>
          <p className="text-[10px] text-midnight-500/50 dark:text-cloudlight-200/35">{formatBytes(Number(file.size))}</p>
        </div>
        <FileMenu
          file={file}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          menuRef={menuRef}
          onToggleFavorite={onToggleFavorite}
          onRename={onRename}
          onDelete={onDelete}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
      </div>
    </div>
  );
}

function FileMenu({
  file,
  menuOpen,
  setMenuOpen,
  menuRef,
  onToggleFavorite,
  onRename,
  onDelete,
  onRestore,
  onPermanentDelete,
}: any) {
  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        onClick={() => setMenuOpen((o: boolean) => !o)}
        className="rounded-lg p-1.5 text-midnight-500/50 opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100 dark:hover:bg-white/5 dark:text-cloudlight-200/40"
      >
        <MoreVertical size={15} />
      </button>
      {menuOpen && (
        <div className="glass-card animate-scale-in absolute right-0 top-8 z-20 w-40 bg-cloudlight-50/95 p-1.5 shadow-glass dark:bg-midnight-800/95">
          {!file.isTrashed ? (
            <>
              <a href={`/api/files/${file.id}/download`} download className="btn-ghost w-full justify-start">
                <Download size={13} /> Download
              </a>
              <button onClick={() => onToggleFavorite(file)} className="btn-ghost w-full justify-start">
                <Star size={13} /> {file.isFavorite ? "Unfavorite" : "Favorite"}
              </button>
              <button onClick={() => onRename(file)} className="btn-ghost w-full justify-start">
                <Pencil size={13} /> Rename
              </button>
              <button onClick={() => onDelete(file)} className="btn-ghost w-full justify-start text-red-400 hover:bg-red-500/10">
                <Trash2 size={13} /> Move to trash
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onRestore?.(file)} className="btn-ghost w-full justify-start">
                <RotateCcw size={13} /> Restore
              </button>
              <button
                onClick={() => onPermanentDelete?.(file)}
                className="btn-ghost w-full justify-start text-red-400 hover:bg-red-500/10"
              >
                <XCircle size={13} /> Delete forever
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
