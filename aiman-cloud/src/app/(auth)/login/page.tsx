"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/toast-provider";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to sign in.");
        return;
      }
      push(`Welcome back, ${data.user.name.split(" ")[0]}.`, "success");
      router.push(params.get("next") || "/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-2xl font-semibold">Welcome back</h2>
      <p className="mt-1.5 text-sm text-midnight-600/70 dark:text-cloudlight-200/50">
        Sign in to reach your private space.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-midnight-600 dark:text-cloudlight-200/60">
            Email
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-midnight-500/40" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-medium text-midnight-600 dark:text-cloudlight-200/60">
              Password
            </label>
            <Link href="#" className="text-xs text-amber-500 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-midnight-500/40" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pl-10"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-midnight-600 dark:text-cloudlight-200/60">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-amber-500"
          />
          Remember me on this device
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 size={15} className="animate-spin" />}
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-midnight-600/70 dark:text-cloudlight-200/50">
        New here?{" "}
        <Link href="/register" className="font-medium text-amber-500 hover:underline">
          Create your vault
        </Link>
      </p>
    </div>
  );
}
