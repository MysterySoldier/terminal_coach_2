import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ActiveCoachMode } from "@/lib/coach";
import { loadState, saveState } from "@/lib/storage";

export type ColorScheme = "dark" | "light";

export type ModeColorMap = Record<ActiveCoachMode, string>;

export interface CoachThemeSettings {
  colorScheme: ColorScheme;
  accentColor: string;
  modeColors: ModeColorMap;
  scanlines: boolean;
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

export const DEFAULT_THEME_SETTINGS: CoachThemeSettings = {
  colorScheme: "dark",
  accentColor: DEFAULT_ACCENT_COLOR,
  modeColors: { ...DEFAULT_MODE_COLORS },
  scanlines: false,
};

export function normalizeHexColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  return fallback;
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
}

export const [CoachThemeProvider, useCoachTheme] = createContextHook(() => {
  const [settings, setSettings] = useState<CoachThemeSettings>(() => loadThemeSettings());

  useEffect(() => {
    saveState(THEME_STORAGE_KEY, settings);
    applyThemeToDom(settings);
  }, [settings]);

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

  const resetColors = useCallback((): void => {
    setSettings((prev) => ({
      ...prev,
      accentColor: DEFAULT_ACCENT_COLOR,
      modeColors: { ...DEFAULT_MODE_COLORS },
    }));
  }, []);

  return useMemo(
    () => ({
      settings,
      setColorScheme,
      setAccentColor,
      setModeColor,
      setScanlines,
      resetColors,
    }),
    [resetColors, setAccentColor, setColorScheme, setModeColor, setScanlines, settings],
  );
});
