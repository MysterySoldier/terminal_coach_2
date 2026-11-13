import { MemoryRouter } from "react-router-dom";
import { render } from "vitest-browser-react";

import { AppRoutes } from "@/App";
import { CardAudioProvider } from "@/hooks/useCardAudio";
import type { ActiveCoachMode } from "@/lib/coach";
import { getDefaultSession, getNode } from "@/lib/terminal-engine";
import Coach from "@/pages/Coach";
import { StudyProvider } from "@/store/study-store";
import { CoachThemeProvider } from "@/store/theme-store";

async function renderCoach(props: { initialMode?: ActiveCoachMode; initialJobId?: string } = {}) {
  window.localStorage.clear();
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
  const screen = await renderCoach();

  await expect.element(screen.getByText("Over Your Shoulder — Coach")).toBeInTheDocument();
  await expect.element(screen.getByText(/Job 1 of 16: The website is down/)).toBeInTheDocument();
  await expect.element(screen.getByText(/No points, no streaks/)).toBeInTheDocument();

  // Top job list pills are removed; bottom shows only the next job's name.
  expect(document.querySelector('section[aria-label="Jobs"]')).toBeNull();
  await expect.element(screen.getByTestId("next-job-button")).toHaveTextContent(
    "See everything in your home folder",
  );

  // The website is down at the start: prove it before fixing it.
  await typeCommand(screen, "curl localhost");
  await expect.element(screen.getByText(/Connection refused/)).toBeInTheDocument();

  // Fix it the durable way, with no hints.
  await typeCommand(screen, "systemctl enable --now nginx");
  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();
  await expect.element(screen.getByText(/no hints, no solution shown/)).toBeInTheDocument();

  // The fix must survive a reboot.
  await screen.getByRole("button", { name: /Test reboot/ }).click();
  await expect.element(screen.getByText(/It survived the reboot/)).toBeInTheDocument();

  // And the website really answers now.
  await typeCommand(screen, "curl localhost");
  await expect.element(screen.getByText(/it works/)).toBeInTheDocument();
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
  await expect.element(screen.getByText(/Job 4 of 16: Lock down deploy\.sh/)).toBeInTheDocument();

  await typeCommand(screen, "chmod 750 deploy.sh");
  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();

  // ls -l shows the new mode — the shell told the truth.
  await typeCommand(screen, "ls -l deploy.sh");
  await expect.element(screen.getByText(/^-rwxr-x---\s+1 user/)).toBeInTheDocument();
});

test("coach: the readiness report has no XP, no streak, no leaderboard", async () => {
  const screen = await renderCoach();
  await expect.element(screen.getByText(/Where you stand/)).toBeInTheDocument();
  await expect.element(screen.getByText("Easy: 0 of 16 jobs passed.")).toBeInTheDocument();
  await expect.element(screen.getByText(/0 of 16 jobs done cold/)).toBeInTheDocument();
  await expect.element(screen.getByText("Extreme: 0 of 16 jobs proved cold twice.")).toBeInTheDocument();
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
  await expect.element(
    screen.getByText(/You passed "Lock down deploy\.sh" cold once\. It is locked for three days and needs a cold retest/),
  ).toBeInTheDocument();
  await expect.element(screen.getByText("Extreme: 0 of 16 jobs proved cold twice.")).toBeInTheDocument();

  // Advance to Job 5 via bottom next-job link, then re-open Job 4 from the Jobs tab -> locked & disabled.
  await screen.getByTestId("next-job-button").click();
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
  await screen.getByTestId("job-row-coach-sb-chmod-750").click();
  await expect.element(screen.getByLabelText(/user@coach/)).toBeDisabled();
});

