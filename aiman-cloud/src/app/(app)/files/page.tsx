"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  List,
  FolderPlus,
  ChevronRight,
  Home,
  FolderOpen,
} from "lucide-react";
import { UploadDropzone } from "@/components/upload-dropzone";
import { FileCard, FileItem } from "@/components/file-card";
import { FolderCard, FolderItem } from "@/components/folder-card";
import { EmptyState } from "@/components/empty-state";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";

export default function FilesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folderId") || null;
  const { push } = useToast();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<FileItem | FolderItem | null>(null);
  const [renameKind, setRenameKind] = useState<"file" | "folder">("file");
  const [renameValue, setRenameValue] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const qs = folderId ? `?folderId=${folderId}` : "";
    const res = await fetch(`/api/files${qs}`);
    if (res.ok) {
      const data = await res.json();
      setFiles(data.files);
      setFolders(data.folders);
    }
    setLoading(false);
  }, [folderId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName, parentId: folderId }),
    });
    if (res.ok) {
      push("Folder created.", "success");
      setNewFolderName("");
      setNewFolderOpen(false);
      load();
    } else {
      push("Couldn't create the folder.", "error");
    }
  }

  async function toggleFavorite(file: FileItem) {
    setFiles((f) => f.map((x) => (x.id === file.id ? { ...x, isFavorite: !x.isFavorite } : x)));
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !file.isFavorite }),
    });
  }

  async function deleteFile(file: FileItem) {
    setFiles((f) => f.filter((x) => x.id !== file.id));
    await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    push(`Moved “${file.name}” to trash.`, "info");
  }

  async function deleteFolder(folder: FolderItem) {
    setFolders((f) => f.filter((x) => x.id !== folder.id));
    await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
    push(`Moved “${folder.name}” to trash.`, "info");
  }

  function openRename(item: FileItem | FolderItem, kind: "file" | "folder") {
    setRenameTarget(item);
    setRenameKind(kind);
    setRenameValue(item.name);
  }

  async function submitRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    const endpoint = renameKind === "file" ? `/api/files/${renameTarget.id}` : `/api/folders/${renameTarget.id}`;
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    if (res.ok) {
      push("Renamed.", "success");
      setRenameTarget(null);
      load();
    } else {
      push("Rename failed.", "error");
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm text-midnight-600 dark:text-cloudlight-200/60">
          <button onClick={() => router.push("/files")} className="flex items-center gap-1 hover:text-amber-500">
            <Home size={14} /> My Files
          </button>
          {folderId && (
            <>
              <ChevronRight size={13} className="opacity-40" />
              <span className="flex items-center gap-1 font-medium text-midnight-900 dark:text-white">
                <FolderOpen size={14} /> Current folder
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setNewFolderOpen(true)} className="btn-secondary">
            <FolderPlus size={15} /> New folder
          </button>
          <div className="glass-panel flex rounded-xl p-1">
            <button
              onClick={() => setView("grid")}
              className={cn("rounded-lg p-1.5", view === "grid" && "bg-amber-500/15 text-amber-500")}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("rounded-lg p-1.5", view === "list" && "bg-amber-500/15 text-amber-500")}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      <UploadDropzone folderId={folderId} onUploaded={load} />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[4/3]" />
          ))}
        </div>
      ) : files.length === 0 && folders.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="This folder is empty"
          description="Drag and drop files above, or create a subfolder to get organized."
        />
      ) : (
        <div className="space-y-5">
          {folders.length > 0 && (
            <div>
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-midnight-500/50 dark:text-cloudlight-200/30">
                Folders
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {folders.map((f) => (
                  <FolderCard
                    key={f.id}
                    folder={f}
                    onRename={(item) => openRename(item, "folder")}
                    onDelete={deleteFolder}
                  />
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div>
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-midnight-500/50 dark:text-cloudlight-200/30">
                Files
              </h2>
              <div
                className={cn(
                  view === "grid"
                    ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
                    : "space-y-2"
                )}
              >
                {files.map((f) => (
                  <FileCard
                    key={f.id}
                    file={f}
                    view={view}
                    onToggleFavorite={toggleFavorite}
                    onRename={(item) => openRename(item, "file")}
                    onDelete={deleteFile}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} title="New folder">
        <form onSubmit={createFolder} className="space-y-4">
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="input-field"
          />
          <button type="submit" className="btn-primary w-full">
            Create folder
          </button>
        </form>
      </Modal>

      <Modal open={!!renameTarget} onClose={() => setRenameTarget(null)} title={`Rename ${renameKind}`}>
        <form onSubmit={submitRename} className="space-y-4">
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="input-field"
          />
          <button type="submit" className="btn-primary w-full">
            Save
          </button>
        </form>
      </Modal>
    </div>
  );
}
