import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { render } from "vitest-browser-react";

import { AppRoutes } from "@/App";
import { CardAudioProvider } from "@/hooks/useCardAudio";
import {
  loadCoachProgress,
  loadEasyProgress,
  loadExtremeProgress,
  loadMediumProgress,
  type ActiveCoachMode,
} from "@/lib/coach";
import { getDefaultSession, getNode } from "@/lib/terminal-engine";
import Coach from "@/pages/Coach";
import { StudyProvider } from "@/store/study-store";
import { CoachThemeProvider } from "@/store/theme-store";

async function renderCoach(props: { initialMode?: ActiveCoachMode; initialJobId?: string } = {}) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  return render(
    <StudyProvider>
      <CardAudioProvider>
        <Coach initialMode={props.initialMode} initialJobId={props.initialJobId} />
      </CardAudioProvider>
    </StudyProvider>,
  );
}

async function renderCoachApp(initialPath = "/coach") {
  window.localStorage.clear();
  window.sessionStorage.clear();
  return render(
    <CoachThemeProvider>
      <CardAudioProvider>
        <MemoryRouter
          initialEntries={[initialPath]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      </CardAudioProvider>
    </CoachThemeProvider>,
  );
}

async function typeCommand(screen: Awaited<ReturnType<typeof render>>, command: string) {
  const input = screen.getByLabelText(/user@coach/);
  await input.fill(command);
  const el = input.element() as HTMLInputElement;
  el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
}

function dropdownOptionTexts(screen: Awaited<ReturnType<typeof render>>, slotNumber: number): string[] {
  const select = screen.getByTestId(`easy-slot-${slotNumber}`).element() as HTMLSelectElement;
  return Array.from(select.options).map((opt) => opt.textContent?.trim() ?? "");
}

async function pickDropdownWord(
  screen: Awaited<ReturnType<typeof render>>,
  slotNumber: number,
  wordText: string,
): Promise<void> {
  const select = screen.getByTestId(`easy-slot-${slotNumber}`).element() as HTMLSelectElement;
  const match =
    wordText === ""
      ? select.options[0]
      : Array.from(select.options).find((opt) => opt.textContent?.trim() === wordText);
  expect(match).toBeDefined();
  select.value = match!.value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

test("coach: the website-down job is solved cold and survives the reboot test", async () => {
  const playedSources: string[] = [];
  const nativePlay = window.HTMLMediaElement.prototype.play;
  const playSpy = vi
    .spyOn(window.HTMLMediaElement.prototype, "play")
    .mockImplementation(function (this: HTMLMediaElement) {
      const src = this.currentSrc || this.src;
      if (src) {
        playedSources.push(src);
      }
      if (src.endsWith("/audio/coach-echo-intro.mp3")) {
        return Promise.resolve();
      }
      return nativePlay.call(this);
    });

  try {
    const screen = await renderCoach();

    await expect.element(screen.getByRole("heading", { name: "Coach Echo — Over Your Shoulder", exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText("Over Your Shoulder — Coach")).not.toBeInTheDocument();
    await expect.element(screen.getByText(/Job 1 of 19: The website is down/)).toBeInTheDocument();
    await expect.element(screen.getByText(/No points, no streaks/)).toBeInTheDocument();

    // Echo intro plays once when Coach opens if not yet played in session; coach instructions do NOT auto-play.
    await expect.poll(() => window.sessionStorage.getItem("coachEchoIntroPlayed")).toBe("1");
    expect(playedSources.filter((src) => src.endsWith("/audio/coach-echo-intro.mp3"))).toHaveLength(1);
    expect(playedSources.filter((src) => src.startsWith("blob:"))).toHaveLength(0);

    // Speaker button sits in the same row as the Job title line, above the job description text; restart icon sits right next to it.
    const titleLineEl = screen.getByText(/Job 1 of 19: The website is down/).element();
    const jobTextEl = screen.getByText(/Your job: get it back up/).element();
    const instrSpeaker = screen.getByTestId("hear-instructions-button");
    const hardRestartBtn = screen.getByTestId("restart-job-button");
    expect(titleLineEl.parentElement).toBe(instrSpeaker.element().parentElement?.parentElement);
    expect(instrSpeaker.element().compareDocumentPosition(jobTextEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(jobTextEl.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      instrSpeaker.element().getBoundingClientRect().bottom,
    );
    expect(hardRestartBtn.element().textContent?.trim()).toBe("");
    expect(document.querySelector('[aria-label="Terminal output"]')!.contains(hardRestartBtn.element())).toBe(true);
    expect(instrSpeaker.element().getBoundingClientRect().right).toBeLessThanOrEqual(
      hardRestartBtn.element().getBoundingClientRect().left,
    );
    await expect.element(screen.getByText(/Job 1 of 19 ·/)).not.toBeInTheDocument();
    await expect.element(instrSpeaker).toHaveAttribute("aria-pressed", "false");
    await instrSpeaker.click();
    await expect.element(instrSpeaker).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => playedSources.filter((src) => src.startsWith("blob:")).length).toBe(1);
    await instrSpeaker.click();
    await expect.element(instrSpeaker).toHaveAttribute("aria-pressed", "false");

    // Top job list pills are removed; bottom shows only the next job's name.
    expect(document.querySelector('section[aria-label="Jobs"]')).toBeNull();
    await expect.element(screen.getByTestId("next-job-button")).toHaveTextContent(
      "See everything in your home folder",
    );

    // The website is down at the start: prove it, verify top restart icon resets the terminal, then fix it.
    await typeCommand(screen, "curl localhost");
    await expect.element(screen.getByText(/Connection refused/)).toBeInTheDocument();
    await hardRestartBtn.click();
    await expect.element(screen.getByText(/Connection refused/)).not.toBeInTheDocument();

    // Fix it the durable way, with no hints.
    await typeCommand(screen, "systemctl enable --now nginx");
    await expect.element(screen.getByText(/Proof — all four must be true/)).toBeInTheDocument();
    await expect.element(screen.getByText(/no hints, no solution shown/)).toBeInTheDocument();
    await expect.element(screen.getByRole("button", { name: /Test reboot/i })).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/test reboot/i);

    const hardProofItems = Array.from(document.querySelectorAll('section[aria-label="Proof checks"] li')).map(
      (li) => li.textContent ?? "",
    );
    expect(hardProofItems).toHaveLength(4);
    expect(hardProofItems[2]).toMatch(/The fix survives a reboot — not tested yet\. Type reboot in the terminal\./);
    expect(hardProofItems[3]).toMatch(/three days/i);

    // Typing `reboot` in the terminal is the only way the reboot proof counts.
    await typeCommand(screen, "reboot");
    await expect.element(screen.getByText(/It survived the reboot/)).toBeInTheDocument();
    await expect.element(screen.getByText(/The fix survives a reboot — tested\./)).toBeInTheDocument();
    expect(loadCoachProgress()["coach-website-down"]?.rebootPassed).toBe(true);

    // And the website really answers now.
    await typeCommand(screen, "curl localhost");
    await expect.element(screen.getByText(/it works/)).toBeInTheDocument();
  } finally {
    playSpy.mockRestore();
  }
});

test("coach: '?' hint icon costs the cold pass, bottom next-job button advances jobs, and chmod is graded on state", async () => {
  const screen = await renderCoach();

  // Ask for one hint via the header '?' icon on the first job: the round can no longer be cold.
  const hintBtn = screen.getByRole("button", { name: /^Hint/ });
  expect(hintBtn.element().textContent?.trim()).toBe("");
  await hintBtn.click();
  await expect.element(screen.getByText(/Is that program running right now/)).toBeInTheDocument();

  // Advance to Job 4 (Lock down deploy.sh) using the bottom next-job link.
  await screen.getByTestId("next-job-button").click(); // -> Job 2
  await screen.getByTestId("next-job-button").click(); // -> Job 3
  await screen.getByTestId("next-job-button").click(); // -> Job 4
  await expect.element(screen.getByText(/Job 4 of 19: Lock down deploy\.sh/)).toBeInTheDocument();

  await typeCommand(screen, "chmod 750 deploy.sh");
  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();

  // ls -l shows the new mode — the shell told the truth.
  await typeCommand(screen, "ls -l deploy.sh");
  await expect.element(screen.getByText(/^-rwxr-x---\s+1 user/)).toBeInTheDocument();
});

test("coach: 'Where You Stand' section is removed and there is no XP, no streak, no leaderboard", async () => {
  const screen = await renderCoach();
  await expect.element(screen.getByText(/Where you stand/i)).not.toBeInTheDocument();
  expect(document.querySelector('section[aria-label="Readiness report"]')).toBeNull();
  await expect.element(screen.getByText(/Easy: 0 of 16 jobs passed\./)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/0 of 16 jobs done cold/)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/Extreme: 0 of 16 jobs proved cold twice\./)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/Next job:/)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/Next in Easy:/)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/Total XP/)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/Leaderboard/)).not.toBeInTheDocument();
});

