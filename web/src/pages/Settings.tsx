import { Moon, RotateCcw, Sun, Volume2 } from "lucide-react";

import { useCardAudio } from "@/hooks/useCardAudio";
import type { ActiveCoachMode } from "@/lib/coach";
import { cn } from "@/lib/utils";
import {
  ACCENT_PRESETS,
  DEFAULT_MODE_COLORS,
  hexToRgba,
  useCoachTheme,
} from "@/store/theme-store";

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
  const { settings, setColorScheme, setAccentColor, setModeColor, setScanlines, resetColors } = useCoachTheme();
  const { autoRead, toggleAutoRead } = useCardAudio();

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <header className="pt-1">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="font-mono text-xs text-muted-foreground">
          Color scheme, accent color, and per-mode colors
        </p>
      </header>

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
