import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  accent = "amber",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: "amber" | "teal";
}) {
  return (
    <div className="glass-card flex items-center gap-3.5 p-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          accent === "amber" ? "bg-amber-500/12 text-amber-500" : "bg-teal-400/12 text-teal-400"
        )}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-midnight-500/60 dark:text-cloudlight-200/40">{label}</p>
        <p className="font-display text-xl font-semibold leading-tight">{value}</p>
      </div>
    </div>
  );
}
