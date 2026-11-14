import {
  fisherYatesShuffle,
  FLASHCARDS,
  getFlashcardsByCategory,
  type FlashcardEntry,
} from "@/data/flashcards";

export const EXAM_QUESTION_COUNT = 20;
export const EXAM_PASS_PERCENT = 80;

export const EXAM_SCOPES = [
  "all",
  "cat-1",
  "cat-2",
  "cat-3",
  "cat-4",
  "cat-5",
  "cat-6",
  "cat-7",
  "cat-8",
] as const;

export type ExamScopeId = (typeof EXAM_SCOPES)[number];

export const TOTAL_EXAMS = EXAM_SCOPES.length;

const VALID_EXAM_SCOPES = new Set<string>(EXAM_SCOPES);

export function isValidExamScopeId(raw: string): raw is ExamScopeId {
  const clean = raw.startsWith("exam:") ? raw.slice(5) : raw;
  return VALID_EXAM_SCOPES.has(clean);
}

export function toExamProgressKey(scopeId: string): string {
  const clean = scopeId.startsWith("exam:") ? scopeId.slice(5) : scopeId;
  return `exam:${clean}`;
}

export function fromExamProgressKey(key: string): ExamScopeId | null {
  const clean = key.startsWith("exam:") ? key.slice(5) : key;
  return isValidExamScopeId(clean) ? clean : null;
}

export type ExamQuestionMode = "recall" | "mc";

export interface ExamQuestion {
  /** 0-based index within the exam (0 .. questions.length - 1). */
  index: number;
  /** Underlying LinuxDeck flashcard. */
  card: FlashcardEntry;
  /** Question mode: "recall" (Terminal Recall) or "mc" (Multiple Choice). */
  mode: ExamQuestionMode;
  /** Plain-words description shown as the question stem. */
  prompt: string;
  /** Expected command answer. */
  correctCommand: string;
  /** 4 real command options for Multiple Choice (empty array for Recall). */
  options: string[];
}

/**
 * Normalize a command for Terminal Recall matching:
 * - Trim leading/trailing whitespace
 * - Collapse multiple spaces into a single space
 * - Preserve exact case (case-sensitive like a real terminal)
 */