test("coach extreme: mode picker shows all 4 modes selectable, hides hints and solutions, and locks a cold-solved job for 3 days", async () => {
  const screen = await renderCoachApp("/coach?job=coach-sb-chmod-750");

  const easyBtn = screen.getByRole("button", { name: /^Easy$/i });
  const mediumBtn = screen.getByRole("button", { name: /^Medium$/i });
  const hardBtn = screen.getByRole("button", { name: /^Hard$/i });
  const extremeBtn = screen.getByRole("button", { name: /^Extreme$/i });

  await expect.element(easyBtn).toBeEnabled();
  await expect.element(mediumBtn).toBeEnabled();
  await expect.element(hardBtn).toBeEnabled();
  await expect.element(extremeBtn).toBeEnabled();

  await extremeBtn.click();

  // Rule 1: no hint button and no solution button anywhere in Extreme mode.
  await expect.element(screen.getByRole("button", { name: /Hint/ })).not.toBeInTheDocument();
  await expect.element(screen.getByRole("button", { name: /solution/i })).not.toBeInTheDocument();

  // Solve Job 4 (Lock down deploy.sh) cold on first try.
  await typeCommand(screen, "chmod 750 deploy.sh");

  await expect.element(screen.getByText(/Locked for three days — pass the cold retest in three days/)).toBeInTheDocument();
  expect(loadExtremeProgress()["coach-sb-chmod-750"]?.stage).toBe("awaiting-retest");

  // Advance to Job 5 via bottom next-job link, then re-open Job 4 from the Jobs tab -> locked & disabled.
  await screen.getByTestId("next-job-button").click();
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
  await screen.getByTestId("job-row-coach-sb-chmod-750").click();
  await expect.element(screen.getByLabelText(/user@coach/)).toBeDisabled();

  // Open Job 1 (website-down) in Extreme mode: cold pass shows "Proof — all four must be true",
  // 3-day lock is LAST (4th), no Test reboot button, and typing `reboot` marks reboot proof true.
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
  await screen.getByTestId("job-row-coach-website-down").click();
  await typeCommand(screen, "systemctl enable --now nginx");

  await expect.element(screen.getByText("Proof — all four must be true", { exact: true })).toBeInTheDocument();
  await expect.element(screen.getByRole("button", { name: /Test reboot/i })).not.toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/test reboot/i);

  const extremeProofItems = Array.from(document.querySelectorAll('section[aria-label="Proof checks"] li')).map(
    (li) => li.textContent ?? "",
  );
  expect(extremeProofItems).toHaveLength(4);
  expect(extremeProofItems[0]).toMatch(/actually works/);
  expect(extremeProofItems[1]).toMatch(/Solved cold on your first try/);
  expect(extremeProofItems[2]).toMatch(/The fix survives a reboot — not tested yet\. Type reboot in the terminal\./);
  expect(extremeProofItems[3]).toMatch(/Locked for three days — pass the cold retest in three days/);

  await typeCommand(screen, "reboot");
  await expect.element(screen.getByText(/The fix survives a reboot — tested\./)).toBeInTheDocument();
  expect(loadExtremeProgress()["coach-website-down"]?.rebootPassed).toBe(true);
});

