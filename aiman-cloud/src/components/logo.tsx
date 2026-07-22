import { cn } from "@/lib/utils";

/**
 * The Aiman Cloud mark: a rounded-square "vault" plate with a cloud silhouette
 * cut from it and a private-file glyph inside — reads as "your files, held
 * privately" rather than a generic cloud icon. Amber → teal gradient is the
 * brand signature, reused across the app (buttons, active states, graphs).
 */
export function Logo({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", animated && "animate-logo-glow", className)}
    >
      <defs>
        <linearGradient id="aiman-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7B84B" />
          <stop offset="1" stopColor="#34D3C9" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#aiman-grad)" fillOpacity="0.16" />
      <rect x="2" y="2" width="44" height="44" rx="14" stroke="url(#aiman-grad)" strokeWidth="1.5" />
      <path
        d="M15 27.5a6 6 0 0 1 1.2-11.88A8 8 0 0 1 31.7 17.4a5.5 5.5 0 0 1-1.2 10.9H15Z"
        fill="url(#aiman-grad)"
      />
      <rect x="20.5" y="24.5" width="7" height="6" rx="1.4" fill="#0B0F19" />
      <path d="M22.2 24.5v-1.6a1.8 1.8 0 1 1 3.6 0v1.6" stroke="#0B0F19" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Logo animated />
      <span className="font-display text-lg font-semibold tracking-tight">
        Aiman <span className="text-amber-500">Cloud</span>
      </span>
    </div>
  );
}
