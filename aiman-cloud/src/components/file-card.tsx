"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Play,
} from "lucide-react";
import { formatBytes, formatRelativeTime, cn } from "@/lib/utils";
import { Modal } from "./modal";

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const Icon = CATEGORY_ICON[file.category];
  const isImage = file.category === "IMAGE";
  const isVideo = file.category === "VIDEO";
  const downloadUrl = `/api/files/${file.id}/download`;

  function handleOpen() {
    if (isImage || isVideo) {
      setPreviewOpen(true);
    } else {
      window.open(downloadUrl, "_blank");
    }
  }

  const previewModal = (
    <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title={file.name} width="max-w-3xl">
      {isImage ? (
        <img src={downloadUrl} alt={file.name} className="max-h-[75vh] w-full rounded-xl object-contain" />
      ) : isVideo ? (
        <video src={downloadUrl} controls autoPlay className="max-h-[75vh] w-full rounded-xl" />
      ) : null}
    </Modal>
  );

  if (view === "list") {
    return (
      <div className="glass-card group flex items-center gap-3 px-4 py-3">
        <button
          onClick={handleOpen}
          className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", CATEGORY_COLOR[file.category])}
        >
          <Icon size={16} />
        </button>
        <button onClick={handleOpen} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-midnight-500/50 dark:text-cloudlight-200/35">
            {formatBytes(Number(file.size))} · {formatRelativeTime(file.updatedAt)}
          </p>
        </button>
        {file.isFavorite && <Star size={14} className="fill-amber-500 text-amber-500" />}
        <FileMenu
          file={file}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onToggleFavorite={onToggleFavorite}
          onRename={onRename}
          onDelete={onDelete}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
        {previewModal}
      </div>
    );
  }

  return (
    <div className="glass-card group relative flex flex-col">
      <button
        onClick={handleOpen}
        className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-t-2xl bg-black/[0.02] dark:bg-white/[0.03]"
      >
        {isImage ? (
          <img
            src={downloadUrl}
            alt={file.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : isVideo ? (
          <>
            <video src={downloadUrl} muted preload="metadata" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90">
                <Play size={16} className="ml-0.5 text-midnight-900" fill="currentColor" />
              </div>
            </div>
          </>
        ) : (
          <Icon size={30} className={CATEGORY_COLOR[file.category].split(" ")[0]} />
        )}
        {file.isFavorite && (
          <Star size={13} className="absolute right-2.5 top-2.5 fill-amber-500 text-amber-500 drop-shadow" />
        )}
      </button>
      <div className="flex items-center gap-2 p-3">
        <button onClick={handleOpen} className="min-w-0 flex-1 text-left">
          <p className="truncate text-xs font-medium">{file.name}</p>
          <p className="text-[10px] text-midnight-500/50 dark:text-cloudlight-200/35">{formatBytes(Number(file.size))}</p>
        </button>
        <FileMenu
          file={file}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onToggleFavorite={onToggleFavorite}
          onRename={onRename}
          onDelete={onDelete}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
      </div>
      {previewModal}
    </div>
  );
}

function FileMenu({
  file,
  menuOpen,
  setMenuOpen,
  onToggleFavorite,
  onRename,
  onDelete,
  onRestore,
  onPermanentDelete,
}: any) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (buttonRef.current?.contains(e.target as Node)) return;
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen, setMenuOpen]);

  function toggleMenu(e: React.MouseEvent) {
    e.stopPropagation();
    if (!menuOpen) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const left = Math.min(Math.max(8, rect.right - 160), window.innerWidth - 168);
      setCoords({ top: rect.bottom + 6, left });
    }
    setMenuOpen((o: boolean) => !o);
  }

  function closeAnd(fn: () => void) {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      setMenuOpen(false);
      fn();
    };
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="rounded-lg p-1.5 text-midnight-500/50 opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100 dark:hover:bg-white/5 dark:text-cloudlight-200/40"
      >
        <MoreVertical size={15} />
      </button>
      {menuOpen &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: "fixed", top: coords.top, left: coords.left }}
            className="glass-card animate-scale-in z-[200] w-40 bg-cloudlight-50/95 p-1.5 shadow-glass dark:bg-midnight-800/95"
          >
            {!file.isTrashed ? (
              <>
                <a
                  href={`/api/files/${file.id}/download`}
                  download
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                  className="btn-ghost w-full justify-start"
                >
                  <Download size={13} /> Download
                </a>
                <button onClick={closeAnd(() => onToggleFavorite(file))} className="btn-ghost w-full justify-start">
                  <Star size={13} /> {file.isFavorite ? "Unfavorite" : "Favorite"}
                </button>
                <button onClick={closeAnd(() => onRename(file))} className="btn-ghost w-full justify-start">
                  <Pencil size={13} /> Rename
                </button>
                <button
                  onClick={closeAnd(() => onDelete(file))}
                  className="btn-ghost w-full justify-start text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={13} /> Move to trash
                </button>
              </>
            ) : (
              <>
                <button onClick={closeAnd(() => onRestore?.(file))} className="btn-ghost w-full justify-start">
                  <RotateCcw size={13} /> Restore
                </button>
                <button
                  onClick={closeAnd(() => onPermanentDelete?.(file))}
                  className="btn-ghost w-full justify-start text-red-400 hover:bg-red-500/10"
                >
                  <XCircle size={13} /> Delete forever
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
