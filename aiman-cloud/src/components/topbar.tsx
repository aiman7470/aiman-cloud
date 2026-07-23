"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LogOut, ChevronDown, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { initials } from "@/lib/utils";
import { useToast } from "./toast-provider";
import Link from "next/link";

interface SearchResult {
  files: any[];
  folders: any[];
  notes: any[];
}

export function Topbar({ user }: { user: { name: string; email: string; hasAvatar?: boolean } }) {
  const router = useRouter();
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setResults(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    push("Signed out.", "info");
    router.push("/login");
    router.refresh();
  }

  const hasResults = results && (results.files.length || results.folders.length || results.notes.length);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-black/5 bg-cloudlight-50/80 px-5 py-3.5 backdrop-blur-xl dark:border-white/5 dark:bg-midnight-950/70 lg:px-8">
      <div ref={boxRef} className="relative flex-1 max-w-xl">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-midnight-500/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files, folders, notes…"
          className="input-field pl-10 pr-9"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-500/40 hover:text-midnight-800"
          >
            <X size={14} />
          </button>
        )}

        {results && (
          <div className="glass-card animate-scale-in absolute left-0 right-0 top-12 max-h-96 overflow-y-auto p-2 shadow-glass">
            {!hasResults && (
              <p className="px-3 py-4 text-center text-xs text-midnight-500/60 dark:text-cloudlight-200/40">
                Nothing matches “{query}”.
              </p>
            )}
            {results.folders.length > 0 && (
              <SearchGroup title="Folders">
                {results.folders.map((f) => (
                  <Link
                    key={f.id}
                    href={`/files?folderId=${f.id}`}
                    className="btn-ghost block w-full justify-start truncate"
                    onClick={() => setResults(null)}
                  >
                    📁 {f.name}
                  </Link>
                ))}
              </SearchGroup>
            )}
            {results.files.length > 0 && (
              <SearchGroup title="Files">
                {results.files.map((f: any) => (
                  <Link
                    key={f.id}
                    href={`/files?folderId=${f.folderId || ""}`}
                    className="btn-ghost block w-full justify-start truncate"
                    onClick={() => setResults(null)}
                  >
                    {f.name}
                  </Link>
                ))}
              </SearchGroup>
            )}
            {results.notes.length > 0 && (
              <SearchGroup title="Notes">
                {results.notes.map((n: any) => (
                  <Link
                    key={n.id}
                    href={`/notes?noteId=${n.id}`}
                    className="btn-ghost block w-full justify-start truncate"
                    onClick={() => setResults(null)}
                  >
                    {n.title}
                  </Link>
                ))}
              </SearchGroup>
            )}
          </div>
        )}
      </div>

      <ThemeToggle />

      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-500 to-teal-400 text-xs font-semibold text-midnight-950">
            {user.hasAvatar ? (
              <img src="/api/user/avatar" alt="" className="h-full w-full object-cover" />
            ) : (
              initials(user.name)
            )}
          </div>
          <ChevronDown size={14} className="hidden text-midnight-500/60 sm:block" />
        </button>
        {menuOpen && (
          <div className="glass-card animate-scale-in absolute right-0 top-11 w-52 p-1.5 shadow-glass">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-midnight-500/60 dark:text-cloudlight-200/40">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-black/5 dark:bg-white/10" />
            <Link href="/settings" className="btn-ghost block w-full justify-start" onClick={() => setMenuOpen(false)}>
              Account settings
            </Link>
            <button onClick={handleLogout} className="btn-ghost w-full justify-start text-red-400 hover:bg-red-500/10">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function SearchGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-midnight-500/50 dark:text-cloudlight-200/30">
        {title}
      </p>
      {children}
    </div>
  );
}
