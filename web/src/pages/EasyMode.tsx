import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Layers,
  RotateCw,
  Search,
  Shuffle,
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
import {
  buildExamQuestions,
  gradeExam,
  isExamAnswerCorrect,
  TOTAL_EXAMS,
  type ExamQuestion,
  type ExamResultSummary,
} from "@/data/exams";
import {
  applyDirectionToDeck,
  buildFlashcardDeck,
  FLASHCARD_DIRECTION_OPTIONS,
  getFlashcardsByCategory,
  TOTAL_FLASHCARDS,
  type DeckCardItem,
  type FlashcardDirection,
} from "@/data/flashcards";
import { useCardAudio } from "@/hooks/useCardAudio";
import { formatTerminalPrompt, loadAuthAccount, resolvePromptUsername } from "@/lib/auth-sync";
import {
  countCategoryMasteredFlashcards,
  countCategoryViewedCommands,
  countMasteredFlashcards,
  countPassedExams,
  countViewedCommands,
  getExamScopeStats,
  getMasteredFlashcardIdSet,
  getMissedExamCardIds,
  isFlashcardMastered,
  loadEasyProgress,
  markCommandViewed,
  markFlashcardMastered,
  recordExamAttempt,
  saveCoachMode,
  saveEasyProgress,
  type ActiveCoachMode,
  type EasyProgress,
} from "@/lib/coach";
import { buildModeSummaries, loadAllProgressSnapshot, statusDotTailwind } from "@/lib/mode-metrics";
import { cn } from "@/lib/utils";
import { hexToRgba, loadThemeSettings, useCoachTheme } from "@/store/theme-store";

const HOME = "/home/user";

const SHORT_CATEGORY_LABELS: Record<string, string> = {
  "cat-1": "1. Files & Text",
  "cat-2": "2. Users & Perms",
  "cat-3": "3. Processes",
  "cat-4": "4. System & Hw",
  "cat-5": "5. Storage",
  "cat-6": "6. Network",
  "cat-7": "7. Packages",
  "cat-8": "8. Shell & Tools",
};

export type EasyActiveSection = "reference" | "flashcards" | "exams";

export interface EasyModeProps {
  onSelectMode?: (nextMode: ActiveCoachMode) => void;
  initialSection?: EasyActiveSection;
}

