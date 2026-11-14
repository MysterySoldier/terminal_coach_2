import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import { AppRoutes } from "@/App";
import { COACH_JOBS } from "@/data/coach-jobs";
import { CardAudioProvider } from "@/hooks/useCardAudio";
import { CoachThemeProvider } from "@/store/theme-store";

const TOTAL_JOBS = COACH_JOBS.length;

async function renderApp(initialPath = "/") {
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

test("main screen: renders NeoServer layout with Coach Echo title + Over Your Shoulder subtitle, 4 mode cards, OVERLOAD badge, 3 rings per card (no bottom panels), and 5-item bottom nav", async () => {
  const screen = await renderApp("/");

  await expect.element(screen.getByRole("heading", { name: "Coach Echo", exact: true })).toBeInTheDocument();
  await expect.element(screen.getByText("Over Your Shoulder", { exact: true })).toBeInTheDocument();
  await expect.element(screen.getByTestId("coach-echo-intro-replay")).toBeInTheDocument();
  await expect.element(screen.getByText(/16 real sysadmin jobs/i)).not.toBeInTheDocument();
  await expect.element(screen.getByTestId("mode-card-easy")).toBeInTheDocument();
  await expect.element(screen.getByTestId("mode-card-medium")).toBeInTheDocument();
  await expect.element(screen.getByTestId("mode-card-hard")).toBeInTheDocument();
  await expect.element(screen.getByTestId("mode-card-extreme")).toBeInTheDocument();
  await expect.element(screen.getByTestId("overload-badge")).toHaveTextContent("OVERLOAD");

  // 3 progress rings per card with exact labels & counts, and zero bottom sparkline panels
  await expect
    .element(screen.getByText("Learn the commands, drill them, test on them", { exact: true }))
    .toBeInTheDocument();
  await expect.element(screen.getByText(/word blocks/i)).not.toBeInTheDocument();
  await expect.element(screen.getByTestId("ring-easy-reference")).toHaveTextContent("0/388");
  await expect.element(screen.getByTestId("ring-easy-flashcards")).toHaveTextContent("0/187");
  await expect.element(screen.getByTestId("ring-easy-exams")).toHaveTextContent("0/9");
  await expect.element(screen.getByTestId("ring-medium-passed")).toHaveTextContent(`0/${TOTAL_JOBS}`);
  await expect.element(screen.getByTestId("ring-medium-tried")).toHaveTextContent(`0/${TOTAL_JOBS}`);
  await expect.element(screen.getByTestId("ring-medium-clean")).toHaveTextContent(`0/${TOTAL_JOBS}`);
  await expect.element(screen.getByTestId("ring-hard-passed")).toHaveTextContent(`0/${TOTAL_JOBS}`);
  await expect.element(screen.getByTestId("ring-hard-reboot")).toHaveTextContent("0/1");
  await expect.element(screen.getByTestId("ring-hard-tried")).toHaveTextContent(`0/${TOTAL_JOBS}`);
  await expect.element(screen.getByTestId("ring-extreme-complete")).toHaveTextContent(`0/${TOTAL_JOBS}`);
  await expect.element(screen.getByTestId("ring-extreme-cold1")).toHaveTextContent(`0/${TOTAL_JOBS}`);
  await expect.element(screen.getByTestId("ring-extreme-locked")).toHaveTextContent(`0/${TOTAL_JOBS}`);

  expect(document.querySelector('[data-testid^="sparkline-"]')).toBeNull();
  await expect.element(screen.getByText(new RegExp(`${TOTAL_JOBS}-job pass profile`, "i"))).not.toBeInTheDocument();
  await expect.element(screen.getByText(/jobs touched/i)).not.toBeInTheDocument();
  await expect.element(screen.getByText(new RegExp(`${TOTAL_JOBS}-job cold profile`, "i"))).not.toBeInTheDocument();
  await expect.element(screen.getByText(/zero-hint rounds/i)).not.toBeInTheDocument();

  // Bottom navigation has exact 5 items with Modes active
  const nav = screen.getByRole("navigation", { name: "Bottom navigation" });
  await expect.element(nav.getByRole("link", { name: "Modes" })).toHaveAttribute("aria-current", "page");
  await expect.element(nav.getByRole("link", { name: "Coach" })).toBeInTheDocument();
  await expect.element(nav.getByRole("link", { name: "Jobs" })).toBeInTheDocument();
  await expect.element(nav.getByRole("link", { name: "Terminal" })).toBeInTheDocument();
  await expect.element(nav.getByRole("link", { name: "More" })).toBeInTheDocument();
});

test("intro audio: attempts autoplay after 3s, falls back immediately to first tap when blocked, guards once per session, and replays via speaker icon", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const playedSources: string[] = [];
  let blockAutoplay = true;
  const nativePlay = window.HTMLMediaElement.prototype.play;
  const playSpy = vi
    .spyOn(window.HTMLMediaElement.prototype, "play")
    .mockImplementation(function (this: HTMLMediaElement) {
      if (this.currentSrc || this.src) {
        playedSources.push(this.currentSrc || this.src);
      }
      if (blockAutoplay) {
        return Promise.reject(
          new DOMException("play() failed because the user didn't interact with the document first.", "NotAllowedError"),
        );
      }
      return nativePlay.call(this);
    });

  try {
    // 1. Plain browser tab path: autoplay blocked at 3s -> immediate play on first tap
    const screen = await renderApp("/");
    const introPlayCount = () => playedSources.filter((src) => src.endsWith("/audio/coach-echo-intro.mp3")).length;

    // Deliberate 3-second settle pause: nothing attempted at 0ms or 2.9s
    expect(introPlayCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(2900);
    expect(introPlayCount()).toBe(0);

    // At 3.0s, autoplay is attempted once and silently rejected (session guard NOT set yet)
    await vi.advanceTimersByTimeAsync(100);
    expect(introPlayCount()).toBe(1);
    expect(window.sessionStorage.getItem("coachEchoIntroPlayed")).toBeNull();

    // First user tap anywhere on the main screen plays immediately (no extra 3s wait)
    blockAutoplay = false;
    await screen.getByTestId("mode-card-easy").click();
    await expect.element(screen.getByRole("heading", { name: "Easy", exact: true })).toBeInTheDocument();
    expect(introPlayCount()).toBe(2);
    expect(window.sessionStorage.getItem("coachEchoIntroPlayed")).toBe("1");

    // Returning to Modes in the same session: neither waiting 3s nor tapping plays again
    await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Modes" }).click();
    await expect.element(screen.getByRole("heading", { name: "Coach Echo", exact: true })).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(3500);
    await screen.getByText("Over Your Shoulder", { exact: true }).click();
    expect(introPlayCount()).toBe(2);

    // Tapping the header speaker icon replays coach-echo-intro.mp3 immediately
    await screen.getByTestId("coach-echo-intro-replay").click();
    expect(introPlayCount()).toBe(3);

    await screen.unmount();

    // 2. Installed-PWA path: when autoplay is allowed, plays automatically at 3s with no tap
    playedSources.length = 0;
    blockAutoplay = false;
    const pwaScreen = await renderApp("/");

    await vi.advanceTimersByTimeAsync(2900);
    expect(introPlayCount()).toBe(0);

    await vi.advanceTimersByTimeAsync(100);
    expect(introPlayCount()).toBe(1);
    vi.useRealTimers();
    await expect.poll(() => window.sessionStorage.getItem("coachEchoIntroPlayed")).toBe("1");

    // Subsequent tap does not replay once autoplay already succeeded
    await pwaScreen.getByText("Over Your Shoulder", { exact: true }).click();
    expect(introPlayCount()).toBe(1);

    // Opening Coach after intro already played on Modes does NOT replay intro and does NOT auto-play instructions
    await pwaScreen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Coach" }).click();
    await expect.element(pwaScreen.getByRole("heading", { name: "Coach Echo — Over Your Shoulder", exact: true })).toBeInTheDocument();
    expect(introPlayCount()).toBe(1);
    expect(playedSources.filter((src) => src.startsWith("blob:"))).toHaveLength(0);

    // Tapping instructions speaker plays, and switching bottom-nav tabs stops playing audio immediately
    const instrBtn = pwaScreen.getByTestId("hear-instructions-button");
    await instrBtn.click();
    await expect.poll(() => playedSources.filter((src) => src.startsWith("blob:")).length).toBe(1);
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    try {
      await pwaScreen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
      await expect.element(pwaScreen.getByRole("heading", { name: /Jobs$/ })).toBeInTheDocument();
      expect(pauseSpy).toHaveBeenCalled();
    } finally {
      pauseSpy.mockRestore();
    }
    await pwaScreen.unmount();

    // 3. Coach screen direct/iPhone path: when Modes did NOT play intro yet, Coach plays Echo intro once and stops on tab switch
    playedSources.length = 0;
    const coachDirectScreen = await renderApp("/coach");
    await expect.poll(() => introPlayCount()).toBe(1);
    await expect.poll(() => window.sessionStorage.getItem("coachEchoIntroPlayed")).toBe("1");
    expect(playedSources.filter((src) => src.startsWith("blob:"))).toHaveLength(0);

    const introPauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    try {
      await coachDirectScreen
        .getByRole("navigation", { name: "Bottom navigation" })
        .getByRole("link", { name: "Terminal" })
        .click();
      expect(introPauseSpy).toHaveBeenCalled();
    } finally {
      introPauseSpy.mockRestore();
    }
  } finally {
    playSpy.mockRestore();
    vi.useRealTimers();
  }
});

test("navigation: mode card links to mode's 50-job list, and clicking a job opens the coach job screen on that job", async () => {
  const screen = await renderApp("/");

  await screen.getByTestId("mode-card-hard").click();
  await expect.element(screen.getByRole("heading", { name: "Hard Jobs" })).toBeInTheDocument();

  // All 19 jobs render in the job list
  const chmodRow = screen.getByTestId("job-row-coach-sb-chmod-750");
  await expect.element(chmodRow).toBeInTheDocument();
  await expect.element(screen.getByTestId("job-row-coach-ssh-key-server1")).toBeInTheDocument();
  await expect.element(screen.getByTestId("job-row-coach-install-httpd")).toBeInTheDocument();
  await expect.element(screen.getByTestId("job-row-coach-deleted-open-file")).toBeInTheDocument();
  await chmodRow.click();

  // Opens moved Coach job screen directly on Job 4 in Hard mode
  await expect.element(screen.getByText(new RegExp(`Job 4 of ${TOTAL_JOBS}: Lock down deploy\\.sh`))).toBeInTheDocument();
  const input = screen.getByLabelText(/user@coach/);
  await input.fill("chmod 750 deploy.sh");
  const el = input.element() as HTMLInputElement;
  el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));

  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();

  // Returning to Modes shows green dot and 1 / TOTAL_JOBS cold on Hard card
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Modes" }).click();
  await expect.element(screen.getByTestId("mode-card-hard")).toHaveTextContent(`1 / ${TOTAL_JOBS} cold`);
  await expect.element(screen.getByTestId("ring-hard-passed")).toHaveTextContent(`1/${TOTAL_JOBS}`);
});

