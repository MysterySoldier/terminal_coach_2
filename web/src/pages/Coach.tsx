import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  BookOpen,
  CheckCircle2,
  Ear,
  Flame,
  Lightbulb,
  Lock,
  Play,
  RotateCcw,
  Volume2,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";

import { PromptButton } from "@/components/terminal/PromptButton";
import { ScanlineFrame } from "@/components/terminal/Scanlines";
import { COACH_JOBS, prepareJobSession, type CoachJob } from "@/data/coach-jobs";
import { EASY_PLANS, easyBlockSpeech, type EasyBlock } from "@/data/easy-coach";
import { MEDIUM_PLANS } from "@/data/medium-coach";
import { useCardAudio } from "@/hooks/useCardAudio";
import {
  advanceShadowTyping,
  didCommandBurnFirstTry,
  easyReadinessReport,
  evaluateEasyAttempt,
  extremeJobStatus,
  extremeReadinessReport,
  isTaskSolved,
  loadCoachMode,
  loadCoachProgress,
  loadEasyProgress,
  loadExtremeProgress,
  loadMediumProgress,
  lockRemainingWords,
  markEasyRebootPassed,
  markExtremeRebootPassed,
  markMediumRebootPassed,
  markRebootPassed,
  mediumReadinessReport,
  readinessReport,
  recordEasyHintUsed,
  recordEasyRound,
  recordExtremeHintUsed,
  recordExtremeRound,
  recordMediumHintUsed,
  recordMediumRound,
  recordRound,
  resolveEasyUiStatus,
  resolveMediumUiStatus,
  saveCoachMode,
  saveCoachProgress,
  saveEasyProgress,
  saveExtremeProgress,
  saveMediumProgress,
  stepAtShadowIndex,
  swapEasySlots,
  type ActiveCoachMode,
  type CoachProgress,
  type EasyJobRecord,
  type EasyJobStatus,
  type EasyProgress,
  type ExtremeProgress,
  type MediumJobStatus,
  type MediumProgress,
} from "@/lib/coach";
import {
  completeCommand,
  completePath,
  getDefaultSession,
  parseCommand,
  rebootDefaultSession,
  runCommand,
} from "@/lib/terminal-engine";
import { cn } from "@/lib/utils";

const HOME = "/home/user";

interface Line {
  id: number;
  kind: "input" | "output" | "error";
  text: string;
}

type Feedback = { tone: "success" | "hint" | "idle"; message: string };
type ExtremeRoundOutcome = "none" | "locked" | "completed" | "not-counted" | "failed";
type DragSource = { from: "bank"; blockId: string } | { from: "tray"; slotIndex: number };

function hardJobStatus(job: CoachJob, progress: CoachProgress): "cold" | "helped" | "retest" | "not-yet" {
  const record = progress[job.id];
  if (!record || (record.coldPasses === 0 && !record.solvedWithHelp)) return "not-yet";
  if (record.nextRetestAt !== null && record.coldPasses > 0 && Date.now() >= record.nextRetestAt) return "retest";
  if (record.coldPasses > 0) return "cold";
  return "helped";
}

function statusColorClasses(status: EasyJobStatus | MediumJobStatus, selected: boolean): string {
  switch (status) {
    case "passed":
      return cn(
        "border-emerald-400 bg-emerald-500/15 text-emerald-300",
        selected && "ring-1 ring-emerald-400/70",
      );
    case "hint-used":
      return cn(
        "border-yellow-400/90 bg-yellow-500/15 text-yellow-300",
        selected && "ring-1 ring-yellow-400/70",
      );
    case "working":
      return cn(
        "border-purple-400/90 bg-purple-500/15 text-purple-300",
        selected && "ring-1 ring-purple-400/70",
      );
    case "failed":
      return cn(
        "animate-pulse border-red-500 bg-red-500/20 text-red-400",
        selected && "ring-1 ring-red-500/70",
      );
    case "not-done":
    default:
      return selected
        ? "border-zinc-400 bg-zinc-800/60 text-zinc-200"
        : "border-zinc-600/70 bg-zinc-900/40 text-zinc-400 hover:border-zinc-400/70 hover:text-zinc-200";
  }
}

function mediumStatusLabel(status: MediumJobStatus): string {
  switch (status) {
    case "passed":
      return "Medium pass";
    case "hint-used":
      return "hint used";
    case "working":
      return "working";
    case "failed":
      return "failed";
    case "not-done":
    default:
      return "not done";
  }
}

function easyStatusLabel(status: EasyJobStatus, record: EasyJobRecord | undefined, roundSolved: boolean): string {
  switch (status) {
    case "passed":
      return "Easy pass";
    case "hint-used":
      return record?.passed || roundSolved ? "Easy pass · hint used" : "hint used";
    case "working":
      return "working";
    case "failed":
      return "failed";
    case "not-done":
    default:
      return "not done";
  }
}

export interface CoachProps {
  initialMode?: ActiveCoachMode;
  initialJobId?: string | null;
  terminalFocus?: boolean;
}

function resolveInitialJobIndex(jobId?: string | null): number {
  if (!jobId) return 0;
  const idx = COACH_JOBS.findIndex((j) => j.id === jobId);
  return idx >= 0 ? idx : 0;
}

