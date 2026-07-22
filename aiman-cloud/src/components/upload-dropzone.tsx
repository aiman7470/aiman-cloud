"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "./toast-provider";

interface UploadTask {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
}

export function UploadDropzone({ folderId, onUploaded }: { folderId: string | null; onUploaded: () => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();

  const uploadFile = useCallback(
    (file: globalThis.File) => {
      const id = Math.random().toString(36).slice(2);
      setTasks((t) => [...t, { id, name: file.name, progress: 0, status: "uploading" }]);

      const form = new FormData();
      form.append("file", file);
      if (folderId) form.append("folderId", folderId);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/files");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setTasks((t) => t.map((task) => (task.id === id ? { ...task, progress: pct } : task)));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setTasks((t) => t.map((task) => (task.id === id ? { ...task, progress: 100, status: "done" } : task)));
          onUploaded();
          setTimeout(() => setTasks((t) => t.filter((task) => task.id !== id)), 2500);
        } else {
          setTasks((t) => t.map((task) => (task.id === id ? { ...task, status: "error" } : task)));
          try {
            const body = JSON.parse(xhr.responseText);
            push(body.error || "Upload failed.", "error");
          } catch {
            push("Upload failed.", "error");
          }
        }
      };
      xhr.onerror = () => {
        setTasks((t) => t.map((task) => (task.id === id ? { ...task, status: "error" } : task)));
        push("Upload failed. Check your connection.", "error");
      };
      xhr.send(form);
    },
    [folderId, onUploaded, push]
  );

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    Array.from(fileList).forEach(uploadFile);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "glass-card flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragActive ? "border-amber-500/60 bg-amber-500/5" : "border-black/10 dark:border-white/10"
        )}
      >
        <UploadCloud size={26} className="text-amber-500" />
        <p className="text-sm font-medium">Drag files here, or click to browse</p>
        <p className="text-xs text-midnight-500/50 dark:text-cloudlight-200/40">
          Any file type · up to {process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || "2048"}MB per file
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {tasks.length > 0 && (
        <div className="mt-3 space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="glass-card flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{task.name}</p>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      task.status === "error" ? "bg-red-400" : "bg-gradient-to-r from-amber-500 to-teal-400"
                    )}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-midnight-500/50 dark:text-cloudlight-200/40">
                {task.status === "error" ? "Failed" : task.status === "done" ? "Done" : `${task.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
