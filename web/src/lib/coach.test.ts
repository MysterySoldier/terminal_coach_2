import {
  advanceShadowTyping,
  didCommandBurnFirstTry,
  easyReadinessReport,
  evaluateEasyAttempt,
  extremeJobStatus,
  extremeReadinessReport,
  isRetestDue,
  isTaskSolved,
  loadCoachMode,
  loadCoachProgress,
  loadEasyProgress,
  loadExtremeProgress,
  loadMediumProgress,
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
  swapEasySlots,
  type CoachProgress,
  type ExtremeProgress,
} from "@/lib/coach";
import { COACH_JOBS, createJobSession } from "@/data/coach-jobs";
import { EASY_PLANS } from "@/data/easy-coach";
import { MEDIUM_PLANS } from "@/data/medium-coach";
import { SANDBOX_TASKS } from "@/data/sandbox";
import { parseCommand, createSession, getNodeInSession, rebootSession, runCommandInSession } from "@/lib/terminal-engine";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 10, 12, 0, 0);

const JOBS = [
  { id: "coach-website-down", title: "The website is down", domain: "troubleshoot" },
  { id: "coach-sb-chmod-750", title: "Lock down deploy.sh", domain: "security" },
];

describe("cold passes", () => {
  it("solving with zero hints and no solution shown is a cold pass", () => {
    const next = recordRound({}, "coach-website-down", { solved: true, hintsUsed: 0, solutionShown: false, rebootPassed: true }, NOW);
    expect(next["coach-website-down"].coldPasses).toBe(1);
    expect(next["coach-website-down"].lastColdPassAt).toBe(NOW);
    expect(next["coach-website-down"].nextRetestAt).toBe(NOW + 3 * DAY);
  });

  it("solving after a hint is not a cold pass, but still counts as solved with help", () => {
    const next = recordRound({}, "coach-website-down", { solved: true, hintsUsed: 2, solutionShown: false, rebootPassed: true }, NOW);
    expect(next["coach-website-down"].coldPasses).toBe(0);
    expect(next["coach-website-down"].solvedWithHelp).toBe(true);
  });

  it("solving after seeing the solution is not a cold pass", () => {
    const next = recordRound({}, "coach-website-down", { solved: true, hintsUsed: 0, solutionShown: true, rebootPassed: false }, NOW);
    expect(next["coach-website-down"].coldPasses).toBe(0);
    expect(next["coach-website-down"].solvedWithHelp).toBe(true);
  });

  it("a failed round counts as an attempt but no pass", () => {
    const next = recordRound({}, "coach-website-down", { solved: false, hintsUsed: 1, solutionShown: false, rebootPassed: false }, NOW);
    expect(next["coach-website-down"].attempts).toBe(1);
    expect(next["coach-website-down"].coldPasses).toBe(0);
  });

  it("the retest is due after three days, not before", () => {
    const progress: CoachProgress = recordRound(
      {},
      "coach-website-down",
      { solved: true, hintsUsed: 0, solutionShown: false, rebootPassed: true },
      NOW,
    );
    expect(isRetestDue(progress["coach-website-down"], NOW + 2 * DAY)).toBe(false);
    expect(isRetestDue(progress["coach-website-down"], NOW + 3 * DAY)).toBe(true);
    expect(isRetestDue(progress["coach-website-down"], NOW + 4 * DAY)).toBe(true);
  });
});

describe("readiness report", () => {
  it("speaks in plain words: what you can do, what still needs help, what is next", () => {
    const progress: CoachProgress = recordRound(
      {},
      "coach-website-down",
      { solved: true, hintsUsed: 0, solutionShown: false, rebootPassed: true },
      NOW,
    );
    const report = readinessReport(JOBS, progress, NOW);
    expect(report.coldCount).toBe(1);
    expect(report.totalCount).toBe(2);
    expect(report.lines[0]).toContain("on your own, with no help");
    expect(report.lines[1]).toContain("have not done");
    expect(report.nextStep).toContain("Lock down deploy.sh");
  });

  it("with nothing done, every line says not yet and the next step names the first job", () => {
    const report = readinessReport(JOBS, {}, NOW);
    expect(report.coldCount).toBe(0);
    expect(report.lines).toHaveLength(2);
    expect(report.nextStep).toContain("The website is down");
  });

  it("a due retest comes before a new weak job", () => {
    const progress: CoachProgress = recordRound(
      {},
      "coach-website-down",
      { solved: true, hintsUsed: 0, solutionShown: false, rebootPassed: true },
      NOW,
    );
    const report = readinessReport(JOBS, progress, NOW + 4 * DAY);
    expect(report.nextStep).toContain("The website is down");
    expect(report.nextStep).toContain("again, cold");
  });
});