test("coach extreme: a wrong first try burns the session so a second try does not count", async () => {
  const screen = await renderCoach({ initialMode: "extreme", initialJobId: "coach-sb-chmod-750" });

  // Wrong chmod burns the first try in this session.
  await typeCommand(screen, "chmod 755 deploy.sh");
  await expect.element(screen.getByText(/did not finish the job on the first try/)).toBeInTheDocument();

  // Solving afterwards in the same session does not lock or count for Extreme.
  await typeCommand(screen, "chmod 750 deploy.sh");
  await expect.element(screen.getByText(/not solved cold on your first try in this session/)).toBeInTheDocument();
  await expect.element(screen.getByText(/Not counted for Extreme/)).toBeInTheDocument();
  expect(loadExtremeProgress()["coach-sb-chmod-750"]?.stage).toBe("not-done");
});

test("coach medium: shadow text visible, '?' Hint present, cold shadow solve marks green, hint solve marks yellow, Extreme still has 0 hints", async () => {
  const screen = await renderCoach();

  const easyBtn = screen.getByRole("button", { name: /^Easy$/i });
  const mediumBtn = screen.getByRole("button", { name: /^Medium$/i });
  await expect.element(easyBtn).toBeEnabled();
  await expect.element(mediumBtn).toBeEnabled();

  await mediumBtn.click();

  // Shadow text visible for Job 1, '?' Hint icon button present, step-by-step walkthrough card visible.
  await expect.element(screen.getByTestId("shadow-remaining")).toHaveTextContent("systemctl enable --now nginx");
  await expect.element(screen.getByRole("button", { name: /^Hint/ })).toBeInTheDocument();
  await expect.element(screen.getByText(/Coach walkthrough/i)).toBeInTheDocument();

  // Wrong key does not advance past matched prefix; status becomes working while typing.
  const input = screen.getByLabelText(/user@coach/);
  await input.fill("sysx");
  await expect.element(input).toHaveValue("sys");
  await expect.element(screen.getByTestId("shadow-remaining")).toHaveTextContent("temctl enable --now nginx");
  await expect.element(screen.getByTestId("medium-status-badge")).toHaveTextContent("working");

  // Complete Job 1 cold over the shadow -> marks green (Medium pass).
  await typeCommand(screen, "systemctl enable --now nginx");
  await expect.element(screen.getByTestId("medium-status-badge")).toHaveTextContent("Medium pass");
  expect(Object.values(loadMediumProgress()).filter((r) => r.status === "passed")).toHaveLength(1);

  // Advance to Job 2 via bottom next-job button, use '?' Hint, and finish -> marks yellow (hint used), does NOT increment pass count.
  await screen.getByTestId("next-job-button").click();
  await screen.getByRole("button", { name: /^Hint/ }).click();
  await expect.element(screen.getByTestId("medium-status-badge")).toHaveTextContent("hint used");
  await typeCommand(screen, "ls -la");
  await expect.element(screen.getByTestId("medium-status-badge")).toHaveTextContent("hint used");
  expect(Object.values(loadMediumProgress()).filter((r) => r.status === "passed")).toHaveLength(1);

  // Switch to Extreme -> still 0 hints and 0 solution buttons.
  await screen.getByRole("button", { name: /^Extreme$/i }).click();
  await expect.element(screen.getByRole("button", { name: /Hint/ })).not.toBeInTheDocument();
  await expect.element(screen.getByRole("button", { name: /solution/i })).not.toBeInTheDocument();
});

