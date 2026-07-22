"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";
interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastCtx {
  push: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

const ICONS: Record<ToastType, any> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const ACCENTS: Record<ToastType, string> = {
  success: "text-teal-400",
  error: "text-red-400",
  info: "text-amber-400",
  warning: "text-amber-400",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type];
          return (
            <div
              key={toast.id}
              className="glass-card animate-fade-in flex items-start gap-3 px-4 py-3 shadow-glass"
            >
              <Icon className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", ACCENTS[toast.type])} size={18} />
              <p className="flex-1 text-sm text-midnight-800 dark:text-cloudlight-100">{toast.message}</p>
              <button onClick={() => dismiss(toast.id)} className="text-midnight-500/50 hover:text-midnight-800 dark:hover:text-white">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