describe("extreme mode", () => {
  it("first-try cold pass locks the job for 3 days and awaits retest before counting complete", () => {
    const p1 = recordExtremeRound(
      {},
      "coach-sb-chmod-750",
      { solved: true, hintsUsed: 0, firstTryInSession: true, rebootPassed: true },
      NOW,
    );
    expect(p1["coach-sb-chmod-750"].stage).toBe("awaiting-retest");
    expect(p1["coach-sb-chmod-750"].nextRetestAt).toBe(NOW + 3 * DAY);
    expect(extremeJobStatus(p1["coach-sb-chmod-750"], NOW)).toBe("locked");
    expect(extremeJobStatus(p1["coach-sb-chmod-750"], NOW + 2 * DAY)).toBe("locked");
    expect(extremeJobStatus(p1["coach-sb-chmod-750"], NOW + 3 * DAY)).toBe("retest-due");

    const reportWhileLocked = extremeReadinessReport(JOBS, p1, NOW);
    expect(reportWhileLocked.headline).toBe("Extreme: 0 of 2 jobs proved cold twice.");
    expect(reportWhileLocked.completeCount).toBe(0);
    expect(reportWhileLocked.lockedCount).toBe(1);
    expect(reportWhileLocked.lines[1]).toContain("locked for three days");
    expect(reportWhileLocked.lines[1]).toContain("needs a cold retest");
  });

  it("cannot advance to complete while locked during the 3-day wait", () => {
    const p1 = recordExtremeRound(
      {},
      "coach-sb-chmod-750",
      { solved: true, hintsUsed: 0, firstTryInSession: true, rebootPassed: true },
      NOW,
    );
    const early = recordExtremeRound(
      p1,
      "coach-sb-chmod-750",
      { solved: true, hintsUsed: 0, firstTryInSession: true, rebootPassed: true },
      NOW + 1 * DAY,
    );
    expect(early["coach-sb-chmod-750"].stage).toBe("awaiting-retest");
    expect(extremeJobStatus(early["coach-sb-chmod-750"], NOW + 1 * DAY)).toBe("locked");
  });

  it("passing the 3-day cold retest marks the job Extreme complete", () => {
    const p1 = recordExtremeRound(
      {},
      "coach-sb-chmod-750",
      { solved: true, hintsUsed: 0, firstTryInSession: true, rebootPassed: true },
      NOW,
    );
    const p2 = recordExtremeRound(
      p1,
      "coach-sb-chmod-750",
      { solved: true, hintsUsed: 0, firstTryInSession: true, rebootPassed: true },
      NOW + 3 * DAY,
    );
    expect(p2["coach-sb-chmod-750"].stage).toBe("complete");
    expect(extremeJobStatus(p2["coach-sb-chmod-750"], NOW + 3 * DAY)).toBe("complete");

    const report = extremeReadinessReport(JOBS, p2, NOW + 3 * DAY);
    expect(report.headline).toBe("Extreme: 1 of 2 jobs proved cold twice.");
    expect(report.completeCount).toBe(1);
    expect(report.lines[1]).toContain("proved \"Lock down deploy.sh\" cold twice");
  });

  it("solving after the first try in the session does not count", () => {
    const next = recordExtremeRound(
      {},
      "coach-sb-chmod-750",
      { solved: true, hintsUsed: 0, firstTryInSession: false, rebootPassed: true },
      NOW,
    );
    expect(next["coach-sb-chmod-750"].stage).toBe("not-done");
    expect(extremeJobStatus(next["coach-sb-chmod-750"], NOW)).toBe("not-done");
  });

  it("failing the 3-day retest sends the job back to not-done and restarts the 3-day clock", () => {
    let progress: ExtremeProgress = recordExtremeRound(
      {},
      "coach-sb-chmod-750",
      { solved: true, hintsUsed: 0, firstTryInSession: true, rebootPassed: true },
      NOW,
    );
    // Retest fails at day 3
    progress = recordExtremeRound(
      progress,
      "coach-sb-chmod-750",
      { solved: false, hintsUsed: 0, firstTryInSession: false, rebootPassed: false },
      NOW + 3 * DAY,
    );
    expect(progress["coach-sb-chmod-750"].stage).toBe("not-done");
    expect(progress["coach-sb-chmod-750"].nextRetestAt).toBeNull();

    // Passing cold again at day 4 starts a brand-new 3-day clock (due at day 7)
    progress = recordExtremeRound(
      progress,
      "coach-sb-chmod-750",
      { solved: true, hintsUsed: 0, firstTryInSession: true, rebootPassed: true },
      NOW + 4 * DAY,
    );
    expect(progress["coach-sb-chmod-750"].stage).toBe("awaiting-retest");
    expect(progress["coach-sb-chmod-750"].nextRetestAt).toBe(NOW + 7 * DAY);
  });

  it("using a hint resets an awaiting-retest job back to not-done", () => {
    const p1 = recordExtremeRound(
      {},
      "coach-sb-chmod-750",
      { solved: true, hintsUsed: 0, firstTryInSession: true, rebootPassed: true },
      NOW,
    );
    const reset = recordExtremeHintUsed(p1, "coach-sb-chmod-750");
    expect(reset["coach-sb-chmod-750"].stage).toBe("not-done");
    expect(reset["coach-sb-chmod-750"].nextRetestAt).toBeNull();
  });

  it("distinguishes harmless inspection from wrong task attempts on first try", () => {
    const session = createSession();
    const inspect = runCommandInSession(session, "ls -l deploy.sh", "/home/user");
    expect(didCommandBurnFirstTry("coach-sb-chmod-750", parseCommand("ls -l deploy.sh"), inspect, inspect.cwd)).toBe(false);

    const wrongChmod = runCommandInSession(session, "chmod 755 deploy.sh", "/home/user");
    expect(didCommandBurnFirstTry("coach-sb-chmod-750", parseCommand("chmod 755 deploy.sh"), wrongChmod, wrongChmod.cwd)).toBe(true);

    const wrongLs = runCommandInSession(session, "ls -l", "/home/user");
    expect(didCommandBurnFirstTry("coach-sb-ls-la", parseCommand("ls -l"), wrongLs, wrongLs.cwd)).toBe(true);
  });
});

