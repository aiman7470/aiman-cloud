"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="glass-panel flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:border-amber-500/30"
    >
      {theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-midnight-700" />}
    </button>
  );
}
