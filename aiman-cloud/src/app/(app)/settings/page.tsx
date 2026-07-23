"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Palette, ShieldCheck, Loader2, KeyRound, Smartphone, Camera } from "lucide-react";
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
  twoFactorEnabled: boolean;
  avatarUrl: string | null;
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

  function loadMe() {
    return fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setMe(d.user);
          setName(d.user.name);
          setEmail(d.user.email);
        }
      });
  }

  useEffect(() => {
    loadMe();
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
          <AvatarUploader me={me} onChange={loadMe} />
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

      <TwoFactorSection enabled={me.twoFactorEnabled} onChange={loadMe} />
    </div>
  );
}

function TwoFactorSection({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  const { push } = useToast();
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [busy, setBusy] = useState(false);

  async function startEnroll() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) return push(data.error || "Couldn't start setup.", "error");
      setQrCode(data.qrCodeDataUrl);
      setSecret(data.secret);
      setEnrolling(true);
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      });
      const data = await res.json();
      if (!res.ok) return push(data.error || "That code didn't match.", "error");
      push("Two-factor authentication is on.", "success");
      setEnrolling(false);
      setQrCode(null);
      setCode("");
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (!res.ok) return push(data.error || "Couldn't disable 2FA.", "error");
      push("Two-factor authentication is off.", "info");
      setShowDisable(false);
      setDisablePassword("");
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass-card p-5">
      <h2 className="mb-1 flex items-center gap-1.5 font-display text-sm font-semibold">
        <Smartphone size={14} className="text-amber-500" /> Two-factor authentication
      </h2>
      <p className="mb-4 text-xs text-midnight-500/60 dark:text-cloudlight-200/40">
        Require a code from an authenticator app (Google Authenticator, 1Password, Authy…) every time you sign in.
      </p>

      {enabled ? (
        <div>
          <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-teal-500">
            <ShieldCheck size={13} /> Enabled on this account
          </p>
          {!showDisable ? (
            <button onClick={() => setShowDisable(true)} className="btn-secondary">
              Disable 2FA
            </button>
          ) : (
            <form onSubmit={disable} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-midnight-600 dark:text-cloudlight-200/60">
                  Confirm your password to disable
                </label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="input-field"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="btn-primary">
                  {busy && <Loader2 size={14} className="animate-spin" />}
                  Confirm disable
                </button>
                <button type="button" onClick={() => setShowDisable(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : !enrolling ? (
        <button onClick={startEnroll} disabled={busy} className="btn-primary">
          {busy && <Loader2 size={14} className="animate-spin" />}
          <KeyRound size={14} /> Enable 2FA
        </button>
      ) : (
        <form onSubmit={confirmEnroll} className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-black/[0.02] p-4 dark:bg-white/[0.03] sm:flex-row">
            {qrCode && <img src={qrCode} alt="2FA QR code" className="h-36 w-36 rounded-lg bg-white p-1.5" />}
            <div className="min-w-0 text-xs text-midnight-600 dark:text-cloudlight-200/60">
              <p className="mb-1.5">Scan this with your authenticator app, or enter the code manually:</p>
              <code className="block break-all rounded-lg bg-black/5 px-2.5 py-1.5 font-mono text-[11px] dark:bg-white/10">
                {secret}
              </code>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-midnight-600 dark:text-cloudlight-200/60">
              Enter the 6-digit code to confirm
            </label>
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="input-field text-center text-lg tracking-[0.5em]"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy || code.length !== 6} className="btn-primary">
              {busy && <Loader2 size={14} className="animate-spin" />}
              Confirm and enable
            </button>
            <button
              type="button"
              onClick={() => {
                setEnrolling(false);
                setQrCode(null);
                setCode("");
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function AvatarUploader({ me, onChange }: { me: { name: string; avatarUrl: string | null }; onChange: () => void }) {
  const { push } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cacheBust, setCacheBust] = useState(0);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/user/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        push(data.error || "Couldn't update your profile picture.", "error");
        return;
      }
      setCacheBust((c) => c + 1);
      onChange();
      push("Profile picture updated.", "success");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-500 to-teal-400 font-display text-lg font-semibold text-midnight-950"
      title="Change profile picture"
    >
      {me.avatarUrl ? (
        <img src={`/api/user/avatar?v=${cacheBust}`} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(me.name)
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        {uploading ? <Loader2 size={16} className="animate-spin text-white" /> : <Camera size={16} className="text-white" />}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </button>
  );
}