describe("medium mode", () => {
  it("covers all coach jobs with contiguous shadow-typing character steps across every stage and solves on the final stage", () => {
    expect(COACH_JOBS.length).toBeGreaterThanOrEqual(26);
    for (const job of COACH_JOBS) {
      const plan = MEDIUM_PLANS[job.id];
      expect(plan).toBeDefined();
      expect(plan.stages.length).toBeGreaterThanOrEqual(1);
      expect(plan.target).toBe(plan.stages[0].target);

      const session = createJobSession(job);
      let cwd = "/home/user";
      let solved = false;

      for (let sIdx = 0; sIdx < plan.stages.length; sIdx += 1) {
        const stage = plan.stages[sIdx];
        expect(stage.steps[0].start).toBe(0);
        for (let i = 1; i < stage.steps.length; i += 1) {
          expect(stage.steps[i].start).toBe(stage.steps[i - 1].end);
        }
        expect(stage.steps[stage.steps.length - 1].end).toBe(stage.target.length);

        const stateBefore = job.checkState ? job.checkState(session, cwd) : null;
        const result = runCommandInSession(session, stage.target, cwd);
        if (sIdx === plan.stages.length - 1) {
          solved = isTaskSolved(
            { match: job.match ?? (() => false), checkState: job.checkState },
            session,
            stateBefore,
            { parsed: parseCommand(stage.target), cwdBefore: cwd, cwdAfter: result.cwd, result },
          );
        }
        cwd = result.cwd;
      }

      expect(solved).toBe(true);
    }
  });

  it("advances shadow typing on correct keys and fades remaining grey text", () => {
    const plan = MEDIUM_PLANS["coach-sb-chmod-750"];
    const step1 = advanceShadowTyping("", "c", plan);
    expect(step1.advanced).toBe(true);
    expect(step1.blocked).toBe(false);
    expect(step1.typed).toBe("c");
    expect(step1.remainingShadow).toBe("hmod 750 deploy.sh");

    const full = advanceShadowTyping("c", "chmod 750 deploy.sh", plan);
    expect(full.advanced).toBe(true);
    expect(full.blocked).toBe(false);
    expect(full.completed).toBe(true);
    expect(full.typed).toBe("chmod 750 deploy.sh");
    expect(full.remainingShadow).toBe("");
  });

  it("does not advance on a wrong key and explains in plain words which part is wrong", () => {
    const plan = MEDIUM_PLANS["coach-sb-chmod-750"];
    const wrong = advanceShadowTyping("chmod ", "chmod 9", plan);
    expect(wrong.advanced).toBe(false);
    expect(wrong.blocked).toBe(true);
    expect(wrong.typed).toBe("chmod ");
    expect(wrong.remainingShadow).toBe("750 deploy.sh");
    expect(wrong.wrongStep?.stepNumber).toBe(2);
    expect(wrong.coachMessage).toContain("three-digit permission code");
    expect(wrong.coachMessage).not.toContain("750");
  });

  it("marks hint use as hint-used (yellow) and does not count it as a Medium pass", () => {
    const hinted = recordMediumHintUsed({}, "coach-sb-chmod-750");
    expect(hinted["coach-sb-chmod-750"].status).toBe("hint-used");

    const solvedWithHint = recordMediumRound(
      hinted,
      "coach-sb-chmod-750",
      {
        solved: true,
        fullShadowTyped: true,
        hintsUsed: 1,
        solutionShown: false,
        firstTryInSession: true,
        rebootPassed: true,
      },
      NOW,
    );
    expect(solvedWithHint["coach-sb-chmod-750"].status).toBe("hint-used");

    const report = mediumReadinessReport(JOBS, solvedWithHint);
    expect(report.passCount).toBe(0);
    expect(report.hintUsedCount).toBe(1);
    expect(report.headline).toBe("Medium: 0 of 2 jobs passed.");
    expect(report.lines[1]).toContain("hint used");
  });

  it("counts a 0-hint first-try shadow solve as a Medium pass with no 3-day lock", () => {
    const passed = recordMediumRound(
      {},
      "coach-sb-chmod-750",
      {
        solved: true,
        fullShadowTyped: true,
        hintsUsed: 0,
        solutionShown: false,
        firstTryInSession: true,
        rebootPassed: true,
      },
      NOW,
    );
    expect(passed["coach-sb-chmod-750"].status).toBe("passed");
    expect(passed["coach-sb-chmod-750"].passedAt).toBe(NOW);

    const report = mediumReadinessReport(JOBS, passed);
    expect(report.passCount).toBe(1);
    expect(report.headline).toBe("Medium: 1 of 2 jobs passed.");
    expect(report.lines[1]).toContain("Medium pass");
  });

  it("maps UI status across not-done, working, passed, hint-used, and failed", () => {
    expect(
      resolveMediumUiStatus(undefined, {
        isCurrentJob: true,
        typingStarted: false,
        hintsUsed: 0,
        solutionShown: false,
        roundFailed: false,
        roundSolved: false,
      }),
    ).toBe("not-done");

    expect(
      resolveMediumUiStatus(undefined, {
        isCurrentJob: true,
        typingStarted: true,
        hintsUsed: 0,
        solutionShown: false,
        roundFailed: false,
        roundSolved: false,
      }),
    ).toBe("working");

    expect(
      resolveMediumUiStatus(undefined, {
        isCurrentJob: true,
        typingStarted: true,
        hintsUsed: 0,
        solutionShown: false,
        roundFailed: true,
        roundSolved: false,
      }),
    ).toBe("failed");
  });

  it("stores Medium progress separately from Hard and Extreme progress", () => {
    const store = new Map<string, string>();
    const prevWindow = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
        clear: () => store.clear(),
      },
    };
    try {
      const hard = recordRound({}, "coach-website-down", { solved: true, hintsUsed: 0, solutionShown: false, rebootPassed: true }, NOW);
      const extreme = recordExtremeRound({}, "coach-sb-chmod-750", { solved: true, hintsUsed: 0, firstTryInSession: true, rebootPassed: true }, NOW);
      const medium = recordMediumRound(
        {},
        "coach-sb-chmod-750",
        { solved: true, fullShadowTyped: true, hintsUsed: 0, solutionShown: false, firstTryInSession: true, rebootPassed: true },
        NOW,
      );

      saveCoachProgress(hard);
      saveExtremeProgress(extreme);
      saveMediumProgress(medium);

      expect(loadCoachProgress()["coach-sb-chmod-750"]).toBeUndefined();
      expect(loadCoachProgress()["coach-website-down"].coldPasses).toBe(1);
      expect(loadExtremeProgress()["coach-sb-chmod-750"].stage).toBe("awaiting-retest");
      expect(loadMediumProgress()["coach-sb-chmod-750"].status).toBe("passed");
      expect(loadMediumProgress()["coach-website-down"]).toBeUndefined();
    } finally {
      if (prevWindow === undefined) delete (globalThis as { window?: unknown }).window;
      else (globalThis as { window?: unknown }).window = prevWindow;
    }
  });
});

