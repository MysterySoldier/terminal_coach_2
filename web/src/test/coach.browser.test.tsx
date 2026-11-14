import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { render } from "vitest-browser-react";

import { AppRoutes } from "@/App";
import { COACH_JOBS } from "@/data/coach-jobs";
import { CardAudioProvider } from "@/hooks/useCardAudio";
import {
  countViewedCommands,
  loadCoachProgress,
  loadEasyProgress,
  loadExtremeProgress,
  loadMediumProgress,
  type ActiveCoachMode,
} from "@/lib/coach";
import { getNode } from "@/lib/terminal-engine";
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
    await expect.element(screen.getByText(/Job 1 of \d+: The website is down/)).toBeInTheDocument();
    await expect.element(screen.getByText(/No points, no streaks/)).toBeInTheDocument();

    // Echo intro plays once when Coach opens if not yet played in session; coach instructions do NOT auto-play.
    await expect.poll(() => window.sessionStorage.getItem("coachEchoIntroPlayed")).toBe("1");
    expect(playedSources.filter((src) => src.endsWith("/audio/coach-echo-intro.mp3"))).toHaveLength(1);
    expect(playedSources.filter((src) => src.startsWith("blob:"))).toHaveLength(0);

    // Speaker button sits in the same row as the Job title line, above the job description text; restart icon sits right next to it.
    const titleLineEl = screen.getByText(/Job 1 of \d+: The website is down/).element();
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
    await expect.element(screen.getByText(/Job 1 of \d+ ·/)).not.toBeInTheDocument();
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
  await expect.element(screen.getByText(/Job 4 of \d+: Lock down deploy\.sh/)).toBeInTheDocument();

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

