import {
  ArrowRight,
  Blocks,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Ear,
  Flame,
  Lock,
  RotateCcw,
  Volume2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

import { PromptButton } from "@/components/terminal/PromptButton";
import { ScanlineFrame } from "@/components/terminal/Scanlines";
import { COACH_JOBS, type CoachJob, prepareJobSession } from "@/data/coach-jobs";
import { EASY_PLANS, easyBlockSpeech, type EasyBlock, type EasyStagePlan } from "@/data/easy-coach";
import { MEDIUM_PLANS } from "@/data/medium-coach";
import { useCardAudio } from "@/hooks/useCardAudio";
import {
  advanceShadowTyping,
  didCommandBurnFirstTry,
  evaluateEasyAttempt,
  extremeJobStatus,
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
  hasPlayedIntroThisSession,
  markIntroPlayedThisSession,
  stopCoachEchoIntro,
  tryPlayCoachEchoIntro,
} from "@/lib/intro-audio";
import { saveActiveJobId } from "@/lib/mode-metrics";
import {
  completeCommand,
  completePath,
  getDefaultSession,
  parseCommand,
  runCommand,
} from "@/lib/terminal-engine";
import { cn } from "@/lib/utils";

const HOME = "/home/user";

const EASY_REBOOT_STAGE: EasyStagePlan = {
  target: "reboot",
  intro:
    "The fix is running now. Pick reboot and tap > to restart the machine and prove the website comes back up on its own.",
  passMessage: "It survived the reboot. The fix is real — the website is still up after a restart.",
  blocks: [
    {
      id: "reboot",
      token: "reboot",
      meaning: "restart the machine to prove the service comes back up at boot",
    },
  ],
  bankOrder: ["reboot"],
  slots: [
    {
      slotNumber: 1,
      label: "1. Restart command",
      expectedBlockId: "reboot",
      emptySlotHint: "Pick reboot first, then tap Run to restart the machine.",
      wrongOrderByBlockId: {},
    },
  ],
};

interface Line {
  id: number;
  kind: "input" | "output" | "error";
  text: string;
  isInstruction?: boolean;
}

type Feedback = { tone: "success" | "hint" | "idle"; message: string };
type ExtremeRoundOutcome = "none" | "locked" | "completed" | "not-counted" | "failed";

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
  const { activeKey, phase, speak, stop, toggle } = useCardAudio();
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

  // Easy mode dropdown word-builder state
  const [easyTraySlots, setEasyTraySlots] = useState<Array<string | null>>(() =>
    Array<string | null>(EASY_PLANS[COACH_JOBS[0].id].stages[0].slots.length).fill(null),
  );
  const [easyInspectedBlockId, setEasyInspectedBlockId] = useState<string | null>(null);
  const [easyBlocksTouched, setEasyBlocksTouched] = useState<boolean>(false);
  const [easyLastTryFailed, setEasyLastTryFailed] = useState<boolean>(false);

  const lineIdRef = useRef<number>(1);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isEasy = mode === "easy";
  const isMedium = mode === "medium";
  const isHard = mode === "hard";
  const isExtreme = mode === "extreme";
  const job: CoachJob = COACH_JOBS[jobIndex];
  const mediumPlan = MEDIUM_PLANS[job.id];
  const mediumStage = mediumPlan.stages[Math.min(mediumStageIndex, mediumPlan.stages.length - 1)];
  const mediumStagePrefix = mediumStageIndex > 0 ? `:s${mediumStageIndex + 1}` : "";
  const easyPlan = EASY_PLANS[job.id];
  const easyStage = easyPlan.stages[Math.min(easyStageIndex, easyPlan.stages.length - 1)];
  const easyStagePrefix = easyStageIndex > 0 ? `:s${easyStageIndex + 1}` : "";
  const isEasyAwaitingReboot = isEasy && solved && job.rebootCheck && !rebootPassed;
  const easyInputDisabled = solved && !isEasyAwaitingReboot;
  const activeEasyStage = isEasyAwaitingReboot ? EASY_REBOOT_STAGE : easyStage;

  const easyBlockById = useMemo(
    () => new Map<string, EasyBlock>(activeEasyStage.blocks.map((b) => [b.id, b])),
    [activeEasyStage],
  );
  const inspectedEasyBlock = easyInspectedBlockId ? easyBlockById.get(easyInspectedBlockId) ?? null : null;

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
      setEasyBlocksTouched(false);
      setEasyLastTryFailed(false);
      saveActiveJobId(next.id);

      if (targetMode === "extreme" && nextExtremeStatus === "locked") {
        const waitWords = lockRemainingWords(nextExtremeRecord?.nextRetestAt ?? null);
        setLines([
          { id: lineIdRef.current++, kind: "output", text: `Job ${index + 1} of ${COACH_JOBS.length}: ${next.title}` },
          { id: lineIdRef.current++, kind: "output", text: next.job, isInstruction: true },
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
              ? "Easy word blocks: pick each word in order to learn what it means, then press > to run it."
              : "The coach points. It never gives you the command.";

      const initialLines: Line[] = [
        { id: lineIdRef.current++, kind: "output", text: `Job ${index + 1} of ${COACH_JOBS.length}: ${next.title}` },
        { id: lineIdRef.current++, kind: "output", text: next.job, isInstruction: true },
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
      if (targetMode !== "easy") {
        inputRef.current?.focus();
      }
    },
    [extremeProgress, mode],
  );

  const handleSelectJob = useCallback(
    (index: number): void => {
      stop();
      if (isExtreme && !solved && roundStarted) {
        burnExtremeTry(job.id);
      }
      if (isMedium && !solved && roundStarted) {
        burnMediumTry(job.id);
      }
      startJob(index, mode);
    },
    [burnExtremeTry, burnMediumTry, isExtreme, isMedium, job.id, mode, roundStarted, solved, startJob, stop],
  );

  const handleRestartJob = useCallback((): void => {
    stop();
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
    stop,
  ]);

  const handleSelectMode = useCallback(
    (nextMode: ActiveCoachMode): void => {
      if (nextMode === mode) return;
      stop();
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
    [burnExtremeTry, burnMediumTry, job.id, jobIndex, mode, roundStarted, solved, startJob, stop],
  );

  const stopRef = useRef(stop);
  stopRef.current = stop;

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

  const verifyRebootSurvival = useCallback(
    (afterCwd: string): void => {
      const stillDone = job.checkState ? job.checkState(getDefaultSession(), afterCwd) : false;
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
        setFeedback({
          tone: "success",
          message: "It survived the reboot. The fix is real — the website is still up after a restart.",
        });
      } else {
        setRebootPassed(false);
        if (isExtreme) {
          burnExtremeTry(job.id);
          setExtremeRoundOutcome("failed");
        } else if (isMedium) {
          setMediumRoundFailed(true);
          burnMediumTry(job.id);
        }
        setFeedback({
          tone: "hint",
          message:
            "After the reboot the job is undone. The fix only lasted until the restart — it needs to start at boot, not just now.",
        });
      }
    },
    [burnExtremeTry, burnMediumTry, isEasy, isExtreme, isMedium, job],
  );

  // ---------------------------------------------------------------------------
  // Easy mode dropdown interactions (pick per slot, tap/speaker meaning, Run >)
  // ---------------------------------------------------------------------------

  const inspectEasyBlock = useCallback(
    (block: EasyBlock): void => {
      setEasyInspectedBlockId(block.id);
      const stagePrefix = isEasyAwaitingReboot ? ":reboot" : easyStagePrefix;
      void speak(`coach:easy:${job.id}${stagePrefix}:block-${block.id}`, easyBlockSpeech(block));
    },
    [easyStagePrefix, isEasyAwaitingReboot, job.id, speak],
  );

  const handleSelectSlotWord = useCallback(
    (slotIndex: number, nextBlockId: string): void => {
      if (easyInputDisabled) return;
      const chosenId = nextBlockId || null;
      if (!solved) {
        setEasyBlocksTouched(true);
        setEasyLastTryFailed(false);
        if (feedback.tone === "hint" && hintsShown === 0 && !solutionShown) {
          setFeedback({ tone: "idle", message: "" });
        }
      }

      setEasyTraySlots((current) => {
        const next = [...current];
        if (chosenId) {
          for (let i = 0; i < next.length; i += 1) {
            if (i !== slotIndex && next[i] === chosenId) {
              next[i] = null;
            }
          }
        }
        next[slotIndex] = chosenId;
        return next;
      });

      if (chosenId) {
        const block = easyBlockById.get(chosenId);
        if (block) {
          inspectEasyBlock(block);
        }
      }
    },
    [easyBlockById, easyInputDisabled, feedback.tone, hintsShown, inspectEasyBlock, solutionShown, solved],
  );

  const runEasyBuiltCommand = useCallback((): void => {
    if (easyInputDisabled) return;

    if (isEasyAwaitingReboot) {
      const rebootEval = evaluateEasyAttempt(EASY_REBOOT_STAGE, easyTraySlots, {
        jobId: job.id,
        stageIndex: easyPlan.stages.length,
      });
      if (!rebootEval.ok) {
        setFeedback({ tone: "hint", message: rebootEval.coachMessage });
        void speak(rebootEval.audioKey, rebootEval.coachMessage);
        return;
      }
      const promptStr = `user@coach:${cwd === HOME ? "~" : cwd}$`;
      pushLines([{ kind: "input", text: `${promptStr} ${rebootEval.command}` }]);
      const result = runCommand(rebootEval.command, cwd);
      if (result.output.length) {
        pushLines(
          result.output.map((text) => ({
            kind: result.unknown ? ("error" as const) : ("output" as const),
            text,
          })),
        );
      }
      setCwd(result.cwd);
      verifyRebootSurvival(result.cwd);
      return;
    }

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
      if (job.rebootCheck) {
        setEasyTraySlots(Array<string | null>(EASY_REBOOT_STAGE.slots.length).fill(null));
        setEasyInspectedBlockId(null);
      }

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

      const rebootSuffix = job.rebootCheck
        ? " Pick reboot in the word blocks below and tap Run to watch the fix survive a restart."
        : "";
      setFeedback({
        tone: usedHelp ? "hint" : "success",
        message: usedHelp
          ? `${evaluation.coachMessage} Hint used — marked yellow on this job, and it still counts as an Easy pass.${rebootSuffix}`
          : `${evaluation.coachMessage}${rebootSuffix}`,
      });
      void speak(evaluation.audioKey, evaluation.coachMessage);
    }
  }, [
    cwd,
    easyInputDisabled,
    easyPlan.stages,
    easyStage,
    easyStageIndex,
    easyTraySlots,
    hintsShown,
    isEasyAwaitingReboot,
    job,
    pushLines,
    solutionShown,
    speak,
    verifyRebootSurvival,
  ]);

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

    const parsed = parseCommand(raw);
    if (solved) {
      if (job.rebootCheck && parsed.name === "reboot" && result.exitCode === 0) {
        verifyRebootSurvival(result.cwd);
      }
      return;
    }
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
              ? "Medium pass — you typed the whole shadow command on your first try with zero hints, and the service is up. Type reboot in the terminal to watch it survive a restart."
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
              ? "Cold retest passed on your first try — Extreme complete. Type reboot in the terminal to watch the fix survive a restart."
              : "Cold retest passed on your first try. You proved this job cold twice, three days apart — Extreme complete.",
          });
        } else {
          setExtremeRoundOutcome("locked");
          setFeedback({
            tone: "success",
            message: job.rebootCheck
              ? "Passed cold on your first try. This job is now locked for three days until its cold retest. Type reboot in the terminal to watch the fix survive a restart."
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

    // Hard mode
    if (didSolve) {
      setSolved(true);
      const rebootOk = !job.rebootCheck;
      setRebootPassed(rebootOk);
      if (!roundRecorded) recordHardSolvedRound(rebootOk);
      setFeedback({
        tone: "success",
        message: job.rebootCheck
          ? "The website is back up — and the machine says so, not the coach. Now prove it survives a reboot: type reboot in the terminal."
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
    verifyRebootSurvival,
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
  const jobInstructionAudioKey = `coach:${job.id}:job`;
  const isJobInstructionPlaying = activeKey === jobInstructionAudioKey && phase !== "idle";
  const easyGuideAudioKey = isEasyAwaitingReboot
    ? `coach:easy:${job.id}:reboot-intro`
    : `coach:easy:${job.id}${easyStagePrefix}:intro`;
  const isEasyGuidePlaying = activeKey === easyGuideAudioKey && phase !== "idle";

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
                Coach Echo — Over Your Shoulder
              </h1>
              <p className="truncate font-mono text-[11px] text-muted-foreground sm:text-xs">
                {isExtreme
                  ? "Extreme: cold only, first try in this session, then a cold retest three days later."
                  : isMedium
                    ? "Medium: shadow typing + plain-words walkthrough. Type every character yourself, then run it."
                    : isEasy
                      ? "Easy: pick each word in order to learn what it means and build the command."
                      : "No points, no streaks, no leaderboard. The only score is what you can do cold."}
              </p>
            </div>
          </div>
          {!isEasy && !isExtreme ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                data-testid="hint-button"
                aria-label={hintsShown > 0 ? `Hint (${hintsShown}/${job.hints.length})` : "Hint"}
                disabled={solved || hintsShown >= job.hints.length}
                onClick={askHint}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-phosphor/50 hover:text-phosphor disabled:cursor-not-allowed disabled:opacity-45"
              >
                <CircleHelp className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : null}
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
                onClick={() => toggle(`coach:medium:${job.id}:look`, mediumPlan.whereToLook)}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 px-2.5 py-1 font-mono text-xs text-emerald-300/90 hover:border-emerald-400 hover:text-emerald-200"
              >
                <Volume2 className="h-3.5 w-3.5" aria-hidden />
                Where to look
              </button>
              <button
                type="button"
                onClick={() =>
                  toggle(
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
        {lines.map((line) =>
          line.isInstruction ? (
            <div key={line.id} className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-phosphor/90">{line.text}</p>
              <button
                type="button"
                data-testid="hear-instructions-button"
                aria-label="Hear instructions"
                aria-pressed={isJobInstructionPlaying}
                onClick={(event) => {
                  event.stopPropagation();
                  toggle(jobInstructionAudioKey, job.job);
                }}
                className={cn(
                  "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                  isJobInstructionPlaying
                    ? "border-phosphor bg-phosphor/15 text-phosphor"
                    : "border-border/80 bg-card/70 text-muted-foreground hover:border-phosphor/50 hover:text-phosphor",
                )}
              >
                <Volume2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ) : (
            <p
              key={line.id}
              className={cn(
                "whitespace-pre-wrap break-words",
                line.kind === "input" ? "text-foreground" : line.kind === "error" ? "text-danger" : "text-phosphor/90",
              )}
            >
              {line.text}
            </p>
          ),
        )}
      </div>

      {/* Easy Word Blocks (Blue cold storage — dropdowns + '>' Run icon) */}
      {isEasy ? (
        <section
          aria-label="Easy word block builder"
          className="space-y-3 rounded-lg border border-sky-500/50 bg-sky-950/20 p-3.5 sm:space-y-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
                WORD BLOCKS
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
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                data-testid="hear-guide-button"
                aria-label="Hear guide"
                aria-pressed={isEasyGuidePlaying}
                onClick={() => toggle(easyGuideAudioKey, activeEasyStage.intro)}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
                  isEasyGuidePlaying
                    ? "border-sky-400 bg-sky-500/20 text-sky-200"
                    : "border-sky-500/40 text-sky-300/90 hover:border-sky-400 hover:text-sky-200",
                )}
              >
                <Volume2 className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                data-testid="hint-button"
                aria-label={hintsShown > 0 ? `Hint (${hintsShown}/${job.hints.length})` : "Hint"}
                disabled={solved || hintsShown >= job.hints.length}
                onClick={askHint}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-500/40 text-sky-300/90 transition-colors hover:border-sky-400 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <CircleHelp className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-foreground/90 sm:text-sm">{activeEasyStage.intro}</p>

          {/* Plain-words meaning panel — updates whenever a word is picked or tapped */}
          <div
            data-testid="easy-block-meaning"
            className="rounded-md border border-sky-400/40 bg-background/60 px-3.5 py-2.5"
          >
            {inspectedEasyBlock ? (
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="rounded border border-sky-400/60 bg-sky-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-sky-200 sm:text-sm">
                  {inspectedEasyBlock.token}
                </span>
                <span className="font-mono text-xs text-muted-foreground">=</span>
                <span className="text-xs text-foreground sm:text-sm">{inspectedEasyBlock.meaning}</span>
              </div>
            ) : (
              <p className="font-mono text-xs text-muted-foreground">
                Pick or tap a chosen word to hear what it means in plain words.
              </p>
            )}
          </div>

          {/* Dropdown command row + '>' Run icon button */}
          <div
            data-testid="easy-command-tray"
            aria-label="Command tray"
            className="flex flex-wrap items-center gap-2 rounded-md border border-sky-500/35 bg-background/70 p-3"
          >
            <span className="shrink-0 font-mono text-xs text-sky-300">{prompt}</span>
            {activeEasyStage.slots.map((slot, idx) => {
              const placedId = easyTraySlots[idx];
              const placedBlock = placedId ? easyBlockById.get(placedId) ?? null : null;
              const takenElsewhere = new Set(
                easyTraySlots.filter((id, otherIdx): id is string => Boolean(id) && otherIdx !== idx),
              );
              const availableBlocks = activeEasyStage.bankOrder
                .filter((id) => !takenElsewhere.has(id))
                .map((id) => easyBlockById.get(id))
                .filter((b): b is EasyBlock => Boolean(b));

              return (
                <select
                  key={slot.slotNumber}
                  data-testid={`easy-slot-${slot.slotNumber}`}
                  aria-label={slot.label}
                  value={placedId ?? ""}
                  disabled={easyInputDisabled}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => handleSelectSlotWord(idx, e.target.value)}
                  onClick={() => {
                    if (placedBlock) {
                      inspectEasyBlock(placedBlock);
                    }
                  }}
                  className={cn(
                    "h-9 min-w-[92px] max-w-full flex-1 rounded-md border px-2.5 font-mono text-xs transition-colors focus:border-sky-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[120px] sm:flex-initial sm:text-sm",
                    placedBlock
                      ? "border-sky-400/75 bg-sky-950/90 font-semibold text-sky-100"
                      : "border-dashed border-sky-500/45 bg-background text-muted-foreground",
                  )}
                >
                  <option value="">{slot.label}</option>
                  {availableBlocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.token}
                    </option>
                  ))}
                </select>
              );
            })}
            <button
              type="button"
              aria-label="Run"
              data-testid="easy-run-button"
              disabled={easyInputDisabled}
              onClick={runEasyBuiltCommand}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-sky-400 bg-sky-500/25 text-sky-100 transition-colors hover:bg-sky-500/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </section>
      ) : null}

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

      {/* Proof checklist, once solved (Medium / Hard / Extreme only) */}
      {solved && !isEasy ? (
        <section
          aria-label="Proof checks"
          className={cn(
            "rounded-lg border p-5",
            isMedium && currentMediumStatus === "passed"
              ? "border-emerald-400/70 bg-emerald-500/10"
              : isMedium && currentMediumStatus === "hint-used"
                ? "border-yellow-400/70 bg-yellow-500/10"
                : "border-phosphor/60 bg-phosphor/[0.05]",
          )}
        >
          <h2 className="font-mono text-sm font-semibold text-foreground">
            {isMedium
              ? "Medium practice check"
              : job.rebootCheck
                ? "Proof — all four must be true"
                : "Proof — all three must be true"}
          </h2>
          {isMedium ? (
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
              {job.rebootCheck ? (
                <li className="flex items-start gap-2 text-sm text-foreground/85">
                  {rebootPassed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" aria-hidden />
                  )}
                  The fix survives a reboot
                  {rebootPassed ? " — tested." : " — not tested yet. Type reboot in the terminal."}
                </li>
              ) : null}
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                No three-day lock in Medium — step up to Hard when you are ready to do it without the shadow.
              </li>
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
              {job.rebootCheck ? (
                <li className="flex items-start gap-2 text-sm text-foreground/85">
                  {rebootPassed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-phosphor" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden />
                  )}
                  The fix survives a reboot
                  {rebootPassed ? " — tested." : " — not tested yet. Type reboot in the terminal."}
                </li>
              ) : null}
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
              {job.rebootCheck ? (
                <li className="flex items-start gap-2 text-sm text-foreground/85">
                  {rebootPassed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-phosphor" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden />
                  )}
                  The fix survives a reboot
                  {rebootPassed ? " — tested." : " — not tested yet. Type reboot in the terminal."}
                </li>
              ) : null}
              <li className="flex items-start gap-2 text-sm text-foreground/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-phosphor" aria-hidden />
                {job.proof[2]}
              </li>
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

      {/* Bottom next-job navigation */}
      <div className="border-t border-border/60 pt-2.5">
        {jobIndex < COACH_JOBS.length - 1 ? (
          <button
            type="button"
            data-testid="next-job-button"
            onClick={() => handleSelectJob(jobIndex + 1)}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-left font-mono text-xs text-foreground transition-colors hover:border-phosphor/50 hover:text-phosphor sm:px-4 sm:text-sm"
          >
            <span className="truncate">{COACH_JOBS[jobIndex + 1].title}</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        ) : (
          <p
            data-testid="all-jobs-done"
            className="rounded-lg border border-border/60 bg-card/60 px-3.5 py-2.5 text-center font-mono text-xs text-muted-foreground sm:px-4 sm:text-sm"
          >
            All jobs done
          </p>
        )}
      </div>
    </div>
  );
}
