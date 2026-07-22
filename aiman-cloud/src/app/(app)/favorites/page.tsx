"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { FileCard, FileItem } from "@/components/file-card";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast-provider";

export default function FavoritesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/files?view=favorites");
    if (res.ok) setFiles((await res.json()).files);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFavorite(file: FileItem) {
    setFiles((f) => f.filter((x) => x.id !== file.id));
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: false }),
    });
  }

  async function deleteFile(file: FileItem) {
    setFiles((f) => f.filter((x) => x.id !== file.id));
    await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    push(`Moved “${file.name}” to trash.`, "info");
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Favorites</h1>
        <p className="mt-1 text-sm text-midnight-500/60 dark:text-cloudlight-200/40">
          Files you've starred for quick access.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[4/3]" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <EmptyState icon={Star} title="No favorites yet" description="Star any file to pin it here for quick access." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {files.map((f) => (
            <FileCard key={f.id} file={f} onToggleFavorite={toggleFavorite} onRename={() => {}} onDelete={deleteFile} />
          ))}
        </div>
      )}
    </div>
  );
}