test("easy mode: renders 3 sections in learning order (Command Reference live, Flash Cards Coming in Round 3, Exams Coming in Round 4), loads all 388 commands across 8 categories, searches, and tracks viewed progress", async () => {
  const screen = await renderCoachApp("/jobs?mode=easy");

  // Three section rows in order
  const refSection = screen.getByTestId("easy-section-reference");
  const cardsSection = screen.getByTestId("easy-section-flashcards");
  const examsSection = screen.getByTestId("easy-section-exams");
  await expect.element(refSection).toHaveTextContent("1. Command Reference");
  await expect.element(cardsSection).toHaveTextContent("2. Flash Cards");
  await expect.element(cardsSection).toHaveTextContent("Coming in Round 3");
  await expect.element(cardsSection).toHaveAttribute("aria-disabled", "true");
  await expect.element(examsSection).toHaveTextContent("3. Exams");
  await expect.element(examsSection).toHaveTextContent("Coming in Round 4");
  await expect.element(examsSection).toHaveAttribute("aria-disabled", "true");

  expect(
    refSection.element().compareDocumentPosition(cardsSection.element()) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    cardsSection.element().compareDocumentPosition(examsSection.element()) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();

  // All 388 commands loaded across 8 categories
  await expect.element(screen.getByTestId("command-results-count")).toHaveTextContent("Showing 388 of 388 commands");
  await expect.element(screen.getByTestId("easy-viewed-pill")).toHaveTextContent("0 / 388 viewed");

  // Browse by Category 8 (Shell, Help, and Everyday Tools — 27 commands)
  await screen.getByTestId("category-filter-cat-8").click();
  await expect.element(screen.getByTestId("command-results-count")).toHaveTextContent("Showing 27 of 388 commands");

  // Switch back to All and search by command name
  await screen.getByTestId("category-filter-all").click();
  await screen.getByTestId("command-search-input").fill("chmod");
  await expect.element(screen.getByTestId("command-item-cmd-chmod")).toBeInTheDocument();

  // Tapping a command opens its full entry and increments viewed count (1/388)
  await screen.getByTestId("command-item-cmd-chmod").click();
  await expect.element(screen.getByTestId("command-entry-card")).toBeInTheDocument();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("chmod");
  await expect.element(screen.getByTestId("command-entry-description")).toHaveTextContent(/Change file permissions/);
  await expect.element(screen.getByTestId("command-entry-example")).toHaveTextContent("chmod 750 /usr/local/bin/backup.sh");
  expect(countViewedCommands(loadEasyProgress())).toBe(1);

  // Back to reference list shows 1 / 388 viewed
  await screen.getByTestId("command-entry-back").click();
  await expect.element(screen.getByTestId("easy-viewed-pill")).toHaveTextContent("1 / 388 viewed");
  await expect.element(screen.getByTestId("reference-progress-count")).toHaveTextContent("1/388");
});

test("coach phase 1 across Medium, Hard, and Extreme + 'All jobs done' on the last job: Hard inode cleanup, Medium backup-restore chain, Extreme runaway CPU", async () => {
  const screen = await renderCoachApp("/coach?mode=hard&job=coach-inodes-gone");

  // 1. Hard mode on "No space left" — inodes gone
  await typeCommand(screen, "df -i");
  await expect.element(screen.getByText(/100%/)).toBeInTheDocument();
  await typeCommand(screen, "rm -f /var/spool/maildrop/*");
  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();
  expect(Object.values(loadCoachProgress()).filter((r) => r.coldPasses > 0)).toHaveLength(1);

  // Open the last job in COACH_JOBS via Jobs bottom nav and verify 'All jobs done'
  const lastJob = COACH_JOBS[COACH_JOBS.length - 1];
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
  await screen.getByTestId(`job-row-${lastJob.id}`).click();
  await expect.element(screen.getByTestId("all-jobs-done")).toHaveTextContent("All jobs done");
  await expect.element(screen.getByTestId("next-job-button")).not.toBeInTheDocument();

  // 2. Medium mode via Jobs bottom nav: multi-stage shadow chain (#10 Bring the app back from backup)
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

  // 3. Extreme mode via Jobs bottom nav: (A runaway process is eating all the CPU)
  await screen.getByRole("button", { name: /^Extreme$/i }).click();
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
  await screen.getByTestId("job-row-coach-runaway-cpu").click();
  await typeCommand(screen, "ps aux --sort=-%cpu");
  await typeCommand(screen, "kill 4412");
  await typeCommand(screen, "kill -9 4412");
  await expect.element(screen.getByText(/Locked for three days — pass the cold retest in three days/)).toBeInTheDocument();
  expect(loadExtremeProgress()["coach-runaway-cpu"]?.stage).toBe("awaiting-retest");
});

test("new jobs 11, 12, and 24: open and pass in Medium and Hard terminal modes", async () => {
  // 1. Job 12 (coach-install-httpd) in Hard mode
  const screen = await renderCoachApp("/coach?mode=hard&job=coach-install-httpd");
  await typeCommand(screen, "yum install httpd");
  await typeCommand(screen, "systemctl start httpd");
  await typeCommand(screen, "systemctl enable httpd");
  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();

  // 2. Job 24 (coach-deleted-open-file) in Hard mode
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
  await screen.getByTestId("job-row-coach-deleted-open-file").click();
  await expect.element(screen.getByText(/Job \d+ of \d+: A deleted file is still eating the disk/)).toBeInTheDocument();
  await typeCommand(screen, "df -h");
  await expect.element(screen.getByText(/\/dev\/sda1\s+40G\s+40G\s+0\s+100%\s+\//)).toBeInTheDocument();
  await typeCommand(screen, "lsof | grep deleted");
  await expect.element(screen.getByText(/\/var\/log\/httpd\/access_log \(deleted\)/)).toBeInTheDocument();
  await typeCommand(screen, "systemctl restart httpd");
  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();
});

test("Batch 1-9 ticket jobs (#27, #25, #31, #13, #26, #33, #34) work in Hard mode", async () => {
  const screen = await renderCoachApp("/coach?mode=hard&job=coach-deleted-user-files");
  await typeCommand(screen, "find / -nouser");
  await expect.element(screen.getByText(/\/srv\/projects\/roadmap\.txt/)).toBeInTheDocument();
  await typeCommand(screen, "chown -R alice /srv/projects");
  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();

  // #25 coach-script-not-found in Hard mode
  await screen.getByTestId("next-job-button").click(); // #28
  await screen.getByTestId("next-job-button").click(); // #25
  await typeCommand(screen, "chmod +x script.sh");
  await typeCommand(screen, "./script.sh");
  await expect.element(screen.getByText("HEALTH_CHECK_OK", { exact: true })).toBeInTheDocument();
  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();
});