export default function EasyMode({ onSelectMode, initialSection = "reference" }: EasyModeProps = {}) {
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
  const [activeSection, setActiveSection] = useState<EasyActiveSection>(initialSection);

  // Section 1: Command Reference state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCommandId, setSelectedCommandId] = useState<string | null>(null);
  const referenceSectionRef = useRef<HTMLElement | null>(null);

  // Section 2: Flash Cards state
  const [flashcardCategoryId, setFlashcardCategoryId] = useState<string>("all");
  const [flashcardDirection, setFlashcardDirection] = useState<FlashcardDirection>("cmd-desc");
  const [includeMastered, setIncludeMastered] = useState<boolean>(false);
  const [deck, setDeck] = useState<DeckCardItem[]>(() =>
    buildFlashcardDeck({
      categoryId: "all",
      masteredIds: getMasteredFlashcardIdSet(loadEasyProgress()),
      includeMastered: false,
      direction: "cmd-desc",
    }),
  );
  const [deckIndex, setDeckIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Section 3: Exams state
  const [examCategoryId, setExamCategoryId] = useState<string>("all");
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>(() =>
    buildExamQuestions({
      categoryId: "all",
      missedCardIds: getMissedExamCardIds(loadEasyProgress(), "all"),
    }),
  );
  const [examIndex, setExamIndex] = useState<number>(0);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [recallInput, setRecallInput] = useState<string>("");
  const [examResult, setExamResult] = useState<ExamResultSummary | null>(null);
  const [lastExamFeedback, setLastExamFeedback] = useState<{
    questionNumber: number;
    cardId: string;
    prompt: string;
    userAnswer: string;
    correctCommand: string;
    correct: boolean;
  } | null>(null);

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

  // Stop audio when unmounting EasyMode
  useEffect(() => () => stop(), [stop]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const snapshot = useMemo(() => ({ ...loadAllProgressSnapshot(), easy: easyProgress }), [easyProgress, progressRevision]);
  const summaries = useMemo(() => buildModeSummaries(snapshot, "easy"), [snapshot]);
  const viewedCount = useMemo(() => countViewedCommands(easyProgress), [easyProgress]);
  const masteredCount = useMemo(() => countMasteredFlashcards(easyProgress), [easyProgress]);
  const passedExamsCount = useMemo(() => countPassedExams(easyProgress), [easyProgress]);

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

  const handleOpenCommand = useCallback(
    (entry: CommandReferenceEntry): void => {
      stop();
      setSelectedCommandId(entry.id);
      setEasyProgress((current) => {
        const next = markCommandViewed(current, entry.id);
        saveEasyProgress(next);
        return next;
      });
    },
    [stop],
  );

  const handleCloseCommand = useCallback((): void => {
    stop();
    setSelectedCommandId(null);
  }, [stop]);

  const handleSwitchSection = useCallback(
    (section: EasyActiveSection): void => {
      stop();
      setSelectedCommandId(null);
      setActiveSection(section);
    },
    [stop],
  );

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

  // Flash Cards handlers
  const startNewFlashcardPass = useCallback(
    (
      nextCategoryId: string,
      nextIncludeMastered: boolean,
      nextDirection: FlashcardDirection,
      progressToUse: EasyProgress,
    ): void => {
      stop();
      const masteredSet = getMasteredFlashcardIdSet(progressToUse);
      const nextDeck = buildFlashcardDeck({
        categoryId: nextCategoryId,
        masteredIds: masteredSet,
        includeMastered: nextIncludeMastered,
        direction: nextDirection,
      });
      setDeck(nextDeck);
      setDeckIndex(0);
      setIsFlipped(false);
    },
    [stop],
  );

  const handleSelectFlashcardCategory = useCallback(
    (categoryId: string): void => {
      setFlashcardCategoryId(categoryId);
      startNewFlashcardPass(categoryId, includeMastered, flashcardDirection, easyProgress);
    },
    [easyProgress, flashcardDirection, includeMastered, startNewFlashcardPass],
  );

  const handleSelectFlashcardDirection = useCallback(
    (nextDirection: FlashcardDirection): void => {
      stop();
      setFlashcardDirection(nextDirection);
      setDeck((current) => applyDirectionToDeck(current, nextDirection));
      setIsFlipped(false);
    },
    [stop],
  );

  const handleToggleIncludeMastered = useCallback((): void => {
    const nextInclude = !includeMastered;
    setIncludeMastered(nextInclude);
    startNewFlashcardPass(flashcardCategoryId, nextInclude, flashcardDirection, easyProgress);
  }, [easyProgress, flashcardCategoryId, flashcardDirection, includeMastered, startNewFlashcardPass]);

  const handleRetakeFlashcards = useCallback(
    (overrideIncludeMastered?: boolean): void => {
      const effectiveInclude = overrideIncludeMastered ?? includeMastered;
      if (overrideIncludeMastered !== undefined) {
        setIncludeMastered(overrideIncludeMastered);
      }
      startNewFlashcardPass(flashcardCategoryId, effectiveInclude, flashcardDirection, easyProgress);
    },
    [easyProgress, flashcardCategoryId, flashcardDirection, includeMastered, startNewFlashcardPass],
  );

  const currentDeckItem: DeckCardItem | undefined = deck[deckIndex];
  const currentCard = currentDeckItem?.card;
  const currentBackFirst = currentDeckItem?.backFirst ?? false;
  const showingDescription = currentBackFirst ? !isFlipped : isFlipped;

  const handleFlipCard = useCallback((): void => {
    if (!currentCard) return;
    stop();
    setIsFlipped((prev) => !prev);
  }, [currentCard, stop]);

  const advanceOrRebuildPass = useCallback(
    (updatedProgress: EasyProgress): void => {
      setIsFlipped(false);
      if (deckIndex + 1 < deck.length) {
        setDeckIndex(deckIndex + 1);
      } else {
        const masteredSet = getMasteredFlashcardIdSet(updatedProgress);
        const nextDeck = buildFlashcardDeck({
          categoryId: flashcardCategoryId,
          masteredIds: masteredSet,
          includeMastered,
          direction: flashcardDirection,
        });
        setDeck(nextDeck);
        setDeckIndex(0);
      }
    },
    [deck.length, deckIndex, flashcardCategoryId, flashcardDirection, includeMastered],
  );

  /** Slot 1 (left): mark current card as mastered (moves to mastered pool) and advance. */
  const handleMasterCard = useCallback((): void => {
    if (!currentCard) return;
    stop();
    const updated = markFlashcardMastered(easyProgress, currentCard.id);
    saveEasyProgress(updated);
    setEasyProgress(updated);
    advanceOrRebuildPass(updated);
  }, [advanceOrRebuildPass, currentCard, easyProgress, stop]);

  /** Slot 5 (right): next card — unmastered card stays in the pool for another test. */
  const handleNextCardKeepInPool = useCallback((): void => {
    if (!currentCard) return;
    stop();
    advanceOrRebuildPass(easyProgress);
  }, [advanceOrRebuildPass, currentCard, easyProgress, stop]);

  // Exams handlers
  const startNewExam = useCallback(
    (nextCategoryId: string, progressToUse: EasyProgress): void => {
      stop();
      const missedIds = getMissedExamCardIds(progressToUse, nextCategoryId);
      const nextQuestions = buildExamQuestions({
        categoryId: nextCategoryId,
        missedCardIds: missedIds,
      });
      setExamQuestions(nextQuestions);
      setExamIndex(0);
      setExamAnswers({});
      setRecallInput("");
      setExamResult(null);
      setLastExamFeedback(null);
    },
    [stop],
  );

  const handleSelectExamCategory = useCallback(
    (categoryId: string): void => {
      setExamCategoryId(categoryId);
      startNewExam(categoryId, easyProgress);
    },
    [easyProgress, startNewExam],
  );

  const handleRetakeExam = useCallback((): void => {
    startNewExam(examCategoryId, easyProgress);
  }, [easyProgress, examCategoryId, startNewExam]);

  const currentExamQuestion: ExamQuestion | undefined = examQuestions[examIndex];

  const handleSubmitExamAnswer = useCallback(
    (rawAnswer: string): void => {
      if (!currentExamQuestion || examResult) return;
      stop();
      const isCorrect = isExamAnswerCorrect(currentExamQuestion, rawAnswer);
      setLastExamFeedback({
        questionNumber: examIndex + 1,
        cardId: currentExamQuestion.card.id,
        prompt: currentExamQuestion.prompt,
        userAnswer: rawAnswer.trim(),
        correctCommand: currentExamQuestion.correctCommand,
        correct: isCorrect,
      });
      const nextAnswers: Record<number, string> = {
        ...examAnswers,
        [examIndex]: rawAnswer,
      };
      setExamAnswers(nextAnswers);
      setRecallInput("");

      if (examIndex + 1 < examQuestions.length) {
        setExamIndex(examIndex + 1);
      } else {
        const summary = gradeExam(examQuestions, nextAnswers, examCategoryId);
        const updatedProgress = recordExamAttempt(easyProgress, examCategoryId, {
          score: summary.score,
          total: summary.total,
          missedCardIds: summary.missedCardIds,
        });
        saveEasyProgress(updatedProgress);
        setEasyProgress(updatedProgress);
        setExamResult(summary);
      }
    },
    [
      currentExamQuestion,
      easyProgress,
      examAnswers,
      examCategoryId,
      examIndex,
      examQuestions,
      examResult,
      stop,
    ],
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

  const flashcardAudioSide = showingDescription ? "back" : "front";
  const flashcardAudioKey = currentCard ? `linuxdeck:${currentCard.id}:${flashcardAudioSide}` : "";
  const flashcardAudioText = currentCard
    ? showingDescription
      ? currentCard.description
      : currentCard.command
    : "";
  const isFlashcardPlaying = Boolean(flashcardAudioKey && activeKey === flashcardAudioKey && phase !== "idle");

  const examAudioKey = currentExamQuestion ? `linuxdeck:${currentExamQuestion.card.id}:back` : "";
  const examAudioText = currentExamQuestion ? currentExamQuestion.prompt : "";
  const isExamAudioPlaying = Boolean(examAudioKey && activeKey === examAudioKey && phase !== "idle");

  const currentExamScopeStats = useMemo(
    () => getExamScopeStats(easyProgress, examCategoryId),
    [easyProgress, examCategoryId],
  );
  const overallExamStats = useMemo(
    () => getExamScopeStats(easyProgress, "all"),
    [easyProgress],
  );

  const scopeTotalCards = useMemo(
    () => getFlashcardsByCategory(flashcardCategoryId).length,
    [flashcardCategoryId],
  );
  const scopeMasteredCards = useMemo(
    () => countCategoryMasteredFlashcards(easyProgress, flashcardCategoryId),
    [easyProgress, flashcardCategoryId],
  );

  return (
    <div className="w-full min-w-0 max-w-full space-y-2.5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/"
            aria-label="Back to Modes"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground/40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
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
              <span
                data-testid="easy-mastered-pill"
                style={{
                  borderColor: hexToRgba(modeColor, 0.55),
                  backgroundColor: hexToRgba(modeColor, 0.14),
                  color: modeColor,
                }}
                className="tnum rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold"
              >
                {masteredCount} / {TOTAL_FLASHCARDS} mastered
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
                "rounded-lg border px-2 py-1 text-center font-mono text-xs font-medium transition-colors",
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
          <section aria-label="Easy learning sections" className="space-y-1.5">
            {/* 1. Command Reference (LIVE) */}
            <button
              type="button"
              data-testid="easy-section-reference"
              aria-pressed={activeSection === "reference"}
              onClick={() => {
                handleSwitchSection("reference");
                referenceSectionRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
              }}
              style={
                activeSection === "reference"
                  ? {
                      borderColor: hexToRgba(modeColor, 0.65),
                      backgroundColor: hexToRgba(modeColor, 0.1),
                    }
                  : undefined
              }
              className={cn(
                "flex w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors hover:border-foreground/40",
                activeSection !== "reference" && "border-border bg-card",
              )}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {activeSection === "reference" ? (
                  <span
                    style={{
                      borderColor: hexToRgba(modeColor, 0.55),
                      backgroundColor: hexToRgba(modeColor, 0.16),
                      color: modeColor,
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                  >
                    <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
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
                  </span>
                  {activeSection === "reference" ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      All 388 commands across 8 categories — plain words + examples
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span
                  data-testid="reference-progress-count"
                  className="tnum font-mono text-xs font-semibold text-foreground"
                >
                  {viewedCount}/{TOTAL_REFERENCE_COMMANDS}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              </span>
            </button>

            {/* 2. Flash Cards (LIVE in Round 3) */}
            <button
              type="button"
              data-testid="easy-section-flashcards"
              aria-pressed={activeSection === "flashcards"}
              onClick={() => handleSwitchSection("flashcards")}
              style={
                activeSection === "flashcards"
                  ? {
                      borderColor: hexToRgba(modeColor, 0.65),
                      backgroundColor: hexToRgba(modeColor, 0.1),
                    }
                  : undefined
              }
              className={cn(
                "flex w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors hover:border-foreground/40",
                activeSection !== "flashcards" && "border-border bg-card",
              )}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {activeSection === "reference" ? (
                  <span
                    style={{
                      borderColor: hexToRgba(modeColor, 0.55),
                      backgroundColor: hexToRgba(modeColor, 0.16),
                      color: modeColor,
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                  >
                    <Layers className="h-3.5 w-3.5" aria-hidden />
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-foreground sm:text-sm">
                      2. Flash Cards
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
                  </span>
                  {activeSection === "reference" ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      187 LinuxDeck flashcards — 5-slot touch drill + mastered pool
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span
                  data-testid="flashcards-progress-count"
                  className="tnum font-mono text-xs font-semibold text-foreground"
                >
                  {masteredCount}/{TOTAL_FLASHCARDS}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              </span>
            </button>

            {/* 3. Exams (LIVE in Round 4) */}
            <button
              type="button"
              data-testid="easy-section-exams"
              aria-pressed={activeSection === "exams"}
              onClick={() => handleSwitchSection("exams")}
              style={
                activeSection === "exams"
                  ? {
                      borderColor: hexToRgba(modeColor, 0.65),
                      backgroundColor: hexToRgba(modeColor, 0.1),
                    }
                  : undefined
              }
              className={cn(
                "flex w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors hover:border-foreground/40",
                activeSection !== "exams" && "border-border bg-card",
              )}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {activeSection === "reference" ? (
                  <span
                    style={{
                      borderColor: hexToRgba(modeColor, 0.55),
                      backgroundColor: hexToRgba(modeColor, 0.16),
                      color: modeColor,
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                  >
                    <GraduationCap className="h-3.5 w-3.5" aria-hidden />
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-foreground sm:text-sm">
                      3. Exams
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
                  </span>
                  {activeSection === "reference" ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      20-question mixed Terminal Recall + Multiple Choice (80% to pass)
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span
                  data-testid="exams-progress-count"
                  className="tnum font-mono text-xs font-semibold text-foreground"
                >
                  {passedExamsCount}/{TOTAL_EXAMS}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              </span>
            </button>
          </section>

          {activeSection === "exams" ? (
            /* Section 3: Exams (Terminal Recall + Multiple Choice, 20 questions, 80% pass) */
            <section
              data-testid="exams-section"
              aria-label="Exams"
              className="w-full min-w-0 max-w-full space-y-2"
            >
              {/* Category Picker Strip (All Cards + 8 Categories) */}
              <div
                data-testid="exams-category-bar"
                aria-label="Select exam category"
                className="flex w-full min-w-0 max-w-full gap-1.5 overflow-x-auto pb-0.5 no-scrollbar"
              >
                <button
                  type="button"
                  data-testid="exam-category-all"
                  aria-pressed={examCategoryId === "all"}
                  onClick={() => handleSelectExamCategory("all")}
                  style={
                    examCategoryId === "all"
                      ? {
                          borderColor: modeColor,
                          backgroundColor: hexToRgba(modeColor, 0.16),
                          color: modeColor,
                        }
                      : undefined
                  }
                  className={cn(
                    "shrink-0 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
                    examCategoryId !== "all" &&
                      "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  All Cards{overallExamStats ? ` (${overallExamStats.bestScore}/${overallExamStats.bestTotal})` : ""}
                </button>
                {COMMAND_CATEGORIES.map((cat) => {
                  const active = examCategoryId === cat.id;
                  const catStats = getExamScopeStats(easyProgress, cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      data-testid={`exam-category-${cat.id}`}
                      aria-pressed={active}
                      title={`${cat.number}. ${cat.name}`}
                      onClick={() => handleSelectExamCategory(cat.id)}
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
                        "shrink-0 rounded-lg border px-2 py-1 font-mono text-[11px] font-medium transition-colors",
                        !active && "border-border bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {SHORT_CATEGORY_LABELS[cat.id] ?? `${cat.number}. ${cat.name}`}
                      {catStats ? ` (${catStats.bestScore}/${catStats.bestTotal})` : ""}
                    </button>
                  );
                })}
              </div>

              {/* Exam Scope & Best Score Bar */}
              <div
                data-testid="exams-scope-summary"
                className="flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5"
              >
                <span
                  data-testid="exam-best-score-label"
                  className="tnum font-mono text-[11px] text-muted-foreground"
                >
                  {currentExamScopeStats ? (
                    <>
                      Best:{" "}
                      <strong className="text-foreground">
                        {currentExamScopeStats.bestScore}/{currentExamScopeStats.bestTotal} (
                        {currentExamScopeStats.bestPercent}%)
                      </strong>{" "}
                      ·{" "}
                      <span
                        className={
                          currentExamScopeStats.passed ? "text-emerald-300" : "text-amber-300"
                        }
                      >
                        {currentExamScopeStats.passed ? "Passed" : "Needs 80%"}
                      </span>
                    </>
                  ) : (
                    <>Pass mark: 80% (16/20) · Mixed Recall &amp; Multiple Choice</>
                  )}
                </span>
                <button
                  type="button"
                  data-testid="exam-restart-button"
                  onClick={handleRetakeExam}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/70 px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground transition-colors hover:border-foreground/40"
                >
                  <Shuffle className="h-3 w-3" aria-hidden />
                  New Exam
                </button>
              </div>

              {/* Immediate Per-Question Feedback Banner (green if right, red + right answer if wrong) */}
              {lastExamFeedback ? (
                <div
                  role="status"
                  data-testid="exam-question-feedback"
                  data-feedback-status={lastExamFeedback.correct ? "correct" : "wrong"}
                  data-feedback-question={lastExamFeedback.questionNumber}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-1.5 font-mono text-xs",
                    lastExamFeedback.correct
                      ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-300"
                      : "border-red-500/80 bg-red-500/15 text-red-300",
                  )}
                >
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    {lastExamFeedback.correct ? (
                      <>
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
                        Q{lastExamFeedback.questionNumber} Correct: {lastExamFeedback.correctCommand}
                      </>
                    ) : (
                      <>
                        <X className="h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden />
                        Q{lastExamFeedback.questionNumber} Wrong ({lastExamFeedback.userAnswer || "blank"})
                      </>
                    )}
                  </span>
                  {!lastExamFeedback.correct ? (
                    <span
                      data-testid="exam-feedback-right-answer"
                      className="font-semibold text-emerald-300"
                    >
                      Right answer: {lastExamFeedback.correctCommand}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {/* Exam Results View vs Active Question View */}
              {examResult ? (
                <div
                  data-testid="exam-results-card"
                  style={{
                    borderColor: examResult.passed
                      ? hexToRgba("#22c55e", 0.65)
                      : hexToRgba("#f59e0b", 0.65),
                  }}
                  className="w-full min-w-0 max-w-full space-y-2.5 rounded-2xl border bg-card p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Exam Complete
                      </span>
                      <h2
                        data-testid="exam-results-score"
                        className="tnum font-mono text-xl font-bold text-foreground"
                      >
                        {examResult.score} / {examResult.total} ({examResult.percent}%)
                      </h2>
                    </div>
                    <span
                      data-testid="exam-results-status"
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider",
                        examResult.passed
                          ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-300"
                          : "border-amber-400/60 bg-amber-500/15 text-amber-300",
                      )}
                    >
                      {examResult.passed ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          Passed
                        </>
                      ) : (
                        <>Needs 80% to pass</>
                      )}
                    </span>
                  </div>

                  {currentExamScopeStats ? (
                    <p
                      data-testid="exam-results-best"
                      className="tnum font-mono text-xs text-muted-foreground"
                    >
                      Best score for this exam: {currentExamScopeStats.bestScore}/
                      {currentExamScopeStats.bestTotal} ({currentExamScopeStats.bestPercent}%)
                    </p>
                  ) : null}

                  {/* Missed Questions Review */}
                  {examResult.missedQuestions.length === 0 ? (
                    <div
                      data-testid="exam-perfect-banner"
                      className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 font-mono text-xs text-emerald-200"
                    >
                      Perfect score — 0 missed questions!
                    </div>
                  ) : (
                    <div data-testid="exam-missed-list" className="space-y-1.5">
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Missed questions ({examResult.missedQuestions.length}) — queued first for your next retake
                      </span>
                      <div className="max-h-52 space-y-1.5 overflow-y-auto pr-0.5">
                        {examResult.missedQuestions.map((item) => (
                          <div
                            key={item.question.card.id}
                            data-testid="exam-missed-item"
                            data-missed-card-id={item.question.card.id}
                            className="rounded-xl border border-border/80 bg-background/60 p-2.5 text-xs"
                          >
                            <p className="font-medium text-foreground">{item.question.prompt}</p>
                            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                              <span className="text-red-300/90">
                                Your answer: {item.userAnswer || "(blank)"}
                              </span>
                              <span
                                data-testid="exam-missed-correct"
                                className="font-semibold text-emerald-300"
                              >
                                Right answer: {item.question.correctCommand}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    data-testid="exam-retake-button"
                    onClick={handleRetakeExam}
                    style={{
                      borderColor: modeColor,
                      backgroundColor: hexToRgba(modeColor, 0.16),
                      color: modeColor,
                    }}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 font-mono text-xs font-semibold transition-colors"
                  >
                    <Shuffle className="h-3.5 w-3.5" aria-hidden />
                    Retake Exam
                  </button>
                </div>
              ) : currentExamQuestion ? (
                <div
                  data-testid="exam-question-card"
                  data-question-index={examIndex}
                  data-question-mode={currentExamQuestion.mode}
                  data-card-id={currentExamQuestion.card.id}
                  data-correct-command={currentExamQuestion.correctCommand}
                  style={{ borderColor: hexToRgba(modeColor, 0.55) }}
                  className="relative w-full min-w-0 max-w-full space-y-2.5 rounded-2xl border bg-card p-3"
                >
                  {/* Question Header: Mode Badge + Category + Counter + Speaker */}
                  <div className="flex items-center justify-between gap-2 pr-10">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        data-testid="exam-question-mode-badge"
                        style={{
                          borderColor: hexToRgba(modeColor, 0.55),
                          backgroundColor: hexToRgba(modeColor, 0.14),
                          color: modeColor,
                        }}
                        className="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                      >
                        {currentExamQuestion.mode === "recall"
                          ? "Terminal Recall"
                          : "Multiple Choice"}
                      </span>
                      <span className="truncate font-mono text-[10px] text-muted-foreground">
                        {currentExamQuestion.card.categoryNumber}.{" "}
                        {currentExamQuestion.card.categoryName}
                      </span>
                    </div>
                    <span
                      data-testid="exam-question-position"
                      className="tnum shrink-0 font-mono text-[11px] font-semibold text-muted-foreground"
                    >
                      {examIndex + 1} / {examQuestions.length}
                    </span>
                  </div>

                  {/* Speaker button — speaks question stem with Kokoro af_heart */}
                  <button
                    type="button"
                    data-testid="exam-question-speaker"
                    aria-label={
                      isExamAudioPlaying
                        ? "Stop question audio"
                        : "Hear question description"
                    }
                    aria-pressed={isExamAudioPlaying}
                    onClick={() => toggle(examAudioKey, examAudioText)}
                    className={cn(
                      "absolute right-3 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                      isExamAudioPlaying
                        ? "border-sky-400 bg-sky-500/20 text-sky-200"
                        : "border-border bg-background/80 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                    )}
                  >
                    <Volume2 className="h-4 w-4" aria-hidden />
                  </button>

                  {/* Question Stem (Plain-Words Description) */}
                  <div className="rounded-xl border border-border/80 bg-background/60 p-2.5">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {currentExamQuestion.mode === "recall"
                        ? "Type the command for this description:"
                        : "Pick the right command for this description:"}
                    </span>
                    <p
                      data-testid="exam-question-prompt"
                      className="mt-1 break-words text-sm font-medium leading-snug text-foreground"
                    >
                      {currentExamQuestion.prompt}
                    </p>
                  </div>

                  {/* Mode-Specific Answer Area */}
                  {currentExamQuestion.mode === "recall" ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitExamAnswer(recallInput);
                      }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-2">
                        <span
                          data-testid="exam-recall-prompt"
                          style={promptColor ? { color: promptColor } : undefined}
                          className="shrink-0 font-mono text-xs text-sky-300"
                        >
                          {prompt}
                        </span>
                        <input
                          type="text"
                          data-testid="exam-recall-input"
                          aria-label="Type command from memory"
                          value={recallInput}
                          onChange={(e) => setRecallInput(e.target.value)}
                          placeholder="Type exact command..."
                          autoComplete="off"
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck={false}
                          style={commandColor ? { color: commandColor } : undefined}
                          className="min-w-0 flex-1 bg-transparent font-mono text-xs font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:outline-none sm:text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        data-testid="exam-submit-answer"
                        style={{
                          borderColor: modeColor,
                          backgroundColor: hexToRgba(modeColor, 0.16),
                          color: modeColor,
                        }}
                        className="inline-flex w-full items-center justify-center gap-1 rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold transition-colors"
                      >
                        Submit Command
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </form>
                  ) : (
                    <div
                      role="group"
                      data-testid="exam-mc-options"
                      aria-label="Multiple choice command options"
                      className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
                    >
                      {currentExamQuestion.options.map((optionCmd, optIdx) => (
                        <button
                          key={`${optIdx}-${optionCmd}`}
                          type="button"
                          data-testid={`exam-mc-option-${optIdx}`}
                          data-option-command={optionCmd}
                          onClick={() => handleSubmitExamAnswer(optionCmd)}
                          className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 text-left font-mono text-xs font-semibold text-foreground transition-colors hover:border-foreground/45 active:scale-[0.99]"
                        >
                          <span className="min-w-0 break-all">
                            <span
                              style={promptColor ? { color: promptColor } : { color: modeColor }}
                            >
                              $
                            </span>{" "}
                            <span style={commandColor ? { color: commandColor } : undefined}>
                              {optionCmd}
                            </span>
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          ) : activeSection === "flashcards" ? (
            /* Section 2: Flash Cards (187 LinuxDeck cards across 8 categories + All Cards) */
            <section
              data-testid="flashcards-section"
              aria-label="Flash Cards"
              className="w-full min-w-0 max-w-full space-y-2"
            >
              {/* Category Filter Strip (All Cards + 8 Reference Categories with per-category mastered counts) */}
              <div
                data-testid="flashcards-category-bar"
                aria-label="Browse flashcards by category"
                className="flex w-full min-w-0 max-w-full gap-1.5 overflow-x-auto pb-0.5 no-scrollbar"
              >
                <button
                  type="button"
                  data-testid="flashcard-category-all"
                  aria-pressed={flashcardCategoryId === "all"}
                  onClick={() => handleSelectFlashcardCategory("all")}
                  style={
                    flashcardCategoryId === "all"
                      ? {
                          borderColor: modeColor,
                          backgroundColor: hexToRgba(modeColor, 0.16),
                          color: modeColor,
                        }
                      : undefined
                  }
                  className={cn(
                    "shrink-0 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
                    flashcardCategoryId !== "all" &&
                      "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  All Cards ({masteredCount}/{TOTAL_FLASHCARDS})
                </button>
                {COMMAND_CATEGORIES.map((cat) => {
                  const active = flashcardCategoryId === cat.id;
                  const catTotal = getFlashcardsByCategory(cat.id).length;
                  const catMastered = countCategoryMasteredFlashcards(easyProgress, cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      data-testid={`flashcard-category-${cat.id}`}
                      aria-pressed={active}
                      title={`${cat.number}. ${cat.name} (${catMastered}/${catTotal})`}
                      onClick={() => handleSelectFlashcardCategory(cat.id)}
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
                        "shrink-0 rounded-lg border px-2 py-1 font-mono text-[11px] font-medium transition-colors",
                        !active && "border-border bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {SHORT_CATEGORY_LABELS[cat.id] ?? `${cat.number}. ${cat.name}`} ({catMastered}/{catTotal})
                    </button>
                  );
                })}
              </div>

              {/* Direction Bar (Cmd -> Desc, Desc -> Cmd, Mix it up) */}
              <div
                role="group"
                data-testid="flashcards-direction-bar"
                aria-label="Flashcard direction"
                className="grid grid-cols-3 gap-1.5"
              >
                {FLASHCARD_DIRECTION_OPTIONS.map((option) => {
                  const active = flashcardDirection === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      data-testid={`flashcard-direction-${option.value}`}
                      aria-pressed={active}
                      title={option.description}
                      onClick={() => handleSelectFlashcardDirection(option.value)}
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
                        "rounded-lg border px-2 py-1 text-center font-mono text-[11px] font-semibold transition-colors",
                        !active && "border-border bg-card text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* Mastered Pool Retake Bar (Keep OUT vs Leave IN + Shuffle/Retake) */}
              <div
                data-testid="flashcards-mastered-pool-bar"
                className="flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5"
              >
                <span
                  data-testid="flashcards-mastered-summary"
                  className="tnum font-mono text-[11px] text-muted-foreground"
                >
                  Mastered ({scopeMasteredCards}/{scopeTotalCards}):{" "}
                  <strong
                    data-testid="flashcard-retake-mode-label"
                    className="text-foreground"
                  >
                    {includeMastered ? "Leave IN for retake" : "Keep OUT of retake"}
                  </strong>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="flashcard-retake-toggle"
                    onClick={handleToggleIncludeMastered}
                    style={{
                      borderColor: hexToRgba(modeColor, 0.5),
                      color: modeColor,
                    }}
                    className="rounded-lg border bg-background/70 px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors hover:bg-background"
                  >
                    {includeMastered ? "Keep Mastered OUT" : "Leave Mastered IN"}
                  </button>
                  <button
                    type="button"
                    data-testid="flashcard-retake-button"
                    aria-label="Retake and shuffle flashcard pool"
                    onClick={() => handleRetakeFlashcards()}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/70 px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground transition-colors hover:border-foreground/40"
                  >
                    <Shuffle className="h-3 w-3" aria-hidden />
                    Retake
                  </button>
                </div>
              </div>

              {/* Active Flashcard or Pool Complete View */}
              {currentCard ? (
                <div className="space-y-1.5">
                  <div
                    data-testid="flashcard-card"
                    data-card-id={currentCard.id}
                    data-card-flipped={isFlipped ? "true" : "false"}
                    data-card-face={showingDescription ? "description" : "command"}
                    data-side={showingDescription ? "description" : "command"}
                    style={{
                      borderColor: isFlashcardMastered(easyProgress, currentCard.id)
                        ? hexToRgba("#22c55e", 0.6)
                        : hexToRgba(modeColor, 0.55),
                    }}
                    className="relative flex min-h-[148px] w-full min-w-0 max-w-full select-none flex-col justify-between rounded-2xl border bg-card p-3"
                  >
                    {/* Top card chrome: Category + Mastered status + Position + Speaker button (z-20 above touch slots) */}
                    <div className="flex items-center justify-between gap-2 pr-10">
                      <span
                        data-testid="flashcard-category-label"
                        className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                      >
                        {currentCard.categoryNumber}. {currentCard.categoryName}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {isFlashcardMastered(easyProgress, currentCard.id) ? (
                          <span
                            data-testid="flashcard-mastered-badge"
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300"
                          >
                            <Check className="h-2.5 w-2.5" aria-hidden />
                            Mastered
                          </span>
                        ) : null}
                        <span
                          data-testid="flashcard-position"
                          className="tnum font-mono text-[11px] font-semibold text-muted-foreground"
                        >
                          {deckIndex + 1} / {deck.length}
                        </span>
                      </div>
                    </div>

                    {/* Speaker button — outside/above the 5-slot overlay so tapping it plays/stops Kokoro af_heart */}
                    <button
                      type="button"
                      data-testid="flashcard-speaker"
                      aria-label={
                        isFlashcardPlaying
                          ? `Stop audio for ${currentCard.command}`
                          : `Play audio for ${currentCard.command}`
                      }
                      aria-pressed={isFlashcardPlaying}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(flashcardAudioKey, flashcardAudioText);
                      }}
                      className={cn(
                        "absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                        isFlashcardPlaying
                          ? "border-sky-400 bg-sky-500/20 text-sky-200"
                          : "border-border bg-background/80 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                      )}
                    >
                      <Volume2 className="h-4 w-4" aria-hidden />
                    </button>

                    {/* Center Face Content: Front (Command) vs Back (Plain-Words Description) */}
                    <div
                      data-testid="flashcard-visible-face"
                      data-face={showingDescription ? "description" : "command"}
                      className="my-2 flex min-h-[82px] flex-col items-center justify-center px-2 text-center"
                    >
                      {showingDescription ? (
                        <div className="space-y-1">
                          <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            Plain-Words Description
                          </span>
                          <p
                            data-testid="flashcard-description-text"
                            className="break-words text-sm font-medium leading-snug text-foreground sm:text-base"
                          >
                            {currentCard.description}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            Command
                          </span>
                          <p
                            data-testid="flashcard-command-text"
                            className="break-words font-mono text-base font-bold leading-snug text-foreground sm:text-xl"
                          >
                            <span
                              style={promptColor ? { color: promptColor } : { color: modeColor }}
                            >
                              $
                            </span>{" "}
                            <span style={commandColor ? { color: commandColor } : undefined}>
                              {currentCard.command}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Card Hint Bar */}
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground">
                      <span className="text-emerald-400/90">◀ Left: Mastered</span>
                      <span>Middle 3: Tap to Flip</span>
                      <span className="text-sky-300/90">Right: Next ▶</span>
                    </div>

                    {/* 5-Slot Touch Overlay: Slot 1 = Mastered | Slots 2-4 = Flip | Slot 5 = Next (unmastered stays in pool) */}
                    <div
                      role="group"
                      data-testid="flashcard-touch-slots"
                      aria-label="5-slot flashcard touch controls"
                      className="absolute inset-0 z-10 grid grid-cols-5 [-webkit-tap-highlight-color:transparent]"
                    >
                      <button
                        type="button"
                        data-testid="flashcard-slot-1"
                        aria-label="Slot 1: Mark as mastered"
                        onClick={handleMasterCard}
                        className="h-full w-full cursor-pointer bg-transparent p-0 outline-none"
                      />
                      <button
                        type="button"
                        data-testid="flashcard-slot-2"
                        aria-label="Slot 2: Flip card"
                        onClick={handleFlipCard}
                        className="h-full w-full cursor-pointer bg-transparent p-0 outline-none"
                      />
                      <button
                        type="button"
                        data-testid="flashcard-slot-3"
                        aria-label="Slot 3: Flip card"
                        onClick={handleFlipCard}
                        className="h-full w-full cursor-pointer bg-transparent p-0 outline-none"
                      />
                      <button
                        type="button"
                        data-testid="flashcard-slot-4"
                        aria-label="Slot 4: Flip card"
                        onClick={handleFlipCard}
                        className="h-full w-full cursor-pointer bg-transparent p-0 outline-none"
                      />
                      <button
                        type="button"
                        data-testid="flashcard-slot-5"
                        aria-label="Slot 5: Next card (keep in pool)"
                        onClick={handleNextCardKeepInPool}
                        className="h-full w-full cursor-pointer bg-transparent p-0 outline-none"
                      />
                    </div>
                  </div>

                  {/* Visible Action Controls mirroring the 5-slot touch system */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      data-testid="flashcard-action-master"
                      onClick={handleMasterCard}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-emerald-500/45 bg-emerald-500/12 px-2.5 py-1.5 font-mono text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      Mastered
                    </button>
                    <button
                      type="button"
                      data-testid="flashcard-action-flip"
                      onClick={handleFlipCard}
                      style={{
                        borderColor: hexToRgba(modeColor, 0.5),
                        backgroundColor: hexToRgba(modeColor, 0.12),
                        color: modeColor,
                      }}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border px-2.5 py-1.5 font-mono text-xs font-semibold transition-colors"
                    >
                      <RotateCw className="h-3.5 w-3.5" aria-hidden />
                      Flip
                    </button>
                    <button
                      type="button"
                      data-testid="flashcard-action-next"
                      onClick={handleNextCardKeepInPool}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 font-mono text-xs font-semibold text-foreground transition-colors hover:border-foreground/40"
                    >
                      Next
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  data-testid="flashcard-pool-complete"
                  className="rounded-2xl border border-emerald-500/45 bg-card p-4 text-center space-y-2.5"
                >
                  <p className="font-mono text-sm font-bold text-emerald-300">
                    All {scopeTotalCards} cards in this pool are mastered!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mastered cards are currently kept OUT of retakes. Leave them IN to drill the full deck again.
                  </p>
                  <button
                    type="button"
                    data-testid="flashcard-retake-with-mastered"
                    onClick={() => handleRetakeFlashcards(true)}
                    style={{
                      borderColor: modeColor,
                      backgroundColor: hexToRgba(modeColor, 0.16),
                      color: modeColor,
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold"
                  >
                    <Shuffle className="h-3.5 w-3.5" aria-hidden />
                    Leave Mastered IN &amp; Retake ({scopeTotalCards} cards)
                  </button>
                </div>
              )}
            </section>
          ) : (
            /* Section 1: Command Reference Browser */
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
          )}
        </>
      )}
    </div>
  );
}