test("coach easy: dropdown word slots, exclusive choices, tap chosen word meaning, '>' Run icon, header icons, and truthful chmod 750", async () => {
  const screen = await renderCoachApp("/coach");

  // Select Easy mode in the mode picker
  const easyBtn = screen.getByRole("button", { name: /^Easy$/i });
  await expect.element(easyBtn).toBeEnabled();
  await easyBtn.click();

  // Shortened header 'WORD BLOCKS' (no 'NO TYPING', no Available word blocks bank, no Clear tray, no top job pills)
  await expect.element(screen.getByText("WORD BLOCKS", { exact: true })).toBeInTheDocument();
  await expect.element(screen.getByText(/no typing/i)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/Available word blocks/i)).not.toBeInTheDocument();
  await expect.element(screen.getByRole("button", { name: /Clear tray/i })).not.toBeInTheDocument();
  expect(document.querySelector('section[aria-label="Jobs"]')).toBeNull();

  // Panel order in Easy mode: Mode pills -> Terminal output -> WORD BLOCKS -> Coach controls / Next job
  const modePickerRect = document.querySelector('section[aria-label="Coach mode"]')!.getBoundingClientRect();
  const terminalRect = document.querySelector('[aria-label="Terminal output"]')!.getBoundingClientRect();
  const wordBlocksRect = document.querySelector('section[aria-label="Easy word block builder"]')!.getBoundingClientRect();
  const giveUpRect = screen.getByRole("button", { name: /Give up — show the solution/i }).element().getBoundingClientRect();
  const nextJobRect = screen.getByTestId("next-job-button").element().getBoundingClientRect();
  expect(modePickerRect.bottom).toBeLessThanOrEqual(terminalRect.top);
  expect(terminalRect.bottom).toBeLessThanOrEqual(wordBlocksRect.top);
  expect(wordBlocksRect.bottom).toBeLessThanOrEqual(giveUpRect.top);
  expect(giveUpRect.bottom).toBeLessThanOrEqual(nextJobRect.top);

  // Speaker button sits on the Job title row + WORD BLOCKS header row: WORD BLOCKS | status badge | speaker | ? | restart
  const easyTitleEl = screen.getByText(/Job 1 of 19: The website is down/).element();
  const easyJobTextEl = screen.getByText(/Your job: get it back up/).element();
  const instrSpeakerBtn = screen.getByTestId("hear-instructions-button");
  expect(easyTitleEl.parentElement).toBe(instrSpeakerBtn.element().parentElement?.parentElement);
  expect(easyJobTextEl.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    instrSpeakerBtn.element().getBoundingClientRect().bottom,
  );
  const statusBadge = screen.getByTestId("easy-status-badge");
  const hearGuideBtn = screen.getByTestId("hear-guide-button");
  const hintBtn = screen.getByTestId("hint-button");
  const restartBtn = screen.getByTestId("restart-job-button");
  const runBtn = screen.getByTestId("easy-run-button");
  await expect.element(instrSpeakerBtn).toHaveAttribute("aria-label", "Hear instructions");
  await expect.element(hearGuideBtn).toHaveAttribute("aria-label", "Hear guide");
  await expect.element(restartBtn).toHaveAttribute("aria-label", "Start this job again");
  expect(hearGuideBtn.element().textContent?.trim()).toBe("");
  expect(hintBtn.element().textContent?.trim()).toBe("");
  expect(restartBtn.element().textContent?.trim()).toBe("");
  expect(runBtn.element().textContent?.trim()).toBe("");
  expect(document.querySelector('section[aria-label="Easy word block builder"]')!.contains(restartBtn.element())).toBe(
    true,
  );
  expect(document.querySelector('[aria-label="Terminal output"]')!.contains(restartBtn.element())).toBe(false);
  const wordBlocksLabel = screen.getByText("WORD BLOCKS", { exact: true }).element();
  expect(wordBlocksLabel.compareDocumentPosition(statusBadge.element()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(statusBadge.element().compareDocumentPosition(hearGuideBtn.element()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(hearGuideBtn.element().getBoundingClientRect().right).toBeLessThanOrEqual(
    hintBtn.element().getBoundingClientRect().left,
  );
  expect(hintBtn.element().getBoundingClientRect().right).toBeLessThanOrEqual(
    restartBtn.element().getBoundingClientRect().left,
  );
  await expect.element(screen.getByText(/Job 1 of 19 ·/)).not.toBeInTheDocument();
  expect(
    document.querySelector('section[aria-label="Easy word block builder"]')!.querySelectorAll("svg.lucide-volume-2")
      .length,
  ).toBe(1);
  expect(document.querySelectorAll("svg.lucide-volume-2").length).toBe(2);

  // No typing input and no 'Where you stand' section in Easy mode
  await expect.element(screen.getByLabelText(/user@coach/)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/Where you stand/i)).not.toBeInTheDocument();
  expect(Object.values(loadEasyProgress()).filter((r) => r.passed)).toHaveLength(0);

  // Job 1 (website-down): reboot dropdown is NOT shown before the fix passes
  expect(dropdownOptionTexts(screen, 1)).not.toContain("reboot");
  await pickDropdownWord(screen, 1, "systemctl");
  await pickDropdownWord(screen, 2, "enable");
  await pickDropdownWord(screen, 3, "--now");
  await pickDropdownWord(screen, 4, "nginx");
  await runBtn.click();

  await expect
    .element(screen.getByText(/Pick reboot in the word blocks below and tap Run to watch the fix survive a restart\./))
    .toBeInTheDocument();
  await expect.element(screen.getByText(/Easy word-block check/i)).not.toBeInTheDocument();
  expect(document.querySelector('section[aria-label="Proof checks"]')).toBeNull();
  expect(document.body.textContent).not.toMatch(/test reboot/i);
  expect(dropdownOptionTexts(screen, 1)).toContain("reboot");
  expect(document.querySelector('[data-testid="easy-slot-2"]')).toBeNull();

  await pickDropdownWord(screen, 1, "reboot");
  await runBtn.click();
  await expect
    .element(screen.getByText(/It survived the reboot\. The fix is real — the website is still up after a restart\./))
    .toBeInTheDocument();
  expect(document.querySelector('section[aria-label="Proof checks"]')).toBeNull();
  expect(loadEasyProgress()["coach-website-down"]?.rebootPassed).toBe(true);

  // Navigate to Job 4 (Lock down deploy.sh) via bottom next-job button
  await screen.getByTestId("next-job-button").click(); // Job 2
  await screen.getByTestId("next-job-button").click(); // Job 3
  await screen.getByTestId("next-job-button").click(); // Job 4
  expect(getNode("/home/user/deploy.sh")?.mode).toBe(0o644);
  await expect.element(screen.getByText(/^-rw-r--r--\s+1 user/)).toBeInTheDocument();

  // Pick wrong order first ([750] [chmod] [deploy.sh]), verify restart icon clears the picked slot, then test exclusive dropdowns
  await pickDropdownWord(screen, 1, "750");
  expect((screen.getByTestId("easy-slot-1").element() as HTMLSelectElement).value).not.toBe("");
  await screen.getByTestId("restart-job-button").click();
  expect((screen.getByTestId("easy-slot-1").element() as HTMLSelectElement).value).toBe("");

  await pickDropdownWord(screen, 1, "750");
  await expect.element(screen.getByTestId("easy-block-meaning")).toHaveTextContent(
    "owner full control, group read and run, others nothing",
  );
  expect(dropdownOptionTexts(screen, 2)).not.toContain("750");
  expect(dropdownOptionTexts(screen, 3)).not.toContain("750");

  await pickDropdownWord(screen, 2, "chmod");
  await expect.element(screen.getByTestId("easy-block-meaning")).toHaveTextContent("change who can use this");
  expect(dropdownOptionTexts(screen, 3)).not.toContain("750");
  expect(dropdownOptionTexts(screen, 3)).not.toContain("chmod");

  await pickDropdownWord(screen, 3, "deploy.sh");
  await expect.element(screen.getByTestId("easy-block-meaning")).toHaveTextContent("the file");

  // Tapping an already-chosen dropdown replays/displays what that word means in plain words
  await screen.getByTestId("easy-slot-1").click();
  await expect.element(screen.getByTestId("easy-block-meaning")).toHaveTextContent(
    "owner full control, group read and run, others nothing",
  );

  // Run wrong order -> plain-words order coaching, deploy.sh untouched
  await runBtn.click();
  await expect.element(screen.getByText(/Order mix-up in slot 1/)).toBeInTheDocument();
  expect(getNode("/home/user/deploy.sh")?.mode).toBe(0o644);

  // Re-pick [chmod] [750] [deploy.sh], then tap '>' Run
  await pickDropdownWord(screen, 2, "");
  await pickDropdownWord(screen, 1, "chmod");
  await pickDropdownWord(screen, 2, "750");
  await runBtn.click();

  // Confirm deploy.sh mode is really 0o750 in the truthful shell session and ls -l shows rwxr-x---
  expect(getDefaultSession().fs.children?.home?.children?.user?.children?.["deploy.sh"]?.mode).toBe(0o750);
  expect(getNode("/home/user/deploy.sh")?.mode).toBe(0o750);
  await expect.element(screen.getByText(/^-rwxr-x---\s+1 user/)).toBeInTheDocument();
  await expect.element(screen.getByTestId("easy-status-badge")).toHaveTextContent("Easy pass");
  await expect.element(screen.getByText(/Job 4 of 19 ·/)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/Locked down — chmod 750 deploy\.sh changed the file's real permissions/)).toBeInTheDocument();
  await expect.element(screen.getByText(/Easy word-block check/i)).not.toBeInTheDocument();
  expect(document.querySelector('section[aria-label="Proof checks"]')).toBeNull();
  expect(Object.values(loadEasyProgress()).filter((r) => r.passed)).toHaveLength(2);

  // Hints in Easy show yellow on that job while STILL counting as a pass
  await screen.getByTestId("next-job-button").click(); // Job 5: grep -rn Port /etc
  await screen.getByTestId("hint-button").click();
  await pickDropdownWord(screen, 1, "grep");
  await pickDropdownWord(screen, 2, "-rn");
  await pickDropdownWord(screen, 3, "Port");
  await pickDropdownWord(screen, 4, "/etc");
  await screen.getByTestId("easy-run-button").click();
  await expect.element(screen.getByTestId("easy-status-badge")).toHaveTextContent("Easy pass · hint used");
  await expect.element(screen.getByText(/Easy word-block check/i)).not.toBeInTheDocument();
  expect(document.querySelector('section[aria-label="Proof checks"]')).toBeNull();
  expect(Object.values(loadEasyProgress()).filter((r) => r.passed)).toHaveLength(3);
});

test("coach phase 1 across all 4 modes + 'All jobs done' on Job 19: Easy two-stage port-in-use, Hard inode cleanup & deleted open file, Medium backup-restore chain, Extreme runaway CPU", async () => {
  const screen = await renderCoachApp("/coach?mode=easy&job=coach-port-in-use");

  // 1. Easy mode: two-stage Phase 1 job (Job 17 of 19: The port is already in use)
  await expect.element(screen.getByText(/Job 17 of 19: The port is already in use/)).toBeInTheDocument();
  await expect.element(screen.getByTestId("easy-stage-badge")).toHaveTextContent("Step 1 of 2");
  await pickDropdownWord(screen, 1, "kill");
  expect(dropdownOptionTexts(screen, 2)).not.toContain("kill");
  await pickDropdownWord(screen, 2, "2847");
  await screen.getByTestId("easy-run-button").click();

  await expect.element(screen.getByTestId("easy-stage-badge")).toHaveTextContent("Step 2 of 2");
  await pickDropdownWord(screen, 1, "systemctl");
  await pickDropdownWord(screen, 2, "start");
  await pickDropdownWord(screen, 3, "httpd");
  await screen.getByTestId("easy-run-button").click();

  await expect.element(screen.getByTestId("easy-status-badge")).toHaveTextContent("Easy pass");
  expect(Object.values(loadEasyProgress()).filter((r) => r.passed)).toHaveLength(1);
  await expect.element(screen.getByText(/Apache httpd online/)).toBeInTheDocument();

  // Tap bottom next-job button from Job 17 -> lands on Job 18 ("No space left" — inodes gone)
  await screen.getByTestId("next-job-button").click();
  await expect
    .element(screen.getByText(/Job 18 of 19: "No space left" but the disk shows free — the inodes are gone/))
    .toBeInTheDocument();

  // 2. Hard mode on Job 18 ("No space left" — inodes gone)
  await screen.getByRole("button", { name: /^Hard$/i }).click();
  await typeCommand(screen, "df -i");
  await expect.element(screen.getByText(/100%/)).toBeInTheDocument();
  await typeCommand(screen, "rm -f /var/spool/maildrop/*");
  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();
  expect(Object.values(loadCoachProgress()).filter((r) => r.coldPasses > 0)).toHaveLength(1);

  // Tap bottom next-job button from Job 18 -> lands on Job 19 (last job: A deleted file is still eating the disk), which shows 'All jobs done'
  await screen.getByTestId("next-job-button").click();
  await expect.element(screen.getByText(/Job 19 of 19: A deleted file is still eating the disk/)).toBeInTheDocument();
  await expect.element(screen.getByTestId("all-jobs-done")).toHaveTextContent("All jobs done");
  await expect.element(screen.getByTestId("next-job-button")).not.toBeInTheDocument();

  // 3. Medium mode via Jobs bottom nav: multi-stage shadow chain (#10 Bring the app back from backup)
  await screen.getByRole("button", { name: /^Medium$/i }).click();
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
  await screen.getByTestId("job-row-coach-restore-backup").click();
  await expect.element(screen.getByTestId("medium-stage-badge")).toHaveTextContent("Command 1 of 3");
  await expect.element(screen.getByTestId("shadow-remaining")).toHaveTextContent("ls -la /opt/storefront");

  await typeCommand(screen, "ls -la /opt/storefront");
  await expect.element(screen.getByTestId("medium-stage-badge")).toHaveTextContent("Command 2 of 3");
  await expect.element(screen.getByTestId("shadow-remaining")).toHaveTextContent("tar -tf /backups/storefront.tar");

  await typeCommand(screen, "tar -tf /backups/storefront.tar");
  await expect.element(screen.getByTestId("medium-stage-badge")).toHaveTextContent("Command 3 of 3");
  await expect.element(screen.getByTestId("shadow-remaining")).toHaveTextContent("tar -xvf /backups/storefront.tar -C /opt/");

  await typeCommand(screen, "tar -xvf /backups/storefront.tar -C /opt/");
  await expect.element(screen.getByTestId("medium-status-badge")).toHaveTextContent("Medium pass");
  expect(Object.values(loadMediumProgress()).filter((r) => r.status === "passed")).toHaveLength(1);
  expect(getNode("/opt/storefront/server.js")?.content).toContain("Storefront v2.4.1");

  // 4. Extreme mode via Jobs bottom nav: (Job 15 of 19: A runaway process is eating all the CPU)
  await screen.getByRole("button", { name: /^Extreme$/i }).click();
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
  await screen.getByTestId("job-row-coach-runaway-cpu").click();
  await typeCommand(screen, "ps aux --sort=-%cpu");
  await typeCommand(screen, "kill 4412");
  await typeCommand(screen, "kill -9 4412");
  await expect.element(screen.getByText(/Locked for three days — pass the cold retest in three days/)).toBeInTheDocument();
  expect(loadExtremeProgress()["coach-runaway-cpu"]?.stage).toBe("awaiting-retest");
});

test("new jobs 11, 12, and 24 (Job 11, 12, and 19 of 19): open and pass in Easy word-block mode and Hard terminal mode", async () => {
  // 1. Job 11 (coach-ssh-key-server1) in Easy mode (4 stages)
  const screen = await renderCoachApp("/coach?mode=easy&job=coach-ssh-key-server1");
  await expect.element(screen.getByText(/Job 11 of 19: Set up key login to server1/)).toBeInTheDocument();
  await expect.element(screen.getByTestId("easy-stage-badge")).toHaveTextContent("Step 1 of 4");

  await pickDropdownWord(screen, 1, "mv");
  await pickDropdownWord(screen, 2, "~/admin");
  await pickDropdownWord(screen, 3, "~/.ssh/");
  await screen.getByTestId("easy-run-button").click();

  await expect.element(screen.getByTestId("easy-stage-badge")).toHaveTextContent("Step 2 of 4");
  await pickDropdownWord(screen, 1, "chmod");
  await pickDropdownWord(screen, 2, "0600");
  await pickDropdownWord(screen, 3, "~/.ssh/admin");
  await screen.getByTestId("easy-run-button").click();

  await expect.element(screen.getByTestId("easy-stage-badge")).toHaveTextContent("Step 3 of 4");
  await pickDropdownWord(screen, 1, "chown");
  await pickDropdownWord(screen, 2, "$USER");
  await pickDropdownWord(screen, 3, "~/.ssh/admin");
  await screen.getByTestId("easy-run-button").click();

  await expect.element(screen.getByTestId("easy-stage-badge")).toHaveTextContent("Step 4 of 4");
  await pickDropdownWord(screen, 1, "printf");
  await pickDropdownWord(
    screen,
    2,
    '"Host server1\\n  HostName server1\\n  Port 2222\\n  User admin\\n  IdentityFile ~/.ssh/admin\\n"',
  );
  await pickDropdownWord(screen, 3, ">");
  await pickDropdownWord(screen, 4, "~/.ssh/config");
  await screen.getByTestId("easy-run-button").click();

  await expect.element(screen.getByTestId("easy-status-badge")).toHaveTextContent("Easy pass");

  // 2. Job 12 (coach-install-httpd) in Easy mode (3 stages) + Hard mode
  await screen.getByTestId("next-job-button").click();
  await expect.element(screen.getByText(/Job 12 of 19: Install the web server and make it stay up/)).toBeInTheDocument();
  await expect.element(screen.getByTestId("easy-stage-badge")).toHaveTextContent("Step 1 of 3");

  await pickDropdownWord(screen, 1, "yum");
  await pickDropdownWord(screen, 2, "install");
  await pickDropdownWord(screen, 3, "httpd");
  await screen.getByTestId("easy-run-button").click();

  await expect.element(screen.getByTestId("easy-stage-badge")).toHaveTextContent("Step 2 of 3");
  await pickDropdownWord(screen, 1, "systemctl");
  await pickDropdownWord(screen, 2, "start");
  await pickDropdownWord(screen, 3, "httpd");
  await screen.getByTestId("easy-run-button").click();

  await expect.element(screen.getByTestId("easy-stage-badge")).toHaveTextContent("Step 3 of 3");
  await pickDropdownWord(screen, 1, "systemctl");
  await pickDropdownWord(screen, 2, "enable");
  await pickDropdownWord(screen, 3, "httpd");
  await screen.getByTestId("easy-run-button").click();
  await expect.element(screen.getByTestId("easy-status-badge")).toHaveTextContent("Easy pass");

  // Switch to Hard on Job 12 and solve cold
  await screen.getByRole("button", { name: /^Hard$/i }).click();
  await typeCommand(screen, "yum install httpd");
  await typeCommand(screen, "systemctl start httpd");
  await typeCommand(screen, "systemctl enable httpd");
  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();

  // 3. Job 24 / Job 19 of 19 (coach-deleted-open-file) in Hard mode + Easy mode
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
  await screen.getByTestId("job-row-coach-deleted-open-file").click();
  await expect.element(screen.getByText(/Job 19 of 19: A deleted file is still eating the disk/)).toBeInTheDocument();
  await typeCommand(screen, "df -h");
  await expect.element(screen.getByText(/\/dev\/sda1\s+40G\s+40G\s+0\s+100%\s+\//)).toBeInTheDocument();
  await typeCommand(screen, "lsof | grep deleted");
  await expect.element(screen.getByText(/\/var\/log\/httpd\/access_log \(deleted\)/)).toBeInTheDocument();
  await typeCommand(screen, "systemctl restart httpd");
  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();

  // Switch to Easy on Job 19 and solve with word blocks
  await screen.getByRole("button", { name: /^Easy$/i }).click();
  await pickDropdownWord(screen, 1, "systemctl");
  await pickDropdownWord(screen, 2, "restart");
  await pickDropdownWord(screen, 3, "httpd");
  await screen.getByTestId("easy-run-button").click();
  await expect.element(screen.getByTestId("easy-status-badge")).toHaveTextContent("Easy pass");
});
