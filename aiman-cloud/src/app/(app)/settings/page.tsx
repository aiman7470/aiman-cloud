"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Palette, ShieldCheck, Loader2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/components/toast-provider";
import { formatBytes, initials } from "@/lib/utils";

interface Me {
  id: string;
  name: string;
  email: string;
  theme: "dark" | "light";
  language: string;
  timezone: string;
  storageQuota: string;
}

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const { theme, setTheme } = useTheme();
  const { push } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setMe(d.user);
          setName(d.user.name);
          setEmail(d.user.email);
        }
      });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, newEmail: email !== me?.email ? email : undefined }),
      });
      const data = await res.json();
      if (!res.ok) return push(data.error || "Couldn't save changes.", "error");
      push("Profile updated.", "success");
      router.refresh();
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveSecurity(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword) return;
    setSavingSecurity(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return push(data.error || "Couldn't change password.", "error");
      push("Password changed.", "success");
      setCurrentPassword("");
      setNewPassword("");
    } finally {
      setSavingSecurity(false);
    }
  }

  if (!me) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-48" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-midnight-500/60 dark:text-cloudlight-200/40">
          Manage your profile, appearance, and security.
        </p>
      </div>

      <section className="glass-card p-5">
        <h2 className="mb-4 flex items-center gap-1.5 font-display text-sm font-semibold">
          <User size={14} className="text-amber-500" /> Profile
        </h2>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-teal-400 font-display text-lg font-semibold text-midnight-950">
            {initials(me.name)}
          </div>
          <div className="text-xs text-midnight-500/60 dark:text-cloudlight-200/40">
            {formatBytes(Number(me.storageQuota))} total space
          </div>
        </div>
        <form onSubmit={saveProfile} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-midnight-600 dark:text-cloudlight-200/60">
              Full name
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-midnight-600 dark:text-cloudlight-200/60">
              Email
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile && <Loader2 size={14} className="animate-spin" />}
            Save profile
          </button>
        </form>
      </section>

      <section className="glass-card p-5">
        <h2 className="mb-4 flex items-center gap-1.5 font-display text-sm font-semibold">
          <Palette size={14} className="text-amber-500" /> Appearance
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme("dark")}
            className={`btn-secondary flex-1 ${theme === "dark" ? "border-amber-500/50 shadow-glow" : ""}`}
          >
            Dark mode
          </button>
          <button
            onClick={() => setTheme("light")}
            className={`btn-secondary flex-1 ${theme === "light" ? "border-amber-500/50 shadow-glow" : ""}`}
          >
            Light mode
          </button>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="mb-4 flex items-center gap-1.5 font-display text-sm font-semibold">
          <ShieldCheck size={14} className="text-amber-500" /> Security
        </h2>
        <form onSubmit={saveSecurity} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-midnight-600 dark:text-cloudlight-200/60">
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-midnight-600 dark:text-cloudlight-200/60">
              New password
            </label>
            <input
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
            />
          </div>
          <button type="submit" disabled={savingSecurity} className="btn-primary">
            {savingSecurity && <Loader2 size={14} className="animate-spin" />}
            Change password
          </button>
        </form>
      </section>
    </div>
  );
}
