import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CornerDownLeft,
  GraduationCap,
  HelpCircle,
  Layers,
  RotateCcw,
  RotateCw,
  Search,
  Shuffle,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { PageHelpButton } from "@/components/PageHelpButton";
import { withBasePath } from "@/lib/base-path";
import {
  COMMAND_CATEGORIES,
  COMMAND_REFERENCE,
  commandImages,
  formatReferenceClipText,
  searchCommands,
  TOTAL_REFERENCE_COMMANDS,
  type CommandReferenceEntry,
} from "@/data/command-reference";
import { ReferenceImageLightbox } from "@/components/ReferenceImageLightbox";
import {
  TOUR_CLOSE_AUDIO_KEY,
  TOUR_INTRO_AUDIO_KEY,
  WHOS_WHO_AUDIO_KEY,
  WHOS_WHO_FULL_TEXT,
} from "@/data/tour-and-help";
import { useGuidedTour } from "@/store/tour-store";
import {
  buildExamStudyQueue,
  formatRecallHint,
  generateMcOptions,
  getExamCardsByCategory,
  isRecallAnswerCorrect,
  normalizeRecallCommand,
  TOTAL_EXAMS,
  type ExamQuestionMode,
} from "@/data/exams";
import {
  applyDirectionToDeck,
  buildFlashcardDeck,
  FLASHCARD_DIRECTION_OPTIONS,
  getFlashcardsByCategory,
  TOTAL_FLASHCARDS,
  type DeckCardItem,
  type FlashcardDirection,
  type FlashcardEntry,
} from "@/data/flashcards";
import { useCardAudio } from "@/hooks/useCardAudio";
import { formatTerminalPrompt, loadAuthAccount, resolvePromptUsername } from "@/lib/auth-sync";
import {
  countCategoryMasteredFlashcards,
  countCategoryViewedCommands,
  countMasteredFlashcards,
  countPassedExams,
  countViewedCommands,
  getMasteredFlashcardIdSet,
  isCategoryFullyMastered,
  isFlashcardMastered,
  loadEasyProgress,
  markCommandViewed,
  markFlashcardMastered,
  saveEasyProgress,
  type ActiveCoachMode,
  type EasyProgress,
} from "@/lib/coach";
import {
  hasPlayedIntroThisSession,
  markIntroPlayedThisSession,
  stopCoachEchoIntro,
  tryPlayCoachEchoIntro,
} from "@/lib/intro-audio";
import { cn } from "@/lib/utils";
import { hexToRgba, loadThemeSettings, useCoachTheme } from "@/store/theme-store";

const HOME = "/home/user";
const NEON = "#4ade80";

export type EasyActiveSection = "menu" | "reference" | "flashcards" | "exams";

export interface EasyModeProps {
  onSelectMode?: (nextMode: ActiveCoachMode) => void;
  initialSection?: EasyActiveSection;
}

/**
 * Master auto-read switch matching LinuxDeck's AudioToggle:
 * phosphor-green when on, dim slate when off, persisted across Flash Cards and Exams.
 */
export const AudioToggle = memo(() => {
  const { autoRead, toggleAutoRead } = useCardAudio();

  return (
    <button
      type="button"
      role="switch"
      data-testid="audio-autoread-toggle"
      aria-checked={autoRead}
      aria-label={autoRead ? "Auto-read cards: on" : "Auto-read cards: off"}
      title={autoRead ? "Auto-read on" : "Auto-read off"}
      onClick={toggleAutoRead}
      className="relative h-[28px] w-[56px] shrink-0 rounded-full outline-none transition-[background-color,border-color,box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-[#4ade80]/60 active:scale-95"
      style={{
        backgroundColor: autoRead ? "#09170e" : "#14171a",
        border: `1px solid ${autoRead ? "#22c55e" : "#2d3748"}`,
        boxShadow: autoRead
          ? "0 0 12px rgba(34,197,94,0.28), inset 0 0 6px rgba(34,197,94,0.12)"
          : "none",
      }}
    >
      <span
        aria-hidden
        className="absolute left-[7px] top-1/2 -translate-y-1/2 transition-opacity duration-200"
        style={{
          opacity: autoRead ? 1 : 0,
          color: NEON,
          filter: `drop-shadow(0 0 4px ${NEON})`,
        }}
      >
        <Volume2 size={13} strokeWidth={2.6} />
      </span>
      <span
        aria-hidden
        className="absolute right-[7px] top-1/2 -translate-y-1/2 transition-opacity duration-200"
        style={{ opacity: autoRead ? 0 : 1, color: "#64748b" }}
      >
        <VolumeX size={13} strokeWidth={2.4} />
      </span>
      <span
        aria-hidden
        className="absolute left-[3px] top-[3px] h-[20px] w-[20px] rounded-full"
        style={{
          transform: `translateX(${autoRead ? 28 : 0}px)`,
          transition:
            "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s, box-shadow 0.3s",
          backgroundColor: autoRead ? NEON : "#475569",
          boxShadow: autoRead
            ? `0 0 8px ${NEON}, 0 0 2px ${NEON}`
            : "inset 0 1px 1px rgba(255,255,255,0.08)",
        }}
      />
    </button>
  );
});
AudioToggle.displayName = "AudioToggle";

function SectionMiniRing({
  value,
  total,
  color,
}: {
  value: number;
  total: number;
  color: string;
}) {
  const size = 36;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = Math.max(1, total);
  const clamped = Math.max(0, Math.min(total, value));
  const percent = total > 0 ? (clamped / safeTotal) * 100 : 0;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="tnum absolute font-mono text-[9px] font-bold text-foreground">
        {Math.round(percent)}%
      </span>
    </div>
  );
}

