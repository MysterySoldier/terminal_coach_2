import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ALLOWED_AUTH_ORIGINS,
  loadAllLocalProgress,
  loadAuthAccount,
  resolvePromptUsername,
   sanitizePromptName,
  saveAllLocalProgress,
  saveAuthAccount,
  syncWithCloud,
  upsertLocalCloudMirror,
  type CloudAccountPayload,
  type CoachAccountProfile,
} from "@/lib/auth-sync";
import type { ActiveCoachMode } from "@/lib/coach";
import { loadState, saveState } from "@/lib/storage";

export type ColorScheme = "dark" | "light";

export type ModeColorMap = Record<ActiveCoachMode, string>;

export interface CoachThemeSettings {
  colorScheme: ColorScheme;
  accentColor: string;
  modeColors: ModeColorMap;
  scanlines: boolean;
  /** Custom hex color for the terminal prompt (`<name>@coach:~$`), or `""` for mode default. */
  promptColor: string;
  /** Custom hex color for typed commands in the terminal, or `""` for default. */
  commandColor: string;
}

export const THEME_STORAGE_KEY = "coachThemeSettings";

export const DEFAULT_MODE_COLORS: ModeColorMap = {
  easy: "#38bdf8", // BLUE
  medium: "#10b981", // GREEN
  hard: "#facc15", // YELLOW (slow 3s pulse)
  extreme: "#ef4444", // RED (glow border + OVERLOAD)
};

export const DEFAULT_ACCENT_COLOR = "#38bdf8";

export const ACCENT_PRESETS: Array<{ label: string; value: string }> = [
  { label: "Ice Blue", value: "#38bdf8" },
  { label: "Phosphor", value: "#39ff14" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Violet", value: "#a855f7" },
  { label: "Crimson", value: "#ef4444" },
];

export const TERMINAL_COLOR_PRESETS: Array<{ id: string; label: string; value: string }> = [
  { id: "green", label: "Green", value: "#22c55e" },
  { id: "orange", label: "Orange", value: "#fb923c" },
  { id: "purple", label: "Purple", value: "#c084fc" },
  { id: "blue", label: "Blue", value: "#38bdf8" },
  { id: "yellow", label: "Yellow", value: "#facc15" },
  { id: "red", label: "Red", value: "#f87171" },
  { id: "white", label: "White", value: "#f8fafc" },
  { id: "cyan", label: "Cyan", value: "#22d3ee" },
];

export const DEFAULT_THEME_SETTINGS: CoachThemeSettings = {
  colorScheme: "dark",
  accentColor: DEFAULT_ACCENT_COLOR,
  modeColors: { ...DEFAULT_MODE_COLORS },
  scanlines: false,
  promptColor: "",
  commandColor: "",
};

export function normalizeHexColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  return fallback;
}

