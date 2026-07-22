import { Logo } from "@/components/logo";
import { ShieldCheck, Lock, Cloud } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Branding panel */}
      <div className="relative hidden overflow-hidden bg-midnight-900 px-14 py-12 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(700px 400px at 15% 10%, rgba(245,166,35,0.16), transparent), radial-gradient(600px 500px at 90% 80%, rgba(52,211,201,0.14), transparent)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <Logo animated className="h-9 w-9" />
          <span className="font-display text-xl font-semibold text-white">
            Aiman <span className="text-amber-400">Cloud</span>
          </span>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-[1.15] text-white">
            Your files.
            <br />
            Your rules.
            <br />
            <span className="text-amber-400">One private vault.</span>
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-cloudlight-200/60">
            Aiman Cloud keeps every photo, document, and note in one place — encrypted at rest,
            reachable only by you, from any device.
          </p>
        </div>

        <div className="relative flex gap-6 text-xs text-cloudlight-200/50">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-teal-400" /> End-to-end secured sessions
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-teal-400" /> Single-owner access
          </div>
          <div className="flex items-center gap-2">
            <Cloud size={14} className="text-teal-400" /> 100GB private space
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center bg-cloudlight-50 px-6 py-12 dark:bg-midnight-950">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Logo animated />
            <span className="font-display text-lg font-semibold">
              Aiman <span className="text-amber-500">Cloud</span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
