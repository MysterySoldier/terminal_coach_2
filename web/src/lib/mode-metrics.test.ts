import { COACH_JOBS } from "@/data/coach-jobs";
import {
  recordEasyHintUsed,
  recordEasyRound,
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
  it("starts with zero fake data: 0 passed, grey status dots, and 0% rings across all 4 modes", () => {
    const summaries = buildModeSummaries(emptySnapshot(), "hard");
    expect(summaries.map((s) => s.mode)).toEqual(["easy", "medium", "hard", "extreme"]);
    for (const s of summaries) {
      expect(s.totalCount).toBe(16);
      expect(s.passedCount).toBe(0);
      expect(s.dot).toBe("grey");
      expect(s.rings).toHaveLength(3);
      expect(s.rings.every((r) => r.percent === 0)).toBe(true);
      expect(s.sparklines[0].points.every((v) => v === 0)).toBe(true);
      expect(s.sparklines[1].points.every((v) => v === 0)).toBe(true);
    }
    expect(summaries[3].badge).toBe("OVERLOAD");
  });

  it("maps Easy passed to green and Easy hint-used pass to yellow while still counting as passed", () => {
    const snap = emptySnapshot();
    snap.easy = recordEasyRound(snap.easy, COACH_JOBS[0].id, {
      solved: true,
      hintsUsed: 0,
      solutionShown: false,
      rebootPassed: false,
    });
    snap.easy = recordEasyHintUsed(snap.easy, COACH_JOBS[1].id);
    snap.easy = recordEasyRound(snap.easy, COACH_JOBS[1].id, {
      solved: true,
      hintsUsed: 1,
      solutionShown: false,
      rebootPassed: false,
    });

    const row0 = resolveJobRowForMode(COACH_JOBS[0], 0, "easy", snap);
    const row1 = resolveJobRowForMode(COACH_JOBS[1], 1, "easy", snap);
    expect(row0.dot).toBe("green");
    expect(row0.passed).toBe(true);
    expect(row1.dot).toBe("yellow");
    expect(row1.passed).toBe(true);

    const easySummary = buildModeSummaries(snap, "easy")[0];
    expect(easySummary.passedCount).toBe(2);
    expect(easySummary.rings[0].value).toBe(2);
    expect(easySummary.rings[1].value).toBe(1); // No-hint clean passes
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

    expect(resolveJobRowForMode(COACH_JOBS[3], 3, "hard", snap, null, now).dot).toBe("green");
    expect(resolveJobRowForMode(COACH_JOBS[4], 4, "hard", snap, null, now).dot).toBe("yellow");
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