test("settings screen: toggles dark/light color scheme and updates per-mode colors", async () => {
  const screen = await renderApp("/");
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "More" }).click();

  await expect.element(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  expect(document.documentElement.classList.contains("dark")).toBe(true);

  await screen.getByRole("button", { name: "Light" }).click();
  expect(document.documentElement.classList.contains("light")).toBe(true);

  // Customize Easy mode color via swatch
  await screen.getByRole("button", { name: "Easy swatch #818cf8" }).click();
  expect(document.documentElement.style.getPropertyValue("--mode-easy")).toBe("#818cf8");

  // Reset defaults restores Blue (#38bdf8)
  await screen.getByRole("button", { name: /Reset defaults/i }).click();
  expect(document.documentElement.style.getPropertyValue("--mode-easy")).toBe("#38bdf8");
});

test("mobile layout: fits a 375px phone screen with zero horizontal scrolling across Modes, Easy screen, Reference browse/search/entry, a Medium job, and Settings", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/");

  await expect.element(screen.getByTestId("mode-card-extreme")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // Easy screen: 3 sections, browse by category, search by command name, open command entry, Flash Cards, and Exams
  await screen.getByTestId("mode-card-easy").click();
  await expect.element(screen.getByTestId("easy-section-reference")).toBeInTheDocument();
  await expect.element(screen.getByTestId("easy-section-flashcards")).toHaveTextContent("0/187");
  await expect.element(screen.getByTestId("easy-section-exams")).toHaveTextContent("0/9");
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // Filter by Category 2 and search for chmod
  await screen.getByTestId("category-filter-cat-2").click();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  await screen.getByTestId("command-search-input").fill("chmod");
  await screen.getByTestId("command-item-cmd-chmod").click();

  await expect.element(screen.getByTestId("command-entry-card")).toBeInTheDocument();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("chmod");
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(812);

  await screen.getByTestId("command-entry-back").click();
  await expect.element(screen.getByTestId("easy-viewed-pill")).toHaveTextContent("1 / 388 viewed");

  // Flash Cards section: browse/flip/master at 375x812 with 0px horizontal overflow
  await screen.getByTestId("easy-section-flashcards").click();
  await expect.element(screen.getByTestId("flashcards-section")).toBeInTheDocument();
  await expect.element(screen.getByTestId("flashcard-card")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(812);

  await screen.getByTestId("flashcard-slot-3").click();
  await screen.getByTestId("flashcard-slot-1").click();
  await expect.element(screen.getByTestId("flashcards-progress-count")).toHaveTextContent("1/187");
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // Exams section: fits 375x812 phone screen with 0px horizontal overflow
  await screen.getByTestId("easy-section-exams").click();
  await expect.element(screen.getByTestId("exams-section")).toBeInTheDocument();
  await expect.element(screen.getByTestId("exam-question-card")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(812);

  // Medium job
  await screen.getByRole("button", { name: /^Medium$/i }).click();
  await expect.element(screen.getByRole("heading", { name: "Medium Jobs" })).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  await screen.getByTestId("job-row-coach-restore-backup").click();
  await expect.element(screen.getByTestId("shadow-remaining")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
});

test("google sign-in, custom prompt name, terminal text colors, and cross-session cloud progress sync", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/");

  // 1. Guest mode works without sign-in and shows user@coach:~$
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Coach" }).click();
  await expect.element(screen.getByTestId("terminal-input-prompt")).toHaveTextContent("user@coach:~$");

  // Solve Job 4 in Hard mode as a guest first
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
  await screen.getByTestId("job-row-coach-sb-chmod-750").click();
  const guestInput = screen.getByTestId("coach-command-input");
  await guestInput.fill("chmod 750 deploy.sh");
  (guestInput.element() as HTMLInputElement).dispatchEvent(
    new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
  );
  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();

  // 2. Open Settings (More), sign in with Google, keeping & merging guest progress
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "More" }).click();
  await expect.element(screen.getByTestId("guest-mode-badge")).toHaveTextContent("Guest mode");
  await screen.getByTestId("google-signin-button").click();
  await expect.element(screen.getByTestId("google-signin-sheet")).toBeInTheDocument();
  await screen.getByTestId("signin-display-name-input").fill("MysterySoldier");
  await screen.getByTestId("signin-last-name-input").fill("Kennedy");
  await screen.getByTestId("google-id-input").fill("test-sync-user-42");
  await screen.getByTestId("google-signin-submit").click();

  await expect.element(screen.getByTestId("signed-in-prompt-label")).toHaveTextContent("MysterySoldier@coach:~$");

  // 3. Pick Orange prompt color (#fb923c) and Purple command color (#c084fc)
  await screen.getByTestId("prompt-color-orange").click();
  await screen.getByTestId("command-color-purple").click();
  expect((screen.getByTestId("preview-prompt-text").element() as HTMLElement).style.color).toBe("rgb(251, 146, 60)");
  expect((screen.getByTestId("preview-command-text").element() as HTMLElement).style.color).toBe("rgb(192, 132, 252)");
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // 4. Verify custom prompt name and terminal colors appear on Coach & Terminal tabs
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Terminal" }).click();
  const promptLabel = screen.getByTestId("terminal-input-prompt");
  await expect.element(promptLabel).toHaveTextContent("MysterySoldier@coach:~$");
  expect((promptLabel.element() as HTMLElement).style.color).toBe("rgb(251, 146, 60)");
  const cmdInput = screen.getByTestId("coach-command-input");
  expect((cmdInput.element() as HTMLElement).style.color).toBe("rgb(192, 132, 252)");

  // Switch to Easy mode and verify Command Reference entry example line also shows MysterySoldier@coach:~$ in Orange
  await screen.getByRole("button", { name: /^Easy$/i }).click();
  await screen.getByTestId("command-item-cmd-pwd").click();
  const easyPrompt = screen.getByTestId("terminal-line-prompt");
  await expect.element(easyPrompt).toHaveTextContent("MysterySoldier@coach:~$");
  expect((easyPrompt.element() as HTMLElement).style.color).toBe("rgb(251, 146, 60)");

  // 5. Sign out keeps local progress on the device and returns prompt to user@coach:~$
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "More" }).click();
  await screen.getByTestId("google-signout-button").click();
  await expect.element(screen.getByTestId("guest-mode-badge")).toHaveTextContent("Guest mode");

  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Modes" }).click();
  await expect.element(screen.getByTestId("ring-hard-passed")).toHaveTextContent(`1/${TOTAL_JOBS}`);
  await expect.element(screen.getByTestId("ring-easy-reference")).toHaveTextContent("1/388");
});
