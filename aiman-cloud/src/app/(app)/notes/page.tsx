"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pin, Archive, Trash2, Eye, Pencil, StickyNote } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast-provider";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  contentMd: string;
  isPinned: boolean;
  isArchived: boolean;
  updatedAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const { push } = useToast();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/notes");
    if (res.ok) {
      const data = await res.json();
      setNotes(data.notes);
      if (!activeId && data.notes.length > 0) setActiveId(data.notes[0].id);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = notes.find((n) => n.id === activeId) || null;

  async function createNote() {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled note", contentMd: "" }),
    });
    if (res.ok) {
      const { note } = await res.json();
      setNotes((n) => [note, ...n]);
      setActiveId(note.id);
    }
  }

  function updateLocal(patch: Partial<Note>) {
    if (!active) return;
    setNotes((list) => list.map((n) => (n.id === active.id ? { ...n, ...patch } : n)));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await fetch(`/api/notes/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    }, 500);
  }

  async function togglePin(note: Note) {
    await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !note.isPinned }),
    });
    load();
  }

  async function archiveNote(note: Note) {
    await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    });
    push("Note archived.", "info");
    setNotes((n) => n.filter((x) => x.id !== note.id));
    if (activeId === note.id) setActiveId(null);
  }

  async function trashNote(note: Note) {
    await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    push("Note moved to trash.", "info");
    setNotes((n) => n.filter((x) => x.id !== note.id));
    if (activeId === note.id) setActiveId(null);
  }

  return (
    <div className="animate-fade-in flex h-[calc(100vh-8.5rem)] gap-4 lg:h-[calc(100vh-6.5rem)]">
      <div className="flex w-full max-w-xs shrink-0 flex-col">
        <button onClick={createNote} className="btn-primary mb-3 w-full">
          <Plus size={15} /> New note
        </button>
        <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16" />)
          ) : notes.length === 0 ? (
            <EmptyState icon={StickyNote} title="No notes yet" description="Create your first note to get started." />
          ) : (
            notes.map((n) => (
              <button
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className={cn(
                  "glass-card block w-full px-3.5 py-3 text-left transition-all",
                  activeId === n.id && "border-amber-500/40 shadow-glow"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {n.isPinned && <Pin size={11} className="fill-amber-500 text-amber-500" />}
                  <p className="truncate text-sm font-medium">{n.title || "Untitled note"}</p>
                </div>
                <p className="mt-1 truncate text-xs text-midnight-500/50 dark:text-cloudlight-200/35">
                  {n.contentMd.slice(0, 60) || "No content yet"}
                </p>
                <p className="mt-1 text-[10px] text-midnight-500/40 dark:text-cloudlight-200/25">
                  {formatRelativeTime(n.updatedAt)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="glass-card flex min-w-0 flex-1 flex-col p-5">
        {!active ? (
          <div className="flex flex-1 items-center justify-center text-sm text-midnight-500/50 dark:text-cloudlight-200/35">
            Select or create a note to start writing.
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-2">
              <input
                value={active.title}
                onChange={(e) => updateLocal({ title: e.target.value })}
                placeholder="Note title"
                className="min-w-0 flex-1 bg-transparent font-display text-lg font-semibold outline-none"
              />
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => setPreview((p) => !p)} className="btn-ghost" title="Toggle preview">
                  {preview ? <Pencil size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => togglePin(active)} className="btn-ghost" title="Pin">
                  <Pin size={14} className={active.isPinned ? "fill-amber-500 text-amber-500" : ""} />
                </button>
                <button onClick={() => archiveNote(active)} className="btn-ghost" title="Archive">
                  <Archive size={14} />
                </button>
                <button onClick={() => trashNote(active)} className="btn-ghost text-red-400 hover:bg-red-500/10" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {preview ? (
              <div className="prose prose-sm max-w-none flex-1 overflow-y-auto dark:prose-invert">
                <ReactMarkdown>{active.contentMd || "*Nothing to preview yet.*"}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={active.contentMd}
                onChange={(e) => updateLocal({ contentMd: e.target.value })}
                placeholder="Write in Markdown… autosaves as you type."
                className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-midnight-500/30"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
