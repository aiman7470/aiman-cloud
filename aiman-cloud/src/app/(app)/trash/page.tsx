"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, RotateCcw, XCircle } from "lucide-react";
import { FileItem } from "@/components/file-card";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast-provider";
import { formatBytes, formatRelativeTime } from "@/lib/utils";

export default function TrashPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/files?view=trash");
    if (res.ok) setFiles((await res.json()).files);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function restore(file: FileItem) {
    setFiles((f) => f.filter((x) => x.id !== file.id));
    await fetch(`/api/files/${file.id}/restore`, { method: "POST" });
    push(`Restored “${file.name}”.`, "success");
  }

  async function permanentDelete(file: FileItem) {
    if (!confirm(`Permanently delete “${file.name}”? This can't be undone.`)) return;
    setFiles((f) => f.filter((x) => x.id !== file.id));
    await fetch(`/api/files/${file.id}?permanent=true`, { method: "DELETE" });
    push(`Deleted “${file.name}” forever.`, "info");
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Trash</h1>
        <p className="mt-1 text-sm text-midnight-500/60 dark:text-cloudlight-200/40">
          Items here are recoverable until you delete them forever.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <EmptyState icon={Trash2} title="Trash is empty" description="Deleted files and folders will show up here." />
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="glass-card flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-xs text-midnight-500/50 dark:text-cloudlight-200/35">
                  {formatBytes(Number(f.size))} · deleted {formatRelativeTime(f.updatedAt)}
                </p>
              </div>
              <button onClick={() => restore(f)} className="btn-ghost">
                <RotateCcw size={14} /> Restore
              </button>
              <button onClick={() => permanentDelete(f)} className="btn-ghost text-red-400 hover:bg-red-500/10">
                <XCircle size={14} /> Delete forever
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
