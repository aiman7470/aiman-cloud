"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to create your account.");
        return;
      }
      push("Your private vault is ready.", "success");
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-2xl font-semibold">Create your vault</h2>
      <p className="mt-1.5 text-sm text-midnight-600/70 dark:text-cloudlight-200/50">
        One account, one private cloud, entirely yours.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-midnight-600 dark:text-cloudlight-200/60">
            Full name
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-midnight-500/40" />
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aiman"
              className="input-field pl-10"
            />
          </div>
        </div>

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
          <label className="mb-1.5 block text-xs font-medium text-midnight-600 dark:text-cloudlight-200/60">
            Password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-midnight-500/40" />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="input-field pl-10"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 size={15} className="animate-spin" />}
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-midnight-600/70 dark:text-cloudlight-200/50">
        Already have a vault?{" "}
        <Link href="/login" className="font-medium text-amber-500 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