export function normalizeRecallCommand(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * Check whether a user's Terminal Recall answer matches the expected command:
 * exact command match, extra spaces ignored, case-sensitive.
 */
export function isRecallAnswerCorrect(userAnswer: string, expectedCommand: string): boolean {
  const normalizedUser = normalizeRecallCommand(userAnswer);
  const normalizedExpected = normalizeRecallCommand(expectedCommand);
  if (!normalizedUser || !normalizedExpected) return false;
  return normalizedUser === normalizedExpected;
}

/**
 * Generate 4 Multiple Choice command options for a flashcard:
 * - Always includes the card's exact command (`card.command`)
 * - Picks 3 distinct distractor commands from the same category where possible
 *   (falling back to other LinuxDeck cards only if a custom pool has < 4 commands)
 * - Shuffles the 4 options with Fisher-Yates
 */
export function generateMcOptions(
  card: FlashcardEntry,
  pool: readonly FlashcardEntry[] = FLASHCARDS,
  rng: () => number = Math.random,
): string[] {
  const targetCmd = card.command;
  const seen = new Set<string>([targetCmd]);
  const sameCategoryCmds: string[] = [];

  for (const candidate of pool) {
    if (candidate.categoryId === card.categoryId && !seen.has(candidate.command)) {
      seen.add(candidate.command);
      sameCategoryCmds.push(candidate.command);
    }
  }

  const distractors = fisherYatesShuffle(sameCategoryCmds, rng).slice(0, 3);

  if (distractors.length < 3) {
    const fallbackCmds: string[] = [];
    for (const candidate of FLASHCARDS) {
      if (!seen.has(candidate.command)) {
        seen.add(candidate.command);
        fallbackCmds.push(candidate.command);
      }
    }
    for (const cmd of fisherYatesShuffle(fallbackCmds, rng)) {
      if (distractors.length >= 3) break;
      distractors.push(cmd);
    }
  }

  return fisherYatesShuffle([targetCmd, ...distractors], rng);
}

export interface BuildExamOptions {
  /** Category ID ("all" or "cat-1" .. "cat-8"). Defaults to "all". */
  categoryId?: string | null;
  /** Missed flashcard IDs from previous exam attempts — prioritized into the pool first. */
  missedCardIds?: ReadonlySet<string> | readonly string[];
  /** Maximum questions in the exam (defaults to 20, capped at category card count). */
  questionCount?: number;
  /** Optional RNG for deterministic tests. */
  rng?: () => number;
}

/**
 * Build a shuffled exam from the 187 LinuxDeck flashcards (or a category's cards):
 * - 20 questions per exam (or all cards in the category if fewer than 20)
 * - Missed questions from `missedCardIds` go into the next exam's pool first
 * - Mixed modes: half Terminal Recall ("recall"), half Multiple Choice ("mc")
 * - Shuffled with Fisher-Yates, zero duplicate cards within an exam
 */
export function buildExamQuestions(options: BuildExamOptions = {}): ExamQuestion[] {
  const {
    categoryId = "all",
    missedCardIds,
    questionCount = EXAM_QUESTION_COUNT,
    rng = Math.random,
  } = options;

  const categoryPool = getFlashcardsByCategory(categoryId);
  const targetCount = Math.min(Math.max(1, questionCount), categoryPool.length);
  if (targetCount === 0) return [];

  const missedSet =
    missedCardIds instanceof Set ? missedCardIds : new Set(missedCardIds ?? []);

  const missedPool = categoryPool.filter((c) => missedSet.has(c.id));
  const remainingPool = categoryPool.filter((c) => !missedSet.has(c.id));

  const prioritizedCards = [
    ...fisherYatesShuffle(missedPool, rng),
    ...fisherYatesShuffle(remainingPool, rng),
  ].slice(0, targetCount);

  const orderedCards = fisherYatesShuffle(prioritizedCards, rng);

  const recallCount = Math.floor(targetCount / 2);
  const mcCount = targetCount - recallCount;
  const rawModes: ExamQuestionMode[] = [
    ...Array.from({ length: recallCount }, (): ExamQuestionMode => "recall"),
    ...Array.from({ length: mcCount }, (): ExamQuestionMode => "mc"),
  ];
  const modes = fisherYatesShuffle(rawModes, rng);

  return orderedCards.map((card, index) => {
    const mode = modes[index] ?? "mc";
    return {
      index,
      card,
      mode,
      prompt: card.description,
      correctCommand: card.command,
      options: mode === "mc" ? generateMcOptions(card, categoryPool, rng) : [],
    };
  });
}

/**
 * Pass threshold is 80% or better (e.g. 16/20 on a 20-question exam).
 */
export function isExamPassed(score: number, total: number): boolean {
  if (total <= 0) return false;
  return score * 100 >= total * EXAM_PASS_PERCENT;
}

export interface ExamQuestionResult {
  question: ExamQuestion;
  userAnswer: string;
  correct: boolean;
}

export interface ExamResultSummary {
  scopeId: ExamScopeId;
  score: number;
  total: number;
  percent: number;
  passed: boolean;
  results: ExamQuestionResult[];
  missedQuestions: ExamQuestionResult[];
  missedCardIds: string[];
}

export function gradeExam(
  questions: readonly ExamQuestion[],
  answers: Readonly<Record<number, string>>,
  scopeId: string = "all",
): ExamResultSummary {
  const resolvedScope: ExamScopeId = isValidExamScopeId(scopeId) ? scopeId : "all";
  const results: ExamQuestionResult[] = questions.map((question, idx) => {
    const rawAnswer = answers[idx] ?? answers[question.index] ?? "";
    const correct = isRecallAnswerCorrect(rawAnswer, question.correctCommand);
    return {
      question,
      userAnswer: rawAnswer.trim(),
      correct,
    };
  });

  const total = results.length;
  const score = results.filter((r) => r.correct).length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = isExamPassed(score, total);
  const missedQuestions = results.filter((r) => !r.correct);
  const missedCardIds = missedQuestions.map((r) => r.question.card.id);

  return {
    scopeId: resolvedScope,
    score,
    total,
    percent,
    passed,
    results,
    missedQuestions,
    missedCardIds,
  };
}
