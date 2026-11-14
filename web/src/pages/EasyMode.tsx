import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Layers,
  Lock,
  Search,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  COMMAND_CATEGORIES,
  COMMAND_REFERENCE,
  searchCommands,
  TOTAL_REFERENCE_COMMANDS,
  type CommandReferenceEntry,
} from "@/data/command-reference";
import { useCardAudio } from "@/hooks/useCardAudio";
import { formatTerminalPrompt, loadAuthAccount, resolvePromptUsername } from "@/lib/auth-sync";
import {
  countCategoryViewedCommands,
  countViewedCommands,
  loadEasyProgress,
  markCommandViewed,
  saveCoachMode,
  saveEasyProgress,
  type ActiveCoachMode,
  type EasyProgress,
} from "@/lib/coach";
import { buildModeSummaries, loadAllProgressSnapshot, statusDotTailwind } from "@/lib/mode-metrics";
import { cn } from "@/lib/utils";
import { hexToRgba, loadThemeSettings, useCoachTheme } from "@/store/theme-store";

const HOME = "/home/user";

export interface EasyModeProps {
  onSelectMode?: (nextMode: ActiveCoachMode) => void;
}

export default function EasyMode({ onSelectMode }: EasyModeProps = {}) {
  const navigate = useNavigate();
  const { activeKey, phase, toggle, stop } = useCardAudio();
  const themeCtx = useCoachTheme();
  const fallbackTheme = useMemo(() => loadThemeSettings(), []);
  const fallbackAccount = useMemo(() => loadAuthAccount(), []);

  const settings = themeCtx?.settings ?? fallbackTheme;
  const progressRevision = themeCtx?.progressRevision ?? 0;
  const promptUsername = themeCtx?.promptUsername ?? resolvePromptUsername(fallbackAccount);
  const promptColor = settings.promptColor;
  const commandColor = settings.commandColor;
  const modeColor = settings.modeColors.easy;

  const [easyProgress, setEasyProgress] = useState<EasyProgress>(() => loadEasyProgress());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCommandId, setSelectedCommandId] = useState<string | null>(null);
  const referenceSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setEasyProgress(loadEasyProgress());
  }, [progressRevision]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleSync = (): void => {
      setEasyProgress(loadEasyProgress());
    };
    window.addEventListener("coach:progress-synced", handleSync);
    return () => window.removeEventListener("coach:progress-synced", handleSync);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const snapshot = useMemo(() => ({ ...loadAllProgressSnapshot(), easy: easyProgress }), [easyProgress, progressRevision]);
  const summaries = useMemo(() => buildModeSummaries(snapshot, "easy"), [snapshot]);
  const viewedCount = useMemo(() => countViewedCommands(easyProgress), [easyProgress]);

  const filteredCommands = useMemo(
    () => searchCommands(searchQuery, selectedCategoryId),
    [searchQuery, selectedCategoryId],
  );

  const selectedEntry: CommandReferenceEntry | null = useMemo(() => {
    if (!selectedCommandId) return null;
    return COMMAND_REFERENCE.find((entry) => entry.id === selectedCommandId) ?? null;
  }, [selectedCommandId]);

  const selectedIndexInFiltered = useMemo(() => {
    if (!selectedEntry) return -1;
    return filteredCommands.findIndex((entry) => entry.id === selectedEntry.id);
  }, [filteredCommands, selectedEntry]);

  const handleOpenCommand = useCallback((entry: CommandReferenceEntry): void => {
    stop();
    setSelectedCommandId(entry.id);
    setEasyProgress((current) => {
      const next = markCommandViewed(current, entry.id);
      saveEasyProgress(next);
      return next;
    });
  }, [stop]);

  const handleCloseCommand = useCallback((): void => {
    stop();
    setSelectedCommandId(null);
  }, [stop]);

  const handleSwitchMode = useCallback(
    (nextMode: ActiveCoachMode): void => {
      stop();
      saveCoachMode(nextMode);
      if (onSelectMode) {
        onSelectMode(nextMode);
        return;
      }
      navigate(`/jobs?mode=${nextMode}`);
    },
    [navigate, onSelectMode, stop],
  );

  const prompt = formatTerminalPrompt(HOME, promptUsername, HOME);

  const groupedCommands = useMemo(() => {
    const byCat = new Map<string, CommandReferenceEntry[]>();
    for (const cmd of filteredCommands) {
      const list = byCat.get(cmd.categoryId) ?? [];
      list.push(cmd);
      byCat.set(cmd.categoryId, list);
    }
    return COMMAND_CATEGORIES.filter((cat) => byCat.has(cat.id)).map((cat) => ({
      category: cat,
      commands: byCat.get(cat.id) ?? [],
    }));
  }, [filteredCommands]);

  const entryAudioKey = selectedEntry ? `coach:easy:ref:${selectedEntry.id}` : "";
  const isEntryPlaying = Boolean(entryAudioKey && activeKey === entryAudioKey && phase !== "idle");

  return (
    <div className="w-full min-w-0 max-w-full space-y-3">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/"
            aria-label="Back to Modes"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground/40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-xl font-bold tracking-tight text-foreground">Easy</h1>
              <span
                data-testid="easy-viewed-pill"
                style={{
                  borderColor: hexToRgba(modeColor, 0.55),
                  backgroundColor: hexToRgba(modeColor, 0.14),
                  color: modeColor,
                }}
                className="tnum rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold"
              >
                {viewedCount} / {TOTAL_REFERENCE_COMMANDS} viewed
              </span>
            </div>
            <p className="truncate font-mono text-xs text-muted-foreground">
              Learn the commands, drill them, test on them
            </p>
          </div>
        </div>
      </header>

      {/* Mode Switcher Pills */}
      <nav aria-label="Switch mode" className="grid grid-cols-4 gap-1.5">
        {summaries.map((s) => {
          const c = settings.modeColors[s.mode];
          const active = s.mode === "easy";
          return (
            <button
              key={s.mode}
              type="button"
              aria-pressed={active}
              onClick={() => handleSwitchMode(s.mode)}
              style={{
                borderColor: active ? c : hexToRgba(c, 0.35),
                backgroundColor: active ? hexToRgba(c, 0.16) : undefined,
                color: active ? c : undefined,
              }}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-center font-mono text-xs font-medium transition-colors",
                !active && "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {s.name}
            </button>
          );
        })}
      </nav>

      {/* Command Entry View — compact single-card view when a command is selected so it fits phone screen without scrolling */}
      {selectedEntry ? (
        <section
          data-testid="command-entry-card"
          aria-label={`Command entry for ${selectedEntry.name}`}
          style={{ borderColor: hexToRgba(modeColor, 0.55) }}
          className="w-full min-w-0 max-w-full space-y-2.5 rounded-2xl border bg-card p-3.5 sm:p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              data-testid="command-entry-back"
              onClick={handleCloseCommand}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/70 px-2.5 py-1 font-mono text-xs text-foreground transition-colors hover:border-foreground/40"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Back to Reference
            </button>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[11px] text-emerald-300">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Viewed
            </span>
          </div>

          <div className="space-y-1">
            <p
              data-testid="command-entry-category"
              className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              {selectedEntry.categoryNumber}. {selectedEntry.categoryName} · {selectedEntry.group}
            </p>
            <div className="flex items-center justify-between gap-2">
              <h2
                data-testid="command-entry-name"
                style={{ color: modeColor }}
                className="break-words font-mono text-lg font-bold tracking-tight sm:text-xl"
              >
                {selectedEntry.name}
              </h2>
              <button
                type="button"
                data-testid="command-entry-speak"
                aria-label={`Hear description for ${selectedEntry.name}`}
                aria-pressed={isEntryPlaying}
                onClick={() =>
                  toggle(
                    entryAudioKey,
                    `${selectedEntry.name}. ${selectedEntry.description} Example: ${selectedEntry.example}`,
                  )
                }
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  isEntryPlaying
                    ? "border-sky-400 bg-sky-500/20 text-sky-200"
                    : "border-border bg-background/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                )}
              >
                <Volume2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          {/* Plain-words description */}
          <div className="rounded-xl border border-border/80 bg-background/60 p-3">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              What it does in plain words
            </span>
            <p
              data-testid="command-entry-description"
              className="mt-1 text-xs leading-relaxed text-foreground sm:text-sm"
            >
              {selectedEntry.description}
            </p>
          </div>

          {/* Example command line */}
          <div className="rounded-xl border border-border/80 bg-background px-3 py-2.5">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Example command line
            </span>
            <p
              data-testid="command-entry-example"
              className="mt-1 whitespace-pre-wrap break-all font-mono text-xs leading-snug text-foreground sm:text-sm"
            >
              <span
                data-testid="terminal-line-prompt"
                style={promptColor ? { color: promptColor } : undefined}
                className="text-sky-300"
              >
                {prompt}
              </span>{" "}
              <span
                data-testid="terminal-line-command"
                style={commandColor ? { color: commandColor } : undefined}
                className="font-semibold text-foreground"
              >
                {selectedEntry.example}
              </span>
            </p>
          </div>

          {/* Prev / Next navigation within current filter */}
          {filteredCommands.length > 1 && selectedIndexInFiltered >= 0 ? (
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button
                type="button"
                data-testid="command-entry-prev"
                disabled={selectedIndexInFiltered <= 0}
                onClick={() => {
                  const prev = filteredCommands[selectedIndexInFiltered - 1];
                  if (prev) handleOpenCommand(prev);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/70 px-2.5 py-1.5 font-mono text-xs text-foreground transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Prev
              </button>
              <span className="tnum font-mono text-[11px] text-muted-foreground">
                {selectedIndexInFiltered + 1} of {filteredCommands.length}
              </span>
              <button
                type="button"
                data-testid="command-entry-next"
                disabled={selectedIndexInFiltered >= filteredCommands.length - 1}
                onClick={() => {
                  const next = filteredCommands[selectedIndexInFiltered + 1];
                  if (next) handleOpenCommand(next);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/70 px-2.5 py-1.5 font-mono text-xs text-foreground transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <>
          {/* Three Easy Section Rows in learning order */}
          <section aria-label="Easy learning sections" className="space-y-2">
            {/* 1. Command Reference (LIVE) */}
            <button
              type="button"
              data-testid="easy-section-reference"
              onClick={() => {
                referenceSectionRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
              }}
              style={{
                borderColor: hexToRgba(modeColor, 0.65),
                backgroundColor: hexToRgba(modeColor, 0.08),
              }}
              className="flex w-full min-w-0 max-w-full items-center justify-between gap-2.5 rounded-xl border p-3 text-left transition-colors hover:border-foreground/40"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div
                  style={{
                    borderColor: hexToRgba(modeColor, 0.55),
                    backgroundColor: hexToRgba(modeColor, 0.16),
                    color: modeColor,
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                >
                  <BookOpen className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-foreground sm:text-sm">
                      1. Command Reference
                    </span>
                    <span
                      style={{
                        borderColor: hexToRgba(modeColor, 0.6),
                        backgroundColor: hexToRgba(modeColor, 0.18),
                        color: modeColor,
                      }}
                      className="rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                    >
                      Live
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    All 388 commands across 8 categories — plain words + examples
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span
                  data-testid="reference-progress-count"
                  className="tnum font-mono text-xs font-semibold text-foreground"
                >
                  {viewedCount}/{TOTAL_REFERENCE_COMMANDS}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>
            </button>

            {/* 2. Flash Cards (Coming in Round 3 — not tappable) */}
            <div
              data-testid="easy-section-flashcards"
              aria-disabled="true"
              className="flex w-full min-w-0 max-w-full cursor-not-allowed select-none items-center justify-between gap-2.5 rounded-xl border border-border/60 bg-card/50 p-3 opacity-65"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background/50 text-muted-foreground">
                  <Layers className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-mono text-xs font-semibold text-foreground/85 sm:text-sm">
                    2. Flash Cards
                  </span>
                  <p className="truncate text-xs text-muted-foreground">
                    Drill commands until you know them cold
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background/70 px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                <Lock className="h-3 w-3" aria-hidden />
                Coming in Round 3
              </span>
            </div>

            {/* 3. Exams (Coming in Round 4 — not tappable) */}
            <div
              data-testid="easy-section-exams"
              aria-disabled="true"
              className="flex w-full min-w-0 max-w-full cursor-not-allowed select-none items-center justify-between gap-2.5 rounded-xl border border-border/60 bg-card/50 p-3 opacity-65"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background/50 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-mono text-xs font-semibold text-foreground/85 sm:text-sm">
                    3. Exams
                  </span>
                  <p className="truncate text-xs text-muted-foreground">
                    Test yourself across all 8 categories
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background/70 px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                <Lock className="h-3 w-3" aria-hidden />
                Coming in Round 4
              </span>
            </div>
          </section>

          {/* Command Reference Browser */}
          <section
            ref={referenceSectionRef}
            data-testid="command-reference-browser"
            aria-label="Command Reference"
            className="space-y-2.5"
          >
            {/* Search by command name */}
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" aria-hidden />
              <input
                type="search"
                data-testid="command-search-input"
                aria-label="Search commands by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 388 commands by name (e.g. chmod, ss, tar)..."
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-8 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-sky-400 focus:outline-none sm:text-sm"
              />
              {searchQuery ? (
                <button
                  type="button"
                  data-testid="command-search-clear"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : null}
            </div>

            {/* Category Filter Pills (All + 8 Categories) */}
            <div
              data-testid="category-filter-bar"
              aria-label="Browse by category"
              className="flex flex-wrap gap-1.5"
            >
              <button
                type="button"
                data-testid="category-filter-all"
                aria-pressed={selectedCategoryId === "all"}
                onClick={() => setSelectedCategoryId("all")}
                style={
                  selectedCategoryId === "all"
                    ? {
                        borderColor: modeColor,
                        backgroundColor: hexToRgba(modeColor, 0.16),
                        color: modeColor,
                      }
                    : undefined
                }
                className={cn(
                  "rounded-lg border px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
                  selectedCategoryId !== "all" && "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                All ({TOTAL_REFERENCE_COMMANDS})
              </button>
              {COMMAND_CATEGORIES.map((cat) => {
                const active = selectedCategoryId === cat.id;
                const catViewed = countCategoryViewedCommands(easyProgress, cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    data-testid={`category-filter-${cat.id}`}
                    aria-pressed={active}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    style={
                      active
                        ? {
                            borderColor: modeColor,
                            backgroundColor: hexToRgba(modeColor, 0.16),
                            color: modeColor,
                          }
                        : undefined
                    }
                    className={cn(
                      "max-w-full truncate rounded-lg border px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
                      !active && "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {cat.number}. {cat.name} ({catViewed}/{cat.commandCount})
                  </button>
                );
              })}
            </div>

            {/* Results summary line */}
            <div className="flex items-center justify-between px-0.5 font-mono text-[11px] text-muted-foreground">
              <span data-testid="command-results-count">
                Showing {filteredCommands.length} of {TOTAL_REFERENCE_COMMANDS} commands
              </span>
              <span>Tap a command for its full entry</span>
            </div>

            {/* Category Groups & Commands */}
            {groupedCommands.length === 0 ? (
              <div
                data-testid="command-search-empty"
                className="rounded-xl border border-border bg-card p-4 text-center font-mono text-xs text-muted-foreground"
              >
                No commands matching "{searchQuery}". Try another command name.
              </div>
            ) : (
              <div className="space-y-3">
                {groupedCommands.map(({ category, commands }) => {
                  const catViewed = countCategoryViewedCommands(easyProgress, category.id);
                  return (
                    <div
                      key={category.id}
                      data-testid={`category-group-${category.id}`}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 px-1">
                        <h2 className="min-w-0 truncate font-mono text-xs font-bold text-foreground sm:text-sm">
                          {category.number}. {category.name}
                        </h2>
                        <span className="tnum shrink-0 font-mono text-[11px] text-muted-foreground">
                          {catViewed} / {category.commandCount} viewed
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        {commands.map((entry) => {
                          const isViewed = Boolean(easyProgress[entry.id]?.viewed);
                          return (
                            <button
                              key={entry.id}
                              type="button"
                              data-testid={`command-item-${entry.id}`}
                              data-command-name={entry.name}
                              data-command-viewed={isViewed ? "true" : "false"}
                              onClick={() => handleOpenCommand(entry)}
                              style={
                                isViewed
                                  ? { borderColor: hexToRgba(modeColor, 0.45) }
                                  : undefined
                              }
                              className="group flex w-full min-w-0 max-w-full items-center justify-between gap-2.5 rounded-xl border border-border bg-card px-3 py-2 text-left transition-colors hover:border-foreground/35 active:scale-[0.99]"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      "h-2 w-2 shrink-0 rounded-full",
                                      statusDotTailwind(isViewed ? "green" : "grey"),
                                    )}
                                  />
                                  <span className="font-mono text-xs font-bold text-foreground sm:text-sm">
                                    {entry.name}
                                  </span>
                                  <span className="truncate font-mono text-[10px] text-muted-foreground">
                                    {entry.group}
                                  </span>
                                </div>
                                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                  {entry.description}
                                </p>
                              </div>
                              <ChevronRight
                                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                                aria-hidden
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