export default function EasyMode({ initialSection = "menu" }: EasyModeProps = {}) {
  const { autoRead, activeKey, phase, speak, prefetch, toggle, stop, unlock } = useCardAudio();
  const [searchParams, setSearchParams] = useSearchParams();
  const tour = useGuidedTour();
  const themeCtx = useCoachTheme();
  const fallbackTheme = useMemo(() => loadThemeSettings(), []);
  const fallbackAccount = useMemo(() => loadAuthAccount(), []);

  const settings = themeCtx?.settings ?? fallbackTheme;
  const progressRevision = themeCtx?.progressRevision ?? 0;
  const promptUsername = themeCtx?.promptUsername ?? resolvePromptUsername(fallbackAccount);
  const promptColor = settings.promptColor;
  const commandColor = settings.commandColor;
  const modeColor = settings.modeColors.easy;

  const isWhosWhoUrlParam = searchParams.get("whoswho") === "1";
  const isTourCloseParam = searchParams.get("tourclose") === "1";
  const isEasyModeRoute = searchParams.get("mode") === "easy";

  const [easyProgress, setEasyProgress] = useState<EasyProgress>(() => loadEasyProgress());
  const [activeSection, setActiveSection] = useState<EasyActiveSection>(() =>
    isWhosWhoUrlParam ? "reference" : initialSection,
  );

  // Section 1: Command Reference state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedReferenceCategoryId, setSelectedReferenceCategoryId] = useState<string | null>(null);
  const [selectedCommandId, setSelectedCommandId] = useState<string | null>(null);
  const [showWhosWho, setShowWhosWho] = useState<boolean>(() => isWhosWhoUrlParam);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; name: string } | null>(null);

  useEffect(() => {
    if (isWhosWhoUrlParam) {
      setActiveSection("reference");
      setSelectedCommandId(null);
      setSelectedReferenceCategoryId(null);
      setShowWhosWho(true);
    } else if (tour?.tourActive && tour.currentStep?.id !== "modes") {
      // When the tour advances from Modes to Coach, show the Coach/Easy menu
      setShowWhosWho(false);
      setActiveSection("menu");
    }
  }, [isWhosWhoUrlParam, tour?.currentStep?.id, tour?.tourActive]);

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

  // Section 3: Exams (LinuxDeck study modes: Multiple Choice & Terminal Recall) state
  const [examScreenView, setExamScreenView] = useState<"menu" | "session">("menu");
  const [examMode, setExamMode] = useState<ExamQuestionMode>("mc");
  const [examCategoryId, setExamCategoryId] = useState<string>("all");
  const [examQueue, setExamQueue] = useState<FlashcardEntry[]>([]);
  const [examDeckTotal, setExamDeckTotal] = useState<number>(TOTAL_FLASHCARDS);
  const [examInitialMastered, setExamInitialMastered] = useState<number>(0);
  const [examStepIndex, setExamStepIndex] = useState<number>(0);
  const [examSessionMastered, setExamSessionMastered] = useState<number>(0);
  const [examSessionReviewed, setExamSessionReviewed] = useState<number>(0);
  const [examSelectedOptionIdx, setExamSelectedOptionIdx] = useState<number | null>(null);
  const [recallInput, setRecallInput] = useState<string>("");
  const [examSubmittedInput, setExamSubmittedInput] = useState<string>("");
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [examIsCorrect, setExamIsCorrect] = useState<boolean | null>(null);
  const [examShowHint, setExamShowHint] = useState<boolean>(false);
  const [examIncludeAllCards, setExamIncludeAllCards] = useState<boolean>(false);
  const recallInputRef = useRef<HTMLInputElement | null>(null);

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

  const stopRef = useRef(stop);
  stopRef.current = stop;

  // Play Coach Echo intro once per session if user landed directly on /coach
  useEffect(() => {
    if (!hasPlayedIntroThisSession()) {
      void tryPlayCoachEchoIntro().then((played) => {
        if (played) {
          markIntroPlayedThisSession();
        }
      });
    }
    return () => {
      stopRef.current();
      stopCoachEchoIntro();
    };
  }, []);

  const viewedCount = useMemo(() => countViewedCommands(easyProgress), [easyProgress]);
  const masteredCount = useMemo(() => countMasteredFlashcards(easyProgress), [easyProgress]);
  const passedExamsCount = useMemo(() => countPassedExams(easyProgress), [easyProgress]);

  const isSearchingReference = searchQuery.trim().length > 0;

  const selectedReferenceCategory = useMemo(() => {
    if (!selectedReferenceCategoryId) return null;
    return COMMAND_CATEGORIES.find((cat) => cat.id === selectedReferenceCategoryId) ?? null;
  }, [selectedReferenceCategoryId]);

  const categoryReferenceCommands = useMemo(() => {
    if (!selectedReferenceCategory) return [];
    return COMMAND_REFERENCE.filter((entry) => entry.categoryId === selectedReferenceCategory.id);
  }, [selectedReferenceCategory]);

  const filteredCommands = useMemo(
    () => searchCommands(searchQuery, "all"),
    [searchQuery],
  );

  const activeReferenceCommandPool = useMemo(
    () => (selectedReferenceCategory ? categoryReferenceCommands : filteredCommands),
    [categoryReferenceCommands, filteredCommands, selectedReferenceCategory],
  );

  const selectedEntry: CommandReferenceEntry | null = useMemo(() => {
    if (!selectedCommandId) return null;
    return COMMAND_REFERENCE.find((entry) => entry.id === selectedCommandId) ?? null;
  }, [selectedCommandId]);

  const selectedIndexInFiltered = useMemo(() => {
    if (!selectedEntry) return -1;
    return activeReferenceCommandPool.findIndex((entry) => entry.id === selectedEntry.id);
  }, [activeReferenceCommandPool, selectedEntry]);

  // ---------------------------------------------------------------------------
  // Flash Cards handlers & autoplay
  // ---------------------------------------------------------------------------

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
      unlock();
      setFlashcardCategoryId(categoryId);
      startNewFlashcardPass(categoryId, includeMastered, flashcardDirection, easyProgress);
    },
    [easyProgress, flashcardDirection, includeMastered, startNewFlashcardPass, unlock],
  );

  const handleSelectFlashcardDirection = useCallback(
    (nextDirection: FlashcardDirection): void => {
      unlock();
      stop();
      setFlashcardDirection(nextDirection);
      setDeck((current) => applyDirectionToDeck(current, nextDirection));
      setIsFlipped(false);
    },
    [stop, unlock],
  );

  const handleToggleIncludeMastered = useCallback((): void => {
    unlock();
    const nextInclude = !includeMastered;
    setIncludeMastered(nextInclude);
    startNewFlashcardPass(flashcardCategoryId, nextInclude, flashcardDirection, easyProgress);
  }, [easyProgress, flashcardCategoryId, flashcardDirection, includeMastered, startNewFlashcardPass, unlock]);

  const handleRetakeFlashcards = useCallback(
    (overrideIncludeMastered?: boolean): void => {
      unlock();
      const effectiveInclude = overrideIncludeMastered ?? includeMastered;
      if (overrideIncludeMastered !== undefined) {
        setIncludeMastered(overrideIncludeMastered);
      }
      startNewFlashcardPass(flashcardCategoryId, effectiveInclude, flashcardDirection, easyProgress);
    },
    [easyProgress, flashcardCategoryId, flashcardDirection, includeMastered, startNewFlashcardPass, unlock],
  );

  const currentDeckItem: DeckCardItem | undefined = deck[deckIndex];
  const currentCard = currentDeckItem?.card;
  const currentBackFirst = currentDeckItem?.backFirst ?? false;
  const showingDescription = currentBackFirst ? !isFlipped : isFlipped;

  // Auto-read visible Flash Card side (command on front, description on back) on card appear and every flip
  useEffect(() => {
    if (activeSection !== "flashcards" || !currentCard) return;
    if (autoRead) {
      const side = showingDescription ? "back" : "front";
      const key = `linuxdeck:${currentCard.id}:${side}`;
      const text = showingDescription ? currentCard.description : currentCard.command;
      void speak(key, text);

      const otherSide = showingDescription ? "front" : "back";
      const otherText = showingDescription ? currentCard.command : currentCard.description;
      prefetch(`linuxdeck:${currentCard.id}:${otherSide}`, otherText);
    } else {
      stop();
    }
    return () => {
      stop();
    };
  }, [
    activeSection,
    autoRead,
    currentCard,
    deckIndex,
    flashcardCategoryId,
    flashcardDirection,
    prefetch,
    showingDescription,
    speak,
    stop,
  ]);

  const handleFlipCard = useCallback((): void => {
    if (!currentCard) return;
    unlock();
    stop();
    setIsFlipped((prev) => !prev);
  }, [currentCard, stop, unlock]);

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

  /** Slot 1 (left): mark current card as mastered (shared mastery) and advance. */
  const handleMasterCard = useCallback((): void => {
    if (!currentCard) return;
    unlock();
    stop();
    const updated = markFlashcardMastered(easyProgress, currentCard.id);
    saveEasyProgress(updated);
    setEasyProgress(updated);
    advanceOrRebuildPass(updated);
  }, [advanceOrRebuildPass, currentCard, easyProgress, stop, unlock]);

  /** Slot 5 (right): next card — unmastered card stays in the pool for another test. */
  const handleNextCardKeepInPool = useCallback((): void => {
    if (!currentCard) return;
    unlock();
    stop();
    advanceOrRebuildPass(easyProgress);
  }, [advanceOrRebuildPass, currentCard, easyProgress, stop, unlock]);

  // ---------------------------------------------------------------------------
  // Exams (LinuxDeck study modes: Multiple Choice & Terminal Recall) handlers
  // ---------------------------------------------------------------------------

  const startExamStudySession = useCallback(
    (
      nextCategoryId: string,
      nextMode: ExamQuestionMode,
      progressToUse: EasyProgress,
      includeAllCards: boolean = false,
    ): void => {
      unlock();
      stop();
      const categoryCards = getExamCardsByCategory(nextCategoryId);
      const masteredSet = getMasteredFlashcardIdSet(progressToUse);
      const queue = buildExamStudyQueue({
        categoryId: nextCategoryId,
        masteredIds: masteredSet,
        includeMastered: includeAllCards,
      });
      const initialMastered = includeAllCards
        ? 0
        : categoryCards.filter((card) => masteredSet.has(card.id)).length;

      setExamCategoryId(nextCategoryId);
      setExamMode(nextMode);
      setExamIncludeAllCards(includeAllCards);
      setExamDeckTotal(categoryCards.length);
      setExamInitialMastered(initialMastered);
      setExamQueue(queue);
      setExamStepIndex(0);
      setExamSessionMastered(0);
      setExamSessionReviewed(0);
      setExamSelectedOptionIdx(null);
      setRecallInput("");
      setExamSubmittedInput("");
      setExamSubmitted(false);
      setExamIsCorrect(null);
      setExamShowHint(false);
      setExamScreenView("session");
    },
    [stop, unlock],
  );

  const handleOpenExamCategory = useCallback(
    (categoryId: string, overrideMode?: ExamQuestionMode): void => {
      const latestProgress = loadEasyProgress();
      setEasyProgress(latestProgress);
      startExamStudySession(categoryId, overrideMode ?? examMode, latestProgress, false);
    },
    [examMode, startExamStudySession],
  );

  const handleSwitchExamModeInSession = useCallback(
    (nextMode: ExamQuestionMode): void => {
      if (nextMode === examMode && examScreenView === "session") return;
      const latestProgress = loadEasyProgress();
      setEasyProgress(latestProgress);
      startExamStudySession(examCategoryId, nextMode, latestProgress, examIncludeAllCards);
    },
    [examCategoryId, examIncludeAllCards, examMode, examScreenView, startExamStudySession],
  );

  const handleRestartExamDeck = useCallback((): void => {
    const latestProgress = loadEasyProgress();
    setEasyProgress(latestProgress);
    startExamStudySession(examCategoryId, examMode, latestProgress, true);
  }, [examCategoryId, examMode, startExamStudySession]);

  const handleExamDone = useCallback((): void => {
    stop();
    setExamScreenView("menu");
  }, [stop]);

  const currentExamCard: FlashcardEntry | undefined = examQueue[0];

  // Generate 4 shuffled MC options (1 correct from category + 3 distractors from the whole 187-command pool)
  const currentMcOptions = useMemo(() => {
    if (!currentExamCard) return [];
    return generateMcOptions(currentExamCard);
    // Re-shuffle options whenever card or stepIndex changes (including when a missed card re-queues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExamCard?.id, examStepIndex]);

  // Autoplay question description when an exam question appears and autoRead is ON
  useEffect(() => {
    if (
      activeSection !== "exams" ||
      examScreenView !== "session" ||
      !currentExamCard ||
      examQueue.length === 0
    ) {
      return;
    }
    if (autoRead) {
      void speak(`linuxdeck:${currentExamCard.id}:back`, currentExamCard.description);
    } else {
      stop();
    }
    return () => {
      stop();
    };
  }, [
    activeSection,
    autoRead,
    currentExamCard,
    examMode,
    examQueue.length,
    examScreenView,
    examStepIndex,
    speak,
    stop,
  ]);

  // Focus Recall input when a new Recall question appears
  useEffect(() => {
    if (
      activeSection === "exams" &&
      examScreenView === "session" &&
      examMode === "recall" &&
      currentExamCard &&
      !examSubmitted
    ) {
      const id = window.setTimeout(() => recallInputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
  }, [activeSection, currentExamCard, examMode, examScreenView, examStepIndex, examSubmitted]);

  const handleSelectMcOption = useCallback(
    (optionIdx: number): void => {
      if (examSubmitted || !currentExamCard) return;
      unlock();
      stop();
      const chosenCommand = currentMcOptions[optionIdx] ?? "";
      const isCorrect =
        normalizeRecallCommand(chosenCommand) === normalizeRecallCommand(currentExamCard.command);
      setExamSelectedOptionIdx(optionIdx);
      setExamSubmittedInput(chosenCommand);
      setExamIsCorrect(isCorrect);
      setExamSubmitted(true);

      if (isCorrect) {
        const updated = markFlashcardMastered(easyProgress, currentExamCard.id);
        saveEasyProgress(updated);
        setEasyProgress(updated);
      }
    },
    [currentExamCard, currentMcOptions, easyProgress, examSubmitted, stop, unlock],
  );

  const handleSubmitRecall = useCallback(
    (e?: React.FormEvent): void => {
      e?.preventDefault();
      if (examSubmitted || !currentExamCard || !recallInput.trim()) return;
      unlock();
      stop();
      const typed = recallInput.trim();
      const isCorrect = isRecallAnswerCorrect(typed, currentExamCard.command);
      setExamSubmittedInput(typed);
      setExamIsCorrect(isCorrect);
      setExamSubmitted(true);

      if (isCorrect) {
        const updated = markFlashcardMastered(easyProgress, currentExamCard.id);
        saveEasyProgress(updated);
        setEasyProgress(updated);
      }
    },
    [currentExamCard, easyProgress, examSubmitted, recallInput, stop, unlock],
  );

  const handleAdvanceExamCard = useCallback((): void => {
    if (!examSubmitted || !currentExamCard) return;
    unlock();
    stop();
    if (examIsCorrect) {
      setExamSessionMastered((n) => n + 1);
      setExamQueue((q) => q.slice(1));
    } else {
      setExamSessionReviewed((n) => n + 1);
      setExamQueue((q) => (q.length === 0 ? q : [...q.slice(1), q[0]]));
    }
    setExamStepIndex((i) => i + 1);
    setExamSelectedOptionIdx(null);
    setRecallInput("");
    setExamSubmittedInput("");
    setExamSubmitted(false);
    setExamIsCorrect(null);
    setExamShowHint(false);
  }, [currentExamCard, examIsCorrect, examSubmitted, stop, unlock]);

  // ---------------------------------------------------------------------------
  // Command Reference handlers
  // ---------------------------------------------------------------------------

  // Auto-play Reference entry clip when an entry opens or when navigating with Prev / Next
  useEffect(() => {
    if (activeSection !== "reference" || !selectedEntry) return;
    const key = `coach:easy:ref:${selectedEntry.id}`;
    const clipText = formatReferenceClipText(selectedEntry);
    void speak(key, clipText);
    return () => {
      stop();
    };
  }, [activeSection, selectedEntry, speak, stop]);

  // Auto-play Who's Who narration when the Who's Who page opens
  useEffect(() => {
    if (activeSection !== "reference" || !showWhosWho || selectedEntry) return;
    if (tour?.tourActive || isTourCloseParam) {
      return;
    }
    void speak(WHOS_WHO_AUDIO_KEY, WHOS_WHO_FULL_TEXT);
    return () => {
      stop();
    };
  }, [activeSection, isTourCloseParam, selectedEntry, showWhosWho, speak, stop, tour?.tourActive]);

  const handleOpenWhosWho = useCallback((): void => {
    unlock();
    setLightboxImage(null);
    setSelectedCommandId(null);
    setSelectedReferenceCategoryId(null);
    setShowWhosWho(true);
  }, [unlock]);

  const handleCloseWhosWho = useCallback((): void => {
    stop();
    setShowWhosWho(false);
    if (isWhosWhoUrlParam || isTourCloseParam) {
      setSearchParams({}, { replace: true });
    }
  }, [isTourCloseParam, isWhosWhoUrlParam, setSearchParams, stop]);

  const handleOpenCommand = useCallback(
    (entry: CommandReferenceEntry): void => {
      unlock();
      setLightboxImage(null);
      setSelectedCommandId(entry.id);
      setEasyProgress((current) => {
        const next = markCommandViewed(current, entry.id);
        saveEasyProgress(next);
        return next;
      });
    },
    [unlock],
  );

  const handleCloseCommand = useCallback((): void => {
    stop();
    setLightboxImage(null);
    setSelectedCommandId(null);
  }, [stop]);

  const handleOpenReferenceCategory = useCallback(
    (categoryId: string): void => {
      stop();
      setLightboxImage(null);
      setSelectedCommandId(null);
      setShowWhosWho(false);
      setSelectedReferenceCategoryId(categoryId);
    },
    [stop],
  );

  const handleBackToReferenceSections = useCallback((): void => {
    stop();
    setLightboxImage(null);
    setSelectedCommandId(null);
    setShowWhosWho(false);
    setSelectedReferenceCategoryId(null);
  }, [stop]);

  const handleOpenSection = useCallback(
    (section: EasyActiveSection): void => {
      unlock();
      stop();
      setLightboxImage(null);
      setSelectedCommandId(null);
      setShowWhosWho(false);
      setSelectedReferenceCategoryId(null);
      const latestProgress = loadEasyProgress();
      setEasyProgress(latestProgress);
      if (section === "flashcards") {
        startNewFlashcardPass(
          flashcardCategoryId,
          includeMastered,
          flashcardDirection,
          latestProgress,
        );
      } else if (section === "exams") {
        setExamScreenView("menu");
      }
      setActiveSection(section);
    },
    [
      flashcardCategoryId,
      flashcardDirection,
      includeMastered,
      startNewFlashcardPass,
      stop,
      unlock,
    ],
  );

  const handleBackToEasyMenu = useCallback((): void => {
    stop();
    setSelectedCommandId(null);
    setShowWhosWho(false);
    setSelectedReferenceCategoryId(null);
    setExamScreenView("menu");
    setActiveSection("menu");
  }, [stop]);

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
  const isWhosWhoPlaying = Boolean(
    showWhosWho &&
      !selectedEntry &&
      phase !== "idle" &&
      (activeKey === WHOS_WHO_AUDIO_KEY ||
        activeKey === TOUR_INTRO_AUDIO_KEY ||
        activeKey === TOUR_CLOSE_AUDIO_KEY),
  );

  const scopeTotalCards = useMemo(
    () => getFlashcardsByCategory(flashcardCategoryId).length,
    [flashcardCategoryId],
  );
  const scopeMasteredCards = useMemo(
    () => countCategoryMasteredFlashcards(easyProgress, flashcardCategoryId),
    [easyProgress, flashcardCategoryId],
  );

  const examCategoryTitle = useMemo(() => {
    if (examCategoryId === "all") return "All Commands";
    const cat = COMMAND_CATEGORIES.find((c) => c.id === examCategoryId);
    return cat ? `${cat.number}. ${cat.name}` : "All Commands";
  }, [examCategoryId]);

  const examPosition = Math.min(examInitialMastered + examStepIndex + 1, Math.max(1, examDeckTotal));
  const examCompletedCount = Math.max(0, examDeckTotal - examQueue.length);
  const examProgressFraction = examDeckTotal > 0 ? examCompletedCount / examDeckTotal : 0;

  // ===========================================================================
  // Dedicated Screen 1: Command Reference
  // ===========================================================================
  if (activeSection === "reference") {
    return (
      <div className="w-full min-w-0 max-w-full space-y-2.5">
        {selectedReferenceCategory && !selectedEntry ? (
          /* Dedicated Category Screen Header: Back arrow to Reference sections + Category Name */
          <header className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                data-testid="reference-category-back"
                aria-label="Back to Reference sections"
                onClick={handleBackToReferenceSections}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground/40"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
              <div className="min-w-0">
                <h1
                  data-testid="reference-category-heading"
                  className="truncate font-sans text-base font-bold tracking-tight text-foreground sm:text-lg"
                >
                  {selectedReferenceCategory.number}. {selectedReferenceCategory.name}
                </h1>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {countCategoryViewedCommands(easyProgress, selectedReferenceCategory.id)} /{" "}
                  {selectedReferenceCategory.commandCount} viewed
                </p>
              </div>
            </div>
            <span
              data-testid="reference-progress-count"
              className="tnum shrink-0 font-mono text-xs font-semibold text-foreground"
            >
              {viewedCount}/{TOTAL_REFERENCE_COMMANDS}
            </span>
          </header>
        ) : showWhosWho && !selectedEntry ? (
          /* Who's Who Screen Header */
          <header className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                data-testid="reference-whos-who-back"
                aria-label="Back to Reference"
                onClick={handleCloseWhosWho}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground/40"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
              <div className="min-w-0">
                <h1
                  data-testid="whos-who-heading"
                  className="truncate font-sans text-base font-bold tracking-tight text-foreground sm:text-lg"
                >
                  Who's Who in the Library
                </h1>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  The coach, the owner, and you
                </p>
              </div>
            </div>
            <span
              data-testid="reference-progress-count"
              className="tnum shrink-0 font-mono text-xs font-semibold text-foreground"
            >
              {viewedCount}/{TOTAL_REFERENCE_COMMANDS}
            </span>
          </header>
        ) : (
          /* Reference Sections Screen Header: Back arrow to Easy + Command Reference */
          <header className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                data-testid="easy-section-back"
                aria-label="Back to Easy"
                onClick={handleBackToEasyMenu}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground/40"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
              <div className="min-w-0">
                <h1 className="truncate font-sans text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  Command Reference
                </h1>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  All 388 commands across 8 categories
                </p>
              </div>
            </div>
            <span
              data-testid="reference-progress-count"
              className="tnum shrink-0 font-mono text-xs font-semibold text-foreground"
            >
              {viewedCount}/{TOTAL_REFERENCE_COMMANDS}
            </span>
          </header>
        )}

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
                  onClick={() => {
                    unlock();
                    toggle(entryAudioKey, formatReferenceClipText(selectedEntry));
                  }}
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

            {commandImages[selectedEntry.name] ? (
              <button
                type="button"
                data-testid="command-entry-image-trigger"
                onClick={() =>
                  setLightboxImage({
                    src: withBasePath(commandImages[selectedEntry.name]),
                    alt: `A picture of the library for the ${selectedEntry.name} command`,
                    name: selectedEntry.name,
                  })
                }
                className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-border/80 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                aria-label={`Enlarge picture for ${selectedEntry.name}`}
              >
                <img
                  data-testid="command-entry-image"
                  src={withBasePath(commandImages[selectedEntry.name])}
                  alt={`A picture of the library for the ${selectedEntry.name} command`}
                  loading="lazy"
                  onClick={() =>
                    setLightboxImage({
                      src: withBasePath(commandImages[selectedEntry.name]),
                      alt: `A picture of the library for the ${selectedEntry.name} command`,
                      name: selectedEntry.name,
                    })
                  }
                  className="block max-h-[168px] w-full max-w-full rounded-xl object-cover transition-transform duration-200 group-hover:scale-[1.01] sm:max-h-none"
                />
              </button>
            ) : null}

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

            {activeReferenceCommandPool.length > 1 && selectedIndexInFiltered >= 0 ? (
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  type="button"
                  data-testid="command-entry-prev"
                  disabled={selectedIndexInFiltered <= 0}
                  onClick={() => {
                    const prev = activeReferenceCommandPool[selectedIndexInFiltered - 1];
                    if (prev) handleOpenCommand(prev);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/70 px-2.5 py-1.5 font-mono text-xs text-foreground transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  Prev
                </button>
                <span className="tnum font-mono text-[11px] text-muted-foreground">
                  {selectedIndexInFiltered + 1} of {activeReferenceCommandPool.length}
                </span>
                <button
                  type="button"
                  data-testid="command-entry-next"
                  disabled={selectedIndexInFiltered >= activeReferenceCommandPool.length - 1}
                  onClick={() => {
                    const next = activeReferenceCommandPool[selectedIndexInFiltered + 1];
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
        ) : selectedReferenceCategory ? (
          /* Dedicated Screen for One Category's Commands Only */
          <section
            data-testid="command-reference-category-view"
            aria-label={`${selectedReferenceCategory.number}. ${selectedReferenceCategory.name}`}
            className="space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-1 px-0.5 font-mono text-[11px] text-muted-foreground">
              <span data-testid="command-results-count">
                Showing {categoryReferenceCommands.length} of {categoryReferenceCommands.length} commands.
              </span>{" "}
              <span>Tap a command for its full entry</span>
            </div>

            <div
              data-testid={`category-section-${selectedReferenceCategory.id}`}
              className="rounded-2xl border border-border bg-card p-3"
            >
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {categoryReferenceCommands.map((cmd) => {
                  const isViewed = Boolean(easyProgress[cmd.id]?.viewed);
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      data-testid={`command-item-${cmd.id}`}
                      data-viewed={isViewed ? "true" : "false"}
                      onClick={() => handleOpenCommand(cmd)}
                      style={
                        isViewed
                          ? {
                              borderColor: hexToRgba(modeColor, 0.45),
                            }
                          : undefined
                      }
                      className="group flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/55 px-2.5 py-2 text-left transition-colors hover:border-foreground/35 active:scale-[0.99]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            aria-hidden="true"
                            className={cn(
                              "h-2 w-2 shrink-0 rounded-full",
                              isViewed ? "bg-emerald-400" : "bg-zinc-600",
                            )}
                          />
                          <span
                            style={{ color: modeColor }}
                            className="truncate font-mono text-xs font-bold"
                          >
                            {cmd.name}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {cmd.description}
                        </p>
                      </div>
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        ) : showWhosWho ? (
          /* Who's Who in the Library Screen */
          <section
            data-testid="whos-who-screen"
            aria-label="Who's Who in the Library"
            className="space-y-3"
          >
            <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Who&apos;s Who in the Library
                </span>
                <button
                  type="button"
                  data-testid="whos-who-speak"
                  aria-label="Hear Who's Who narration"
                  aria-pressed={isWhosWhoPlaying}
                  onClick={() => {
                    unlock();
                    if (isWhosWhoPlaying) {
                      stop();
                    } else {
                      void speak(WHOS_WHO_AUDIO_KEY, WHOS_WHO_FULL_TEXT);
                    }
                  }}
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                    isWhosWhoPlaying
                      ? "border-sky-400 bg-sky-500/20 text-sky-200"
                      : "border-border bg-background/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  )}
                >
                  <Volume2 className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-border/80 bg-background/60 p-3.5">
                  <h2 className="font-mono text-xs font-bold text-foreground sm:text-sm">
                    Coach Echo
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    Head librarian and coach. Knows the library, shows you around, trains you until you don&apos;t need them.
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/60 p-3.5">
                  <h2 className="font-mono text-xs font-bold text-foreground sm:text-sm">
                    The Owner (root)
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    Owns the building. Can open any door and change any rule. sudo borrows the owner&apos;s keys for one command.
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/60 p-3.5">
                  <h2 className="font-mono text-xs font-bold text-foreground sm:text-sm">
                    You
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    A visitor, here to learn. Your home folder is your own shelf.
                  </p>
                </div>
              </div>

              <div className="border-t border-border/60 pt-3">
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  First you&apos;re on a guided tour with the coach. After the basics, you come in on your own.
                </p>
              </div>

              <button
                type="button"
                data-testid="whos-who-back"
                onClick={handleCloseWhosWho}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/70 px-3 py-1.5 font-mono text-xs font-medium text-foreground transition-colors hover:border-foreground/40"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Back to Command Reference
              </button>
            </div>
          </section>
        ) : (
          /* Reference Sections Screen: Search Box + 8 Section Rows (or Search Results across all categories) */
          <section
            data-testid="command-reference-browser"
            aria-label="Command Reference"
            className="space-y-2.5"
          >
            {/* Search by command name or what it does */}
            <div className="relative flex items-center">
              <Search
                className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                data-testid="command-search-input"
                aria-label="Search commands by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or what it does (e.g. remove, copy, list)"
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

            {isSearchingReference ? (
              <>
                {/* Search Results summary line */}
                <div className="flex flex-wrap items-center justify-between gap-1 px-0.5 font-mono text-[11px] text-muted-foreground">
                  <span data-testid="command-results-count">
                    Showing {filteredCommands.length} of {TOTAL_REFERENCE_COMMANDS} commands.
                  </span>{" "}
                  <span>Tap a command for its full entry</span>
                </div>

                {filteredCommands.length === 0 ? (
                  <div
                    data-testid="command-empty-state"
                    className="rounded-xl border border-border bg-card p-4 text-center font-mono text-xs text-muted-foreground"
                  >
                    No commands matching &ldquo;{searchQuery.trim()}&rdquo;.
                  </div>
                ) : (
                  <div
                    data-testid="reference-search-results"
                    className="rounded-2xl border border-border bg-card p-3"
                  >
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {filteredCommands.map((cmd) => {
                        const isViewed = Boolean(easyProgress[cmd.id]?.viewed);
                        return (
                          <button
                            key={cmd.id}
                            type="button"
                            data-testid={`command-item-${cmd.id}`}
                            data-viewed={isViewed ? "true" : "false"}
                            onClick={() => handleOpenCommand(cmd)}
                            style={
                              isViewed
                                ? {
                                    borderColor: hexToRgba(modeColor, 0.45),
                                  }
                                : undefined
                            }
                            className="group flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/55 px-2.5 py-2 text-left transition-colors hover:border-foreground/35 active:scale-[0.99]"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "h-2 w-2 shrink-0 rounded-full",
                                    isViewed ? "bg-emerald-400" : "bg-zinc-600",
                                  )}
                                />
                                <span
                                  style={{ color: modeColor }}
                                  className="truncate font-mono text-xs font-bold"
                                >
                                  {cmd.name}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                {cmd.description}
                              </p>
                            </div>
                            <ChevronRight
                              className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                              aria-hidden
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* 8 Section Rows Only (no command cards on this screen) */
              <div data-testid="reference-sections-list" className="space-y-2">
                {[
                  <button
                    key="whos-who"
                    type="button"
                    data-testid="reference-whos-who-row"
                    onClick={handleOpenWhosWho}
                    className="flex w-full min-w-0 max-w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-left transition-colors hover:border-foreground/40 active:scale-[0.99]"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-xs font-bold text-foreground sm:text-sm">
                        Who&apos;s Who in the Library
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                        The coach, the owner, and you
                      </span>
                    </div>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </button>,
                  ...COMMAND_CATEGORIES.map((category) => {
                    const catViewed = countCategoryViewedCommands(easyProgress, category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        data-testid={`reference-section-row-${category.id}`}
                        onClick={() => handleOpenReferenceCategory(category.id)}
                        className="flex w-full min-w-0 max-w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-left transition-colors hover:border-foreground/40 active:scale-[0.99]"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="block truncate font-mono text-xs font-bold text-foreground sm:text-sm">
                            {category.number}. {category.name}
                          </span>
                          <span
                            data-testid={`reference-section-viewed-${category.id}`}
                            className="tnum mt-0.5 block font-mono text-[11px] text-muted-foreground"
                          >
                            {catViewed} / {category.commandCount} viewed
                          </span>
                        </div>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      </button>
                    );
                  }),
                ]}
              </div>
            )}
          </section>
        )}

        <PageHelpButton
          pageId={
            selectedEntry ? "reference-entry" : showWhosWho ? "whos-who" : "reference-list"
          }
        />

        {lightboxImage ? (
          <ReferenceImageLightbox
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            commandName={lightboxImage.name}
            onClose={() => setLightboxImage(null)}
          />
        ) : null}
      </div>
    );
  }

  // ===========================================================================
  // Dedicated Screen 2: Flash Cards
  // ===========================================================================
  if (activeSection === "flashcards") {
    return (
      <div className="flex flex-1 min-h-0 w-full min-w-0 max-w-full flex-col justify-between space-y-2">
        <header className="flex shrink-0 items-center justify-between gap-2 pt-0.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              data-testid="easy-section-back"
              aria-label="Back to Easy"
              onClick={handleBackToEasyMenu}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground/40"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-sans text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  Flash Cards
                </h1>
                <span
                  data-testid="flashcards-progress-count"
                  className="tnum font-mono text-xs font-semibold text-muted-foreground"
                >
                  {masteredCount}/{TOTAL_FLASHCARDS}
                </span>
              </div>
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                Auto-speech {autoRead ? "on" : "off"} · 5-slot touch drill
              </p>
            </div>
          </div>
          <AudioToggle />
        </header>

        <section
          data-testid="flashcards-section"
          aria-label="Flash Cards"
          className="flex flex-1 min-h-0 w-full min-w-0 max-w-full flex-col justify-between gap-2"
        >
          {/* Top Controls */}
          <div className="shrink-0 space-y-2">
            {/* Compact Category Dropdown */}
            <div className="w-full">
              <select
                data-testid="flashcards-category-select"
                aria-label="Select flashcard category"
                value={flashcardCategoryId}
                onChange={(e) => handleSelectFlashcardCategory(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-card px-3 font-mono text-xs font-medium text-foreground focus:border-sky-400 focus:outline-none"
              >
                <option key="all" value="all">
                  All Cards ({masteredCount}/{TOTAL_FLASHCARDS})
                </option>
                {COMMAND_CATEGORIES.map((cat) => {
                  const catTotal = getFlashcardsByCategory(cat.id).length;
                  const catMastered = countCategoryMasteredFlashcards(easyProgress, cat.id);
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.number}. {cat.name} ({catMastered}/{catTotal})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Compact 3-way Direction Row on a single line */}
            <div
              role="group"
              data-testid="flashcards-direction-bar"
              aria-label="Card direction"
              className="grid grid-cols-3 gap-1.5"
            >
              {FLASHCARD_DIRECTION_OPTIONS.map((opt) => {
                const active = flashcardDirection === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`flashcard-direction-${opt.id}`}
                    aria-pressed={active}
                    onClick={() => handleSelectFlashcardDirection(opt.id)}
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
                      "truncate rounded-lg border px-2 py-1 text-center font-mono text-[11px] font-medium transition-colors",
                      !active && "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {opt.id === "mix" ? "Mix" : opt.label}
                  </button>
                );
              })}
            </div>

            {/* Compact Mastered Pool OUT/IN line */}
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-card/70 px-2.5 py-1.5 font-mono text-[11px]">
              <span data-testid="flashcard-pool-status" className="truncate text-muted-foreground">
                Mastered:{" "}
                <strong className="text-foreground">
                  {scopeMasteredCards}/{scopeTotalCards}
                </strong>{" "}
                {deck.length > 0 ? `· Card ${deckIndex + 1} of ${deck.length}` : "· Pool complete"}
              </span>
              <button
                type="button"
                data-testid="flashcard-mastered-pool-toggle"
                aria-pressed={includeMastered}
                onClick={handleToggleIncludeMastered}
                style={
                  includeMastered
                    ? {
                        borderColor: modeColor,
                        backgroundColor: hexToRgba(modeColor, 0.16),
                        color: modeColor,
                      }
                    : undefined
                }
                className={cn(
                  "shrink-0 rounded-lg border px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors",
                  !includeMastered &&
                    "border-border bg-background/70 text-muted-foreground hover:text-foreground",
                )}
              >
                {includeMastered ? "Mastered: IN" : "Mastered: OUT"}
              </button>
            </div>
          </div>

          {/* Active Flashcard or All-Mastered State (no speaker button — autoplay handles speech) */}
          {currentCard ? (
            <div className="flex flex-1 min-h-0 flex-col justify-between gap-2">
              <div
                data-testid="flashcard-card"
                data-card-id={currentCard.id}
                data-card-side={showingDescription ? "description" : "command"}
                data-card-flipped={isFlipped ? "true" : "false"}
                style={{ borderColor: hexToRgba(modeColor, 0.55) }}
                className="relative flex flex-1 min-h-[184px] w-full flex-col justify-between overflow-hidden rounded-2xl border bg-card p-3.5 select-none"
              >
                <div className="relative z-20 flex shrink-0 items-center justify-between gap-2 pointer-events-none">
                  <span className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {currentCard.categoryNumber}. {currentCard.categoryName} · {currentCard.group}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {isFlashcardMastered(easyProgress, currentCard.id) ? (
                      <span
                        data-testid="flashcard-mastered-badge"
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300"
                      >
                        <Check className="h-3 w-3" aria-hidden />
                        Mastered
                      </span>
                    ) : null}
                    <span
                      data-testid="flashcard-face-label"
                      style={{
                        borderColor: hexToRgba(modeColor, 0.5),
                        backgroundColor: hexToRgba(modeColor, 0.14),
                        color: modeColor,
                      }}
                      className="rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                    >
                      {showingDescription ? "Description" : "Command"}
                    </span>
                  </div>
                </div>

                {/* Card Center Content */}
                <div className="relative z-0 my-auto flex flex-1 min-h-0 flex-col items-center justify-center px-3 py-2 text-center pointer-events-none overflow-y-auto">
                  {showingDescription ? (
                    <p
                      data-testid="flashcard-face-text"
                      className="max-w-full break-words font-sans text-sm font-medium leading-relaxed text-foreground sm:text-base"
                    >
                      {currentCard.description}
                    </p>
                  ) : (
                    <p
                      data-testid="flashcard-face-text"
                      style={{ color: commandColor || modeColor }}
                      className="max-w-full break-words font-mono text-lg font-bold tracking-tight sm:text-xl"
                    >
                      <span
                        style={promptColor ? { color: promptColor } : undefined}
                        className="mr-1.5 text-sky-300"
                      >
                        $
                      </span>
                      {currentCard.command}
                    </p>
                  )}
                </div>

                {/* Bottom Touch Zone Legend */}
                <div className="relative z-0 shrink-0 grid grid-cols-5 gap-1 border-t border-border/60 pt-2 text-center font-mono text-[10px] text-muted-foreground pointer-events-none">
                  <span className="col-span-1 truncate font-semibold text-emerald-300/90">
                    ← Mastered
                  </span>
                  <span className="col-span-3 truncate">Tap middle 3 slots to flip</span>
                  <span className="col-span-1 truncate font-semibold text-sky-300/90">
                    Next →
                  </span>
                </div>

                {/* 5-Slot Invisible Touch Overlay */}
                <div
                  data-testid="flashcard-touch-grid"
                  className="absolute inset-0 z-10 grid grid-cols-5"
                >
                  <button
                    type="button"
                    data-testid="flashcard-slot-1"
                    aria-label="Mastered — move card to mastered pool"
                    onClick={handleMasterCard}
                    className="h-full w-full cursor-pointer bg-transparent focus:outline-none active:bg-emerald-500/10"
                  />
                  <button
                    type="button"
                    data-testid="flashcard-slot-2"
                    aria-label="Flip card (slot 2)"
                    onClick={handleFlipCard}
                    className="h-full w-full cursor-pointer bg-transparent focus:outline-none active:bg-sky-500/10"
                  />
                  <button
                    type="button"
                    data-testid="flashcard-slot-3"
                    aria-label="Flip card (slot 3)"
                    onClick={handleFlipCard}
                    className="h-full w-full cursor-pointer bg-transparent focus:outline-none active:bg-sky-500/10"
                  />
                  <button
                    type="button"
                    data-testid="flashcard-slot-4"
                    aria-label="Flip card (slot 4)"
                    onClick={handleFlipCard}
                    className="h-full w-full cursor-pointer bg-transparent focus:outline-none active:bg-sky-500/10"
                  />
                  <button
                    type="button"
                    data-testid="flashcard-slot-5"
                    aria-label="Next card — keep unmastered card in pool"
                    onClick={handleNextCardKeepInPool}
                    className="h-full w-full cursor-pointer bg-transparent focus:outline-none active:bg-sky-500/10"
                  />
                </div>
              </div>

              {/* Explicit Action Buttons */}
              <div className="grid shrink-0 grid-cols-3 gap-1.5">
                <button
                  type="button"
                  data-testid="flashcard-action-mastered"
                  onClick={handleMasterCard}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1.5 font-mono text-xs font-semibold text-emerald-300 transition-colors hover:border-emerald-400"
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
              className="my-auto space-y-2.5 rounded-2xl border border-emerald-500/45 bg-card p-4 text-center"
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

        <PageHelpButton pageId="flashcards" className="shrink-0" />
      </div>
    );
  }

  // ===========================================================================
  // Dedicated Screen 3: Exams (LinuxDeck Multiple Choice & Terminal Recall)
  // ===========================================================================
  if (activeSection === "exams") {
    if (examScreenView === "menu") {
      const allDone = isCategoryFullyMastered(easyProgress, "all");
      return (
        <div
          data-testid="exams-section"
          className="w-full min-w-0 max-w-full space-y-2.5"
        >
          <header className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                data-testid="easy-section-back"
                aria-label="Back to Easy"
                onClick={handleBackToEasyMenu}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground/40"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate font-sans text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    Exams
                  </h1>
                  <span
                    data-testid="exams-progress-count"
                    className="tnum font-mono text-xs font-semibold text-muted-foreground"
                  >
                    {passedExamsCount}/{TOTAL_EXAMS}
                  </span>
                </div>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  Pick a mode &amp; category — unmastered cards only
                </p>
              </div>
            </div>
            <AudioToggle />
          </header>

          {/* Two separate study modes: Multiple Choice vs Terminal Recall */}
          <div
            role="group"
            data-testid="exam-mode-picker"
            aria-label="Exam mode"
            className="grid grid-cols-2 gap-1.5"
          >
            <button
              type="button"
              data-testid="exam-mode-mc"
              aria-pressed={examMode === "mc"}
              onClick={() => {
                unlock();
                setExamMode("mc");
              }}
              style={
                examMode === "mc"
                  ? {
                      borderColor: modeColor,
                      backgroundColor: hexToRgba(modeColor, 0.16),
                      color: modeColor,
                    }
                  : undefined
              }
              className={cn(
                "rounded-xl border px-3 py-2 text-left font-mono text-xs font-semibold transition-colors",
                examMode !== "mc" && "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="block text-[10px] uppercase tracking-wider opacity-75">
                $ SELECT --COMMAND
              </span>
              Multiple Choice
            </button>
            <button
              type="button"
              data-testid="exam-mode-recall"
              aria-pressed={examMode === "recall"}
              onClick={() => {
                unlock();
                setExamMode("recall");
              }}
              style={
                examMode === "recall"
                  ? {
                      borderColor: modeColor,
                      backgroundColor: hexToRgba(modeColor, 0.16),
                      color: modeColor,
                    }
                  : undefined
              }
              className={cn(
                "rounded-xl border px-3 py-2 text-left font-mono text-xs font-semibold transition-colors",
                examMode !== "recall" &&
                  "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="block text-[10px] uppercase tracking-wider opacity-75">
                $ PROMPT --RECALL
              </span>
              Terminal Recall
            </button>
          </div>

          {/* Category Decks (All + 8 Coach Categories) */}
          <div data-testid="exams-category-bar" className="space-y-1.5">
            {[
              <button
                key="all"
                type="button"
                data-testid="exam-category-all"
                onClick={() => handleOpenExamCategory("all")}
                style={{
                  borderColor: allDone ? hexToRgba("#22c55e", 0.6) : hexToRgba(modeColor, 0.4),
                }}
                className="flex w-full items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2.5 text-left transition-colors hover:border-foreground/40 active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-foreground sm:text-sm">
                      All Commands
                    </span>
                    {allDone ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                    ) : null}
                  </div>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">
                    {masteredCount} of {TOTAL_FLASHCARDS} mastered
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>,
              ...COMMAND_CATEGORIES.map((cat) => {
                const catTotal = getFlashcardsByCategory(cat.id).length;
                const catMastered = countCategoryMasteredFlashcards(easyProgress, cat.id);
                const catDone = isCategoryFullyMastered(easyProgress, cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    data-testid={`exam-category-${cat.id}`}
                    onClick={() => handleOpenExamCategory(cat.id)}
                    style={{
                      borderColor: catDone ? hexToRgba("#22c55e", 0.6) : undefined,
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-left transition-colors hover:border-foreground/40 active:scale-[0.99]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-mono text-xs font-bold text-foreground">
                          {cat.number}. {cat.name}
                        </span>
                        {catDone ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
                        ) : null}
                      </div>
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        {catMastered} of {catTotal} mastered
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                );
              }),
            ]}
          </div>

          <PageHelpButton pageId="exams" />
        </div>
      );
    }

    // Active Exam Session (Multiple Choice or Terminal Recall) or End Screen
    const hadSessionActivity = examSessionMastered + examSessionReviewed > 0;
    const hintInfo = currentExamCard ? formatRecallHint(currentExamCard.command) : null;

    return (
      <div
        data-testid="exams-section"
        className="w-full min-w-0 max-w-full space-y-2.5"
      >
        {/* Session Header: Back to Exams menu + Title + AudioToggle + Top-Right Mode Switcher */}
        <header className="flex items-center justify-between gap-1.5 pt-0.5">
          <button
            type="button"
            data-testid="exam-back-to-menu"
            aria-label="Back to Exams"
            onClick={handleExamDone}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 font-mono text-xs font-semibold text-foreground hover:border-foreground/40"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back
          </button>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate font-sans text-xs font-bold text-foreground sm:text-sm">
              {examCategoryTitle}
            </h1>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {examMode === "mc" ? "Multiple Choice" : "Terminal Recall"}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <AudioToggle />
            <div
              role="group"
              data-testid="exam-mode-switcher"
              aria-label="Switch exam study mode"
              className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 font-mono text-[10px]"
            >
              <button
                type="button"
                data-testid="exam-mode-switcher-mc"
                aria-label="Multiple Choice mode"
                aria-pressed={examMode === "mc"}
                onClick={() => handleSwitchExamModeInSession("mc")}
                style={
                  examMode === "mc"
                    ? { backgroundColor: modeColor, color: "#000" }
                    : undefined
                }
                className={cn(
                  "rounded px-1.5 py-0.5 font-bold transition-colors",
                  examMode !== "mc" && "text-muted-foreground hover:text-foreground",
                )}
              >
                MC
              </button>
              <button
                type="button"
                data-testid="exam-mode-switcher-recall"
                aria-label="Terminal Recall mode"
                aria-pressed={examMode === "recall"}
                onClick={() => handleSwitchExamModeInSession("recall")}
                style={
                  examMode === "recall"
                    ? { backgroundColor: modeColor, color: "#000" }
                    : undefined
                }
                className={cn(
                  "rounded px-1.5 py-0.5 font-bold transition-colors",
                  examMode !== "recall" && "text-muted-foreground hover:text-foreground",
                )}
              >
                CLI
              </button>
            </div>
          </div>
        </header>

        {examQueue.length === 0 ? (
          /* End Screen (LinuxDeck SessionComplete contract) */
          <div
            data-testid="exam-results-card"
            style={{ borderColor: hexToRgba(modeColor, 0.55) }}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border bg-card p-5 text-center"
          >
            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg width={80} height={80} viewBox="0 0 80 80" className="-rotate-90" aria-hidden>
                <circle
                  cx={40}
                  cy={40}
                  r={34}
                  fill="none"
                  stroke={modeColor}
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              </svg>
              <Check className="absolute h-8 w-8" style={{ color: modeColor }} aria-hidden />
            </div>

            <p data-testid="exam-exit-code" className="font-mono text-2xl font-bold text-foreground">
              $ exit 0
            </p>

            {hadSessionActivity ? (
              <h2
                data-testid="exam-complete-heading"
                className="font-sans text-base font-bold text-foreground"
              >
                Deck Complete
              </h2>
            ) : null}

            <p
              data-testid="exam-mastered-summary"
              className="font-mono text-xs font-medium text-muted-foreground"
            >
              {examDeckTotal} of {examDeckTotal} mastered
            </p>

            {hadSessionActivity ? (
              <p
                data-testid="exam-session-tally"
                style={{ color: modeColor }}
                className="font-mono text-xs font-semibold"
              >
                +{examSessionMastered} mastered · {examSessionReviewed} reviewed
              </p>
            ) : null}

            <div className="mt-1 flex w-full flex-col gap-2">
              <button
                type="button"
                data-testid="exam-restart-deck"
                onClick={handleRestartExamDeck}
                style={{ backgroundColor: modeColor }}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl font-mono text-xs font-bold text-black transition-transform active:scale-[0.98]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                ↻ Restart Deck
              </button>
              <button
                type="button"
                data-testid="exam-done-button"
                onClick={handleExamDone}
                style={{ color: modeColor }}
                className="h-10 w-full rounded-xl border border-border bg-background/70 font-mono text-xs font-semibold transition-transform active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </div>
        ) : currentExamCard ? (
          /* Active Question Card (Multiple Choice or Terminal Recall) */
          <div
            data-testid="exam-question-card"
            data-question-mode={examMode}
            data-card-id={currentExamCard.id}
            data-correct-command={currentExamCard.command}
            style={{ borderColor: hexToRgba(modeColor, 0.55) }}
            className="w-full min-w-0 max-w-full space-y-3 rounded-2xl border bg-card p-3.5"
          >
            {/* Centered Question Stem */}
            <div className="flex flex-col items-center justify-center px-1 py-1 text-center">
              <span
                data-testid="exam-mode-label"
                style={{ color: modeColor }}
                className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider"
              >
                {examMode === "mc" ? "$ SELECT --COMMAND" : "$ PROMPT --RECALL"}
              </span>
              <h3
                data-testid="exam-question-prompt"
                className="max-w-full break-words font-sans text-base font-bold leading-snug text-foreground sm:text-lg"
              >
                {currentExamCard.description}
              </h3>

              {examMode === "recall" && examShowHint && hintInfo ? (
                <div
                  data-testid="exam-hint-box"
                  className="mt-2.5 w-full rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-left font-mono text-xs text-amber-300"
                >
                  💡 Hint: Starts with{" "}
                  <span className="font-bold underline">{hintInfo.prefix}</span> (
                  {hintInfo.length} chars)
                </div>
              ) : null}
            </div>

            {examMode === "mc" ? (
              /* Multiple Choice 4 Options A-D */
              <div
                role="group"
                data-testid="exam-mc-options"
                aria-label="Multiple choice command options"
                className="flex flex-col gap-1.5"
              >
                {currentMcOptions.map((optionCmd, idx) => {
                  const isSelected = examSelectedOptionIdx === idx;
                  const isRightOption =
                    normalizeRecallCommand(optionCmd) ===
                    normalizeRecallCommand(currentExamCard.command);

                  let btnClass =
                    "border-border bg-background/70 text-foreground hover:border-foreground/45";
                  if (examSubmitted) {
                    if (isRightOption) {
                      btnClass =
                        "border-emerald-400 bg-emerald-500/15 text-emerald-300 font-bold";
                    } else if (isSelected) {
                      btnClass = "border-red-500 bg-red-500/15 text-red-300 font-bold";
                    } else {
                      btnClass = "border-border/40 bg-background/30 text-muted-foreground opacity-50";
                    }
                  }

                  return (
                    <button
                      key={`${idx}-${optionCmd}`}
                      type="button"
                      data-testid={`exam-mc-option-${idx}`}
                      data-option-command={optionCmd}
                      disabled={examSubmitted}
                      onClick={() => handleSelectMcOption(idx)}
                      className={cn(
                        "flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left font-mono text-xs transition-all active:scale-[0.99]",
                        btnClass,
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5 truncate">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[11px] font-bold text-muted-foreground">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="truncate">$ {optionCmd}</span>
                      </span>
                      {examSubmitted && isRightOption ? (
                        <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                      ) : null}
                      {examSubmitted && isSelected && !isRightOption ? (
                        <X className="h-4 w-4 shrink-0 text-red-400" aria-hidden />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Terminal Recall Input Form */
              <form onSubmit={handleSubmitRecall} className="space-y-2">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl border bg-background px-3 py-2 font-mono text-xs transition-all sm:text-sm",
                    examSubmitted
                      ? examIsCorrect
                        ? "border-emerald-400"
                        : "border-red-500"
                      : "border-border",
                  )}
                >
                  <span style={{ color: promptColor || modeColor }} className="shrink-0 font-bold">
                    $
                  </span>
                  <input
                    ref={recallInputRef}
                    type="text"
                    data-testid="exam-recall-input"
                    aria-label="Type CLI command here"
                    value={recallInput}
                    onChange={(e) => setRecallInput(e.target.value)}
                    disabled={examSubmitted}
                    placeholder="[type CLI command here...]"
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    style={commandColor ? { color: commandColor } : undefined}
                    className="min-w-0 flex-1 bg-transparent font-mono text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  {!examSubmitted ? (
                    <button
                      type="submit"
                      data-testid="exam-submit-answer"
                      disabled={!recallInput.trim()}
                      style={{ backgroundColor: modeColor }}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-xs font-bold text-black transition-opacity disabled:opacity-30"
                    >
                      <span>Run ⏎</span>
                      <CornerDownLeft className="h-3 w-3" aria-hidden />
                    </button>
                  ) : null}
                </div>

                {!examSubmitted && !examShowHint ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      data-testid="exam-hint-button"
                      onClick={() => setExamShowHint(true)}
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-amber-300"
                    >
                      <HelpCircle className="h-3 w-3" aria-hidden />
                      Need a hint?
                    </button>
                  </div>
                ) : null}
              </form>
            )}

            {/* Immediate Verification Output + Manual Advance Button */}
            {examSubmitted ? (
              <div className="space-y-2">
                <div
                  role="status"
                  data-testid="exam-question-feedback"
                  data-feedback-status={examIsCorrect ? "correct" : "wrong"}
                  className={cn(
                    "space-y-1 rounded-xl border p-2.5 font-mono text-xs",
                    examIsCorrect
                      ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/60 bg-red-500/10 text-red-300",
                  )}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {examMode === "mc"
                        ? examIsCorrect
                          ? "✓ Command Executed!"
                          : "✕ Incorrect Choice"
                        : examIsCorrect
                          ? "✓✓ Command Verified!"
                          : "✕ ✕ Syntax Mismatch"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {examIsCorrect ? "+1 Mastered" : "Re-queued"}
                    </span>
                  </div>

                  {examMode === "mc" ? (
                    <p
                      data-testid="exam-feedback-right-answer"
                      className="truncate text-foreground/90"
                    >
                      {examIsCorrect
                        ? `Verified: "$ ${currentExamCard.command}"`
                        : `Target: "$ ${currentExamCard.command}"`}
                    </p>
                  ) : (
                    <div className="space-y-0.5 text-foreground/90">
                      <p className="truncate">
                        Your input: <span className="font-bold">$ {examSubmittedInput}</span>
                      </p>
                      <p data-testid="exam-feedback-right-answer" className="truncate">
                        Expected:{" "}
                        <span className="font-bold text-emerald-300">
                          $ {currentExamCard.command}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  data-testid="exam-next-button"
                  onClick={handleAdvanceExamCard}
                  className={cn(
                    "flex w-full items-center justify-center rounded-xl py-2 font-mono text-xs font-bold text-black transition-transform active:scale-[0.98]",
                    examIsCorrect ? "bg-emerald-400" : "bg-red-400",
                  )}
                >
                  {examIsCorrect ? "Next Command →" : "Re-queue & Continue →"}
                </button>
              </div>
            ) : null}

            {/* Progress Footer: card N of M + thin progress bar */}
            <div className="flex flex-col items-center gap-1.5 pt-1">
              <span
                data-testid="exam-card-progress"
                className="font-mono text-[11px] font-medium text-muted-foreground"
              >
                card {examPosition} of {examDeckTotal}
              </span>
              <div className="h-1 w-4/5 overflow-hidden rounded-full bg-muted">
                <div
                  data-testid="exam-progress-bar"
                  style={{
                    width:
                      examProgressFraction > 0
                        ? `max(4px, ${Math.round(examProgressFraction * 100)}%)`
                        : "0%",
                    backgroundColor: modeColor,
                  }}
                  className="h-full rounded-full transition-[width] duration-300"
                />
              </div>
            </div>
          </div>
        ) : null}

        <PageHelpButton pageId="exams" />
      </div>
    );
  }

  // ===========================================================================
  // Easy Menu Screen (default on /coach when no job is active):
  // Subtitle + the 3 section rows only — no inline section content below them.
  // ===========================================================================
  return (
    <div className="w-full min-w-0 max-w-full space-y-3">
      <header className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/"
            aria-label="Back to Modes"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-foreground/40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          <div className="min-w-0">
            <h1 className="font-sans text-xl font-bold tracking-tight text-foreground">Easy</h1>
            <p className="truncate font-mono text-xs text-muted-foreground">
              Learn the commands, drill them, test on them
            </p>
          </div>
        </div>
      </header>

      {/* Three Easy Section Rows in learning order — each opens its own dedicated full screen */}
      <section aria-label="Easy learning sections" className="space-y-2.5">
        {/* 1. Command Reference */}
        <button
          type="button"
          data-testid="easy-section-reference"
          onClick={() => handleOpenSection("reference")}
          className="flex w-full min-w-0 max-w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition-colors hover:border-foreground/40 active:scale-[0.99]"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SectionMiniRing
              value={viewedCount}
              total={TOTAL_REFERENCE_COMMANDS}
              color={modeColor}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: modeColor }} aria-hidden />
                <span className="font-mono text-xs font-bold text-foreground sm:text-sm">
                  1. Command Reference
                </span>
              </div>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                All 388 commands across 8 categories — plain words + examples
              </span>
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

        {/* 2. Flash Cards */}
        <button
          type="button"
          data-testid="easy-section-flashcards"
          onClick={() => handleOpenSection("flashcards")}
          className="flex w-full min-w-0 max-w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition-colors hover:border-foreground/40 active:scale-[0.99]"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SectionMiniRing value={masteredCount} total={TOTAL_FLASHCARDS} color={modeColor} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 shrink-0" style={{ color: modeColor }} aria-hidden />
                <span className="font-mono text-xs font-bold text-foreground sm:text-sm">
                  2. Flash Cards
                </span>
              </div>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                187 LinuxDeck flashcards — 5-slot touch drill + autoplay
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span
              data-testid="flashcards-progress-count"
              className="tnum font-mono text-xs font-semibold text-foreground"
            >
              {masteredCount}/{TOTAL_FLASHCARDS}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
        </button>

        {/* 3. Exams */}
        <button
          type="button"
          data-testid="easy-section-exams"
          onClick={() => handleOpenSection("exams")}
          className="flex w-full min-w-0 max-w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition-colors hover:border-foreground/40 active:scale-[0.99]"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SectionMiniRing value={passedExamsCount} total={TOTAL_EXAMS} color={modeColor} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <GraduationCap
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: modeColor }}
                  aria-hidden
                />
                <span className="font-mono text-xs font-bold text-foreground sm:text-sm">
                  3. Exams
                </span>
              </div>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                Multiple Choice &amp; Terminal Recall per category
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span
              data-testid="exams-progress-count"
              className="tnum font-mono text-xs font-semibold text-foreground"
            >
              {passedExamsCount}/{TOTAL_EXAMS}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
        </button>
      </section>

      <PageHelpButton pageId={isEasyModeRoute ? "easy" : "coach"} />

      {lightboxImage ? (
        <ReferenceImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          commandName={lightboxImage.name}
          onClose={() => setLightboxImage(null)}
        />
      ) : null}
    </div>
  );
}