export default function Coach({ initialMode, initialJobId, terminalFocus = false }: CoachProps = {}) {
  const { speak } = useCardAudio();
  const [mode, setMode] = useState<ActiveCoachMode>(() => initialMode ?? loadCoachMode());
  const [progress, setProgress] = useState<CoachProgress>(() => loadCoachProgress());
  const [extremeProgress, setExtremeProgress] = useState<ExtremeProgress>(() => loadExtremeProgress());
  const [mediumProgress, setMediumProgress] = useState<MediumProgress>(() => loadMediumProgress());
  const [easyProgress, setEasyProgress] = useState<EasyProgress>(() => loadEasyProgress());

  const [sessionDisqualified, setSessionDisqualified] = useState<Record<string, boolean>>({});
  const [mediumSessionDisqualified, setMediumSessionDisqualified] = useState<Record<string, boolean>>({});
  const [roundStarted, setRoundStarted] = useState<boolean>(false);
  const [mediumTypingStarted, setMediumTypingStarted] = useState<boolean>(false);
  const [mediumRoundFailed, setMediumRoundFailed] = useState<boolean>(false);
  const [extremeRoundOutcome, setExtremeRoundOutcome] = useState<ExtremeRoundOutcome>("none");

  const [jobIndex, setJobIndex] = useState<number>(() => resolveInitialJobIndex(initialJobId));
  const [cwd, setCwd] = useState<string>(HOME);
  const [input, setInput] = useState<string>("");
  const [lines, setLines] = useState<Line[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState<number>(-1);
  const [ghost, setGhost] = useState<string>("");
  const [feedback, setFeedback] = useState<Feedback>({ tone: "idle", message: "" });
  const [hintsShown, setHintsShown] = useState<number>(0);
  const [solutionShown, setSolutionShown] = useState<boolean>(false);
  const [solved, setSolved] = useState<boolean>(false);
  const [coldPass, setColdPass] = useState<boolean>(false);
  const [rebootPassed, setRebootPassed] = useState<boolean>(false);
  const [roundRecorded, setRoundRecorded] = useState<boolean>(false);
  const [mediumStageIndex, setMediumStageIndex] = useState<number>(0);
  const [easyStageIndex, setEasyStageIndex] = useState<number>(0);

  // Easy mode Scratch-style block builder state
  const [easyTraySlots, setEasyTraySlots] = useState<Array<string | null>>(() =>
    Array<string | null>(EASY_PLANS[COACH_JOBS[0].id].stages[0].slots.length).fill(null),
  );
  const [easyInspectedBlockId, setEasyInspectedBlockId] = useState<string | null>(null);
  const [easySelectedSlot, setEasySelectedSlot] = useState<number | null>(null);
  const [easyBlocksTouched, setEasyBlocksTouched] = useState<boolean>(false);
  const [easyLastTryFailed, setEasyLastTryFailed] = useState<boolean>(false);

  const lineIdRef = useRef<number>(1);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragSourceRef = useRef<DragSource | null>(null);

  const isEasy = mode === "easy";
  const isMedium = mode === "medium";
  const isHard = mode === "hard";
  const isExtreme = mode === "extreme";
  const job = COACH_JOBS[jobIndex];
  const mediumPlan = MEDIUM_PLANS[job.id];
  const mediumStage = mediumPlan.stages[Math.min(mediumStageIndex, mediumPlan.stages.length - 1)];
  const mediumStagePrefix = mediumStageIndex > 0 ? `:s${mediumStageIndex + 1}` : "";
  const easyPlan = EASY_PLANS[job.id];
  const easyStage = easyPlan.stages[Math.min(easyStageIndex, easyPlan.stages.length - 1)];
  const easyStagePrefix = easyStageIndex > 0 ? `:s${easyStageIndex + 1}` : "";

  const easyBlockById = useMemo(
    () => new Map<string, EasyBlock>(easyStage.blocks.map((b) => [b.id, b])),
    [easyStage],
  );
  const easyPlacedSet = useMemo(
    () => new Set<string>(easyTraySlots.filter((id): id is string => Boolean(id))),
    [easyTraySlots],
  );
  const inspectedEasyBlock = easyInspectedBlockId ? easyBlockById.get(easyInspectedBlockId) ?? null : null;

  const jobMeta = useMemo(
    () => COACH_JOBS.map((j) => ({ id: j.id, title: j.title, domain: j.domain })),
    [],
  );
  const hardReport = useMemo(() => readinessReport(jobMeta, progress), [jobMeta, progress]);
  const extremeReport = useMemo(() => extremeReadinessReport(jobMeta, extremeProgress), [extremeProgress, jobMeta]);
  const mediumReport = useMemo(() => mediumReadinessReport(jobMeta, mediumProgress), [jobMeta, mediumProgress]);
  const easyReport = useMemo(() => easyReadinessReport(jobMeta, easyProgress), [easyProgress, jobMeta]);

  const currentExtremeRecord = extremeProgress[job.id];
  const currentExtremeStatus = extremeJobStatus(currentExtremeRecord);
  const isLockedView = isExtreme && currentExtremeStatus === "locked" && !solved;

  const currentMediumStatus: MediumJobStatus = resolveMediumUiStatus(mediumProgress[job.id], {
    isCurrentJob: true,
    typingStarted: mediumTypingStarted,
    hintsUsed: hintsShown,
    solutionShown,
    roundFailed: mediumRoundFailed,
    roundSolved: solved,
  });

  const currentEasyStatus: EasyJobStatus = resolveEasyUiStatus(easyProgress[job.id], {
    isCurrentJob: true,
    blocksTouched: easyBlocksTouched,
    hintsUsed: hintsShown,
    solutionShown,
    lastTryFailed: easyLastTryFailed,
    roundSolved: solved,
  });

  const activeMediumStep = useMemo(
    () => stepAtShadowIndex(mediumStage, input.length),
    [input.length, mediumStage],
  );

  const pushLines = useCallback((entries: Omit<Line, "id">[]): void => {
    setLines((current) => [...current, ...entries.map((entry) => ({ ...entry, id: lineIdRef.current++ }))]);
  }, []);

  const burnExtremeTry = useCallback(
    (targetJobId: string): "retest-failed" | "first-try-burned" => {
      setSessionDisqualified((prev) => ({ ...prev, [targetJobId]: true }));
      const priorStatus = extremeJobStatus(extremeProgress[targetJobId]);
      if (priorStatus === "retest-due" || priorStatus === "not-done") {
        setExtremeProgress((current) => {
          const next = recordExtremeRound(current, targetJobId, {
            solved: false,
            hintsUsed: 0,
            firstTryInSession: false,
            rebootPassed: false,
          });
          saveExtremeProgress(next);
          return next;
        });
      }
      return priorStatus === "retest-due" ? "retest-failed" : "first-try-burned";
    },
    [extremeProgress],
  );

  const burnMediumTry = useCallback((targetJobId: string): void => {
    setMediumSessionDisqualified((prev) => ({ ...prev, [targetJobId]: true }));
    setMediumProgress((current) => {
      const next = recordMediumRound(current, targetJobId, {
        solved: false,
        fullShadowTyped: false,
        hintsUsed: 0,
        solutionShown: false,
        firstTryInSession: false,
        rebootPassed: false,
      });
      saveMediumProgress(next);
      return next;
    });
  }, []);

  const startJob = useCallback(
    (index: number, targetMode: ActiveCoachMode = mode, extremeState: ExtremeProgress = extremeProgress): void => {
      const next = COACH_JOBS[index];
      const nextExtremeRecord = extremeState[next.id];
      const nextExtremeStatus = extremeJobStatus(nextExtremeRecord);
      const nextEasyPlan = EASY_PLANS[next.id];
      const firstEasyStage = nextEasyPlan.stages[0];

      prepareJobSession(getDefaultSession(), next);
      setJobIndex(index);
      setCwd(HOME);
      setInput("");
      setGhost("");
      setHintsShown(0);
      setSolutionShown(false);
      setSolved(false);
      setColdPass(false);
      setRebootPassed(false);
      setRoundRecorded(false);
      setRoundStarted(false);
      setMediumStageIndex(0);
      setEasyStageIndex(0);
      setMediumTypingStarted(false);
      setMediumRoundFailed(false);
      setExtremeRoundOutcome("none");

      setEasyTraySlots(Array<string | null>(firstEasyStage.slots.length).fill(null));
      setEasyInspectedBlockId(null);
      setEasySelectedSlot(null);
      setEasyBlocksTouched(false);
      setEasyLastTryFailed(false);

      if (targetMode === "extreme" && nextExtremeStatus === "locked") {
        const waitWords = lockRemainingWords(nextExtremeRecord?.nextRetestAt ?? null);
        setLines([
          { id: lineIdRef.current++, kind: "output", text: `Job ${index + 1} of ${COACH_JOBS.length}: ${next.title}` },
          { id: lineIdRef.current++, kind: "output", text: next.job },
          {
            id: lineIdRef.current++,
            kind: "output",
            text: `Locked for ${waitWords} after your first cold pass. Come back when the cold retest opens.`,
          },
        ]);
        setFeedback({
          tone: "hint",
          message: `This job is locked for ${waitWords} until its cold retest opens. Pick another unlocked job in the meantime.`,
        });
        void speak(`coach:${next.id}:job`, next.job);
        return;
      }

      setFeedback({ tone: "idle", message: "" });
      const framingLine =
        targetMode === "extreme"
          ? nextExtremeStatus === "retest-due"
            ? "Extreme cold retest: first try in this session, zero hints. The coach only tells you where to look — never the command."
            : "Extreme mode: cold only, first try in this session, zero hints. The coach only tells you where to look — never the command."
          : targetMode === "medium"
            ? "Medium shadow practice: type over the light-grey command character by character, then press Enter to run it."
            : targetMode === "easy"
              ? "Easy word blocks: tap or drag blocks into the command tray to learn each word, then tap Run — no typing at all."
              : "The coach points. It never gives you the command.";

      const initialLines: Line[] = [
        { id: lineIdRef.current++, kind: "output", text: `Job ${index + 1} of ${COACH_JOBS.length}: ${next.title}` },
        { id: lineIdRef.current++, kind: "output", text: next.job },
        { id: lineIdRef.current++, kind: "output", text: framingLine },
      ];

      const beforeCmds =
        firstEasyStage.beforeCommands ?? (firstEasyStage.beforeCommand ? [firstEasyStage.beforeCommand] : []);
      if (targetMode === "easy" && beforeCmds.length > 0) {
        for (const cmd of beforeCmds) {
          const beforeRes = runCommand(cmd, HOME);
          initialLines.push({ id: lineIdRef.current++, kind: "input", text: `user@coach:~$ ${cmd}` });
          for (const text of beforeRes.output) {
            initialLines.push({ id: lineIdRef.current++, kind: "output", text });
          }
        }
      }

      setLines(initialLines);
      void speak(`coach:${next.id}:job`, next.job);
      if (targetMode !== "easy") {
        inputRef.current?.focus();
      }
    },
    [extremeProgress, mode, speak],
  );

  const handleSelectJob = useCallback(
    (index: number): void => {
      if (isExtreme && !solved && roundStarted) {
        burnExtremeTry(job.id);
      }
      if (isMedium && !solved && roundStarted) {
        burnMediumTry(job.id);
      }
      startJob(index, mode);
    },
    [burnExtremeTry, burnMediumTry, isExtreme, isMedium, job.id, mode, roundStarted, solved, startJob],
  );

  const handleRestartJob = useCallback((): void => {
    if (isExtreme) {
      if (currentExtremeStatus === "locked") return;
      if (!solved) {
        burnExtremeTry(job.id);
      }
    }
    if (isMedium && !solved && (mediumTypingStarted || roundStarted)) {
      burnMediumTry(job.id);
    }
    startJob(jobIndex, mode);
  }, [
    burnExtremeTry,
    burnMediumTry,
    currentExtremeStatus,
    isExtreme,
    isMedium,
    job.id,
    jobIndex,
    mediumTypingStarted,
    mode,
    roundStarted,
    solved,
    startJob,
  ]);

  const handleSelectMode = useCallback(
    (nextMode: ActiveCoachMode): void => {
      if (nextMode === mode) return;
      if (mode === "extreme" && !solved && roundStarted) {
        burnExtremeTry(job.id);
      }
      if (mode === "medium" && !solved && roundStarted) {
        burnMediumTry(job.id);
      }
      saveCoachMode(nextMode);
      setMode(nextMode);
      startJob(jobIndex, nextMode);
    },
    [burnExtremeTry, burnMediumTry, job.id, jobIndex, mode, roundStarted, solved, startJob],
  );

  // Start the selected job on first mount, and sync if routed from Jobs/Modes.
  const startedRef = useRef<boolean>(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (initialMode) {
      saveCoachMode(initialMode);
    }
    startJob(resolveInitialJobIndex(initialJobId), initialMode ?? mode, extremeProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevRouteSyncRef = useRef<string>(`${initialMode ?? ""}:${initialJobId ?? ""}`);
  useEffect(() => {
    const key = `${initialMode ?? ""}:${initialJobId ?? ""}`;
    if (prevRouteSyncRef.current === key) return;
    prevRouteSyncRef.current = key;
    const nextMode = initialMode ?? mode;
    const nextIdx = initialJobId ? resolveInitialJobIndex(initialJobId) : jobIndex;
    if (nextMode !== mode) {
      saveCoachMode(nextMode);
      setMode(nextMode);
    }
    startJob(nextIdx, nextMode, extremeProgress);
  }, [extremeProgress, initialJobId, initialMode, jobIndex, mode, startJob]);

  useEffect(() => {
    if (!terminalFocus) return;
    scrollRef.current?.scrollIntoView?.({ block: "nearest" });
    if (!isEasy && !isLockedView) {
      inputRef.current?.focus();
    }
  }, [isEasy, isLockedView, terminalFocus]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  useEffect(() => {
    if (isEasy || isLockedView || (isMedium && !solved)) {
      setGhost("");
      return;
    }
    const trimmed = input.trimStart();
    if (!trimmed) {
      setGhost("");
      return;
    }
    const parts = trimmed.split(/\s+/);
    const isFirst = parts.length === 1 && !/\s$/.test(input);
    const fragment = isFirst ? parts[0] : parts[parts.length - 1];
    const candidates = isFirst ? completeCommand(fragment) : completePath(cwd, fragment);
    const first = candidates[0];
    setGhost(first && first.startsWith(fragment) && first !== fragment ? first.slice(fragment.length) : "");
  }, [cwd, input, isEasy, isLockedView, isMedium, solved]);

  // ---------------------------------------------------------------------------
  // Easy mode block interactions (tap, swap, remove, drag & drop, Run)
  // ---------------------------------------------------------------------------

  const inspectEasyBlock = useCallback(
    (block: EasyBlock): void => {
      setEasyInspectedBlockId(block.id);
      void speak(`coach:easy:${job.id}${easyStagePrefix}:block-${block.id}`, easyBlockSpeech(block));
    },
    [easyStagePrefix, job.id, speak],
  );

  const handleTapBankBlock = useCallback(
    (block: EasyBlock): void => {
      inspectEasyBlock(block);
      if (solved) return;
      setEasyBlocksTouched(true);
      setEasyLastTryFailed(false);
      if (feedback.tone === "hint" && hintsShown === 0 && !solutionShown) {
        setFeedback({ tone: "idle", message: "" });
      }

      setEasyTraySlots((current) => {
        if (current.includes(block.id)) return current;
        const next = [...current];
        if (easySelectedSlot !== null && easySelectedSlot >= 0 && easySelectedSlot < next.length) {
          next[easySelectedSlot] = block.id;
          return next;
        }
        const firstEmpty = next.findIndex((id) => id === null);
        if (firstEmpty !== -1) {
          next[firstEmpty] = block.id;
        }
        return next;
      });
      setEasySelectedSlot(null);
    },
    [easySelectedSlot, feedback.tone, hintsShown, inspectEasyBlock, solutionShown, solved],
  );

  const handleTapTraySlot = useCallback(
    (slotIndex: number): void => {
      const blockId = easyTraySlots[slotIndex];
      if (blockId) {
        const block = easyBlockById.get(blockId);
        if (block) inspectEasyBlock(block);
      }
      if (solved) return;

      if (easySelectedSlot === null) {
        setEasySelectedSlot(slotIndex);
        return;
      }
      if (easySelectedSlot === slotIndex) {
        setEasySelectedSlot(null);
        return;
      }

      setEasyBlocksTouched(true);
      setEasyLastTryFailed(false);
      setEasyTraySlots((current) => swapEasySlots(current, easySelectedSlot, slotIndex));
      setEasySelectedSlot(null);
    },
    [easyBlockById, easySelectedSlot, easyTraySlots, inspectEasyBlock, solved],
  );

  const handleMoveTrayBlock = useCallback(
    (fromIndex: number, toIndex: number): void => {
      if (solved) return;
      setEasyBlocksTouched(true);
      setEasyLastTryFailed(false);
      setEasySelectedSlot(null);
      setEasyTraySlots((current) => swapEasySlots(current, fromIndex, toIndex));
    },
    [solved],
  );

  const handleRemoveTrayBlock = useCallback(
    (slotIndex: number): void => {
      if (solved) return;
      setEasyBlocksTouched(true);
      setEasyLastTryFailed(false);
      setEasySelectedSlot(null);
      setEasyTraySlots((current) => {
        const next = [...current];
        next[slotIndex] = null;
        return next;
      });
    },
    [solved],
  );

  const handleClearEasyTray = useCallback((): void => {
    if (solved) return;
    setEasyLastTryFailed(false);
    setEasySelectedSlot(null);
    setEasyTraySlots(Array<string | null>(easyStage.slots.length).fill(null));
  }, [easyStage.slots.length, solved]);

  const handleDragStartBank = useCallback(
    (event: DragEvent<HTMLButtonElement>, block: EasyBlock): void => {
      dragSourceRef.current = { from: "bank", blockId: block.id };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", block.id);
    },
    [],
  );

  const handleDragStartTray = useCallback((event: DragEvent<HTMLButtonElement>, slotIndex: number, block: EasyBlock): void => {
    dragSourceRef.current = { from: "tray", slotIndex };
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", block.id);
  }, []);

  const handleDropOnSlot = useCallback(
    (event: DragEvent<HTMLDivElement>, targetSlotIndex: number): void => {
      event.preventDefault();
      if (solved) return;
      const source = dragSourceRef.current;
      dragSourceRef.current = null;
      if (!source) return;

      setEasyBlocksTouched(true);
      setEasyLastTryFailed(false);
      setEasySelectedSlot(null);

      if (source.from === "bank") {
        const block = easyBlockById.get(source.blockId);
        if (block) inspectEasyBlock(block);
        setEasyTraySlots((current) => {
          const next = [...current];
          const existingIdx = next.indexOf(source.blockId);
          if (existingIdx !== -1 && existingIdx !== targetSlotIndex) {
            return swapEasySlots(next, existingIdx, targetSlotIndex);
          }
          next[targetSlotIndex] = source.blockId;
          return next;
        });
      } else {
        setEasyTraySlots((current) => swapEasySlots(current, source.slotIndex, targetSlotIndex));
      }
    },
    [easyBlockById, inspectEasyBlock, solved],
  );

  const runEasyBuiltCommand = useCallback((): void => {
    if (solved) return;
    setEasySelectedSlot(null);
    const evaluation = evaluateEasyAttempt(easyStage, easyTraySlots, {
      jobId: job.id,
      stageIndex: easyStageIndex,
    });

    if (!evaluation.ok) {
      setEasyBlocksTouched(true);
      setEasyLastTryFailed(true);
      if (evaluation.block) {
        setEasyInspectedBlockId(evaluation.block.id);
      }
      setEasyProgress((current) => {
        const next = recordEasyRound(current, job.id, {
          solved: false,
          hintsUsed: hintsShown,
          solutionShown,
          rebootPassed: false,
        });
        saveEasyProgress(next);
        return next;
      });
      setFeedback({ tone: "hint", message: evaluation.coachMessage });
      void speak(evaluation.audioKey, evaluation.coachMessage);
      return;
    }

    // Assembled command matches target — execute against the real truthful shell!
    setRoundStarted(true);
    setEasyLastTryFailed(false);
    const promptStr = `user@coach:${cwd === HOME ? "~" : cwd}$`;
    pushLines([{ kind: "input", text: `${promptStr} ${evaluation.command}` }]);

    const session = getDefaultSession();
    const stateBefore = job.checkState ? job.checkState(session, cwd) : null;
    const result = runCommand(evaluation.command, cwd);

    if (result.output.length) {
      pushLines(result.output.map((text) => ({ kind: result.unknown ? ("error" as const) : ("output" as const), text })));
    }

    const parsed = parseCommand(evaluation.command);
    const didSolve = isTaskSolved(
      { match: job.match ?? (() => false), checkState: job.checkState },
      getDefaultSession(),
      stateBefore,
      { parsed, cwdBefore: cwd, cwdAfter: result.cwd, result },
    );

    const afterCmds = easyStage.afterCommands ?? (easyStage.afterCommand ? [easyStage.afterCommand] : []);
    let nextCwd = result.cwd;
    for (const afterCmd of afterCmds) {
      const afterPrompt = `user@coach:${nextCwd === HOME ? "~" : nextCwd}$`;
      const afterRes = runCommand(afterCmd, nextCwd);
      pushLines([
        { kind: "input", text: `${afterPrompt} ${afterCmd}` },
        ...afterRes.output.map((text) => ({ kind: "output" as const, text })),
      ]);
      nextCwd = afterRes.cwd;
    }
    setCwd(nextCwd);

    if (easyStageIndex + 1 < easyPlan.stages.length) {
      const nextStageIdx = easyStageIndex + 1;
      const nextStage = easyPlan.stages[nextStageIdx];
      setEasyStageIndex(nextStageIdx);
      setEasyTraySlots(Array<string | null>(nextStage.slots.length).fill(null));
      setEasyInspectedBlockId(null);
      setEasySelectedSlot(null);
      setFeedback({ tone: "success", message: evaluation.coachMessage });
      void speak(evaluation.audioKey, evaluation.coachMessage);
      return;
    }

    if (didSolve) {
      const rebootOk = !job.rebootCheck;
      const usedHelp = hintsShown > 0 || solutionShown;
      setSolved(true);
      setRebootPassed(rebootOk);
      setRoundRecorded(true);
      setColdPass(!usedHelp);

      setEasyProgress((current) => {
        const next = recordEasyRound(current, job.id, {
          solved: true,
          hintsUsed: hintsShown,
          solutionShown,
          rebootPassed: rebootOk,
        });
        saveEasyProgress(next);
        return next;
      });

      setFeedback({
        tone: usedHelp ? "hint" : "success",
        message: usedHelp
          ? `${evaluation.coachMessage} Hint used — marked yellow on this job, and it still counts as an Easy pass.`
          : evaluation.coachMessage,
      });
      void speak(evaluation.audioKey, evaluation.coachMessage);
    }
  }, [cwd, easyPlan.stages, easyStage, easyStageIndex, easyTraySlots, hintsShown, job, pushLines, solutionShown, solved, speak]);

  // ---------------------------------------------------------------------------
  // Medium / Hard / Extreme keyboard input handlers
  // ---------------------------------------------------------------------------

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const nextValue = event.target.value;
      if (!isMedium || solved) {
        setInput(nextValue);
        return;
      }

      const res = advanceShadowTyping(input, nextValue, mediumStage);
      setInput(res.typed);
      if (res.typed.length > 0) {
        setMediumTypingStarted(true);
      }
      if (res.blocked && res.coachMessage) {
        setFeedback({ tone: "hint", message: res.coachMessage });
        if (res.wrongStep) {
          void speak(
            `coach:medium:${job.id}${mediumStagePrefix}:wrong-${res.wrongStep.stepNumber}`,
            res.wrongStep.wrongKeyHint,
          );
        }
      } else if (res.advanced && feedback.tone === "hint" && hintsShown === 0 && !solutionShown) {
        setFeedback({ tone: "idle", message: "" });
      }
    },
    [feedback.tone, hintsShown, input, isMedium, job.id, mediumStage, mediumStagePrefix, solutionShown, solved, speak],
  );

  const recordHardSolvedRound = useCallback(
    (rebootOk: boolean): void => {
      const isCold = hintsShown === 0 && !solutionShown;
      setColdPass(isCold);
      setProgress((current) => {
        const next = recordRound(current, job.id, { solved: true, hintsUsed: hintsShown, solutionShown, rebootPassed: rebootOk });
        saveCoachProgress(next);
        return next;
      });
      setRoundRecorded(true);
    },
    [hintsShown, job.id, solutionShown],
  );

  const submit = useCallback((): void => {
    if (isLockedView || isEasy) return;
    const raw = input.trim();
    const typedBeforeSubmit = input;
    setInput("");
    setGhost("");
    setHistoryCursor(-1);
    if (!raw) return;

    setRoundStarted(true);
    setHistory((current) => [raw, ...current].slice(0, 100));
    const prompt = `user@coach:${cwd === HOME ? "~" : cwd}$`;
    pushLines([{ kind: "input", text: `${prompt} ${raw}` }]);

    const session = getDefaultSession();
    const stateBefore = job.checkState ? job.checkState(session, cwd) : null;
    const result = runCommand(raw, cwd);

    if (result.output[0] === "\u0000clear") {
      setLines([]);
      setCwd(result.cwd);
      return;
    }
    if (result.output.length) {
      pushLines(result.output.map((text) => ({ kind: result.unknown ? ("error" as const) : ("output" as const), text })));
    }
    setCwd(result.cwd);

    if (solved) return;
    const parsed = parseCommand(raw);
    const didSolve = isTaskSolved(
      { match: job.match ?? (() => false), checkState: job.checkState },
      getDefaultSession(),
      stateBefore,
      { parsed, cwdBefore: cwd, cwdAfter: result.cwd, result },
    );

    if (isMedium) {
      const fullShadowTyped = typedBeforeSubmit === mediumStage.target;
      const usedHelp = hintsShown > 0 || solutionShown;
      const firstTryOk = !mediumSessionDisqualified[job.id];
      const rebootOk = !job.rebootCheck;

      if (fullShadowTyped && mediumStageIndex + 1 < mediumPlan.stages.length) {
        const nextIdx = mediumStageIndex + 1;
        setMediumStageIndex(nextIdx);
        setFeedback({
          tone: usedHelp ? "hint" : "idle",
          message: usedHelp
            ? `Command ${mediumStageIndex + 1} of ${mediumPlan.stages.length} ran (hint used). Now type command ${nextIdx + 1} over the shadow.`
            : "",
        });
        return;
      }

      if (didSolve && fullShadowTyped) {
        setSolved(true);
        setRebootPassed(rebootOk);
        setRoundRecorded(true);
        setMediumSessionDisqualified((prev) => ({ ...prev, [job.id]: true }));

        setMediumProgress((current) => {
          const next = recordMediumRound(current, job.id, {
            solved: true,
            fullShadowTyped: true,
            hintsUsed: hintsShown,
            solutionShown,
            firstTryInSession: firstTryOk,
            rebootPassed: rebootOk,
          });
          saveMediumProgress(next);
          return next;
        });

        if (usedHelp) {
          setColdPass(false);
          setFeedback({
            tone: "hint",
            message:
              "The command ran and changed the machine, with a hint used — marked yellow (hint used), so it does not count as a Medium pass.",
          });
        } else if (!firstTryOk) {
          setColdPass(false);
          setMediumRoundFailed(true);
          setFeedback({
            tone: "hint",
            message:
              "The command worked now, but this was not your first try in this session — start a fresh session to earn a Medium pass.",
          });
        } else {
          setColdPass(true);
          setFeedback({
            tone: "success",
            message: job.rebootCheck
              ? "Medium pass — you typed the whole shadow command on your first try with zero hints, and the service is up. Press Test reboot below to watch it survive a restart."
              : "Medium pass — you typed the whole shadow command on your first try with zero hints, and the machine confirms the change.",
          });
        }
        return;
      }

      // Incomplete or unsolved submission in Medium fails this try
      setMediumRoundFailed(true);
      setMediumSessionDisqualified((prev) => ({ ...prev, [job.id]: true }));
      setMediumProgress((current) => {
        const next = recordMediumRound(current, job.id, {
          solved: false,
          fullShadowTyped,
          hintsUsed: hintsShown,
          solutionShown,
          firstTryInSession: false,
          rebootPassed: false,
        });
        saveMediumProgress(next);
        return next;
      });
      setFeedback({
        tone: "hint",
        message:
          "You pressed Enter before finishing the whole shadow command, so the job is not done yet. Press Start this job again to practice typing every part.",
      });
      return;
    }

    if (isExtreme) {
      if (didSolve) {
        const statusBefore = extremeJobStatus(extremeProgress[job.id]);
        const firstTryOk = !sessionDisqualified[job.id] && hintsShown === 0 && !solutionShown;
        const rebootOk = !job.rebootCheck;

        setSolved(true);
        setRebootPassed(rebootOk);
        setRoundRecorded(true);
        setSessionDisqualified((prev) => ({ ...prev, [job.id]: true }));

        if (!firstTryOk) {
          setColdPass(false);
          setExtremeRoundOutcome("not-counted");
          setFeedback({
            tone: "hint",
            message:
              "The machine says the job is done now, but it was not solved cold on your first try in this session — so it does not count for Extreme.",
          });
          return;
        }

        setColdPass(true);
        setExtremeProgress((current) => {
          const next = recordExtremeRound(current, job.id, {
            solved: true,
            hintsUsed: 0,
            firstTryInSession: true,
            rebootPassed: rebootOk,
          });
          saveExtremeProgress(next);
          return next;
        });

        if (statusBefore === "retest-due" || statusBefore === "complete") {
          setExtremeRoundOutcome("completed");
          setFeedback({
            tone: "success",
            message: job.rebootCheck
              ? "Cold retest passed on your first try — Extreme complete. Press Test reboot below to watch the fix survive a restart."
              : "Cold retest passed on your first try. You proved this job cold twice, three days apart — Extreme complete.",
          });
        } else {
          setExtremeRoundOutcome("locked");
          setFeedback({
            tone: "success",
            message: job.rebootCheck
              ? "Passed cold on your first try. This job is now locked for three days until its cold retest. Press Test reboot below to watch the fix survive a restart."
              : "Passed cold on your first try. This job is now locked for three days — come back in three days for the cold retest.",
          });
        }
        return;
      }

      if (didCommandBurnFirstTry(job.id, parsed, result, result.cwd)) {
        const reason = burnExtremeTry(job.id);
        setExtremeRoundOutcome("failed");
        setFeedback({
          tone: "hint",
          message:
            reason === "retest-failed"
              ? "The cold retest failed on that attempt. This job is back to not done, and the three-day clock restarts once you pass it cold in a new session."
              : "That attempt did not finish the job on the first try, so this session can no longer count for Extreme.",
        });
        return;
      }

      if (parsed.name && parsed.name !== "help" && parsed.name !== "clear") {
        setFeedback({
          tone: "hint",
          message: "Look closely at what the machine just showed you, then finish the job cold on this try.",
        });
      }
      return;
    }

    // Hard mode (unchanged)
    if (didSolve) {
      setSolved(true);
      const rebootOk = !job.rebootCheck;
      setRebootPassed(rebootOk);
      if (!roundRecorded) recordHardSolvedRound(rebootOk);
      setFeedback({
        tone: "success",
        message: job.rebootCheck
          ? "The website is back up — and the machine says so, not the coach. Now prove it survives a reboot: press Test reboot."
          : "Done — and the machine says so, not the coach. The website answers, the file really changed, the archive really exists.",
      });
      return;
    }
    if (parsed.name && parsed.name !== "help" && parsed.name !== "clear") {
      setFeedback({ tone: "hint", message: "That did not finish the job yet. Ask for a hint if you are stuck — the coach will point, not tell." });
    }
  }, [
    burnExtremeTry,
    cwd,
    extremeProgress,
    hintsShown,
    input,
    isEasy,
    isExtreme,
    isLockedView,
    isMedium,
    job,
    mediumPlan.stages.length,
    mediumSessionDisqualified,
    mediumStage.target,
    mediumStageIndex,
    pushLines,
    recordHardSolvedRound,
    roundRecorded,
    sessionDisqualified,
    solutionShown,
    solved,
  ]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>): void => {
      if (isLockedView) return;
      if (event.key === "Enter") {
        event.preventDefault();
        submit();
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        // In Medium shadow typing, the coach never auto-types for the learner.
        if (isMedium && !solved) return;
        const trimmed = input.trimStart();
        const parts = trimmed.split(/\s+/);
        const isFirst = parts.length === 1 && !/\s$/.test(input);
        const fragment = isFirst ? parts[0] : parts[parts.length - 1];
        const candidates = isFirst ? completeCommand(fragment) : completePath(cwd, fragment);
        if (candidates.length === 1) {
          const completion = candidates[0];
          const prefix = input.slice(0, input.length - fragment.length);
          setInput(prefix + completion + (completion.endsWith("/") ? "" : " "));
        } else if (candidates.length > 1) {
          pushLines([
            { kind: "input", text: `user@coach:${cwd === HOME ? "~" : cwd}$ ${input}` },
            { kind: "output", text: candidates.join("  ") },
          ]);
        }
        return;
      }
      if (event.key === "ArrowUp") {
        if (isMedium && !solved) return;
        event.preventDefault();
        if (!history.length) return;
        const next = Math.min(historyCursor + 1, history.length - 1);
        setHistoryCursor(next);
        setInput(history[next]);
        return;
      }
      if (event.key === "ArrowDown") {
        if (isMedium && !solved) return;
        event.preventDefault();
        if (historyCursor <= 0) {
          setHistoryCursor(-1);
          setInput("");
          return;
        }
        const next = historyCursor - 1;
        setHistoryCursor(next);
        setInput(history[next]);
        return;
      }
      if (event.key === "l" && event.ctrlKey) {
        event.preventDefault();
        setLines([]);
      }
    },
    [cwd, history, historyCursor, input, isLockedView, isMedium, pushLines, solved, submit],
  );

  const askHint = useCallback((): void => {
    if (isExtreme || solved || hintsShown >= job.hints.length) return;
    const hint = job.hints[hintsShown];
    setHintsShown((n) => n + 1);
    if (isEasy) {
      setEasyLastTryFailed(false);
      setEasyProgress((current) => {
        const next = recordEasyHintUsed(current, job.id);
        saveEasyProgress(next);
        return next;
      });
    } else if (isMedium) {
      setMediumProgress((current) => {
        const next = recordMediumHintUsed(current, job.id);
        saveMediumProgress(next);
        return next;
      });
    } else {
      setSessionDisqualified((prev) => ({ ...prev, [job.id]: true }));
      setExtremeProgress((current) => {
        const next = recordExtremeHintUsed(current, job.id);
        saveExtremeProgress(next);
        return next;
      });
    }
    setFeedback({ tone: "hint", message: hint });
    void speak(`coach:${job.id}:hint-${hintsShown + 1}`, hint);
  }, [hintsShown, isEasy, isExtreme, isMedium, job, solved, speak]);

  const showSolution = useCallback((): void => {
    if (isExtreme || solved) return;
    setSolutionShown(true);
    if (isEasy) {
      setEasyLastTryFailed(false);
      setEasyProgress((current) => {
        const next = recordEasyHintUsed(current, job.id);
        saveEasyProgress(next);
        return next;
      });
      setFeedback({
        tone: "hint",
        message: `Block order: ${job.solution}. Marked yellow (hint used) — place those blocks in the tray and tap Run to earn your Easy pass.`,
      });
      return;
    }
    if (isMedium) {
      setMediumProgress((current) => {
        const next = recordMediumHintUsed(current, job.id);
        saveMediumProgress(next);
        return next;
      });
      setFeedback({
        tone: "hint",
        message: `Solution: ${job.solution}. Marked yellow (hint used) — type the whole command over the shadow to run it, though this round will not count as a Medium pass.`,
      });
      return;
    }
    setSessionDisqualified((prev) => ({ ...prev, [job.id]: true }));
    setExtremeProgress((current) => {
      const next = recordExtremeHintUsed(current, job.id);
      saveExtremeProgress(next);
      return next;
    });
    setFeedback({ tone: "hint", message: `The solution is: ${job.solution}. This round can no longer count as a cold pass — start the job again to try it cold.` });
  }, [isEasy, isExtreme, isMedium, job, solved]);

  const testReboot = useCallback((): void => {
    const out = rebootDefaultSession();
    pushLines(out.map((text) => ({ kind: "output" as const, text })));
    const stillDone = job.checkState ? job.checkState(getDefaultSession(), cwd) : false;
    if (stillDone) {
      setRebootPassed(true);
      if (isExtreme) {
        setExtremeProgress((current) => {
          const next = markExtremeRebootPassed(current, job.id);
          saveExtremeProgress(next);
          return next;
        });
      } else if (isMedium) {
        setMediumProgress((current) => {
          const next = markMediumRebootPassed(current, job.id);
          saveMediumProgress(next);
          return next;
        });
      } else if (isEasy) {
        setEasyProgress((current) => {
          const next = markEasyRebootPassed(current, job.id);
          saveEasyProgress(next);
          return next;
        });
      } else {
        setProgress((current) => {
          const next = markRebootPassed(current, job.id);
          saveCoachProgress(next);
          return next;
        });
      }
      setFeedback({ tone: "success", message: "It survived the reboot. The fix is real — the website is still up after a restart." });
    } else {
      if (isExtreme) {
        burnExtremeTry(job.id);
        setExtremeRoundOutcome("failed");
      } else if (isMedium) {
        setMediumRoundFailed(true);
        burnMediumTry(job.id);
      }
      setFeedback({ tone: "hint", message: "After the reboot the job is undone. The fix only lasted until the restart — it needs to start at boot, not just now." });
    }
  }, [burnExtremeTry, burnMediumTry, cwd, isEasy, isExtreme, isMedium, job, pushLines]);

  const nextUnlockedExtremeIndex = useMemo(() => {
    for (let offset = 1; offset < COACH_JOBS.length; offset += 1) {
      const idx = (jobIndex + offset) % COACH_JOBS.length;
      const st = extremeJobStatus(extremeProgress[COACH_JOBS[idx].id]);
      if (st !== "locked") return idx;
    }
    return null;
  }, [extremeProgress, jobIndex]);

  const prompt = `user@coach:${cwd === HOME ? "~" : cwd}$`;
  const remainingShadow = isMedium && !solved ? mediumStage.target.slice(input.length) : "";

  return (
    <div className="w-full min-w-0 max-w-full space-y-3 sm:space-y-4">
      <ScanlineFrame
        className={cn(
          "rounded-lg border bg-card",
          isEasy ? "border-sky-500/50" : isMedium ? "border-emerald-500/50" : "border-border",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <Ear
              className={cn(
                "h-4 w-4 shrink-0 sm:h-5 sm:w-5",
                isEasy ? "text-sky-400" : isMedium ? "text-emerald-400" : "text-phosphor",
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-mono text-sm font-semibold text-foreground sm:text-base">
                Over Your Shoulder — Coach
              </h1>
              <p className="truncate font-mono text-[11px] text-muted-foreground sm:text-xs">
                {isExtreme
                  ? "Extreme: cold only, first try in this session, then a cold retest three days later."
                  : isMedium
                    ? "Medium: shadow typing + plain-words walkthrough. Type every character yourself, then run it."
                    : isEasy
                      ? "Easy: learn the words first — tap or drag blocks to build the command, no typing at all."
                      : "No points, no streaks, no leaderboard. The only score is what you can do cold."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void speak(`coach:${job.id}:job`, job.job)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-xs text-muted-foreground hover:border-phosphor/50 hover:text-phosphor sm:gap-2 sm:px-3"
          >
            <Volume2 className="h-3.5 w-3.5" aria-hidden />
            Hear the job
          </button>
        </div>
      </ScanlineFrame>

      {/* Mode picker */}
      <section aria-label="Coach mode" className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card p-2.5 sm:gap-2 sm:p-3">
        <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">Mode</span>
        <button
          type="button"
          aria-pressed={isEasy}
          onClick={() => handleSelectMode("easy")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-xs transition-colors sm:px-3",
            isEasy
              ? "border-sky-400 bg-sky-500/15 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.22)]"
              : "border-sky-500/45 text-sky-300/85 hover:border-sky-400 hover:bg-sky-500/10 hover:text-sky-200",
          )}
        >
          <Blocks className="h-3.5 w-3.5" aria-hidden />
          Easy
        </button>
        <button
          type="button"
          aria-pressed={isMedium}
          onClick={() => handleSelectMode("medium")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-xs transition-colors sm:px-3",
            isMedium
              ? "border-emerald-400 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              : "border-emerald-500/40 text-emerald-300/80 hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-200",
          )}
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden />
          Medium
        </button>
        <button
          type="button"
          aria-pressed={isHard}
          onClick={() => handleSelectMode("hard")}
          className={cn(
            "animate-hard-pulse inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-xs transition-colors sm:px-3",
            isHard
              ? "border-yellow-400 bg-yellow-500/15 text-yellow-300"
              : "border-yellow-500/50 text-yellow-300/85 hover:border-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-200",
          )}
        >
          Hard
        </button>
        <button
          type="button"
          aria-pressed={isExtreme}
          onClick={() => handleSelectMode("extreme")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-xs transition-colors sm:px-3",
            isExtreme
              ? "border-red-500 bg-red-500/15 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
              : "border-red-500/50 text-red-400/85 hover:border-red-500 hover:bg-red-500/10 hover:text-red-300",
          )}
        >
          <Flame className="h-3.5 w-3.5" aria-hidden />
          Extreme
        </button>
      </section>

      {/* Readiness report */}
      {!terminalFocus ? (
        <section aria-label="Readiness report" className="rounded-lg border border-border bg-card p-3.5 sm:p-5">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground sm:text-sm">Where you stand</h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs sm:gap-x-6 sm:text-sm">
            <p className={cn("tnum", isEasy ? "text-sky-300" : "text-muted-foreground")}>{easyReport.headline}</p>
            {isMedium ? <p className="tnum text-emerald-300">{mediumReport.headline}</p> : null}
            <p className={cn("tnum", isHard ? "text-foreground" : "text-muted-foreground")}>
              Hard: {hardReport.coldCount} of {hardReport.totalCount} jobs done cold.
            </p>
            <p className={cn("tnum", isExtreme ? "text-foreground" : "text-muted-foreground")}>{extremeReport.headline}</p>
          </div>
          <ul className="mt-2.5 space-y-1.5 sm:mt-3">
            {(isExtreme
              ? extremeReport.lines
              : isMedium
                ? mediumReport.lines
                : isEasy
                  ? easyReport.lines
                  : hardReport.lines
            ).map((line) => (
              <li key={line} className="text-xs leading-relaxed text-foreground/85 sm:text-sm">
                {line}
              </li>
            ))}
          </ul>
          <p className={cn("mt-2.5 font-mono text-xs sm:mt-3 sm:text-sm", isEasy ? "text-sky-300" : isMedium ? "text-emerald-300" : "text-phosphor")}>
            {isExtreme
              ? extremeReport.nextStep
              : isMedium
                ? mediumReport.nextStep
                : isEasy
                  ? easyReport.nextStep
                  : hardReport.nextStep}
          </p>
        </section>
      ) : null}

      {/* Job list */}
      {!terminalFocus ? (
        <section aria-label="Jobs" className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pr-1 sm:max-h-none sm:gap-2 sm:overflow-visible sm:pr-0">
          {COACH_JOBS.map((j, i) => {
            if (isEasy) {
              const eStatus = resolveEasyUiStatus(easyProgress[j.id], {
                isCurrentJob: i === jobIndex,
                blocksTouched: easyBlocksTouched,
                hintsUsed: hintsShown,
                solutionShown,
                lastTryFailed: easyLastTryFailed,
                roundSolved: solved,
              });
              return (
                <button
                  key={j.id}
                  type="button"
                  data-easy-status={eStatus}
                  onClick={() => handleSelectJob(i)}
                  className={cn(
                    "max-w-full rounded-md border px-2.5 py-1.5 text-left font-mono text-[11px] transition-colors sm:px-3 sm:py-2 sm:text-xs",
                    statusColorClasses(eStatus, i === jobIndex),
                  )}
                >
                  {i + 1}. {j.title} · {easyStatusLabel(eStatus, easyProgress[j.id], i === jobIndex && solved)}
                </button>
              );
            }

            if (isMedium) {
              const mStatus = resolveMediumUiStatus(mediumProgress[j.id], {
                isCurrentJob: i === jobIndex,
                typingStarted: mediumTypingStarted,
                hintsUsed: hintsShown,
                solutionShown,
                roundFailed: mediumRoundFailed,
                roundSolved: solved,
              });
              return (
                <button
                  key={j.id}
                  type="button"
                  data-medium-status={mStatus}
                  onClick={() => handleSelectJob(i)}
                  className={cn(
                    "max-w-full rounded-md border px-2.5 py-1.5 text-left font-mono text-[11px] transition-colors sm:px-3 sm:py-2 sm:text-xs",
                    statusColorClasses(mStatus, i === jobIndex),
                  )}
                >
                  {i + 1}. {j.title} · {mediumStatusLabel(mStatus)}
                </button>
              );
            }

            if (isExtreme) {
              const exStatus = extremeJobStatus(extremeProgress[j.id]);
              return (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => handleSelectJob(i)}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-left font-mono text-[11px] transition-colors sm:px-3 sm:py-2 sm:text-xs",
                    i === jobIndex
                      ? "border-phosphor bg-phosphor/10 text-phosphor"
                      : "border-border text-muted-foreground hover:border-phosphor/40 hover:text-foreground",
                  )}
                >
                  {exStatus === "locked" ? <Lock className="h-3 w-3 shrink-0" aria-hidden /> : null}
                  <span className="min-w-0 break-words">
                    {i + 1}. {j.title}
                    {exStatus === "complete"
                      ? " ✓ proved twice"
                      : exStatus === "locked"
                        ? " · locked (3 days)"
                        : exStatus === "retest-due"
                          ? " · retest due"
                          : ""}
                  </span>
                </button>
              );
            }

            const status = hardJobStatus(j, progress);
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => handleSelectJob(i)}
                className={cn(
                  "max-w-full rounded-md border px-2.5 py-1.5 text-left font-mono text-[11px] transition-colors sm:px-3 sm:py-2 sm:text-xs",
                  i === jobIndex
                    ? "border-phosphor bg-phosphor/10 text-phosphor"
                    : "border-border text-muted-foreground hover:border-phosphor/40 hover:text-foreground",
                )}
              >
                {i + 1}. {j.title}
                {status === "cold" ? " ✓ cold" : status === "helped" ? " · helped" : status === "retest" ? " · retest due" : ""}
              </button>
            );
          })}
        </section>
      ) : null}

      {/* Easy Scratch-style Word Block Builder (Blue cold storage, NO typing) */}
      {isEasy ? (
        <section
          aria-label="Easy word block builder"
          className="space-y-3 rounded-lg border border-sky-500/50 bg-sky-950/20 p-3.5 sm:space-y-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-sky-300">
                Word blocks — no typing
              </span>
              <span
                data-testid="easy-status-badge"
                data-easy-status={currentEasyStatus}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 font-mono text-[11px]",
                  statusColorClasses(currentEasyStatus, false),
                )}
              >
                {easyStatusLabel(currentEasyStatus, easyProgress[job.id], solved)}
              </span>
              {easyPlan.stages.length > 1 ? (
                <span
                  data-testid="easy-stage-badge"
                  className="rounded-full border border-sky-400/50 bg-sky-500/10 px-2.5 py-0.5 font-mono text-[11px] text-sky-200"
                >
                  Step {easyStageIndex + 1} of {easyPlan.stages.length}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void speak(`coach:easy:${job.id}${easyStagePrefix}:intro`, easyStage.intro)}
              className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/40 px-2.5 py-1 font-mono text-xs text-sky-300/90 hover:border-sky-400 hover:text-sky-200"
            >
              <Volume2 className="h-3.5 w-3.5" aria-hidden />
              Hear guide
            </button>
          </div>

          <p className="text-sm leading-relaxed text-foreground/90">{easyStage.intro}</p>

          {/* Plain-words meaning panel — updates whenever any block is tapped */}
          <div
            data-testid="easy-block-meaning"
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-sky-400/40 bg-background/60 px-4 py-3"
          >
            {inspectedEasyBlock ? (
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="rounded border border-sky-400/60 bg-sky-500/20 px-2 py-0.5 font-mono text-sm font-semibold text-sky-200">
                  {inspectedEasyBlock.token}
                </span>
                <span className="font-mono text-xs text-muted-foreground">=</span>
                <span className="text-sm text-foreground">{inspectedEasyBlock.meaning}</span>
              </div>
            ) : (
              <p className="font-mono text-xs text-muted-foreground">
                Tap any word block to see and hear what it means in plain words.
              </p>
            )}
            {inspectedEasyBlock ? (
              <button
                type="button"
                onClick={() => inspectEasyBlock(inspectedEasyBlock)}
                className="inline-flex items-center gap-1 rounded border border-sky-500/40 px-2 py-1 font-mono text-[11px] text-sky-300 hover:border-sky-400"
              >
                <Volume2 className="h-3 w-3" aria-hidden />
                Hear word
              </button>
            ) : null}
          </div>

          {/* Command tray */}
          <div
            data-testid="easy-command-tray"
            aria-label="Command tray"
            className="space-y-2 rounded-md border border-sky-500/35 bg-background/70 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-sky-300">{prompt}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {easySelectedSlot !== null
                  ? `Slot ${easySelectedSlot + 1} selected — tap another slot to swap, or tap a bank block to place it here`
                  : "Tap blocks in order, drag into slots, or tap two tray blocks to swap"}
              </span>
            </div>

            <div className="flex flex-wrap items-stretch gap-2.5 pt-1">
              {easyStage.slots.map((slot, idx) => {
                const placedId = easyTraySlots[idx];
                const placedBlock = placedId ? easyBlockById.get(placedId) ?? null : null;
                const isSelectedSlot = easySelectedSlot === idx;

                return (
                  <div
                    key={slot.slotNumber}
                    data-testid={`easy-slot-${slot.slotNumber}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnSlot(e, idx)}
                    className={cn(
                      "flex min-w-[96px] flex-1 flex-col justify-between gap-1.5 rounded-md border p-2 transition-colors sm:min-w-[132px] sm:flex-initial sm:p-2.5",
                      placedBlock
                        ? "border-sky-400/70 bg-sky-500/15"
                        : "border-dashed border-sky-500/40 bg-background/50",
                      isSelectedSlot && "ring-2 ring-sky-300",
                    )}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {slot.label}
                    </span>
                    {placedBlock ? (
                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          draggable={!solved}
                          onDragStart={(e) => handleDragStartTray(e, idx, placedBlock)}
                          onClick={() => handleTapTraySlot(idx)}
                          className="rounded border border-sky-300/60 bg-sky-500/25 px-2.5 py-1 font-mono text-sm font-semibold text-sky-100 hover:border-sky-200"
                        >
                          {placedBlock.token}
                        </button>
                        {!solved ? (
                          <div className="flex items-center gap-0.5">
                            {idx > 0 ? (
                              <button
                                type="button"
                                aria-label={`Move ${placedBlock.token} left`}
                                onClick={() => handleMoveTrayBlock(idx, idx - 1)}
                                className="rounded p-1 text-sky-300/80 hover:bg-sky-500/20 hover:text-sky-100"
                              >
                                <ArrowLeft className="h-3 w-3" aria-hidden />
                              </button>
                            ) : null}
                            {idx < easyStage.slots.length - 1 ? (
                              <button
                                type="button"
                                aria-label={`Move ${placedBlock.token} right`}
                                onClick={() => handleMoveTrayBlock(idx, idx + 1)}
                                className="rounded p-1 text-sky-300/80 hover:bg-sky-500/20 hover:text-sky-100"
                              >
                                <ArrowRight className="h-3 w-3" aria-hidden />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              aria-label={`Remove ${placedBlock.token}`}
                              onClick={() => handleRemoveTrayBlock(idx)}
                              className="rounded p-1 text-muted-foreground hover:bg-red-500/20 hover:text-red-300"
                            >
                              <X className="h-3 w-3" aria-hidden />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={solved}
                        onClick={() => handleTapTraySlot(idx)}
                        className="rounded border border-dashed border-sky-500/30 px-2.5 py-1 text-left font-mono text-xs text-muted-foreground hover:border-sky-400/60 hover:text-sky-200"
                      >
                        empty slot
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Word blocks bank */}
          <div data-testid="easy-word-bank" aria-label="Word blocks" className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Available word blocks
            </p>
            <div className="flex flex-wrap gap-2">
              {easyStage.bankOrder.map((blockId) => {
                const block = easyBlockById.get(blockId);
                if (!block) return null;
                const inTray = easyPlacedSet.has(block.id);
                if (inTray) {
                  return (
                    <span
                      key={block.id}
                      aria-hidden="true"
                      className="inline-flex items-center rounded-md border border-dashed border-border/60 bg-background/30 px-3 py-2 font-mono text-sm text-muted-foreground/45"
                    >
                      {block.token}
                    </span>
                  );
                }
                return (
                  <button
                    key={block.id}
                    type="button"
                    draggable={!solved}
                    onDragStart={(e) => handleDragStartBank(e, block)}
                    onClick={() => handleTapBankBlock(block)}
                    className={cn(
                      "inline-flex items-center rounded-md border px-3.5 py-2 font-mono text-sm font-medium transition-colors",
                      inspectedEasyBlock?.id === block.id
                        ? "border-sky-300 bg-sky-500/25 text-sky-100 shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                        : "border-sky-400/60 bg-sky-500/10 text-sky-200 hover:border-sky-300 hover:bg-sky-500/20 hover:text-white",
                    )}
                  >
                    {block.token}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Run & Clear controls */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              disabled={solved}
              onClick={runEasyBuiltCommand}
              className="inline-flex items-center gap-2 rounded-md border border-sky-400 bg-sky-500/25 px-4 py-2 font-mono text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-500/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4" aria-hidden />
              Run
            </button>
            <button
              type="button"
              disabled={solved || easyPlacedSet.size === 0}
              onClick={handleClearEasyTray}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-xs text-muted-foreground hover:border-sky-400/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
            >
              Clear tray
            </button>
          </div>
        </section>
      ) : null}

      {/* Medium Coach Walkthrough Card (Green) */}
      {isMedium ? (
        <section
          aria-label="Medium coach walkthrough"
          className="rounded-lg border border-emerald-500/50 bg-emerald-950/20 p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-emerald-300">
                Coach walkthrough
              </span>
              <span
                data-testid="medium-status-badge"
                data-medium-status={currentMediumStatus}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 font-mono text-[11px]",
                  statusColorClasses(currentMediumStatus, false),
                )}
              >
                {mediumStatusLabel(currentMediumStatus)}
              </span>
              {mediumPlan.stages.length > 1 ? (
                <span
                  data-testid="medium-stage-badge"
                  className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-200"
                >
                  Command {mediumStageIndex + 1} of {mediumPlan.stages.length}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void speak(`coach:medium:${job.id}:look`, mediumPlan.whereToLook)}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 px-2.5 py-1 font-mono text-xs text-emerald-300/90 hover:border-emerald-400 hover:text-emerald-200"
              >
                <Volume2 className="h-3.5 w-3.5" aria-hidden />
                Where to look
              </button>
              <button
                type="button"
                onClick={() =>
                  void speak(
                    `coach:medium:${job.id}${mediumStagePrefix}:step-${activeMediumStep.stepNumber}`,
                    activeMediumStep.walkthrough,
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 px-2.5 py-1 font-mono text-xs text-emerald-300/90 hover:border-emerald-400 hover:text-emerald-200"
              >
                <Volume2 className="h-3.5 w-3.5" aria-hidden />
                Hear step {activeMediumStep.stepNumber}
              </button>
            </div>
          </div>

          <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">{mediumPlan.whereToLook}</p>

          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {mediumStage.steps.map((step) => {
              const stepDone = solved || input.length >= step.end;
              const stepCurrent = !solved && activeMediumStep.stepNumber === step.stepNumber;
              return (
                <li
                  key={step.stepNumber}
                  className={cn(
                    "rounded-md border p-3 transition-colors",
                    stepDone
                      ? "border-emerald-400/60 bg-emerald-500/10"
                      : stepCurrent
                        ? "border-purple-400/70 bg-purple-500/10"
                        : "border-border/70 bg-background/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "font-mono text-xs font-semibold",
                        stepDone ? "text-emerald-300" : stepCurrent ? "text-purple-300" : "text-muted-foreground",
                      )}
                    >
                      {step.partLabel}
                    </span>
                    {stepDone ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden /> : null}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/85">{step.walkthrough}</p>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {/* Terminal */}
      <div
        ref={scrollRef}
        onClick={() => {
          if (!isLockedView && !isEasy) inputRef.current?.focus();
        }}
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
        className={cn(
          "w-full min-w-0 max-w-full overflow-x-hidden overflow-y-auto rounded-lg border border-border bg-background p-3 font-mono text-xs leading-relaxed sm:p-5 sm:text-sm",
          terminalFocus
            ? "h-[54vh] min-h-[260px]"
            : isEasy
              ? "h-[28vh] min-h-[175px]"
              : "h-[36vh] min-h-[210px] sm:h-[46vh] sm:min-h-[280px]",
        )}
      >
        {lines.map((line) => (
          <p
            key={line.id}
            className={cn(
              "whitespace-pre-wrap break-words",
              line.kind === "input" ? "text-foreground" : line.kind === "error" ? "text-danger" : "text-phosphor/90",
            )}
          >
            {line.text}
          </p>
        ))}
      </div>

      {feedback.tone !== "idle" ? (
        <div
          role="status"
          className={cn(
            "flex items-start gap-3 rounded-lg border px-4 py-3",
            feedback.tone === "success"
              ? isEasy || isMedium
                ? "border-emerald-400/70 bg-emerald-500/10"
                : "border-phosphor/60 bg-phosphor/[0.07]"
              : (isMedium && currentMediumStatus === "hint-used") || (isEasy && currentEasyStatus === "hint-used")
                ? "border-yellow-400/70 bg-yellow-500/10"
                : (isMedium && currentMediumStatus === "failed") || (isEasy && currentEasyStatus === "failed")
                  ? "animate-pulse border-red-500/80 bg-red-500/15"
                  : "border-lime/50 bg-lime/[0.06]",
          )}
        >
          {feedback.tone === "success" || (isEasy && solved) ? (
            <CheckCircle2
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                isEasy && currentEasyStatus === "hint-used"
                  ? "text-yellow-300"
                  : isEasy || isMedium
                    ? "text-emerald-400"
                    : "text-phosphor",
              )}
              aria-hidden
            />
          ) : (
            <XCircle
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                (isMedium && currentMediumStatus === "hint-used") || (isEasy && currentEasyStatus === "hint-used")
                  ? "text-yellow-300"
                  : (isMedium && currentMediumStatus === "failed") || (isEasy && currentEasyStatus === "failed")
                    ? "text-red-400"
                    : "text-lime",
              )}
              aria-hidden
            />
          )}
          <p
            className={cn(
              "font-mono text-sm",
              feedback.tone === "success"
                ? isEasy || isMedium
                  ? "text-emerald-300"
                  : "text-phosphor"
                : (isMedium && currentMediumStatus === "hint-used") || (isEasy && currentEasyStatus === "hint-used")
                  ? "text-yellow-200"
                  : (isMedium && currentMediumStatus === "failed") || (isEasy && currentEasyStatus === "failed")
                    ? "text-red-300"
                    : "text-lime",
            )}
          >
            {feedback.tone === "success" || (isEasy && solved) ? "✓ " : ""}
            {feedback.message}
          </p>
        </div>
      ) : null}

      {/* Proof checklist, once solved */}
      {solved ? (
        <section
          aria-label="Proof checks"
          className={cn(
            "rounded-lg border p-5",
            (isMedium && currentMediumStatus === "passed") || (isEasy && currentEasyStatus === "passed")
              ? "border-emerald-400/70 bg-emerald-500/10"
              : (isMedium && currentMediumStatus === "hint-used") || (isEasy && currentEasyStatus === "hint-used")
                ? "border-yellow-400/70 bg-yellow-500/10"
                : "border-phosphor/60 bg-phosphor/[0.05]",
          )}
        >
          <h2 className="font-mono text-sm font-semibold text-foreground">
            {isEasy ? "Easy word-block check" : isMedium ? "Medium practice check" : "Proof — all three must be true"}
          </h2>
          {isEasy ? (
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                {job.proof[0]}
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                <CheckCircle2
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    currentEasyStatus === "hint-used" ? "text-yellow-300" : "text-emerald-400",
                  )}
                  aria-hidden
                />
                {currentEasyStatus === "hint-used"
                  ? "Hint used (shown yellow) — hints are welcome in Easy, so this job still counts as an Easy pass."
                  : "Built from word blocks and passed on the real machine — counts as an Easy pass."}
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                No three-day lock and no typing needed in Easy — step up to Medium when you want to type over the shadow.
              </li>
              {job.rebootCheck ? (
                <li className="flex items-start gap-2 text-sm text-foreground/85">
                  {rebootPassed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" aria-hidden />
                  )}
                  The fix survives a reboot{rebootPassed ? " — tested." : " — not tested yet. Press Test reboot."}
                </li>
              ) : null}
            </ul>
          ) : isMedium ? (
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                {job.proof[0]}
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                {coldPass ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" aria-hidden />
                )}
                {coldPass
                  ? "Typed over the shadow on your first try with zero hints — counts as a Medium pass."
                  : hintsShown > 0 || solutionShown
                    ? "Hint used — marked yellow, so it does not count as a Medium pass."
                    : "Not solved on your first try in this session — does not count as a Medium pass."}
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                No three-day lock in Medium — step up to Hard when you are ready to do it without the shadow.
              </li>
              {job.rebootCheck ? (
                <li className="flex items-start gap-2 text-sm text-foreground/85">
                  {rebootPassed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" aria-hidden />
                  )}
                  The fix survives a reboot{rebootPassed ? " — tested." : " — not tested yet. Press Test reboot."}
                </li>
              ) : null}
            </ul>
          ) : isExtreme ? (
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-phosphor" aria-hidden />
                {job.proof[0]}
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                {coldPass ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-phosphor" aria-hidden />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden />
                )}
                {coldPass
                  ? "Solved cold on your first try in this session — zero hints, no answer shown."
                  : "Not counted for Extreme — this was not your first clean cold try in this session."}
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                {extremeRoundOutcome === "completed" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-phosphor" aria-hidden />
                ) : (
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden />
                )}
                {extremeRoundOutcome === "completed"
                  ? "Cold retest passed three days later — proved cold twice (Extreme complete)."
                  : extremeRoundOutcome === "locked"
                    ? "Locked for three days — pass the cold retest in three days to complete Extreme."
                    : "Start a fresh session to earn a first-try cold pass and start the three-day clock."}
              </li>
              {job.rebootCheck ? (
                <li className="flex items-start gap-2 text-sm text-foreground/85">
                  {rebootPassed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-phosphor" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden />
                  )}
                  The fix survives a reboot{rebootPassed ? " — tested." : " — not tested yet. Press Test reboot."}
                </li>
              ) : null}
            </ul>
          ) : (
            <ul className="mt-3 space-y-2">
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-phosphor" aria-hidden />
                {job.proof[0]}
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                {coldPass ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-phosphor" aria-hidden />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden />
                )}
                {job.proof[1]}
                {coldPass ? " — yes, no hints, no solution shown." : " — not this round: hints were used or the solution was shown."}
              </li>
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-phosphor" aria-hidden />
                {job.proof[2]}
              </li>
              {job.rebootCheck ? (
                <li className="flex items-start gap-2 text-sm text-foreground/85">
                  {rebootPassed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-phosphor" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden />
                  )}
                  The fix survives a reboot{rebootPassed ? " — tested." : " — not tested yet. Press Test reboot."}
                </li>
              ) : null}
            </ul>
          )}
        </section>
      ) : null}

      {/* Input line — hidden in Easy mode (NO typing at all in Easy) */}
      {!isEasy ? (
        <div
          className={cn(
            "flex min-w-0 max-w-full items-center gap-2 rounded-lg border bg-card px-3 py-2.5 transition-colors sm:px-4 sm:py-3",
            isMedium ? "border-emerald-500/50" : "border-border",
          )}
        >
          <label htmlFor="coach-input" className={cn("shrink-0 font-mono text-xs sm:text-sm", isMedium ? "text-emerald-400" : "text-phosphor")}>
            {prompt}
          </label>
          <div className="relative min-w-0 flex-1 overflow-hidden">
            <input
              id="coach-input"
              ref={inputRef}
              value={input}
              disabled={isLockedView}
              placeholder={isLockedView ? "Locked until the three-day cold retest opens" : undefined}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="relative z-10 w-full bg-transparent font-mono text-xs text-foreground caret-phosphor outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:text-muted-foreground sm:text-sm"
            />
            {isMedium && !solved ? (
              <span
                data-testid="shadow-overlay"
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center whitespace-pre font-mono text-xs sm:text-sm"
              >
                <span className="invisible whitespace-pre">{input}</span>
                <span data-testid="shadow-remaining" className="whitespace-pre text-zinc-400/55">
                  {remainingShadow}
                </span>
              </span>
            ) : ghost ? (
              <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center whitespace-pre font-mono text-xs sm:text-sm">
                <span className="invisible whitespace-pre">{input}</span>
                <span className="whitespace-pre text-muted-foreground/60">{ghost}</span>
              </span>
            ) : null}
          </div>
          <span className="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:inline">
            {isLockedView
              ? "Locked for 3 days"
              : isMedium && !solved
                ? remainingShadow.length === 0
                  ? "Press Enter to run"
                  : "Type over the grey shadow"
                : "Tab completes · ↑ history"}
          </span>
        </div>
      ) : null}

      {/* Coach controls */}
      <div className="flex flex-wrap items-center gap-2">
        {!isExtreme ? (
          <PromptButton size="sm" brackets onClick={askHint} disabled={solved || hintsShown >= job.hints.length}>
            <Lightbulb className="h-3.5 w-3.5" aria-hidden />
            Hint {hintsShown > 0 ? `(${hintsShown}/${job.hints.length})` : ""}
          </PromptButton>
        ) : null}
        {job.rebootCheck && solved && !rebootPassed ? (
          <PromptButton size="sm" variant="outline" onClick={testReboot}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Test reboot
          </PromptButton>
        ) : null}
        {!isExtreme && !solved ? (
          <PromptButton size="sm" variant="ghost" onClick={showSolution}>
            Give up — show the solution
          </PromptButton>
        ) : null}
        {isExtreme && currentExtremeStatus === "locked" ? (
          nextUnlockedExtremeIndex !== null ? (
            <PromptButton size="sm" variant="outline" onClick={() => handleSelectJob(nextUnlockedExtremeIndex)}>
              Next unlocked job
            </PromptButton>
          ) : null
        ) : (
          <PromptButton size="sm" variant="ghost" onClick={handleRestartJob}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Start this job again
          </PromptButton>
        )}
        <p className="ml-auto font-mono text-xs text-muted-foreground">
          {isExtreme
            ? currentExtremeStatus === "locked"
              ? `Job ${jobIndex + 1} of ${COACH_JOBS.length} · locked for three days until cold retest`
              : currentExtremeStatus === "complete"
                ? `Job ${jobIndex + 1} of ${COACH_JOBS.length} · Extreme complete`
                : !sessionDisqualified[job.id]
                  ? `Job ${jobIndex + 1} of ${COACH_JOBS.length} · cold only · first try`
                  : `Job ${jobIndex + 1} of ${COACH_JOBS.length} · first try used in this session`
            : isEasy
              ? `Job ${jobIndex + 1} of ${COACH_JOBS.length} · ${easyStatusLabel(currentEasyStatus, easyProgress[job.id], solved)}`
              : isMedium
                ? `Job ${jobIndex + 1} of ${COACH_JOBS.length} · ${mediumStatusLabel(currentMediumStatus)}`
                : `Job ${jobIndex + 1} of ${COACH_JOBS.length} · ${hintsShown === 0 && !solutionShown ? "cold so far" : "help used — this round cannot be cold"}`}
        </p>
      </div>

      {!isExtreme && solutionShown && !solved ? (
        <p className="rounded-lg border border-border bg-card p-4 font-mono text-sm text-foreground/85">
          Solution: {job.solution}
        </p>
      ) : null}
    </div>
  );
}