export function normalizeOptionalHexColor(value: string | undefined | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : "";
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = normalizeHexColor(hex, "#38bdf8").slice(1);
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function loadThemeSettings(): CoachThemeSettings {
  const raw = loadState<Partial<CoachThemeSettings>>(THEME_STORAGE_KEY, {});
  const scheme: ColorScheme = raw.colorScheme === "light" ? "light" : "dark";
  return {
    colorScheme: scheme,
    accentColor: normalizeHexColor(raw.accentColor ?? DEFAULT_ACCENT_COLOR, DEFAULT_ACCENT_COLOR),
    modeColors: {
      easy: normalizeHexColor(raw.modeColors?.easy ?? DEFAULT_MODE_COLORS.easy, DEFAULT_MODE_COLORS.easy),
      medium: normalizeHexColor(raw.modeColors?.medium ?? DEFAULT_MODE_COLORS.medium, DEFAULT_MODE_COLORS.medium),
      hard: normalizeHexColor(raw.modeColors?.hard ?? DEFAULT_MODE_COLORS.hard, DEFAULT_MODE_COLORS.hard),
      extreme: normalizeHexColor(raw.modeColors?.extreme ?? DEFAULT_MODE_COLORS.extreme, DEFAULT_MODE_COLORS.extreme),
    },
    scanlines: Boolean(raw.scanlines),
    promptColor: normalizeOptionalHexColor(raw.promptColor),
    commandColor: normalizeOptionalHexColor(raw.commandColor),
  };
}

export function applyThemeToDom(settings: CoachThemeSettings): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", settings.colorScheme === "dark");
  root.classList.toggle("light", settings.colorScheme === "light");
  root.style.setProperty("--coach-accent", settings.accentColor);
  root.style.setProperty("--mode-easy", settings.modeColors.easy);
  root.style.setProperty("--mode-medium", settings.modeColors.medium);
  root.style.setProperty("--mode-hard", settings.modeColors.hard);
  root.style.setProperty("--mode-hard-glow", hexToRgba(settings.modeColors.hard, 0.4));
  root.style.setProperty("--mode-extreme", settings.modeColors.extreme);
  root.style.setProperty("--mode-extreme-glow", hexToRgba(settings.modeColors.extreme, 0.38));
  if (settings.promptColor) {
    root.style.setProperty("--terminal-prompt-color", settings.promptColor);
  } else {
    root.style.removeProperty("--terminal-prompt-color");
  }
  if (settings.commandColor) {
    root.style.setProperty("--terminal-command-color", settings.commandColor);
  } else {
    root.style.removeProperty("--terminal-command-color");
  }
}

export type CloudSyncStatus = "idle" | "syncing" | "synced" | "offline";

export interface GoogleSignInOptions {
  googleId?: string;
  displayName?: string;
  familyName?: string;
  credential?: string;
  accessToken?: string;
  /** Whether to merge existing local (guest) progress into the signed-in account. Defaults to true. */
  mergeLocalProgress?: boolean;
}

const ENV_GOOGLE_CLIENT_ID =
  typeof import.meta !== "undefined" && import.meta.env
    ? String(import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "").trim()
    : "";