describe("easy mode", () => {
  it("builds the right command(s) for all 19 jobs, mutates real shell state, and passes the job check", () => {
    for (const job of COACH_JOBS) {
      const plan = EASY_PLANS[job.id];
      expect(plan).toBeDefined();
      expect(plan.stages.length).toBeGreaterThanOrEqual(1);

      const session = createJobSession(job);
      let cwd = "/home/user";
      let solved = false;

      for (let sIdx = 0; sIdx < plan.stages.length; sIdx += 1) {
        const stage = plan.stages[sIdx];
        const correctOrder = stage.slots.map((s) => s.expectedBlockId);
        const evaluation = evaluateEasyAttempt(stage, correctOrder, { jobId: job.id, stageIndex: sIdx });
        expect(evaluation.ok).toBe(true);
        if (!evaluation.ok) continue;

        expect(evaluation.command).toBe(stage.target);

        const stateBefore = job.checkState ? job.checkState(session, cwd) : null;
        const result = runCommandInSession(session, evaluation.command, cwd);
        if (sIdx === plan.stages.length - 1) {
          solved = isTaskSolved(
            { match: job.match ?? (() => false), checkState: job.checkState },
            session,
            stateBefore,
            { parsed: parseCommand(evaluation.command), cwdBefore: cwd, cwdAfter: result.cwd, result },
          );
        }
        cwd = result.cwd;
      }

      expect(solved).toBe(true);

      if (job.id === "coach-sb-chmod-750") {
        expect(getNodeInSession(session, "/home/user/deploy.sh")?.mode).toBe(0o750);
      }
    }
  });

  it("teaches plain-words meanings on Job 4 word blocks [chmod] [750] [deploy.sh]", () => {
    const plan = EASY_PLANS["coach-sb-chmod-750"];
    const byId = new Map(plan.blocks.map((b) => [b.id, b]));
    expect(byId.get("chmod")?.meaning).toBe("change who can use this");
    expect(byId.get("750")?.meaning).toBe("owner full control, group read and run, others nothing");
    expect(byId.get("deploy-sh")?.meaning).toBe("the file");
  });

  it("wrong block order does not pass and gives plain-words coaching explaining what part is wrong and why", () => {
    const plan = EASY_PLANS["coach-sb-chmod-750"];
    const wrongOrder = evaluateEasyAttempt(plan, ["750", "chmod", "deploy-sh"]);
    expect(wrongOrder.ok).toBe(false);
    if (wrongOrder.ok) return;

    expect(wrongOrder.reason).toBe("wrong-order");
    expect(wrongOrder.slotIndex).toBe(0);
    expect(wrongOrder.coachMessage.toLowerCase()).not.toBe("wrong");
    expect(wrongOrder.coachMessage).toContain("750");
    expect(wrongOrder.coachMessage).toContain("chmod");
    expect(wrongOrder.coachMessage).toContain("slot 1");

    // Swapping slots 0 and 1 fixes the order and passes
    const fixed = swapEasySlots(["750", "chmod", "deploy-sh"], 0, 1);
    const afterSwap = evaluateEasyAttempt(plan, fixed);
    expect(afterSwap.ok).toBe(true);
    if (afterSwap.ok) {
      expect(afterSwap.command).toBe("chmod 750 deploy.sh");
    }
  });

  it("wrong distractor block does not pass and explains why in plain words", () => {
    const plan = EASY_PLANS["coach-sb-chmod-750"];
    const wrongBlock = evaluateEasyAttempt(plan, ["chmod", "755", "deploy-sh"]);
    expect(wrongBlock.ok).toBe(false);
    if (wrongBlock.ok) return;

    expect(wrongBlock.reason).toBe("wrong-block");
    expect(wrongBlock.slotIndex).toBe(1);
    expect(wrongBlock.coachMessage).toContain("755");
    expect(wrongBlock.coachMessage).toContain("others");
  });

  it("allows hints in Easy: shows yellow (hint-used) on the job while still counting as an Easy pass with no 3-day lock", () => {
    const hinted = recordEasyHintUsed({}, "coach-sb-chmod-750");
    expect(hinted["coach-sb-chmod-750"].passed).toBe(false);
    expect(hinted["coach-sb-chmod-750"].hintUsed).toBe(true);

    const solvedWithHint = recordEasyRound(
      hinted,
      "coach-sb-chmod-750",
      { solved: true, hintsUsed: 2, solutionShown: false, rebootPassed: true },
      NOW,
    );
    expect(solvedWithHint["coach-sb-chmod-750"].passed).toBe(true);
    expect(solvedWithHint["coach-sb-chmod-750"].hintUsed).toBe(true);

    const uiStatus = resolveEasyUiStatus(solvedWithHint["coach-sb-chmod-750"], {
      isCurrentJob: false,
      blocksTouched: false,
      hintsUsed: 0,
      solutionShown: false,
      lastTryFailed: false,
      roundSolved: false,
    });
    expect(uiStatus).toBe("hint-used");

    const report = easyReadinessReport(JOBS, solvedWithHint);
    expect(report.passCount).toBe(1);
    expect(report.hintPassCount).toBe(1);
    expect(report.headline).toBe("Easy: 1 of 2 jobs passed.");
  });

  it("stores coachEasyProgress separately from Medium, Hard, and Extreme and persists all 4 modes", () => {
    const store = new Map<string, string>();
    const prevWindow = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
        clear: () => store.clear(),
      },
    };
    try {
      const easy = recordEasyRound(
        {},
        "coach-sb-chmod-750",
        { solved: true, hintsUsed: 1, solutionShown: false, rebootPassed: true },
        NOW,
      );
      const medium = recordMediumRound(
        {},
        "coach-website-down",
        { solved: true, fullShadowTyped: true, hintsUsed: 0, solutionShown: false, firstTryInSession: true, rebootPassed: true },
        NOW,
      );
      const hard = recordRound({}, "coach-website-down", { solved: true, hintsUsed: 0, solutionShown: false, rebootPassed: true }, NOW);
      const extreme = recordExtremeRound({}, "coach-website-down", { solved: true, hintsUsed: 0, firstTryInSession: true, rebootPassed: true }, NOW);

      saveEasyProgress(easy);
      saveMediumProgress(medium);
      saveCoachProgress(hard);
      saveExtremeProgress(extreme);

      expect(loadEasyProgress()["coach-sb-chmod-750"].passed).toBe(true);
      expect(loadEasyProgress()["coach-website-down"]).toBeUndefined();
      expect(loadMediumProgress()["coach-sb-chmod-750"]).toBeUndefined();
      expect(loadCoachProgress()["coach-sb-chmod-750"]).toBeUndefined();
      expect(loadExtremeProgress()["coach-sb-chmod-750"]).toBeUndefined();

      for (const m of ["easy", "medium", "hard", "extreme"] as const) {
        saveCoachMode(m);
        expect(loadCoachMode()).toBe(m);
      }
    } finally {
      if (prevWindow === undefined) delete (globalThis as { window?: unknown }).window;
      else (globalThis as { window?: unknown }).window = prevWindow;
    }
  });

  it("keeps all standalone coach job & plan counts intact (8 sandbox tasks, 34 coach jobs across Easy/Medium/Hard/Extreme)", () => {
    expect(SANDBOX_TASKS).toHaveLength(8);
    expect(COACH_JOBS).toHaveLength(38);
    expect(Object.keys(EASY_PLANS)).toHaveLength(38);
    expect(Object.keys(MEDIUM_PLANS)).toHaveLength(38);
  });
});

