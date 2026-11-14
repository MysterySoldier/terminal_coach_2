import {
  fisherYatesShuffle,
  FLASHCARDS,
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

/**
 * Audited exam overrides for cards whose raw LinuxDeck command or description
 * had duplicate commands, inconsistent placeholders, or ambiguous descriptions:
 * - Each description points unambiguously to one canonical command.
 * - Duplicate commands (e.g. `dd if=/dev/sda of=bk.img` vs `dd`, `tcpdump -i [interface]` vs `tcpdump`,
 *   `ip [address]` vs `ip`) are normalized so MC options and Recall answers never conflict.
 * - `tar` placeholders are normalized to `[archive] [file]`.
 */
export const EXAM_CARD_OVERRIDES: Readonly<
  Record<string, { command?: string; description?: string }>
> = {
  // Firewall family (cat-6) — sharpen descriptions so each points at one tool
  "security-0": {
    command: "nftables",
    description: "Configure Linux kernel packet-filtering tables and chains with nftables",
  },
  "net-12": {
    command: "ufw",
    description: "Manage Ubuntu/Debian firewall rules with Uncomplicated Firewall (ufw)",
  },
  "security-4": {
    command: "firewalld",
    description: "Run the dynamic zone-based firewall daemon (firewalld)",
  },
  "security-9": {
    command: "firewall-cmd",
    description: "CLI client to add or query firewalld zones and rules (firewall-cmd)",
  },

  // Kernel modules & kernel build family (cat-4 / cat-8)
  "sysinfo-1": {
    command: "lsmod",
    description: "List currently loaded Linux kernel modules (lsmod)",
  },
  "sysinfo-2": {
    command: "modprobe [module]",
    description: "Load or unload a kernel module and its dependencies in the running kernel (modprobe)",
  },
  "sysinfo-3": {
    command: "depmod",
    description: "Generate the kernel module dependency map file (depmod)",
  },
  "sysinfo-4": {
    command: "make menuconfig",
    description: "Open the text-menu interface to configure Linux kernel build options (make menuconfig)",
  },
  "sysinfo-5": {
    command: "make bzImage",
    description: "Compile the compressed Linux kernel image from source (make bzImage)",
  },
  "sysinfo-6": {
    command: "make modules_install",
    description: "Install compiled kernel modules into /lib/modules during a kernel source build (make modules_install)",
  },

  // Tar archives (cat-1) — normalized placeholder form
  "archive-5": {
    command: "tar -xvf [archive]",
    description: "Extract files from a tar archive (tar -xvf)",
  },
  "archive-6": {
    command: "tar -czvf [archive] [file]",
    description: "Create a gzip-compressed .tar.gz archive from files (tar -czvf)",
  },

  // Process viewers (cat-3) — sharpen ps vs top vs htop
  "proc-0": {
    command: "ps",
    description: "Print a one-time snapshot of currently running processes (ps)",
  },
  "proc-1": {
    command: "top",
    description: "Standard built-in real-time table of running processes and CPU/RAM usage (top)",
  },
  "proc-2": {
    command: "htop",
    description: "Color-coded interactive ncurses process viewer with scroll and tree view (htop)",
  },

  // Disk image / dd (cat-1) — normalize sysinfo-8 to canonical "dd" so MC never shows "dd if=/dev/sda of=bk.img" against "dd"
  "monitor-18": {
    command: "dd",
    description: "Low-level block copy utility for disk backup, cloning, and restore (dd)",
  },
  "sysinfo-8": {
    command: "dd",
    description: "Clone or back up a raw disk image byte-for-byte with dd",
  },

  // Packet capture / tcpdump (cat-6) — normalize security-8 to canonical "tcpdump"
  "security-8": {
    command: "tcpdump",
    description: "Capture live network traffic packets on a network interface (tcpdump)",
  },
  "net-13": {
    command: "tcpdump",
    description: "Command-line network packet analyzer and traffic sniffer (tcpdump)",
  },

  // IP / network interfaces (cat-6)
  "net-6": {
    command: "ip a",
    description: "Show all network interfaces and their assigned IP addresses (ip a)",
  },
  "net-7": {
    command: "ip [address]",
    description: "IpRoute2 utility to manage network interfaces, addresses, and routing (ip)",
  },

  // Disk free space (cat-5)
  "files-14": {
    command: "df",
    description: "Display mounted filesystem disk space usage (df)",
  },
  "fs-7": {
    command: "df -h",
    description: "Show mounted disk space usage in human-readable units like GB and MB (df -h)",
  },

  // System activity & CPU monitors (cat-4)
  "monitor-1": {
    command: "vmstat",
    description: "Report virtual memory, swap, process, and CPU statistics (vmstat)",
  },
  "monitor-2": {
    command: "iostat",
    description: "Report CPU utilization and block device disk I/O throughput (iostat)",
  },
  "monitor-3": {
    command: "sar",
    description: "Collect, report, and save historical system activity data (sysstat sar)",
  },
  "monitor-5": {
    command: "mpstat",
    description: "Report processor-related statistics and overall CPU usage breakdown (mpstat)",
  },
  "monitor-10": {
    command: "sar -u 1",
    description: "Sample real-time CPU utilization every 1 second with sar (-u 1)",
  },
  "monitor-11": {
    command: "iotop",
    description: "Top-like real-time monitor of disk I/O bandwidth per process (iotop)",
  },
  "monitor-12": {
    command: "mpstat -P ALL",
    description: "Display per-core CPU load across all processors (mpstat -P ALL)",
  },
  "monitor-13": {
    command: "dstat",
    description: "Combined real-time resource stats tool replacing vmstat, iostat, and netstat (dstat)",
  },

  // DNS lookup tools (cat-6)
  "net-10": {
    command: "dig [domain]",
    description: "Query DNS name servers for detailed record output (Domain Information Groper: dig)",
  },
  "net-11": {
    command: "nslookup [domain]",
    description: "Query DNS to resolve a domain name or IP address (nslookup)",
  },

  // HTTP downloaders (cat-6)
  "net-3": {
    command: "curl [url]",
    description: "Transfer data from or to a URL and inspect HTTP responses (curl)",
  },
  "net-4": {
    command: "wget [url]",
    description: "Non-interactive command-line file downloader for HTTP, HTTPS, and FTP (wget)",
  },

  // Encryption tools (cat-6)
  "security-3": {
    command: "gpg",
    description: "Encrypt, decrypt, and sign files with GNU Privacy Guard (gpg)",
  },
  "remote-7": {
    command: "openssl",
    description: "Command-line toolkit for TLS/SSL certificates, keys, and cryptography (openssl)",
  },

  // Partitioning & filesystem creation (cat-5)
  "fs-2": {
    command: "mkfs [type] [dev]",
    description: "Build a Linux filesystem of a specified type on a partition (mkfs)",
  },
  "fs-5": {
    command: "parted",
    description: "GNU disk partition manipulation program supporting GPT and MBR (parted)",
  },
  "fs-6": {
    command: "fdisk [device]",
    description: "Menu-driven disk partition table editor (fdisk)",
  },
  "fs-9": {
    command: "mkfs.ext4 [device]",
    description: "Format a partition specifically with an ext4 filesystem (mkfs.ext4)",
  },
  "sysinfo-9": {
    command: "mkisofs",
    description: "Build an ISO 9660 CD/DVD image from a directory tree (classic mkisofs)",
  },
  "sysinfo-11": {
    command: "genisoimage",
    description: "Generate an ISO 9660 filesystem image (cdrkit genisoimage)",
  },

  // User info & file metadata (cat-1 / cat-2)
  "files-8": {
    command: "find [path] -name [file]",
    description: "Walk a directory tree in real time to search for files by name or attributes (find)",
  },
  "files-9": {
    command: "locate [file]",
    description: "Quickly find file paths using the pre-built mlocate database (locate)",
  },
  "files-11": {
    command: "stat [file]",
    description: "Display detailed file or filesystem status: inode, size, permissions, and timestamps (stat)",
  },
  "files-18": {
    command: "lsattr [file]",
    description: "List ext2/ext3/ext4 special file attributes such as immutable +i (lsattr)",
  },
  "files-19": {
    command: "chattr [op] [file]",
    description: "Change ext2/ext3/ext4 special file attributes such as setting immutable +i (chattr)",
  },
  "users-0": {
    command: "who",
    description: "List currently logged-in user sessions and terminals (who)",
  },
  "users-1": {
    command: "w",
    description: "Show who is logged in and what process each user is currently running (w)",
  },
  "users-15": {
    command: "finger [username]",
    description: "Display a user's login name, real name, terminal, and home directory profile (finger)",
  },

  // Clocks & time (cat-3 / cat-8)
  "sysinfo-14": {
    command: "date",
    description: "Print or format the current system date and time (date)",
  },
  "sysinfo-15": {
    command: "timedatectl",
    description: "Query or change the systemd system clock, timezone, and NTP sync (timedatectl)",
  },
  "sysinfo-16": {
    command: "hwclock",
    description: "Read or synchronize the hardware real-time BIOS clock (hwclock)",
  },

  // Package updates (cat-7)
  "pkg-0": {
    command: "apt update",
    description: "Refresh APT package index lists from repositories (apt update)",
  },
  "pkg-1": {
    command: "apt upgrade",
    description: "Upgrade installed Debian/Ubuntu packages to their newest versions (apt upgrade)",
  },
  "pkg-10": {
    command: "yum update",
    description: "Update installed RHEL/CentOS packages using YUM (yum update)",
  },
};

export function resolveExamCard(card: FlashcardEntry): FlashcardEntry {
  const override = EXAM_CARD_OVERRIDES[card.id];
  if (!override) return card;
  return {
    ...card,
    command: override.command ?? card.command,
    description: override.description ?? card.description,
  };
}

export const EXAM_CARDS: FlashcardEntry[] = FLASHCARDS.map(resolveExamCard);

export function getExamCardById(id: string): FlashcardEntry | undefined {
  const cleaned = id.startsWith("fc:") ? id.slice(3) : id;
  return EXAM_CARDS.find((card) => card.id === cleaned);
}

export function getExamCardsByCategory(categoryId: string | null | undefined): FlashcardEntry[] {
  if (!categoryId || categoryId === "all") return EXAM_CARDS;
  return EXAM_CARDS.filter((card) => card.categoryId === categoryId);
}

export type ExamQuestionMode = "recall" | "mc";

export interface ExamQuestion {
  /** 0-based index within the exam (0 .. questions.length - 1). */
  index: number;
  /** Underlying LinuxDeck flashcard (with exam-audited command & description). */
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
 * Normalize a command string:
 * - Trim leading/trailing whitespace
 * - Collapse multiple spaces into a single space
 * - Preserve exact case (case-sensitive like a real terminal)
 */
export function normalizeRecallCommand(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * Strip bracket placeholders (e.g. [job_id], [directory], [src], [dst],
 * [srv]:[pt], [name]='[cmd]', [archive].tar.gz) from a command string
 * and collapse extra whitespace.
 */
export function stripBracketPlaceholders(raw: string): string {
  const tokens = normalizeRecallCommand(raw).split(" ").filter(Boolean);
  const kept = tokens.filter((tok) => !/\[[^\]]*\]/.test(tok));
  if (kept.length > 0) {
    return kept.join(" ");
  }
  return normalizeRecallCommand(raw.replace(/\[[^\]]*\]/g, ""));
}

/**
 * Extract the primary command token (first token after stripping bracket placeholders).
 */
export function getBaseCommand(raw: string): string {
  const stripped = stripBracketPlaceholders(raw);
  return stripped.split(" ")[0] ?? "";
}

/**
 * Recall grading rule (LinuxDeck):
 * The typed answer is accepted IFF the expected command, lower-cased,
 * STARTS WITH the typed input, lower-cased (ignoring extra spaces, and
 * also accepting prefix match against bracket-stripped expected command).
 * Trailing text beyond the expected command FAILS ("fail2ban extra" for "fail2ban").
 */
export function isRecallAnswerCorrect(userAnswer: string, expectedCommand: string): boolean {
  const userNorm = normalizeRecallCommand(userAnswer).toLowerCase();
  const expectedNorm = normalizeRecallCommand(expectedCommand).toLowerCase();
  if (!userNorm || !expectedNorm) return false;
  if (expectedNorm.startsWith(userNorm)) return true;

  const strippedExpected = stripBracketPlaceholders(expectedCommand).toLowerCase();
  if (strippedExpected && strippedExpected.startsWith(userNorm)) return true;

  return false;
}

/**
 * Format the LinuxDeck Terminal Recall hint:
 * "💡 Hint: Starts with XXX (N chars)" — first 3 letters of expected command + total length.
 */
export function formatRecallHint(expectedCommand: string): {
  prefix: string;
  length: number;
  text: string;
} {
  const clean = normalizeRecallCommand(expectedCommand);
  const prefix = clean.slice(0, 3);
  const length = clean.length;
  return {
    prefix,
    length,
    text: `💡 Hint: Starts with ${prefix} (${length} chars)`,
  };
}

/**
 * Grade an exam answer according to the question's mode:
 * - Multiple Choice ("mc"): the selected option must match `question.correctCommand`
 * - Terminal Recall ("recall"): graded via `isRecallAnswerCorrect`
 */
export function isExamAnswerCorrect(
  question: Pick<ExamQuestion, "mode" | "correctCommand">,
  userAnswer: string,
): boolean {
  if (question.mode === "mc") {
    const normUser = normalizeRecallCommand(userAnswer);
    const normExpected = normalizeRecallCommand(question.correctCommand);
    return Boolean(normUser && normUser === normExpected);
  }
  return isRecallAnswerCorrect(userAnswer, question.correctCommand);
}

/**
 * Generate 4 Multiple Choice command options for a flashcard (LinuxDeck spec):
 * - Always includes the card's exact stored command (`card.command`)
 * - Draws 3 distractors from the WHOLE 187-command pool (`EXAM_CARDS`)
 * - Never picks a distractor that shares the same command or base command (first token)
 *   as the target command or another distractor
 * - Shuffles option order and correct letter (A–D) with Fisher-Yates
 */
export function generateMcOptions(
  card: FlashcardEntry,
  pool: readonly FlashcardEntry[] = EXAM_CARDS,
  rng: () => number = Math.random,
): string[] {
  const targetCmd = card.command;
  const targetBase = getBaseCommand(targetCmd);
  const seenCommands = new Set<string>([targetCmd]);
  const seenBases = new Set<string>([targetBase]);

  const sourcePool = pool.length >= 4 ? pool : EXAM_CARDS;
  const distinctBaseCandidates: string[] = [];
  const fallbackCandidates: string[] = [];

  for (const candidate of sourcePool) {
    if (candidate.id === card.id) continue;
    const cmd = candidate.command;
    if (seenCommands.has(cmd)) continue;
    const base = getBaseCommand(cmd);
    if (!seenBases.has(base)) {
      seenCommands.add(cmd);
      seenBases.add(base);
      distinctBaseCandidates.push(cmd);
    } else {
      fallbackCandidates.push(cmd);
    }
  }

  if (distinctBaseCandidates.length < 3 && sourcePool !== EXAM_CARDS) {
    for (const candidate of EXAM_CARDS) {
      if (candidate.id === card.id) continue;
      const cmd = candidate.command;
      if (seenCommands.has(cmd)) continue;
      const base = getBaseCommand(cmd);
      if (!seenBases.has(base)) {
        seenCommands.add(cmd);
        seenBases.add(base);
        distinctBaseCandidates.push(cmd);
      } else {
        fallbackCandidates.push(cmd);
      }
    }
  }

  const distractors = fisherYatesShuffle(distinctBaseCandidates, rng).slice(0, 3);

  if (distractors.length < 3) {
    for (const cmd of fisherYatesShuffle(fallbackCandidates, rng)) {
      if (distractors.length >= 3) break;
      if (!distractors.includes(cmd) && cmd !== targetCmd) {
        distractors.push(cmd);
      }
    }
  }

  return fisherYatesShuffle([targetCmd, ...distractors], rng);
}

export interface BuildExamStudyQueueOptions {
  /** Category ID ("all" or "cat-1" .. "cat-8"). Defaults to "all". */
  categoryId?: string | null;
  /** Set of mastered card IDs (shared across Flash Cards and Exams). */
  masteredIds?: ReadonlySet<string>;
  /** When true (e.g. "Restart Deck"), includes all cards in the category even if mastered. */
  includeMastered?: boolean;
  /** Optional RNG for deterministic shuffling. */
  rng?: () => number;
}

/**
 * Build a shuffled study queue for an Exams session (Multiple Choice or Terminal Recall):
 * - By default, includes only the category's unmastered cards, shuffled with Fisher-Yates.
 * - When `includeMastered` is true ("Restart Deck"), includes all cards in the category, shuffled.
 */
export function buildExamStudyQueue(options: BuildExamStudyQueueOptions = {}): FlashcardEntry[] {
  const {
    categoryId = "all",
    masteredIds = new Set<string>(),
    includeMastered = false,
    rng = Math.random,
  } = options;

  const categoryCards = getExamCardsByCategory(categoryId);
  const filtered = includeMastered
    ? categoryCards
    : categoryCards.filter((card) => !masteredIds.has(card.id));

  return fisherYatesShuffle(filtered, rng);
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
 * Build a shuffled exam from the 187 audited LinuxDeck exam cards (or a category's cards):
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

  const categoryPool = getExamCardsByCategory(categoryId);
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
    const correct = isExamAnswerCorrect(question, rawAnswer);
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
