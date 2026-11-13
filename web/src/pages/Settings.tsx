import { Cloud, LogIn, LogOut, Moon, RefreshCw, RotateCcw, Sun, Terminal, User, Volume2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { useCardAudio } from "@/hooks/useCardAudio";
import { hasAnyLocalProgress, sanitizePromptName } from "@/lib/auth-sync";
import type { ActiveCoachMode } from "@/lib/coach";
import { cn } from "@/lib/utils";
import {
  ACCENT_PRESETS,
  DEFAULT_MODE_COLORS,
  TERMINAL_COLOR_PRESETS,
  hexToRgba,
  useCoachTheme,
} from "@/store/theme-store";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          prompt: () => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

const MODE_LABELS: Array<{ mode: ActiveCoachMode; name: string; note: string; swatches: string[] }> = [
  {
    mode: "easy",
    name: "Easy",
    note: "Default: Blue (word blocks)",
    swatches: ["#38bdf8", "#60a5fa", "#06b6d4", "#818cf8"],
  },
  {
    mode: "medium",
    name: "Medium",
    note: "Default: Green (shadow typing)",
    swatches: ["#10b981", "#22c55e", "#14b8a6", "#84cc16"],
  },
  {
    mode: "hard",
    name: "Hard",
    note: "Default: Yellow (slow 3s pulse)",
    swatches: ["#facc15", "#eab308", "#f59e0b", "#fb923c"],
  },
  {
    mode: "extreme",
    name: "Extreme",
    note: "Default: Red (glow border + OVERLOAD)",
    swatches: ["#ef4444", "#f43f5e", "#e11d48", "#dc2626"],
  },
];

export default function Settings() {
  const {
    settings,
    account,
    promptUsername,
    syncStatus,
    googleClientId,
    setColorScheme,
    setAccentColor,
    setModeColor,
    setScanlines,
    setPromptColor,
    setCommandColor,
    resetColors,
    signInWithGoogleAccount,
    signOutGoogle,
    setCustomPromptName,
    useGoogleLastName,
    triggerCloudSync,
  } = useCoachTheme();
  const { autoRead, toggleAutoRead } = useCardAudio();

  const [showSignInSheet, setShowSignInSheet] = useState<boolean>(false);
  const [mergeLocalOnSignIn, setMergeLocalOnSignIn] = useState<boolean>(true);
  const [signInGoogleId, setSignInGoogleId] = useState<string>("");
  const [signInDisplayName, setSignInDisplayName] = useState<string>("");
  const [signInFamilyName, setSignInFamilyName] = useState<string>("");
  const [nameDraft, setNameDraft] = useState<string>(account?.displayName ?? "");
  const [hasLocalGuestProgress, setHasLocalGuestProgress] = useState<boolean>(() => hasAnyLocalProgress());

  useEffect(() => {
    setNameDraft(account?.displayName ?? "");
    setHasLocalGuestProgress(hasAnyLocalProgress());
  }, [account]);

  // Load Google Identity Services script dynamically when a clientId is configured
  useEffect(() => {
    if (!googleClientId || typeof document === "undefined") return;
    if (document.getElementById("google-identity-services-script")) return;
    const script = document.createElement("script");
    script.id = "google-identity-services-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [googleClientId]);

  const handleStartGoogleSignIn = (): void => {
    setHasLocalGuestProgress(hasAnyLocalProgress());
    setShowSignInSheet(true);

    if (googleClientId && typeof window !== "undefined" && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "openid profile",
          callback: (resp) => {
            if (resp?.access_token) {
              void signInWithGoogleAccount({
                accessToken: resp.access_token,
                mergeLocalProgress: mergeLocalOnSignIn,
              }).then(() => setShowSignInSheet(false));
            }
          },
        });
        tokenClient.requestAccessToken();
      } catch {
        // Fallback sheet remains open
      }
    }
  };

  const handleCompleteSignInForm = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const resolvedName = sanitizePromptName(signInDisplayName || signInFamilyName || signInGoogleId, "user");
    const resolvedGoogleId = (signInGoogleId.trim() || `google:${resolvedName.toLowerCase()}`).slice(0, 128);
    await signInWithGoogleAccount({
      googleId: resolvedGoogleId,
      displayName: resolvedName,
      familyName: signInFamilyName.trim() ? sanitizePromptName(signInFamilyName, "") : undefined,
      mergeLocalProgress: true,
    });
    setShowSignInSheet(false);
  };

  const handleSaveCustomName = (event: FormEvent): void => {
    event.preventDefault();
    const sanitized = sanitizePromptName(nameDraft, "user");
    setNameDraft(sanitized);
    setCustomPromptName(sanitized);
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <header className="pt-1">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="font-mono text-xs text-muted-foreground">
          Google cloud sync, terminal prompt name, terminal colors, and mode themes
        </p>
      </header>

      {/* 1. Google Sign-In & Cloud Progress Sync + Prompt Name */}
      <section
        aria-label="Account and cloud sync"
        data-testid="account-section"
        className="rounded-2xl border border-border bg-card p-4 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-sky-400" aria-hidden />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Account & Cloud Sync
            </h2>
          </div>
          {account ? (
            <span
              data-testid="cloud-sync-status"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              {syncStatus === "syncing"
                ? "Syncing..."
                : syncStatus === "offline"
                  ? "Offline · saved locally"
                  : "Synced to cloud"}
            </span>
          ) : (
            <span
              data-testid="guest-mode-badge"
              className="rounded-full border border-border bg-background/60 px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              Guest mode
            </span>
          )}
        </div>

        {!account ? (
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Sign in with Google so your Easy, Medium, Hard, and Extreme passes follow you to any device. Guest mode
              works in full with no sign-in needed, and your prompt stays{" "}
              <code className="font-mono text-foreground">user@coach:~$</code>.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="google-signin-button"
                onClick={handleStartGoogleSignIn}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-400/60 bg-sky-500/15 px-3.5 py-2 font-mono text-xs font-semibold text-sky-200 transition-colors hover:border-sky-300 hover:bg-sky-500/25"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                Sign in with Google
              </button>
            </div>

            {showSignInSheet ? (
              <form
                data-testid="google-signin-sheet"
                onSubmit={(e) => void handleCompleteSignInForm(e)}
                className="space-y-3 rounded-xl border border-sky-500/40 bg-background/75 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    Google Sign-In & Progress Merge
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSignInSheet(false)}
                    className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>

                <label className="flex items-start gap-2 rounded-lg border border-border/80 bg-card/70 p-2.5 text-xs text-foreground">
                  <input
                    type="checkbox"
                    data-testid="merge-local-progress-checkbox"
                    checked={mergeLocalOnSignIn}
                    onChange={(e) => setMergeLocalOnSignIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-sky-400"
                  />
                  <span>
                    Keep my local (guest) progress on this device and merge it into my Google account
                    {hasLocalGuestProgress ? " (local progress detected — passes will be merged, never wiped)" : ""}.
                  </span>
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Prompt / Display Name (e.g. MysterySoldier)
                    </span>
                    <input
                      type="text"
                      data-testid="signin-display-name-input"
                      aria-label="Prompt display name"
                      placeholder="MysterySoldier"
                      value={signInDisplayName}
                      onChange={(e) => setSignInDisplayName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground outline-none focus:border-sky-400"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Google Last Name (optional)
                    </span>
                    <input
                      type="text"
                      data-testid="signin-last-name-input"
                      aria-label="Google last name"
                      placeholder="Kennedy"
                      value={signInFamilyName}
                      onChange={(e) => setSignInFamilyName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground outline-none focus:border-sky-400"
                    />
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Google Account ID (sync key across devices — no email displayed)
                  </span>
                  <input
                    type="text"
                    data-testid="google-id-input"
                    aria-label="Google account ID"
                    placeholder="google-uid-1"
                    value={signInGoogleId}
                    onChange={(e) => setSignInGoogleId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground outline-none focus:border-sky-400"
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Prompt preview:{" "}
                    <strong className="text-foreground">
                      {sanitizePromptName(signInDisplayName || signInFamilyName || signInGoogleId, "user")}@coach:~$
                    </strong>
                  </span>
                  <button
                    type="submit"
                    data-testid="google-signin-submit"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400 bg-sky-500/20 px-3 py-1.5 font-mono text-xs font-semibold text-sky-100 hover:bg-sky-500/30"
                  >
                    Continue with Google
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/55 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400" aria-hidden />
                  <span
                    data-testid="signed-in-prompt-label"
                    className="font-mono text-sm font-semibold text-foreground"
                  >
                    {promptUsername}@coach:~$
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Progress merges by best pass across all devices. Signing out keeps your local progress on this device.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  data-testid="sync-now-button"
                  onClick={() => void triggerCloudSync()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Sync
                </button>
                <button
                  type="button"
                  data-testid="google-signout-button"
                  onClick={signOutGoogle}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  Sign out
                </button>
              </div>
            </div>

            {/* Custom Terminal Prompt Name Setting */}
            <form onSubmit={handleSaveCustomName} className="space-y-2 rounded-xl border border-border/80 bg-background/45 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="custom-prompt-name" className="font-mono text-xs font-semibold text-foreground">
                  Terminal Prompt Name
                </label>
                {account.familyName ? (
                  <button
                    type="button"
                    data-testid="use-last-name-button"
                    onClick={() => {
                      const last = sanitizePromptName(account.familyName, "user");
                      setNameDraft(last);
                      useGoogleLastName();
                    }}
                    className="rounded border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] text-sky-300 hover:border-sky-400"
                  >
                    Use Google last name ({ sanitizePromptName(account.familyName, "user") })
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Letters, numbers, underscore, and hyphen only. Keeps the exact case you type.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="custom-prompt-name"
                  type="text"
                  data-testid="custom-prompt-name-input"
                  aria-label="Terminal prompt name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="MysterySoldier"
                  className="min-w-[160px] flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  data-testid="save-prompt-name-button"
                  className="rounded-lg border border-sky-400/60 bg-sky-500/15 px-3 py-1.5 font-mono text-xs font-semibold text-sky-200 hover:bg-sky-500/25"
                >
                  Save name
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* 2. Terminal Text Colors (Prompt & Typed Command) */}
      <section
        aria-label="Terminal text colors"
        data-testid="terminal-colors-section"
        className="rounded-2xl border border-border bg-card p-4 space-y-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-phosphor" aria-hidden />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Terminal Text Colors
            </h2>
          </div>
          {settings.promptColor || settings.commandColor ? (
            <button
              type="button"
              data-testid="reset-terminal-colors-button"
              onClick={() => {
                setPromptColor("");
                setCommandColor("");
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/60 px-2 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" aria-hidden />
              Default colors
            </button>
          ) : null}
        </div>

        {/* Live Terminal Prompt + Command Preview */}
        <div
          data-testid="terminal-color-preview"
          className="rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-xs sm:text-sm"
        >
          <span
            data-testid="preview-prompt-text"
            style={settings.promptColor ? { color: settings.promptColor } : undefined}
            className="text-phosphor"
          >
            {promptUsername}@coach:~$
          </span>{" "}
          <span
            data-testid="preview-command-text"
            style={settings.commandColor ? { color: settings.commandColor } : undefined}
            className="text-foreground"
          >
            sudo apt-get update
          </span>
        </div>

        {/* Prompt Color Palette */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-semibold text-foreground">
              Prompt Color ({promptUsername}@coach:~$)
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {settings.promptColor || "Default"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-testid="prompt-color-default"
              aria-pressed={settings.promptColor === ""}
              onClick={() => setPromptColor("")}
              className={cn(
                "rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors",
                settings.promptColor === ""
                  ? "border-foreground bg-background text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              Default
            </button>
            {TERMINAL_COLOR_PRESETS.map((preset) => {
              const active = settings.promptColor.toLowerCase() === preset.value.toLowerCase();
              return (
                <button
                  key={`prompt-${preset.id}`}
                  type="button"
                  data-testid={`prompt-color-${preset.id}`}
                  aria-label={`Prompt color ${preset.label}`}
                  aria-pressed={active}
                  onClick={() => setPromptColor(preset.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors",
                    active ? "border-foreground bg-background text-foreground" : "border-border text-muted-foreground",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 rounded-full border border-black/20"
                    style={{ backgroundColor: preset.value }}
                  />
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Typed Command Color Palette */}
        <div className="space-y-2 border-t border-border/70 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-semibold text-foreground">
              Typed Command Color (sudo apt-get)
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {settings.commandColor || "Default"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-testid="command-color-default"
              aria-pressed={settings.commandColor === ""}
              onClick={() => setCommandColor("")}
              className={cn(
                "rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors",
                settings.commandColor === ""
                  ? "border-foreground bg-background text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              Default
            </button>
            {TERMINAL_COLOR_PRESETS.map((preset) => {
              const active = settings.commandColor.toLowerCase() === preset.value.toLowerCase();
              return (
                <button
                  key={`command-${preset.id}`}
                  type="button"
                  data-testid={`command-color-${preset.id}`}
                  aria-label={`Command color ${preset.label}`}
                  aria-pressed={active}
                  onClick={() => setCommandColor(preset.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors",
                    active ? "border-foreground bg-background text-foreground" : "border-border text-muted-foreground",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 rounded-full border border-black/20"
                    style={{ backgroundColor: preset.value }}
                  />
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Color Scheme (Dark / Light) */}
      <section aria-label="Color scheme" className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Color Scheme
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={settings.colorScheme === "dark"}
            onClick={() => setColorScheme("dark")}
            style={
              settings.colorScheme === "dark"
                ? { borderColor: settings.accentColor, backgroundColor: hexToRgba(settings.accentColor, 0.14) }
                : undefined
            }
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 font-mono text-xs font-medium transition-colors",
              settings.colorScheme === "dark"
                ? "text-foreground"
                : "border-border bg-background/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <Moon className="h-4 w-4" aria-hidden />
            Dark
          </button>
          <button
            type="button"
            aria-pressed={settings.colorScheme === "light"}
            onClick={() => setColorScheme("light")}
            style={
              settings.colorScheme === "light"
                ? { borderColor: settings.accentColor, backgroundColor: hexToRgba(settings.accentColor, 0.14) }
                : undefined
            }
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 font-mono text-xs font-medium transition-colors",
              settings.colorScheme === "light"
                ? "text-foreground"
                : "border-border bg-background/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <Sun className="h-4 w-4" aria-hidden />
            Light
          </button>
        </div>
      </section>

      {/* Accent Color */}
      <section aria-label="Accent color" className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Accent Color
          </h2>
          <span className="font-mono text-xs text-foreground">{settings.accentColor}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((preset) => {
            const active = settings.accentColor.toLowerCase() === preset.value.toLowerCase();
            return (
              <button
                key={preset.value}
                type="button"
                aria-label={`Accent ${preset.label}`}
                aria-pressed={active}
                onClick={() => setAccentColor(preset.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs transition-colors",
                  active ? "border-foreground bg-background text-foreground" : "border-border text-muted-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: preset.value }}
                />
                {preset.label}
              </button>
            );
          })}

          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 font-mono text-xs text-foreground">
            <input
              type="color"
              aria-label="Custom accent color"
              value={settings.accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0"
            />
            Custom
          </label>
        </div>
      </section>

      {/* Per-Mode Colors */}
      <section aria-label="Per-mode colors" className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Mode Colors
          </h2>
          <button
            type="button"
            onClick={resetColors}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-2.5 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Reset defaults
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {MODE_LABELS.map((item) => {
            const current = settings.modeColors[item.mode];
            return (
              <div
                key={item.mode}
                className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-background/50 p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: current }}
                    />
                    <span className="font-mono text-sm font-semibold text-foreground">{item.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{current}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.note}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.swatches.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`${item.name} swatch ${hex}`}
                      onClick={() => setModeColor(item.mode, hex)}
                      style={{ backgroundColor: hex }}
                      className={cn(
                        "h-6 w-6 rounded-full border transition-transform active:scale-95",
                        current.toLowerCase() === hex.toLowerCase()
                          ? "scale-110 border-foreground ring-2 ring-foreground/30"
                          : "border-black/20",
                      )}
                    />
                  ))}
                  <input
                    type="color"
                    aria-label={`${item.name} mode color`}
                    value={current}
                    onChange={(e) => setModeColor(item.mode, e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0.5"
                  />
                  {current.toLowerCase() !== DEFAULT_MODE_COLORS[item.mode].toLowerCase() ? (
                    <button
                      type="button"
                      onClick={() => setModeColor(item.mode, DEFAULT_MODE_COLORS[item.mode])}
                      className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      Default
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Voice & Scanlines */}
      <section aria-label="Voice and display" className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
              <Volume2 className="h-3.5 w-3.5" aria-hidden />
              Kokoro af_heart Voice Auto-Read
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Automatically speak job prompts and pre-baked coaching lines
            </p>
          </div>
          <button
            type="button"
            aria-pressed={autoRead}
            onClick={toggleAutoRead}
            style={
              autoRead
                ? { borderColor: settings.accentColor, backgroundColor: hexToRgba(settings.accentColor, 0.16) }
                : undefined
            }
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-foreground"
          >
            {autoRead ? "On" : "Off"}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
          <div className="min-w-0">
            <div className="font-mono text-xs font-semibold text-foreground">CRT Scanline Texture</div>
            <p className="mt-0.5 text-xs text-muted-foreground">Subtle scanlines on the Coach header card</p>
          </div>
          <button
            type="button"
            aria-pressed={settings.scanlines}
            onClick={() => setScanlines(!settings.scanlines)}
            style={
              settings.scanlines
                ? { borderColor: settings.accentColor, backgroundColor: hexToRgba(settings.accentColor, 0.16) }
                : undefined
            }
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-foreground"
          >
            {settings.scanlines ? "On" : "Off"}
          </button>
        </div>
      </section>
    </div>
  );
}