describe("Phase 1 incident jobs (#10, #11, #12, #18–#24) state grading & guardrails", () => {
  it("#11 coach-ssh-key-server1 requires ~/admin moved to ~/.ssh/admin, mode 0600, owner user, and valid Host server1 config", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-ssh-key-server1")!;
    const session = createJobSession(job);

    const step1 = runCommandInSession(session, "mv ~/admin ~/.ssh/", "/home/user");
    expect(didCommandBurnFirstTry(job.id, parseCommand("mv ~/admin ~/.ssh/"), step1, step1.cwd)).toBe(false);
    expect(job.checkState!(session, "/home/user")).toBe(false);

    const step2 = runCommandInSession(session, "chmod 0600 ~/.ssh/admin", "/home/user");
    expect(didCommandBurnFirstTry(job.id, parseCommand("chmod 0600 ~/.ssh/admin"), step2, step2.cwd)).toBe(false);
    expect(job.checkState!(session, "/home/user")).toBe(false);

    const step3 = runCommandInSession(session, "chown $USER ~/.ssh/admin", "/home/user");
    expect(didCommandBurnFirstTry(job.id, parseCommand("chown $USER ~/.ssh/admin"), step3, step3.cwd)).toBe(false);
    expect(job.checkState!(session, "/home/user")).toBe(false);

    runCommandInSession(
      session,
      'printf "Host server1\\n  HostName server1\\n  Port 2222\\n  User admin\\n  IdentityFile ~/.ssh/admin\\n" > ~/.ssh/config',
      "/home/user",
    );
    expect(job.checkState!(session, "/home/user")).toBe(true);
  });

  it("#12 coach-install-httpd requires package installed, service active, and service enabled", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-install-httpd")!;
    const session = createJobSession(job);

    const s1 = runCommandInSession(session, "yum install httpd", "/home/user");
    expect(didCommandBurnFirstTry(job.id, parseCommand("yum install httpd"), s1, s1.cwd)).toBe(false);
    expect(job.checkState!(session, "/home/user")).toBe(false);

    const s2 = runCommandInSession(session, "systemctl start httpd", "/home/user");
    expect(didCommandBurnFirstTry(job.id, parseCommand("systemctl start httpd"), s2, s2.cwd)).toBe(false);
    expect(job.checkState!(session, "/home/user")).toBe(false);

    runCommandInSession(session, "systemctl enable httpd", "/home/user");
    expect(job.checkState!(session, "/home/user")).toBe(true);
  });

  it("#24 coach-deleted-open-file requires open deleted file released and disk space back while httpd stays running", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-deleted-open-file")!;
    const session = createJobSession(job);

    const dfBefore = runCommandInSession(session, "df -h", "/home/user");
    expect(didCommandBurnFirstTry(job.id, parseCommand("df -h"), dfBefore, dfBefore.cwd)).toBe(false);
    expect(job.checkState!(session, "/home/user")).toBe(false);

    const lsofBefore = runCommandInSession(session, "lsof | grep deleted", "/home/user");
    expect(didCommandBurnFirstTry(job.id, parseCommand("lsof | grep deleted"), lsofBefore, lsofBefore.cwd)).toBe(false);

    runCommandInSession(session, "systemctl restart httpd", "/home/user");
    expect(job.checkState!(session, "/home/user")).toBe(true);
  });
  it("#10 coach-restore-backup rejects stray /storefront or nested /opt/storefront/storefront and accepts -C /opt/", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-restore-backup")!;

    const wrongRoot = createJobSession(job);
    runCommandInSession(wrongRoot, "tar -xvf /backups/storefront.tar -C /", "/home/user");
    expect(job.checkState!(wrongRoot, "/home/user")).toBe(false);

    const wrongNested = createJobSession(job);
    runCommandInSession(wrongNested, "tar -xvf /backups/storefront.tar -C /opt/storefront", "/home/user");
    expect(job.checkState!(wrongNested, "/home/user")).toBe(false);

    const right = createJobSession(job);
    runCommandInSession(right, "tar -xvf /backups/storefront.tar -C /opt/", "/home/user");
    expect(job.checkState!(right, "/home/user")).toBe(true);
  });

  it("#18 coach-permission-denied rejects chmod 777 / world-open modes and accepts chgrp developers", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-permission-denied")!;

    const lazy777 = createJobSession(job);
    runCommandInSession(lazy777, "chmod 777 /srv/shared/release-plan.md", "/home/user");
    expect(job.checkState!(lazy777, "/home/user")).toBe(false);

    const lazy666 = createJobSession(job);
    runCommandInSession(lazy666, "chmod 666 /srv/shared/release-plan.md", "/home/user");
    expect(job.checkState!(lazy666, "/home/user")).toBe(false);

    const right = createJobSession(job);
    runCommandInSession(right, "chgrp developers /srv/shared/release-plan.md", "/home/user");
    expect(job.checkState!(right, "/home/user")).toBe(true);
  });

  it("#19 coach-cron-down requires cron both active and enabled while keeping crontab intact", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-cron-down")!;
    const session = createJobSession(job);

    const startOnly = runCommandInSession(session, "systemctl start cron", "/home/user");
    expect(job.checkState!(session, "/home/user")).toBe(false);
    expect(didCommandBurnFirstTry(job.id, parseCommand("systemctl start cron"), startOnly, startOnly.cwd)).toBe(false);

    runCommandInSession(session, "systemctl enable cron", "/home/user");
    expect(job.checkState!(session, "/home/user")).toBe(true);
    rebootSession(session);
    expect(job.checkState!(session, "/home/user")).toBe(true);
  });

  it("#20 coach-runaway-cpu allows polite kill 4412 without burning first try, rejects killing sshd, and passes on kill -9 4412", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-runaway-cpu")!;
    const session = createJobSession(job);

    const diag = runCommandInSession(session, "ps aux --sort=-%cpu", "/home/user");
    expect(didCommandBurnFirstTry(job.id, parseCommand("ps aux --sort=-%cpu"), diag, diag.cwd)).toBe(false);

    const polite = runCommandInSession(session, "kill 4412", "/home/user");
    expect(didCommandBurnFirstTry(job.id, parseCommand("kill 4412"), polite, polite.cwd)).toBe(false);
    expect(job.checkState!(session, "/home/user")).toBe(false);

    runCommandInSession(session, "kill -9 4412", "/home/user");
    expect(job.checkState!(session, "/home/user")).toBe(true);

    const killedSshd = createJobSession(job);
    runCommandInSession(killedSshd, "kill -9 1180", "/home/user");
    runCommandInSession(killedSshd, "kill -9 4412", "/home/user");
    expect(job.checkState!(killedSshd, "/home/user")).toBe(false);
  });

  it("#21 coach-disk-full rejects wiping live logs and passes when only app-debug.log.old is removed", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-disk-full")!;

    const wipedAll = createJobSession(job);
    runCommandInSession(wipedAll, "rm -f /var/log/*", "/home/user");
    expect(job.checkState!(wipedAll, "/home/user")).toBe(false);

    const right = createJobSession(job);
    runCommandInSession(right, "rm /var/log/app-debug.log.old", "/home/user");
    expect(job.checkState!(right, "/home/user")).toBe(true);
  });

  it("#22 coach-port-in-use allows kill 2847 then systemctl start httpd without burning Extreme first try", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-port-in-use")!;
    const session = createJobSession(job);

    const killRes = runCommandInSession(session, "kill 2847", "/home/user");
    expect(didCommandBurnFirstTry(job.id, parseCommand("kill 2847"), killRes, killRes.cwd)).toBe(false);
    expect(job.checkState!(session, "/home/user")).toBe(false);

    runCommandInSession(session, "systemctl start httpd", "/home/user");
    expect(job.checkState!(session, "/home/user")).toBe(true);
  });

  it("#23 coach-inodes-gone rejects deleting /var/spool itself and passes when maildrop files are cleared", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-inodes-gone")!;

    const wipedSpool = createJobSession(job);
    runCommandInSession(wipedSpool, "rm -rf /var/spool", "/home/user");
    expect(job.checkState!(wipedSpool, "/home/user")).toBe(false);

    const right = createJobSession(job);
    runCommandInSession(right, "rm -f /var/spool/maildrop/*", "/home/user");
    expect(job.checkState!(right, "/home/user")).toBe(true);
  });

  it("Batch 1 jobs (#27, #28, #25, #36) grade on real state and respect Extreme first-try guardrails", () => {
    // #27 coach-deleted-user-files
    const j27 = COACH_JOBS.find((j) => j.id === "coach-deleted-user-files")!;
    const s27 = createJobSession(j27);
    const find27 = runCommandInSession(s27, "find / -nouser", "/home/user");
    expect(didCommandBurnFirstTry(j27.id, parseCommand("find / -nouser"), find27, find27.cwd)).toBe(false);
    runCommandInSession(s27, "chown -R alice /srv/projects", "/home/user");
    expect(j27.checkState!(s27, "/home/user")).toBe(true);

    // #28 coach-service-journal
    const j28 = COACH_JOBS.find((j) => j.id === "coach-service-journal")!;
    const s28 = createJobSession(j28);
    const jctl = runCommandInSession(s28, "journalctl -u nginx", "/home/user");
    expect(didCommandBurnFirstTry(j28.id, parseCommand("journalctl -u nginx"), jctl, jctl.cwd)).toBe(false);
    const chmod28 = runCommandInSession(s28, "chmod +x /usr/sbin/nginx", "/home/user");
    expect(didCommandBurnFirstTry(j28.id, parseCommand("chmod +x /usr/sbin/nginx"), chmod28, chmod28.cwd)).toBe(false);
    runCommandInSession(s28, "systemctl restart nginx", "/home/user");
    expect(j28.checkState!(s28, "/home/user")).toBe(true);

    // #25 coach-script-not-found
    const j25 = COACH_JOBS.find((j) => j.id === "coach-script-not-found")!;
    const s25 = createJobSession(j25);
    const chmod25 = runCommandInSession(s25, "chmod +x script.sh", "/home/user");
    expect(didCommandBurnFirstTry(j25.id, parseCommand("chmod +x script.sh"), chmod25, chmod25.cwd)).toBe(false);
    expect(j25.checkState!(s25, "/home/user")).toBe(false);
    runCommandInSession(s25, "./script.sh", "/home/user");
    expect(j25.checkState!(s25, "/home/user")).toBe(true);

    // #36 coach-verify-checksum
    const j36 = COACH_JOBS.find((j) => j.id === "coach-verify-checksum")!;
    const s36 = createJobSession(j36);
    runCommandInSession(s36, "sha256sum -c /tmp/downloads/agent.tar.gz.sha256", "/home/user");
    expect(j36.checkState!(s36, "/home/user")).toBe(true);
  });

  it("Batch 2 jobs (#30, #31, #37) grade on real state and respect Extreme first-try guardrails", () => {
    // #30 coach-too-many-open-files
    const j30 = COACH_JOBS.find((j) => j.id === "coach-too-many-open-files")!;
    const s30 = createJobSession(j30);
    const uRead = runCommandInSession(s30, "ulimit -n", "/home/user");
    expect(didCommandBurnFirstTry(j30.id, parseCommand("ulimit -n"), uRead, uRead.cwd)).toBe(false);
    runCommandInSession(s30, "ulimit -n 4096", "/home/user");
    expect(j30.checkState!(s30, "/home/user")).toBe(true);

    // #31 coach-clock-wrong
    const j31 = COACH_JOBS.find((j) => j.id === "coach-clock-wrong")!;
    const s31 = createJobSession(j31);
    const tdStatus = runCommandInSession(s31, "timedatectl status", "/home/user");
    expect(didCommandBurnFirstTry(j31.id, parseCommand("timedatectl status"), tdStatus, tdStatus.cwd)).toBe(false);
    const cTrack = runCommandInSession(s31, "chronyc tracking", "/home/user");
    expect(didCommandBurnFirstTry(j31.id, parseCommand("chronyc tracking"), cTrack, cTrack.cwd)).toBe(false);
    runCommandInSession(s31, "timedatectl set-ntp true", "/home/user");
    runCommandInSession(s31, "chronyc makestep", "/home/user");
    expect(j31.checkState!(s31, "/home/user")).toBe(true);

    // #37 coach-zombie-processes
    const j37 = COACH_JOBS.find((j) => j.id === "coach-zombie-processes")!;
    const s37 = createJobSession(j37);
    const wrongKill = runCommandInSession(s37, "kill -9 3418", "/home/user");
    expect(didCommandBurnFirstTry(j37.id, parseCommand("kill -9 3418"), wrongKill, wrongKill.cwd)).toBe(true);
    expect(j37.checkState!(s37, "/home/user")).toBe(false);
    runCommandInSession(s37, "systemctl restart worker-mgr", "/home/user");
    expect(j37.checkState!(s37, "/home/user")).toBe(true);
  });

  it("Batch 3 jobs (#13, #14) grade on real state and respect Extreme first-try guardrails", () => {
    // #13 coach-who-logged-in
    const j13 = COACH_JOBS.find((j) => j.id === "coach-who-logged-in")!;
    const s13 = createJobSession(j13);
    runCommandInSession(s13, "awk '{ print $1 }' lastlog | sort | uniq > users.txt", "/home/user");
    expect(j13.checkState!(s13, "/home/user")).toBe(true);

    // #14 coach-squeeze-old-logs
    const j14 = COACH_JOBS.find((j) => j.id === "coach-squeeze-old-logs")!;
    const s14 = createJobSession(j14);
    const cmd14 = 'printf "#!/bin/bash\\nfor f in ~/logs/app.log.[1-6]; do gzip $f; done\\n" > script.sh';
    const w14 = runCommandInSession(s14, cmd14, "/home/user");
    expect(didCommandBurnFirstTry(j14.id, parseCommand(cmd14), w14, w14.cwd)).toBe(false);
    runCommandInSession(s14, "chmod +x script.sh", "/home/user");
    expect(j14.checkState!(s14, "/home/user")).toBe(false);
    runCommandInSession(s14, "./script.sh", "/home/user");
    expect(j14.checkState!(s14, "/home/user")).toBe(true);
  });

  it("Batch 4 jobs (#26, #29) grade on real state and respect Extreme first-try guardrails", () => {
    // #26 coach-new-user-login
    const j26 = COACH_JOBS.find((j) => j.id === "coach-new-user-login")!;
    const s26 = createJobSession(j26);
    const u1 = runCommandInSession(s26, "useradd -m alex", "/home/user");
    expect(didCommandBurnFirstTry(j26.id, parseCommand("useradd -m alex"), u1, u1.cwd)).toBe(false);
    expect(j26.checkState!(s26, "/home/user")).toBe(false);
    const u2 = runCommandInSession(s26, "passwd alex", "/home/user");
    expect(didCommandBurnFirstTry(j26.id, parseCommand("passwd alex"), u2, u2.cwd)).toBe(false);
    expect(j26.checkState!(s26, "/home/user")).toBe(false);
    runCommandInSession(s26, "usermod -aG developers alex", "/home/user");
    expect(j26.checkState!(s26, "/home/user")).toBe(true);

    // #29 coach-dns-broken
    const j29 = COACH_JOBS.find((j) => j.id === "coach-dns-broken")!;
    const s29 = createJobSession(j29);
    const d1 = runCommandInSession(s29, "dig example.com", "/home/user");
    expect(didCommandBurnFirstTry(j29.id, parseCommand("dig example.com"), d1, d1.cwd)).toBe(false);
    runCommandInSession(s29, 'echo "nameserver 8.8.8.8" > /etc/resolv.conf', "/home/user");
    expect(j29.checkState!(s29, "/home/user")).toBe(true);
  });

  it("Stretch Batch 5 jobs (#15, #16, #17, #32) grade on real state and respect Extreme first-try guardrails", () => {
    // #15 coach-new-drive
    const j15 = COACH_JOBS.find((j) => j.id === "coach-new-drive")!;
    const s15 = createJobSession(j15);
    runCommandInSession(s15, "parted -s /dev/sdc mklabel gpt", "/home/user");
    runCommandInSession(s15, "parted -s /dev/sdc mkpart primary ext4 1 10G", "/home/user");
    expect(j15.checkState!(s15, "/home/user")).toBe(false);
    runCommandInSession(s15, "mkfs.ext4 /dev/sdc1", "/home/user");
    expect(j15.checkState!(s15, "/home/user")).toBe(true);

    // #16 coach-grow-disk
    const j16 = COACH_JOBS.find((j) => j.id === "coach-grow-disk")!;
    const s16 = createJobSession(j16);
    runCommandInSession(s16, "pvcreate /dev/sdd", "/home/user");
    runCommandInSession(s16, "vgextend vgdata /dev/sdd", "/home/user");
    runCommandInSession(s16, "lvextend -L +10GB /dev/mapper/vgdata-data", "/home/user");
    expect(j16.checkState!(s16, "/home/user")).toBe(false);
    runCommandInSession(s16, "resize2fs /dev/mapper/vgdata-data", "/home/user");
    expect(j16.checkState!(s16, "/home/user")).toBe(true);

    // #17 coach-deleted-volume
    const j17 = COACH_JOBS.find((j) => j.id === "coach-deleted-volume")!;
    const s17 = createJobSession(j17);
    runCommandInSession(s17, "vgcfgrestore -f /etc/lvm/archive/vg_replays_00041.vg vg_replays", "/home/user");
    runCommandInSession(s17, "lvchange -a y /dev/vg_replays/lv_matches", "/home/user");
    expect(j17.checkState!(s17, "/home/user")).toBe(false);
    runCommandInSession(s17, "mount -a", "/home/user");
    expect(j17.checkState!(s17, "/home/user")).toBe(true);

    // #32 coach-firewall-ssh
    const j32 = COACH_JOBS.find((j) => j.id === "coach-firewall-ssh")!;
    const s32 = createJobSession(j32);
    const badDisable = runCommandInSession(s32, "ufw disable", "/home/user");
    expect(didCommandBurnFirstTry(j32.id, parseCommand("ufw disable"), badDisable, badDisable.cwd)).toBe(true);
    expect(j32.checkState!(s32, "/home/user")).toBe(false);

    const s32Good = createJobSession(j32);
    runCommandInSession(s32Good, "ufw allow 22/tcp", "/home/user");
    expect(j32GoodCheck(j32, s32Good)).toBe(true);
  });

  it("Stretch Batch 6 jobs (#33, #34, #35, #38) grade on real state and respect Extreme first-try guardrails", () => {
    // #33 coach-umount-busy
    const j33 = COACH_JOBS.find((j) => j.id === "coach-umount-busy")!;
    const s33 = createJobSession(j33);
    const lsof33 = runCommandInSession(s33, "lsof /mnt/backup", "/home/user");
    expect(lsof33.output.join("\n")).toContain("5320");
    runCommandInSession(s33, "kill 5320", "/home/user");
    expect(j33.checkState!(s33, "/home/user")).toBe(false);
    runCommandInSession(s33, "umount /mnt/backup", "/home/user");
    expect(j33.checkState!(s33, "/home/user")).toBe(true);

    // #34 coach-script-service
    const j34 = COACH_JOBS.find((j) => j.id === "coach-script-service")!;
    const s34 = createJobSession(j34);
    runCommandInSession(
      s34,
      'printf "[Service]\\nExecStart=/usr/local/bin/healthd.sh\\n[Install]\\nWantedBy=multi-user.target\\n" > /etc/systemd/system/healthd.service',
      "/home/user",
    );
    expect(j34.checkState!(s34, "/home/user")).toBe(false);
    runCommandInSession(s34, "systemctl enable --now healthd", "/home/user");
    expect(j34.checkState!(s34, "/home/user")).toBe(true);

    // #35 coach-bad-interpreter
    const j35 = COACH_JOBS.find((j) => j.id === "coach-bad-interpreter")!;
    const s35 = createJobSession(j35);
    const badRun = runCommandInSession(s35, "./deploy.sh", "/home/user");
    expect(badRun.output.join("\n")).toContain("bad interpreter");
    runCommandInSession(s35, "dos2unix deploy.sh", "/home/user");
    expect(j35.checkState!(s35, "/home/user")).toBe(false);
    runCommandInSession(s35, "./deploy.sh", "/home/user");
    expect(j35.checkState!(s35, "/home/user")).toBe(true);

    // #38 coach-logrotate
    const j38 = COACH_JOBS.find((j) => j.id === "coach-logrotate")!;
    const s38 = createJobSession(j38);
    runCommandInSession(
      s38,
      'printf "/var/log/myapp/*.log {\\n  daily\\n  rotate 7\\n  compress\\n}\\n" > /etc/logrotate.d/myapp',
      "/home/user",
    );
    expect(j38.checkState!(s38, "/home/user")).toBe(false);
    runCommandInSession(s38, "logrotate -f /etc/logrotate.d/myapp", "/home/user");
    expect(j38.checkState!(s38, "/home/user")).toBe(true);
  });
});

function j32GoodCheck(job: (typeof COACH_JOBS)[number], session: ReturnType<typeof createJobSession>): boolean {
  return Boolean(job.checkState!(session, "/home/user"));
}
