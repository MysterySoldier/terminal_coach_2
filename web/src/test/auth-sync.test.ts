import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ALLOWED_AUTH_ORIGINS,
  formatTerminalPrompt,
  loadAuthAccount,
  mergeAllProgress,
  resolvePromptUsername,
  sanitizePromptName,
  saveAuthAccount,
  syncWithCloud,
} from "@/lib/auth-sync";
import { clearAllState } from "@/lib/storage";

describe("auth-sync: prompt name sanitization, auth profile, and merge-by-best cloud sync", () => {
  const store = new Map<string, string>();
  let prevWindow: unknown;

  beforeEach(() => {
    store.clear();
    prevWindow = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        get length() {
          return store.size;
        },
        key: (i: number) => Array.from(store.keys())[i] ?? null,
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
    clearAllState();
  });

  afterEach(() => {
    if (prevWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else (globalThis as { window?: unknown }).window = prevWindow;
  });

  it("sanitizes prompt display names to letters, numbers, underscore, and hyphen while keeping exact case", () => {
    expect(sanitizePromptName("MysterySoldier")).toBe("MysterySoldier");
    expect(sanitizePromptName("Tobias_K-99")).toBe("Tobias_K-99");
    expect(sanitizePromptName("Mystery Soldier! @#$%^&*()")).toBe("MysterySoldier");
    expect(sanitizePromptName("   $$$   ")).toBe("user");
    expect(sanitizePromptName("")).toBe("user");
    expect(sanitizePromptName(null)).toBe("user");
  });

  it("keeps user@coach:~$ for guests and uses <name>@coach:~$ when signed in", () => {
    expect(resolvePromptUsername(null)).toBe("user");
    expect(formatTerminalPrompt("/home/user", resolvePromptUsername(null))).toBe("user@coach:~$");

    const signedIn = { googleId: "google-123", displayName: "MysterySoldier", familyName: "Kennedy" };
    expect(resolvePromptUsername(signedIn)).toBe("MysterySoldier");
    expect(formatTerminalPrompt("/home/user", resolvePromptUsername(signedIn))).toBe("MysterySoldier@coach:~$");
    expect(formatTerminalPrompt("/var/log", resolvePromptUsername(signedIn))).toBe("MysterySoldier@coach:/var/log$");

    saveAuthAccount(signedIn);
    expect(loadAuthAccount()).toEqual(signedIn);
    saveAuthAccount(null);
    expect(loadAuthAccount()).toBeNull();
  });

  it("includes both mysterylabs-coach.pages.dev and coach.mysterylabs.dev in allowed auth origins", () => {
    expect(ALLOWED_AUTH_ORIGINS).toContain("https://mysterylabs-coach.pages.dev");
    expect(ALLOWED_AUTH_ORIGINS).toContain("https://coach.mysterylabs.dev");
  });

  it("merges Easy, Medium, Hard, and Extreme progress by best pass without ever overwriting a pass with not-passed", () => {
    const deviceA = {
      easy: {
        "cmd-ls": {
          viewed: true,
          viewedAt: 1000,
        },
      },
      medium: {
        "coach-website-down": {
          attempts: 1,
          status: "passed" as const,
          passedAt: 1100,
          rebootPassed: true,
        },
        "coach-disk-full": {
          attempts: 1,
          status: "failed" as const,
          passedAt: null,
          rebootPassed: false,
        },
      },
      hard: {
        "coach-website-down": {
          attempts: 1,
          coldPasses: 1,
          solvedWithHelp: false,
          lastColdPassAt: 1200,
          nextRetestAt: 1200 + 3 * 86400000,
          rebootPassed: true,
        },
      },
      extreme: {
        "coach-website-down": {
          attempts: 1,
          stage: "awaiting-retest" as const,
          firstColdPassAt: 2000,
          nextRetestAt: 2000 + 3 * 86400000,
          completedAt: null,
          rebootPassed: true,
        },
        "coach-restore-backup": {
          attempts: 2,
          stage: "complete" as const,
          firstColdPassAt: 1000,
          nextRetestAt: null,
          completedAt: 5000,
          rebootPassed: false,
        },
      },
    };

    const deviceB = {
      easy: {
        "cmd-chmod": {
          viewed: true,
          viewedAt: 3000,
        },
      },
      medium: {
        "coach-website-down": {
          attempts: 2,
          status: "not-done" as const,
          passedAt: null,
          rebootPassed: false,
        },
        "coach-disk-full": {
          attempts: 2,
          status: "passed" as const,
          passedAt: 3100,
          rebootPassed: false,
        },
      },
      hard: {
        "coach-website-down": {
          attempts: 2,
          coldPasses: 0,
          solvedWithHelp: true,
          lastColdPassAt: null,
          nextRetestAt: null,
          rebootPassed: false,
        },
      },
      extreme: {
        "coach-website-down": {
          attempts: 1,
          stage: "not-done" as const,
          firstColdPassAt: null,
          nextRetestAt: null,
          completedAt: null,
          rebootPassed: false,
        },
        "coach-restore-backup": {
          attempts: 1,
          stage: "awaiting-retest" as const,
          firstColdPassAt: 1500,
          nextRetestAt: 1500 + 3 * 86400000,
          completedAt: null,
          rebootPassed: false,
        },
      },
    };

    const merged = mergeAllProgress(deviceA, deviceB);

    // Easy: union of viewed commands across devices
    expect(merged.easy["cmd-ls"]?.viewed).toBe(true);
    expect(merged.easy["cmd-ls"]?.viewedAt).toBe(1000);
    expect(merged.easy["cmd-chmod"]?.viewed).toBe(true);
    expect(merged.easy["cmd-chmod"]?.viewedAt).toBe(3000);

    // Medium: passed beats not-done and failed
    expect(merged.medium["coach-website-down"].status).toBe("passed");
    expect(merged.medium["coach-disk-full"].status).toBe("passed");

    // Hard: coldPasses > 0 preserved
    expect(merged.hard["coach-website-down"].coldPasses).toBe(1);
    expect(merged.hard["coach-website-down"].rebootPassed).toBe(true);
    expect(merged.hard["coach-website-down"].nextRetestAt).toBe(1200 + 3 * 86400000);

    // Extreme: awaiting-retest (3-day lock) beats not-done; complete beats awaiting-retest
    expect(merged.extreme["coach-website-down"].stage).toBe("awaiting-retest");
    expect(merged.extreme["coach-website-down"].firstColdPassAt).toBe(2000);
    expect(merged.extreme["coach-website-down"].nextRetestAt).toBe(2000 + 3 * 86400000);
    expect(merged.extreme["coach-restore-backup"].stage).toBe("complete");
    expect(merged.extreme["coach-restore-backup"].completedAt).toBe(5000);
  });

  it("syncs account progress across sessions via syncWithCloud fallback when offline", async () => {
    const session1Progress = {
      easy: {
        "cmd-chmod": {
          viewed: true,
          viewedAt: 5000,
        },
      },
      medium: {},
      hard: {},
      extreme: {},
    };

    const res1 = await syncWithCloud({
      googleId: "google-test-sync-1",
      displayName: "MysterySoldier",
      familyName: "Kennedy",
      promptColor: "#fb923c",
      commandColor: "#c084fc",
      progress: session1Progress,
    });

    expect(res1.account.displayName).toBe("MysterySoldier");
    expect(res1.account.promptColor).toBe("#fb923c");
    expect(res1.account.commandColor).toBe("#c084fc");
    expect(res1.account.progress.easy["cmd-chmod"]?.viewed).toBe(true);

    // Second session signing in with empty local progress receives session 1's viewed commands and colors
    const res2 = await syncWithCloud({
      googleId: "google-test-sync-1",
      progress: { easy: {}, medium: {}, hard: {}, extreme: {} },
    });

    expect(res2.account.displayName).toBe("MysterySoldier");
    expect(res2.account.familyName).toBe("Kennedy");
    expect(res2.account.promptColor).toBe("#fb923c");
    expect(res2.account.commandColor).toBe("#c084fc");
    expect(res2.account.progress.easy["cmd-chmod"]?.viewed).toBe(true);
  });
});