test("coach extreme: a wrong first try burns the session so a second try does not count", async () => {
  const screen = await renderCoach({ initialMode: "extreme", initialJobId: "coach-sb-chmod-750" });

  // Wrong chmod burns the first try in this session.
  await typeCommand(screen, "chmod 755 deploy.sh");
  await expect.element(screen.getByText(/did not finish the job on the first try/)).toBeInTheDocument();

  // Solving afterwards in the same session does not lock or count for Extreme.
  await typeCommand(screen, "chmod 750 deploy.sh");
  await expect.element(screen.getByText(/not solved cold on your first try in this session/)).toBeInTheDocument();
  await expect.element(screen.getByText(/You have not done "Lock down deploy\.sh" cold in Extreme yet\./)).toBeInTheDocument();
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
  await expect.element(screen.getByText("Medium: 1 of 16 jobs passed.")).toBeInTheDocument();

  // Advance to Job 2 via bottom next-job button, use '?' Hint, and finish -> marks yellow (hint used), does NOT increment pass count.
  await screen.getByTestId("next-job-button").click();
  await screen.getByRole("button", { name: /^Hint/ }).click();
  await expect.element(screen.getByTestId("medium-status-badge")).toHaveTextContent("hint used");
  await typeCommand(screen, "ls -la");
  await expect.element(screen.getByTestId("medium-status-badge")).toHaveTextContent("hint used");
  await expect.element(screen.getByText("Medium: 1 of 16 jobs passed.")).toBeInTheDocument();

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

  // Header has icon-only Hear guide (the ONLY speaker icon) and '?' Hint icon; Run is '>' icon-only
  const hearGuideBtn = screen.getByTestId("hear-guide-button");
  const hintBtn = screen.getByTestId("hint-button");
  const runBtn = screen.getByTestId("easy-run-button");
  await expect.element(hearGuideBtn).toHaveAttribute("aria-label", "Hear guide");
  expect(hearGuideBtn.element().textContent?.trim()).toBe("");
  expect(hintBtn.element().textContent?.trim()).toBe("");
  expect(runBtn.element().textContent?.trim()).toBe("");
  expect(document.querySelectorAll("svg.lucide-volume-2").length).toBe(1);

  // No typing input exists in Easy mode
  await expect.element(screen.getByLabelText(/user@coach/)).not.toBeInTheDocument();
  await expect.element(screen.getByText("Easy: 0 of 16 jobs passed.")).toBeInTheDocument();

  // Navigate to Job 4 (Lock down deploy.sh) via bottom next-job button
  await screen.getByTestId("next-job-button").click(); // Job 2
  await screen.getByTestId("next-job-button").click(); // Job 3
  await screen.getByTestId("next-job-button").click(); // Job 4
  expect(getNode("/home/user/deploy.sh")?.mode).toBe(0o644);
  await expect.element(screen.getByText(/^-rw-r--r--\s+1 user/)).toBeInTheDocument();

  // Pick wrong order first ([750] [chmod] [deploy.sh]) and verify picked words disappear from other dropdowns
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
  await expect.element(screen.getByText("Easy: 1 of 16 jobs passed.")).toBeInTheDocument();

  // Hints in Easy show yellow on that job while STILL counting as a pass
  await screen.getByTestId("next-job-button").click(); // Job 5: grep -rn Port /etc
  await screen.getByTestId("hint-button").click();
  await pickDropdownWord(screen, 1, "grep");
  await pickDropdownWord(screen, 2, "-rn");
  await pickDropdownWord(screen, 3, "Port");
  await pickDropdownWord(screen, 4, "/etc");
  await screen.getByTestId("easy-run-button").click();
  await expect.element(screen.getByTestId("easy-status-badge")).toHaveTextContent("Easy pass · hint used");
  await expect.element(screen.getByText("Easy: 2 of 16 jobs passed.")).toBeInTheDocument();
});

test("coach phase 1 across all 4 modes + 'All jobs done' on Job 16: Easy two-stage port-in-use, Medium backup-restore chain, Hard inode cleanup, Extreme runaway CPU", async () => {
  const screen = await renderCoachApp("/coach?mode=easy&job=coach-port-in-use");

  // 1. Easy mode: two-stage Phase 1 job (#15 The port is already in use)
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
  await expect.element(screen.getByText("Easy: 1 of 16 jobs passed.")).toBeInTheDocument();
  await expect.element(screen.getByText(/Apache httpd online/)).toBeInTheDocument();

  // Tap bottom next-job button from Job 15 -> lands on Job 16 (last job), which shows 'All jobs done'
  await screen.getByTestId("next-job-button").click();
  await expect.element(screen.getByTestId("all-jobs-done")).toHaveTextContent("All jobs done");
  await expect.element(screen.getByTestId("next-job-button")).not.toBeInTheDocument();

  // 2. Hard mode on Job 16 (#16 "No space left" — inodes gone)
  await screen.getByRole("button", { name: /^Hard$/i }).click();
  await typeCommand(screen, "df -i");
  await expect.element(screen.getByText(/100%/)).toBeInTheDocument();
  await typeCommand(screen, "rm -f /var/spool/maildrop/*");
  await expect.element(screen.getByText(/Hard: 1 of 16 jobs done cold\./)).toBeInTheDocument();

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
  await expect.element(screen.getByText("Medium: 1 of 16 jobs passed.")).toBeInTheDocument();
  expect(getNode("/opt/storefront/server.js")?.content).toContain("Storefront v2.4.1");

  // 4. Extreme mode via Jobs bottom nav: (#13 A runaway process is eating all the CPU)
  await screen.getByRole("button", { name: /^Extreme$/i }).click();
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
  await screen.getByTestId("job-row-coach-runaway-cpu").click();
  await typeCommand(screen, "ps aux --sort=-%cpu");
  await typeCommand(screen, "kill 4412");
  await typeCommand(screen, "kill -9 4412");
  await expect.element(
    screen.getByText(/You passed "A runaway process is eating all the CPU" cold once\. It is locked for three days/),
  ).toBeInTheDocument();
});