export const [CoachThemeProvider, useCoachTheme] = createContextHook(() => {
  const [settings, setSettings] = useState<CoachThemeSettings>(() => loadThemeSettings());
  const [account, setAccount] = useState<CoachAccountProfile | null>(() => loadAuthAccount());
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>("idle");
  const [googleClientId, setGoogleClientId] = useState<string>(ENV_GOOGLE_CLIENT_ID);
  const [progressRevision, setProgressRevision] = useState<number>(0);

  const accountRef = useRef<CoachAccountProfile | null>(account);
  accountRef.current = account;
  const settingsRef = useRef<CoachThemeSettings>(settings);
  settingsRef.current = settings;

  useEffect(() => {
    saveState(THEME_STORAGE_KEY, settings);
    applyThemeToDom(settings);
  }, [settings]);

  // Fetch runtime Google Client ID config from Cloudflare Pages Function (`/api/auth/config`) if not set at build time
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    void fetch("/api/auth/config")
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { googleClientId?: string };
        if (!cancelled && data?.googleClientId && !googleClientId) {
          setGoogleClientId(data.googleClientId.trim());
        }
      })
      .catch(() => {
        // Offline or static preview
      });
    return () => {
      cancelled = true;
    };
  }, [googleClientId]);

  const applySyncedAccount = useCallback((cloudAcc: CloudAccountPayload): CoachAccountProfile => {
    const nextProfile: CoachAccountProfile = {
      googleId: cloudAcc.googleId,
      displayName: sanitizePromptName(cloudAcc.displayName, "user"),
      familyName: sanitizePromptName(cloudAcc.familyName, ""),
    };
    saveAuthAccount(nextProfile);
    setAccount(nextProfile);

    saveAllLocalProgress(cloudAcc.progress);
    setProgressRevision((r) => r + 1);

    setSettings((prev) => ({
      ...prev,
      promptColor:
        cloudAcc.promptColor !== undefined && cloudAcc.promptColor !== ""
          ? normalizeOptionalHexColor(cloudAcc.promptColor)
          : prev.promptColor,
      commandColor:
        cloudAcc.commandColor !== undefined && cloudAcc.commandColor !== ""
          ? normalizeOptionalHexColor(cloudAcc.commandColor)
          : prev.commandColor,
    }));

    return nextProfile;
  }, []);

  const performCloudSync = useCallback(
    async (override?: {
      targetAccount?: CoachAccountProfile;
      promptColor?: string;
      commandColor?: string;
      mergeLocal?: boolean;
    }): Promise<void> => {
      const activeAcc = override?.targetAccount ?? accountRef.current;
      if (!activeAcc) return;

      setSyncStatus("syncing");
      const currentSettings = settingsRef.current;
      const result = await syncWithCloud({
        googleId: activeAcc.googleId,
        displayName: activeAcc.displayName,
        familyName: activeAcc.familyName,
        promptColor: override?.promptColor !== undefined ? override.promptColor : currentSettings.promptColor,
        commandColor: override?.commandColor !== undefined ? override.commandColor : currentSettings.commandColor,
        progress: loadAllLocalProgress(),
        mergeLocal: override?.mergeLocal ?? true,
      });

      applySyncedAccount(result.account);
      setSyncStatus(result.ok ? "synced" : "offline");
    },
    [applySyncedAccount],
  );

  // Sync on initial load if already signed in, and listen for progress saves or online events
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (accountRef.current) {
      void performCloudSync();
    }

    const handleProgressSaved = (): void => {
      setProgressRevision((r) => r + 1);
      if (accountRef.current) {
        void performCloudSync();
      }
    };

    const handleProgressSynced = (): void => {
      setProgressRevision((r) => r + 1);
    };

    const handleOnline = (): void => {
      if (accountRef.current) {
        void performCloudSync();
      }
    };

    window.addEventListener("coach:progress-saved", handleProgressSaved);
    window.addEventListener("coach:progress-synced", handleProgressSynced);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("coach:progress-saved", handleProgressSaved);
      window.removeEventListener("coach:progress-synced", handleProgressSynced);
      window.removeEventListener("online", handleOnline);
    };
  }, [performCloudSync]);

  const signInWithGoogleAccount = useCallback(
    async (options: GoogleSignInOptions): Promise<CoachAccountProfile | null> => {
      const mergeLocal = options.mergeLocalProgress !== false;
      const localProgress = mergeLocal ? loadAllLocalProgress() : { easy: {}, medium: {}, hard: {}, extreme: {} };
      const currentSettings = settingsRef.current;

      setSyncStatus("syncing");

      // Try `/api/auth/google` first when online
      if (typeof navigator === "undefined" || navigator.onLine !== false) {
        try {
          const response = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              credential: options.credential,
              accessToken: options.accessToken,
              googleId: options.googleId,
              displayName: options.displayName,
              familyName: options.familyName,
              promptColor: currentSettings.promptColor || undefined,
              commandColor: currentSettings.commandColor || undefined,
              progress: localProgress,
            }),
          });
          if (response.ok) {
            const data = (await response.json()) as { ok?: boolean; account?: CloudAccountPayload };
            if (data?.account && data.account.googleId) {
              const mirrored = upsertLocalCloudMirror({
                ...data.account,
                progress: mergeLocal
                  ? {
                      easy: { ...localProgress.easy, ...data.account.progress.easy },
                      medium: { ...localProgress.medium, ...data.account.progress.medium },
                      hard: { ...localProgress.hard, ...data.account.progress.hard },
                      extreme: { ...localProgress.extreme, ...data.account.progress.extreme },
                    }
                  : data.account.progress,
              });
              const profile = applySyncedAccount(mirrored);
              setSyncStatus("synced");
              return profile;
            }
          }
        } catch {
          // Fall back to `syncWithCloud` / local cloud mirror below
        }
      }

      const fallbackGoogleId = (options.googleId || options.displayName || "google-user").trim();
      const syncRes = await syncWithCloud({
        googleId: fallbackGoogleId,
        displayName: options.displayName,
        familyName: options.familyName,
        promptColor: currentSettings.promptColor || undefined,
        commandColor: currentSettings.commandColor || undefined,
        progress: localProgress,
        mergeLocal,
      });

      const profile = applySyncedAccount(syncRes.account);
      setSyncStatus(syncRes.ok ? "synced" : "offline");
      return profile;
    },
    [applySyncedAccount],
  );

  const signOutGoogle = useCallback((): void => {
    saveAuthAccount(null);
    setAccount(null);
    setSyncStatus("idle");
  }, []);

  const setCustomPromptName = useCallback(
    (name: string): void => {
      const safeName = sanitizePromptName(name, "user");
      const currentAcc = accountRef.current;
      if (!currentAcc) return;
      const updated: CoachAccountProfile = {
        ...currentAcc,
        displayName: safeName,
      };
      saveAuthAccount(updated);
      setAccount(updated);
      void performCloudSync({ targetAccount: updated });
    },
    [performCloudSync],
  );

  const useGoogleLastName = useCallback((): void => {
    const currentAcc = accountRef.current;
    if (!currentAcc || !currentAcc.familyName) return;
    const safeLast = sanitizePromptName(currentAcc.familyName, currentAcc.displayName);
    const updated: CoachAccountProfile = {
      ...currentAcc,
      displayName: safeLast,
    };
    saveAuthAccount(updated);
    setAccount(updated);
    void performCloudSync({ targetAccount: updated });
  }, [performCloudSync]);

  const setColorScheme = useCallback((colorScheme: ColorScheme): void => {
    setSettings((prev) => ({ ...prev, colorScheme }));
  }, []);

  const setAccentColor = useCallback((color: string): void => {
    setSettings((prev) => ({
      ...prev,
      accentColor: normalizeHexColor(color, prev.accentColor),
    }));
  }, []);

  const setModeColor = useCallback((mode: ActiveCoachMode, color: string): void => {
    setSettings((prev) => ({
      ...prev,
      modeColors: {
        ...prev.modeColors,
        [mode]: normalizeHexColor(color, prev.modeColors[mode]),
      },
    }));
  }, []);

  const setScanlines = useCallback((scanlines: boolean): void => {
    setSettings((prev) => ({ ...prev, scanlines }));
  }, []);

  const setPromptColor = useCallback(
    (color: string): void => {
      const normalized = normalizeOptionalHexColor(color);
      setSettings((prev) => ({ ...prev, promptColor: normalized }));
      if (accountRef.current) {
        void performCloudSync({ promptColor: normalized });
      }
    },
    [performCloudSync],
  );

  const setCommandColor = useCallback(
    (color: string): void => {
      const normalized = normalizeOptionalHexColor(color);
      setSettings((prev) => ({ ...prev, commandColor: normalized }));
      if (accountRef.current) {
        void performCloudSync({ commandColor: normalized });
      }
    },
    [performCloudSync],
  );

  const resetColors = useCallback((): void => {
    setSettings((prev) => ({
      ...prev,
      accentColor: DEFAULT_ACCENT_COLOR,
      modeColors: { ...DEFAULT_MODE_COLORS },
      promptColor: "",
      commandColor: "",
    }));
    if (accountRef.current) {
      void performCloudSync({ promptColor: "", commandColor: "" });
    }
  }, [performCloudSync]);

  const promptUsername = useMemo(() => resolvePromptUsername(account), [account]);

  return useMemo(
    () => ({
      settings,
      account,
      promptUsername,
      syncStatus,
      googleClientId,
      allowedOrigins: ALLOWED_AUTH_ORIGINS,
      progressRevision,
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
      triggerCloudSync: performCloudSync,
    }),
    [
      account,
      googleClientId,
      performCloudSync,
      progressRevision,
      promptUsername,
      resetColors,
      setAccentColor,
      setColorScheme,
      setCommandColor,
      setCustomPromptName,
      setModeColor,
      setPromptColor,
      setScanlines,
      settings,
      signInWithGoogleAccount,
      signOutGoogle,
      syncStatus,
      useGoogleLastName,
    ],
  );
});
