import { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/15 to-teal-400/15">
        <Icon size={22} className="text-amber-500" />
      </div>
      <div>
        <p className="font-display text-base font-semibold">{title}</p>
        <p className="mt-1 max-w-xs text-sm text-midnight-500/60 dark:text-cloudlight-200/40">{description}</p>
      </div>
      {action}
    </div>
  );
}
