import { COACH_JOBS } from "@/data/coach-jobs";
import { TOTAL_REFERENCE_COMMANDS } from "@/data/command-reference";
import { TOTAL_EXAMS } from "@/data/exams";
import { TOTAL_FLASHCARDS } from "@/data/flashcards";
import {
  markCommandViewed,
  markFlashcardMastered,
  recordExamAttempt,
  recordExtremeRound,
  recordMediumRound,
  recordRound,
} from "@/lib/coach";
import {
  buildModeSummaries,
  resolveJobRowForMode,
  type AllProgressSnapshot,
} from "@/lib/mode-metrics";
import {
  DEFAULT_MODE_COLORS,
  DEFAULT_THEME_SETTINGS,
  hexToRgba,
  normalizeHexColor,
} from "@/store/theme-store";

function emptySnapshot(): AllProgressSnapshot {
  return { easy: {}, medium: {}, hard: {}, extreme: {} };
}

describe("mode-metrics (NeoServer main screen data)", () => {
  it("starts with zero fake data: 0 viewed/passed, grey status dots, and 0% rings across all 4 modes", () => {
    const summaries = buildModeSummaries(emptySnapshot(), "hard");
    expect(summaries.map((s) => s.mode)).toEqual(["easy", "medium", "hard", "extreme"]);

    // Easy card: 388 reference commands, live Reference ring, 0 for Flash Cards and Exams rings
    expect(summaries[0].subtitle).toBe("Learn the commands, drill them, test on them");
    expect(summaries[0].totalCount).toBe(TOTAL_REFERENCE_COMMANDS);
    expect(summaries[0].passedCount).toBe(0);
    expect(summaries[0].statusLine).toBe("0 / 388 viewed");
    expect(summaries[0].dot).toBe("grey");
    expect(summaries[0].rings.map((r) => r.label)).toEqual(["Reference", "Flash Cards", "Exams"]);
    expect(summaries[0].rings[0].total).toBe(388);
    expect(summaries[0].rings[1].total).toBe(TOTAL_FLASHCARDS);
    expect(summaries[0].rings[2].total).toBe(TOTAL_EXAMS);

    // Medium, Hard, Extreme have 50 ticket jobs
    for (const s of summaries.slice(1)) {
      expect(s.totalCount).toBe(COACH_JOBS.length);
      expect(s.passedCount).toBe(0);
      expect(s.dot).toBe("grey");
      expect(s.rings).toHaveLength(3);
      expect(s.rings.every((r) => r.percent === 0)).toBe(true);
      expect(s.sparklines[0].points.every((v) => v === 0)).toBe(true);
      expect(s.sparklines[1].points.every((v) => v === 0)).toBe(true);
    }
    expect(summaries[3].badge).toBe("OVERLOAD");
  });

  it("tracks Easy Reference viewed commands and Flash Cards mastered count on the Easy mode card rings", () => {
    const snap = emptySnapshot();
    snap.easy = markCommandViewed(snap.easy, "cmd-ls", 1000);
    snap.easy = markCommandViewed(snap.easy, "cmd-chmod", 2000);
    snap.easy = markFlashcardMastered(snap.easy, "files-0", 3000);
    snap.easy = markFlashcardMastered(snap.easy, "users-0", 4000);
    snap.easy = markFlashcardMastered(snap.easy, "net-0", 5000);
    snap.easy = recordExamAttempt(snap.easy, "all", { score: 18, total: 20, missedCardIds: [] }, 6000);
    snap.easy = recordExamAttempt(snap.easy, "cat-1", { score: 17, total: 20, missedCardIds: [] }, 7000);

    const easySummary = buildModeSummaries(snap, "easy")[0];
    expect(easySummary.passedCount).toBe(2);
    expect(easySummary.statusLine).toBe("2 / 388 viewed");
    expect(easySummary.dot).toBe("purple");
    expect(easySummary.rings[0].value).toBe(2);
    expect(easySummary.rings[0].total).toBe(388);
    expect(easySummary.rings[1].value).toBe(3);
    expect(easySummary.rings[1].total).toBe(187);
    expect(easySummary.rings[2].value).toBe(2);
    expect(easySummary.rings[2].total).toBe(TOTAL_EXAMS);
  });

  it("maps Medium failed try to red and working job to purple", () => {
    const snap = emptySnapshot();
    snap.medium = recordMediumRound(snap.medium, COACH_JOBS[3].id, {
      solved: false,
      fullShadowTyped: false,
      hintsUsed: 0,
      solutionShown: false,
      firstTryInSession: false,
      rebootPassed: false,
    });

    const failedRow = resolveJobRowForMode(COACH_JOBS[3], 3, "medium", snap);
    const workingRow = resolveJobRowForMode(COACH_JOBS[4], 4, "medium", snap, COACH_JOBS[4].id);
    expect(failedRow.dot).toBe("red");
    expect(workingRow.dot).toBe("purple");
  });

  it("maps Hard cold pass to green and help-solved round to yellow", () => {
    const now = 1_700_000_000_000;
    const snap = emptySnapshot();
    snap.hard = recordRound(
      snap.hard,
      COACH_JOBS[3].id,
      { solved: true, hintsUsed: 0, solutionShown: false, rebootPassed: false },
      now,
    );
    snap.hard = recordRound(
      snap.hard,
      COACH_JOBS[4].id,
      { solved: true, hintsUsed: 2, solutionShown: false, rebootPassed: false },
      now,
    );

    const coldRow = resolveJobRowForMode(COACH_JOBS[3], 3, "hard", snap, null, now);
    const hintRow = resolveJobRowForMode(COACH_JOBS[4], 4, "hard", snap, null, now);
    expect(coldRow.dot).toBe("green");
    expect(coldRow.statusLabel).toBe("passed cold");
    expect(hintRow.dot).toBe("yellow");
    expect(hintRow.statusLabel).toBe("passed with hint");

    const hardSummary = buildModeSummaries(snap, "hard", now)[2];
    expect(hardSummary.subtitle).toContain("passed with hint");
    expect(hardSummary.statusLine).toContain("1 passed with hint");
  });

  it("maps Extreme first cold pass to amber (3-day lock) and second cold retest pass to green", () => {
    const t0 = 1_700_000_000_000;
    const snap = emptySnapshot();
    snap.extreme = recordExtremeRound(
      snap.extreme,
      COACH_JOBS[3].id,
      { solved: true, hintsUsed: 0, firstTryInSession: true, rebootPassed: false },
      t0,
    );

    const lockedRow = resolveJobRowForMode(COACH_JOBS[3], 3, "extreme", snap, null, t0 + 1000);
    expect(lockedRow.dot).toBe("amber");
    expect(lockedRow.passed).toBe(false);

    const afterThreeDays = t0 + 3 * 24 * 60 * 60 * 1000 + 5000;
    snap.extreme = recordExtremeRound(
      snap.extreme,
      COACH_JOBS[3].id,
      { solved: true, hintsUsed: 0, firstTryInSession: true, rebootPassed: false },
      afterThreeDays,
    );

    const completeRow = resolveJobRowForMode(COACH_JOBS[3], 3, "extreme", snap, null, afterThreeDays);
    expect(completeRow.dot).toBe("green");
    expect(completeRow.passed).toBe(true);
  });

  it("keeps default mode colors Easy=Blue, Medium=Green, Hard=Yellow, Extreme=Red", () => {
    expect(DEFAULT_MODE_COLORS).toEqual({
      easy: "#38bdf8",
      medium: "#10b981",
      hard: "#facc15",
      extreme: "#ef4444",
    });
    expect(DEFAULT_THEME_SETTINGS.colorScheme).toBe("dark");
  });

  it("normalizes custom hex colors and falls back safely on invalid input", () => {
    expect(normalizeHexColor("#FF00AA", "#000000")).toBe("#ff00aa");
    expect(normalizeHexColor("not-a-color", "#38bdf8")).toBe("#38bdf8");
    expect(hexToRgba("#ef4444", 0.5)).toBe("rgba(239, 68, 68, 0.5)");
  });
});
