import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import App, { AppRoutes } from "@/App";
import { COACH_JOBS } from "@/data/coach-jobs";
import { TOUR_DONE_STORAGE_KEY } from "@/data/tour-and-help";
import { CardAudioProvider } from "@/hooks/useCardAudio";
import { CoachThemeProvider } from "@/store/theme-store";

const TOTAL_JOBS = COACH_JOBS.length;

async function renderApp(initialPath = "/", options?: { firstRunTour?: boolean }) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  if (!options?.firstRunTour) {
    window.localStorage.setItem(TOUR_DONE_STORAGE_KEY, "true");
  }
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

test("main screen: renders NeoServer layout with Over Your Shoulder title + Learn Linux with Coach Echo over your shoulder subtitle, no header speaker button, 4 mode cards, OVERLOAD badge, 3 rings per card (no bottom panels), and 5-item bottom nav", async () => {
  const screen = await renderApp("/");

  await expect.element(screen.getByRole("heading", { name: "Over Your Shoulder", exact: true })).toBeInTheDocument();
  await expect.element(screen.getByText("Learn Linux with Coach Echo over your shoulder", { exact: true })).toBeInTheDocument();
  expect(document.querySelector('[data-testid="coach-echo-intro-replay"]')).toBeNull();
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

test("modes screen header: renders no speaker button while keeping title, subtitle, and sign-in pill intact", async () => {
  const screen = await renderApp("/");

  const heading = screen.getByRole("heading", { name: "Over Your Shoulder", exact: true });
  await expect.element(heading).toBeInTheDocument();
  await expect.element(screen.getByText("Learn Linux with Coach Echo over your shoulder", { exact: true })).toBeInTheDocument();
  await expect.element(screen.getByTestId("modes-auth-button")).toHaveTextContent("Sign in");

  const headerEl = heading.element().closest("header")!;
  expect(headerEl).not.toBeNull();
  expect(headerEl.querySelector('[data-testid="coach-echo-intro-replay"]')).toBeNull();
  expect(headerEl.querySelector('[aria-label*="Replay" i]')).toBeNull();
  const headerButtons = Array.from(headerEl.querySelectorAll("button"));
  expect(headerButtons).toHaveLength(1);
  expect(headerButtons[0]?.getAttribute("data-testid")).toBe("modes-auth-button");
});

test("intro audio: attempts autoplay after 3s, falls back immediately to first tap when blocked, and guards once per session", async () => {
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
    await expect.element(screen.getByRole("heading", { name: "Over Your Shoulder", exact: true })).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(3500);
    await screen.getByText("Learn Linux with Coach Echo over your shoulder", { exact: true }).click();
    expect(introPlayCount()).toBe(2);

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
    await pwaScreen.getByText("Learn Linux with Coach Echo over your shoulder", { exact: true }).click();
    expect(introPlayCount()).toBe(1);

    // Opening Coach after intro already played on Modes shows Easy menu and does NOT replay intro
    await pwaScreen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Coach" }).click();
    await expect.element(pwaScreen.getByRole("heading", { name: "Easy", exact: true })).toBeInTheDocument();
    expect(introPlayCount()).toBe(1);
    expect(playedSources.filter((src) => src.startsWith("blob:"))).toHaveLength(0);

    // Opening an active job coach view: tapping instructions speaker plays, and switching bottom-nav tabs stops playing audio immediately
    await pwaScreen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
    await pwaScreen.getByTestId("job-row-coach-sb-chmod-750").click();
    await expect.element(pwaScreen.getByRole("heading", { name: "Coach Echo — Over Your Shoulder", exact: true })).toBeInTheDocument();
    const instrBtn = pwaScreen.getByTestId("hear-instructions-button");
    await instrBtn.click();
    await expect.poll(() => playedSources.filter((src) => src.startsWith("blob:")).length).toBe(1);
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    try {
      await pwaScreen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Terminal" }).click();
      await expect.element(pwaScreen.getByTestId("practice-terminal-title")).toHaveTextContent("Practice Terminal");
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

test("settings screen: renders no CRT Scanline Texture row and ignores legacy scanlines:true preference", async () => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.localStorage.setItem(TOUR_DONE_STORAGE_KEY, "true");
  window.localStorage.setItem(
    "linuxplus:v1:coachThemeSettings",
    JSON.stringify({
      colorScheme: "dark",
      accentColor: "#38bdf8",
      scanlines: true,
    }),
  );

  const screen = await render(
    <CoachThemeProvider>
      <CardAudioProvider>
        <MemoryRouter
          initialEntries={["/settings"]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      </CardAudioProvider>
    </CoachThemeProvider>,
  );

  await expect.element(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  await expect.element(screen.getByText("Kokoro af_heart Voice Auto-Read")).toBeInTheDocument();
  await expect.element(screen.getByText(/CRT Scanline Texture/i)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/Subtle scanlines on the Coach header card/i)).not.toBeInTheDocument();
  expect(document.querySelector(".scanlines")).toBeNull();
});

test("mobile layout: fits a 375px phone screen with zero horizontal scrolling across Modes, Easy menu on Coach tab, dedicated Reference/Flash Cards/Exams screens, Jobs (3 modes only), a Medium job, and Settings", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/");

  await expect.element(screen.getByTestId("mode-card-extreme")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // Tapping Easy card on Modes navigates to Coach tab's Easy menu (3 rows only, no inline section content)
  await screen.getByTestId("mode-card-easy").click();
  const nav = screen.getByRole("navigation", { name: "Bottom navigation" });
  await expect.element(nav.getByRole("link", { name: "Coach" })).toHaveAttribute("aria-current", "page");
  await expect.element(screen.getByTestId("easy-section-reference")).toBeInTheDocument();
  await expect.element(screen.getByTestId("easy-section-flashcards")).toHaveTextContent("0/187");
  await expect.element(screen.getByTestId("easy-section-exams")).toHaveTextContent("0/9");
  expect(document.querySelector('[data-testid="command-reference-browser"]')).toBeNull();
  expect(document.querySelector('[data-testid="flashcards-section"]')).toBeNull();
  expect(document.querySelector('[data-testid="exams-section"]')).toBeNull();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // Open dedicated Command Reference screen: 8 section rows only, no command cards
  await screen.getByTestId("easy-section-reference").click();
  await expect.element(screen.getByTestId("command-reference-browser")).toBeInTheDocument();
  await expect.element(screen.getByTestId("reference-sections-list")).toBeInTheDocument();
  expect(document.querySelectorAll('[data-testid^="reference-section-row-"]')).toHaveLength(8);
  expect(document.querySelectorAll('[data-testid^="command-item-"]')).toHaveLength(0);
  expect(document.querySelector('[data-testid="category-filter-bar"]')).toBeNull();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // Tap Section 1 -> opens only its 81 commands, back arrow returns to sections list
  await screen.getByTestId("reference-section-row-cat-1").click();
  await expect.element(screen.getByTestId("command-reference-category-view")).toBeInTheDocument();
  await expect.element(screen.getByTestId("command-results-count")).toHaveTextContent("Showing 81 of 81 commands.");
  expect(document.querySelectorAll('[data-testid^="command-item-"]')).toHaveLength(81);
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // Open a command full entry from the section screen
  await screen.getByTestId("command-item-cmd-pwd").click();
  await expect.element(screen.getByTestId("command-entry-card")).toBeInTheDocument();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("pwd");
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(812);

  await screen.getByTestId("command-entry-back").click();
  await expect.element(screen.getByTestId("command-reference-category-view")).toBeInTheDocument();
  await screen.getByTestId("reference-category-back").click();
  await expect.element(screen.getByTestId("reference-sections-list")).toBeInTheDocument();
  expect(document.querySelectorAll('[data-testid^="command-item-"]')).toHaveLength(0);

  // Search on the sections screen matches what a command DOES ("remove" -> rm, "list" -> ls) and name ("chmod"); clearing restores the 8 sections
  await expect
    .element(screen.getByTestId("command-search-input"))
    .toHaveAttribute("placeholder", "Search by name or what it does (e.g. remove, copy, list)");

  await screen.getByTestId("command-search-input").fill("remove");
  await expect.element(screen.getByTestId("command-item-cmd-rm")).toBeInTheDocument();
  await expect.element(screen.getByTestId("command-item-cmd-rmdir")).toBeInTheDocument();
  await expect.element(screen.getByTestId("command-item-cmd-userdel")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  await screen.getByTestId("command-search-input").fill("list");
  await expect.element(screen.getByTestId("command-item-cmd-ls")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  await screen.getByTestId("command-search-input").fill("chmod");
  await expect.element(screen.getByTestId("command-item-cmd-chmod")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  await screen.getByTestId("command-search-clear").click();
  await expect.element(screen.getByTestId("reference-sections-list")).toBeInTheDocument();
  expect(document.querySelectorAll('[data-testid^="command-item-"]')).toHaveLength(0);
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // Who's Who in the Library row and screen: introduces Coach Echo, The Owner (root), and You
  await expect.element(screen.getByTestId("reference-whos-who-row")).toBeInTheDocument();
  await screen.getByTestId("reference-whos-who-row").click();
  await expect.element(screen.getByTestId("whos-who-screen")).toBeInTheDocument();
  await expect.element(screen.getByRole("heading", { name: "Coach Echo", exact: true })).toBeInTheDocument();
  await expect.element(screen.getByText(/Head librarian and coach\. Knows the library, shows you around, trains you until you don't need them\./)).toBeInTheDocument();
  await expect.element(screen.getByRole("heading", { name: "The Owner (root)", exact: true })).toBeInTheDocument();
  await expect.element(screen.getByText(/Owns the building\. Can open any door and change any rule\. sudo borrows the owner's keys for one command\./)).toBeInTheDocument();
  await expect.element(screen.getByRole("heading", { name: "You", exact: true })).toBeInTheDocument();
  await expect.element(screen.getByText(/A visitor, here to learn\. Your home folder is your own shelf\./)).toBeInTheDocument();
  await expect.element(screen.getByText(/First you're on a guided tour with the coach\. After the basics, you come in on your own\./)).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  await screen.getByTestId("whos-who-back").click();
  await expect.element(screen.getByTestId("reference-sections-list")).toBeInTheDocument();

  await screen.getByTestId("easy-section-back").click();

  // Dedicated Flash Cards screen: browse/flip/master at 375x812 with 0px horizontal overflow
  await screen.getByTestId("easy-section-flashcards").click();
  await expect.element(screen.getByTestId("flashcards-section")).toBeInTheDocument();
  await expect.element(screen.getByTestId("flashcard-card")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(812);

  await screen.getByTestId("flashcard-slot-3").click();
  await screen.getByTestId("flashcard-slot-1").click();
  await expect.element(screen.getByTestId("flashcards-progress-count")).toHaveTextContent("1/187");
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  await screen.getByTestId("easy-section-back").click();

  // Dedicated Exams screen: menu + active session fit 375x812 phone screen with 0px horizontal overflow
  await screen.getByTestId("easy-section-exams").click();
  await expect.element(screen.getByTestId("exams-section")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  await screen.getByTestId("exam-category-cat-8").click();
  await expect.element(screen.getByTestId("exam-question-card")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(812);

  // Jobs tab has Medium, Hard, Extreme only (no Easy)
  await nav.getByRole("link", { name: "Jobs" }).click();
  const modeNav = screen.getByRole("navigation", { name: "Switch mode job list" });
  await expect.element(modeNav).toBeInTheDocument();
  expect(modeNav.element().querySelectorAll("button")).toHaveLength(3);
  await modeNav.getByRole("button", { name: /^Medium$/i }).click();
  await expect.element(screen.getByRole("heading", { name: "Medium Jobs" })).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  await screen.getByTestId("job-row-coach-restore-backup").click();
  await expect.element(screen.getByTestId("shadow-remaining")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
});

test("google sign-in, custom prompt name, terminal text colors, and cross-session cloud progress sync", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/");

  // 1. Guest mode works without sign-in and shows user@coach:~$ on an active job
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
  await screen.getByTestId("job-row-coach-sb-chmod-750").click();
  await expect.element(screen.getByTestId("terminal-input-prompt")).toHaveTextContent("user@coach:~$");

  // Solve Job 4 in Hard mode as a guest first
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

  // 4. Verify custom prompt name and terminal colors appear on active Coach job terminal
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Jobs" }).click();
  await screen.getByTestId("job-row-coach-sb-chmod-750").click();
  const promptLabel = screen.getByTestId("terminal-input-prompt");
  await expect.element(promptLabel).toHaveTextContent("MysterySoldier@coach:~$");
  expect((promptLabel.element() as HTMLElement).style.color).toBe("rgb(251, 146, 60)");
  const cmdInput = screen.getByTestId("coach-command-input");
  expect((cmdInput.element() as HTMLElement).style.color).toBe("rgb(192, 132, 252)");

  // Switch to Easy mode and verify Command Reference entry example line also shows MysterySoldier@coach:~$ in Orange
  await screen.getByRole("button", { name: /^Easy$/i }).click();
  await screen.getByTestId("easy-section-reference").click();
  await screen.getByTestId("reference-section-row-cat-1").click();
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

test("Round 4.9: Practice Terminal on Terminal tab runs scripted sequence at 375x812", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/");

  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Terminal" }).click();

  await expect.element(screen.getByTestId("practice-terminal-title")).toHaveTextContent("Practice Terminal");
  await expect
    .element(screen.getByTestId("practice-terminal-subtitle"))
    .toHaveTextContent("A pretend terminal. The library is the computer — nothing here is real, so you can't break anything.");
  await expect
    .element(screen.getByTestId("practice-terminal-welcome"))
    .toHaveTextContent("Welcome to the practice library. Type a command and press Enter.");
  await expect
    .element(screen.getByTestId("practice-terminal-hint"))
    .toHaveTextContent("Try: ls · ls -a · ls -la · cd maps · pwd · mkdir school · help");
  await expect.element(screen.getByTestId("practice-terminal-prompt")).toHaveTextContent("Tobias@coach:~$");

  const input = screen.getByTestId("practice-terminal-input");
  const submitCmd = async (cmd: string) => {
    await input.fill(cmd);
    const form = input.element().closest("form")!;
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  };

  // Run the scripted sequence:
  // ls, ls -a, ls -la, cd maps, pwd, ls, cd .., mkdir school, ls, cd cooking, cd nope, help
  await submitCmd("ls");
  await submitCmd("ls -a");
  await expect.element(screen.getByText(".old-notes").first()).toBeInTheDocument();

  await submitCmd("ls -la");
  await expect.element(screen.getByText("12 pages")).toBeInTheDocument();
  await expect.element(screen.getByText("3 books")).toBeInTheDocument();

  await submitCmd("cd maps");
  await expect.element(screen.getByTestId("practice-terminal-prompt")).toHaveTextContent("Tobias@coach:~/maps$");

  await submitCmd("pwd");
  await expect.element(screen.getByTestId("practice-output-pwd")).toHaveTextContent("/home/Tobias/maps");

  await submitCmd("ls");
  await expect.element(screen.getByText("world")).toBeInTheDocument();
  await expect.element(screen.getByText("city")).toBeInTheDocument();
  await expect.element(screen.getByText("stars")).toBeInTheDocument();

  await submitCmd("cd ..");
  await expect.element(screen.getByTestId("practice-terminal-prompt")).toHaveTextContent("Tobias@coach:~$");

  await submitCmd("mkdir school");
  await submitCmd("ls");
  await expect.element(screen.getByText("school", { exact: true })).toBeInTheDocument();

  await submitCmd("cd cooking");
  await expect
    .element(screen.getByText('"cooking" is a book, not a shelf — you can\'t walk into it.'))
    .toBeInTheDocument();

  await submitCmd("cd nope");
  await expect
    .element(screen.getByText('There is no shelf or book called "nope" here.'))
    .toBeInTheDocument();

  await submitCmd("help");
  await expect.element(screen.getByText("what's on the shelf in front of you")).toBeInTheDocument();
  await expect.element(screen.getByText("wipe the screen clean")).toBeInTheDocument();

  // Check phone screen horizontal fit
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
});

test("Round 4.10: Reference illustrations for pwd, ls, and cd render after name and before description, while entries without an image render unchanged", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/coach");

  await screen.getByTestId("easy-section-reference").click();
  await screen.getByTestId("reference-section-row-cat-1").click();

  for (const cmd of ["pwd", "ls", "cd", "mkdir", "grep"] as const) {
    await screen.getByTestId(`command-item-cmd-${cmd}`).click();

    const nameEl = screen.getByTestId("command-entry-name").element() as HTMLElement;
    const imgEl = screen.getByTestId("command-entry-image").element() as HTMLImageElement;
    const descEl = screen.getByTestId("command-entry-description").element() as HTMLElement;

    expect(imgEl.getAttribute("src")).toBe(`/images/commands/${cmd}.jpg`);
    expect(imgEl.getAttribute("loading")).toBe("lazy");
    expect(imgEl.getAttribute("alt")).toBe(`A picture of the library for the ${cmd} command`);

    // Verify DOM order: name precedes image, image precedes description
    expect(Boolean(nameEl.compareDocumentPosition(imgEl) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(Boolean(imgEl.compareDocumentPosition(descEl) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);

    // Fits phone screen without horizontal scrolling
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

    await screen.getByTestId("command-entry-back").click();
  }

  // Open an entry without an image (wc) and confirm no image element or placeholder is rendered
  await screen.getByTestId("command-item-cmd-wc").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("wc");
  const entryCard = screen.getByTestId("command-entry-card").element();
  expect(entryCard.querySelector('[data-testid="command-entry-image"]')).toBeNull();
  expect(entryCard.querySelector("img")).toBeNull();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
});

test("Round 4.8 / 4.10 fix / 4.11: Reference speaker button plays recorded Kokoro af_heart clip, stops when tapped while speaking, falls back to speechSynthesis only if clip is missing, and ls description matches library wording", async () => {
  await page.viewport(375, 812);

  const playedSources: string[] = [];
  const spokenTexts: string[] = [];

  const playSpy = vi
    .spyOn(window.HTMLMediaElement.prototype, "play")
    .mockImplementation(function (this: HTMLMediaElement) {
      if (this.src) {
        playedSources.push(this.src);
      }
      return Promise.resolve();
    });

  const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");

  if (!window.speechSynthesis) {
    (window as unknown as { speechSynthesis: unknown }).speechSynthesis = {} as SpeechSynthesis;
  }
  const speakSpy = vi.spyOn(window.speechSynthesis, "speak").mockImplementation((utterance: SpeechSynthesisUtterance) => {
    spokenTexts.push(utterance.text);
    utterance.dispatchEvent(new Event("start"));
  });
  const cancelSpy = vi.spyOn(window.speechSynthesis, "cancel").mockImplementation(() => {});

  try {
    const screen = await renderApp("/coach");

    await screen.getByTestId("easy-section-reference").click();
    await screen.getByTestId("reference-section-row-cat-1").click();

    // 1. Open ls: confirm new description and auto-play
    const blobCountBeforeLs = playedSources.filter((s) => s.startsWith("blob:")).length;
    await screen.getByTestId("command-item-cmd-ls").click();
    await expect
      .element(screen.getByTestId("command-entry-description"))
      .toHaveTextContent("Opens the shelf and shows you everything on it — what's in this folder.");

    // 2. Round 4.16: opening ls automatically plays recorded Kokoro mp3 clip (no tap needed)
    const lsSpeakBtn = screen.getByTestId("command-entry-speak");
    await expect
      .poll(() => playedSources.filter((s) => s.startsWith("blob:")).length)
      .toBe(blobCountBeforeLs + 1);
    expect(speakSpy).not.toHaveBeenCalled();
    await expect.element(lsSpeakBtn).toHaveAttribute("aria-pressed", "true");

    // 3. Tapping the button while auto-playing stops it
    await lsSpeakBtn.click();
    expect(pauseSpy).toHaveBeenCalled();
    await expect.element(lsSpeakBtn).toHaveAttribute("aria-pressed", "false");

    // 3b. Tapping the button again while stopped replays the clip
    await lsSpeakBtn.click();
    await expect
      .poll(() => playedSources.filter((s) => s.startsWith("blob:")).length)
      .toBe(blobCountBeforeLs + 2);
    await expect.element(lsSpeakBtn).toHaveAttribute("aria-pressed", "true");

    // Back to category list
    await screen.getByTestId("command-entry-back").click();

    // 4. Open ln: automatically plays its recorded Kokoro mp3 clip
    const blobCountBeforeLn = playedSources.filter((s) => s.startsWith("blob:")).length;
    await screen.getByTestId("command-item-cmd-ln").click();
    const lnSpeakBtn = screen.getByTestId("command-entry-speak");
    await expect
      .poll(() => playedSources.filter((s) => s.startsWith("blob:")).length)
      .toBe(blobCountBeforeLn + 1);
    expect(speakSpy).not.toHaveBeenCalled();
    await expect.element(lnSpeakBtn).toHaveAttribute("aria-pressed", "true");

    // 5. Fallback check: if an entry's clip is missing (404), fall back to speechSynthesis with name + standsFor + What it does + description
    await screen.getByTestId("command-entry-back").click();
    const origFetch = window.fetch;
    window.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    try {
      await screen.getByTestId("command-item-cmd-nl").click();
      const nlSpeakBtn = screen.getByTestId("command-entry-speak");
      await expect.poll(() => spokenTexts.length).toBe(1);
      expect(spokenTexts[0]).toContain("N L. Number lines. What it does:");
      expect(spokenTexts[0].toLowerCase()).toContain("line numbers");
      await expect.element(nlSpeakBtn).toHaveAttribute("aria-pressed", "true");
    } finally {
      window.fetch = origFetch;
    }

    // 6. Round 4.14: cd, stat, and awk layout unchanged (standsFor NOT rendered on screen) and entries auto-play recorded clips
    for (const [cmd, forbiddenScreenText] of [
      ["cd", "Change directory"],
      ["stat", "Status"],
      ["awk", "What it does:"],
    ] as const) {
      await screen.getByTestId("command-entry-back").click();
      const beforeCount = playedSources.filter((s) => s.startsWith("blob:")).length;
      await screen.getByTestId(`command-item-cmd-${cmd}`).click();
      const cardText = screen.getByTestId("command-entry-card").element().textContent ?? "";
      expect(cardText).not.toContain(forbiddenScreenText);
      await expect
        .poll(() => playedSources.filter((s) => s.startsWith("blob:")).length)
        .toBe(beforeCount + 1);
      expect(speakSpy).toHaveBeenCalledTimes(1); // only from step 5 fallback
    }
  } finally {
    playSpy.mockRestore();
    pauseSpy.mockRestore();
    speakSpy.mockRestore();
    cancelSpy.mockRestore();
  }
});

test("Round 4.13: Tap-to-enlarge on Reference illustrations opens lightbox full-screen, supports double-tap zoom/drag, and closes via X, backdrop click, Escape key, or browser back", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/coach");

  await screen.getByTestId("easy-section-reference").click();
  await screen.getByTestId("reference-section-row-cat-1").click();

  // Test pwd entry
  await screen.getByTestId("command-item-cmd-pwd").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("pwd");

  // Tap image to enlarge
  await screen.getByTestId("command-entry-image").click();

  // Lightbox opens full-screen
  const lightbox = screen.getByTestId("image-lightbox");
  await expect.element(lightbox).toBeVisible();
  const lightboxImg = screen.getByTestId("lightbox-image");
  await expect.element(lightboxImg).toBeVisible();
  expect(lightboxImg.element().getAttribute("src")).toBe("/images/commands/pwd.jpg");

  // Double-click/double-tap to zoom in
  await lightboxImg.dblClick();
  expect(lightboxImg.element().style.transform).toContain("scale(2.5)");

  // Double-click/double-tap to zoom out
  await lightboxImg.dblClick();
  expect(lightboxImg.element().style.transform).toContain("scale(1)");

  // Close via X button
  await screen.getByTestId("lightbox-close").click();
  expect(document.querySelector('[data-testid="image-lightbox"]')).toBeNull();
  // Confirmed still on pwd entry
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("pwd");

  // Test close via Escape key
  await screen.getByTestId("command-entry-image").click();
  await expect.element(screen.getByTestId("image-lightbox")).toBeVisible();
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  await expect.poll(() => document.querySelector('[data-testid="image-lightbox"]')).toBeNull();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("pwd");

  // Test close via backdrop click
  await screen.getByTestId("command-entry-image").click();
  await expect.element(screen.getByTestId("image-lightbox")).toBeVisible();
  await screen.getByTestId("image-lightbox").click({ position: { x: 10, y: 10 } });
  await expect.poll(() => document.querySelector('[data-testid="image-lightbox"]')).toBeNull();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("pwd");

  // Test grep entry
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-grep").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("grep");

  await screen.getByTestId("command-entry-image").click();
  await expect.element(screen.getByTestId("image-lightbox")).toBeVisible();
  expect(screen.getByTestId("lightbox-image").element().getAttribute("src")).toBe("/images/commands/grep.jpg");
  await screen.getByTestId("lightbox-close").click();
  expect(document.querySelector('[data-testid="image-lightbox"]')).toBeNull();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("grep");

  // Test entry without picture (wc) has no lightbox trigger
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-wc").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("wc");
  expect(document.querySelector('[data-testid="command-entry-image"]')).toBeNull();
  expect(document.querySelector('[data-testid="command-entry-image-trigger"]')).toBeNull();

  // Round 4.15 checks: df (cat-5), apt (cat-7), man (cat-8), and ssh (cat-6, parked/no picture)
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("reference-category-back").click();

  // df in cat-5
  await screen.getByTestId("reference-section-row-cat-5").click();
  await screen.getByTestId("command-item-cmd-df").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("df");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/df.jpg");
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("reference-category-back").click();

  // apt in cat-7
  await screen.getByTestId("reference-section-row-cat-7").click();
  await screen.getByTestId("command-item-cmd-apt").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("apt");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/apt.jpg");
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("reference-category-back").click();

  // man in cat-8
  await screen.getByTestId("reference-section-row-cat-8").click();
  await screen.getByTestId("command-item-cmd-man").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("man");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/man.jpg");
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("reference-category-back").click();

  // ssh in cat-6 (parked: must have no picture)
  await screen.getByTestId("reference-section-row-cat-6").click();
  await screen.getByTestId("command-item-cmd-ssh").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("ssh");
  expect(document.querySelector('[data-testid="command-entry-image"]')).toBeNull();
  expect(document.querySelector('[data-testid="command-entry-image-trigger"]')).toBeNull();
});

test("Round 4.19: Section 2 illustrations render correctly for spot-checked commands (useradd, chmod, sudo, vipw), existing commands (pwd, ls, cd, vdir, cat) still show theirs, and parked command w has no picture", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/coach");

  await screen.getByTestId("easy-section-reference").click();

  // Section 2: check spot-check commands and parked w
  await screen.getByTestId("reference-section-row-cat-2").click();

  // 1. useradd
  await screen.getByTestId("command-item-cmd-useradd").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("useradd");
  const useraddImg = screen.getByTestId("command-entry-image");
  await expect.element(useraddImg).toBeVisible();
  expect(useraddImg.element().getAttribute("src")).toBe("/images/commands/useradd.jpg");
  // DOM order: name precedes image, image precedes description
  const useraddNameEl = screen.getByTestId("command-entry-name").element();
  const useraddImgEl = useraddImg.element();
  const useraddDescEl = screen.getByTestId("command-entry-description").element();
  expect(useraddNameEl.compareDocumentPosition(useraddImgEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(useraddImgEl.compareDocumentPosition(useraddDescEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // 2. chmod
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-chmod").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("chmod");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/chmod.jpg");

  // 3. sudo
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-sudo").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("sudo");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/sudo.jpg");

  // 4. vipw
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-vipw").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("vipw");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/vipw.jpg");

  // 5. w (parked: must have NO picture)
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-w").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("w");
  expect(document.querySelector('[data-testid="command-entry-image"]')).toBeNull();
  expect(document.querySelector('[data-testid="command-entry-image-trigger"]')).toBeNull();

  // Return to categories and check Section 1 commands still have pictures
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("reference-category-back").click();
  await screen.getByTestId("reference-section-row-cat-1").click();

  for (const cmd of ["pwd", "ls", "cd", "vdir", "cat"]) {
    await screen.getByTestId(`command-item-cmd-${cmd}`).click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent(cmd);
    expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe(`/images/commands/${cmd}.jpg`);
    await screen.getByTestId("command-entry-back").click();
  }
});

test("Round 4.20: Section 3 illustrations render correctly for spot-checked commands (ps, top, htop, pstree), existing commands (pwd, ls, cd, vdir, cat) still show theirs, and parked command wait has no picture", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/coach");

  await screen.getByTestId("easy-section-reference").click();

  // Section 3: check spot-check commands and parked wait
  await screen.getByTestId("reference-section-row-cat-3").click();

  // 1. ps
  await screen.getByTestId("command-item-cmd-ps").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("ps");
  const psImg = screen.getByTestId("command-entry-image");
  await expect.element(psImg).toBeVisible();
  expect(psImg.element().getAttribute("src")).toBe("/images/commands/ps.jpg");
  // DOM order: name precedes image, image precedes description
  const psNameEl = screen.getByTestId("command-entry-name").element();
  const psImgEl = psImg.element();
  const psDescEl = screen.getByTestId("command-entry-description").element();
  expect(psNameEl.compareDocumentPosition(psImgEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(psImgEl.compareDocumentPosition(psDescEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // 2. top
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-top").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("top");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/top.jpg");

  // 3. htop
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-htop").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("htop");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/htop.jpg");

  // 4. pstree
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-pstree").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("pstree");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/pstree.jpg");

  // 5. wait (parked: must have NO picture)
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-wait").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("wait");
  expect(document.querySelector('[data-testid="command-entry-image"]')).toBeNull();
  expect(document.querySelector('[data-testid="command-entry-image-trigger"]')).toBeNull();

  // Return to categories and check Section 1 commands still have pictures
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("reference-category-back").click();
  await screen.getByTestId("reference-section-row-cat-1").click();

  for (const cmd of ["pwd", "ls", "cd", "vdir", "cat"]) {
    await screen.getByTestId(`command-item-cmd-${cmd}`).click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent(cmd);
    expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe(`/images/commands/${cmd}.jpg`);
    await screen.getByTestId("command-entry-back").click();
  }
});

test("Round 4.21: Section 4 illustrations render correctly for spot-checked commands (free, uptime, dmesg, lscpu), existing commands (pwd, ls, cd, vdir, cat) still show theirs, and parked commands (strace, lsscsi, lsb_release) have no picture", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/coach");

  await screen.getByTestId("easy-section-reference").click();

  // Section 4: check spot-check commands and parked words
  await screen.getByTestId("reference-section-row-cat-4").click();

  // 1. free
  await screen.getByTestId("command-item-cmd-free").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("free");
  const freeImg = screen.getByTestId("command-entry-image");
  await expect.element(freeImg).toBeVisible();
  expect(freeImg.element().getAttribute("src")).toBe("/images/commands/free.jpg");
  // DOM order: name precedes image, image precedes description
  const freeNameEl = screen.getByTestId("command-entry-name").element();
  const freeImgEl = freeImg.element();
  const freeDescEl = screen.getByTestId("command-entry-description").element();
  expect(freeNameEl.compareDocumentPosition(freeImgEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(freeImgEl.compareDocumentPosition(freeDescEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // 2. uptime
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-uptime").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("uptime");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/uptime.jpg");

  // 3. dmesg
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-dmesg").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("dmesg");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/dmesg.jpg");

  // 4. lscpu
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-lscpu").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("lscpu");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/lscpu.jpg");

  // 5. strace (parked: must have NO picture)
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-strace").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("strace");
  expect(document.querySelector('[data-testid="command-entry-image"]')).toBeNull();
  expect(document.querySelector('[data-testid="command-entry-image-trigger"]')).toBeNull();

  // Return to categories and check Section 1 commands still have pictures
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("reference-category-back").click();
  await screen.getByTestId("reference-section-row-cat-1").click();

  for (const cmd of ["pwd", "ls", "cd", "vdir", "cat"]) {
    await screen.getByTestId(`command-item-cmd-${cmd}`).click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent(cmd);
    expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe(`/images/commands/${cmd}.jpg`);
    await screen.getByTestId("command-entry-back").click();
  }
});

test("Round 4.22: Section 5 illustrations render correctly for spot-checked commands (mount, fdisk, lsblk, du), existing commands (pwd, ls, cd, vdir, cat) still show theirs, and parked command cfdisk has no picture", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/coach");

  await screen.getByTestId("easy-section-reference").click();

  // Section 5: check spot-check commands and parked words
  await screen.getByTestId("reference-section-row-cat-5").click();

  // 1. mount
  await screen.getByTestId("command-item-cmd-mount").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("mount");
  const mountImg = screen.getByTestId("command-entry-image");
  await expect.element(mountImg).toBeVisible();
  expect(mountImg.element().getAttribute("src")).toBe("/images/commands/mount.jpg");
  // DOM order: name precedes image, image precedes description
  const mountNameEl = screen.getByTestId("command-entry-name").element();
  const mountImgEl = mountImg.element();
  const mountDescEl = screen.getByTestId("command-entry-description").element();
  expect(mountNameEl.compareDocumentPosition(mountImgEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(mountImgEl.compareDocumentPosition(mountDescEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // 2. fdisk
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-fdisk").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("fdisk");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/fdisk.jpg");

  // 3. lsblk
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-lsblk").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("lsblk");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/lsblk.jpg");

  // 4. du
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-du").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("du");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/du.jpg");

  // 5. cfdisk (parked: must have NO picture)
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-cfdisk").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("cfdisk");
  expect(document.querySelector('[data-testid="command-entry-image"]')).toBeNull();
  expect(document.querySelector('[data-testid="command-entry-image-trigger"]')).toBeNull();

  // Return to categories and check Section 1 commands still have pictures
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("reference-category-back").click();
  await screen.getByTestId("reference-section-row-cat-1").click();

  for (const cmd of ["pwd", "ls", "cd", "vdir", "cat"]) {
    await screen.getByTestId(`command-item-cmd-${cmd}`).click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent(cmd);
    expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe(`/images/commands/${cmd}.jpg`);
    await screen.getByTestId("command-entry-back").click();
  }
});

test("Round 4.23: Section 6 illustrations render correctly for spot-checked commands (ping, curl, ip, netstat) and nc (netcat), existing commands (pwd, ls, cd, vdir, cat) still show theirs, and parked command wget has no picture", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/coach");

  await screen.getByTestId("easy-section-reference").click();

  // Section 6: check spot-check commands and parked words
  await screen.getByTestId("reference-section-row-cat-6").click();

  // 1. ping
  await screen.getByTestId("command-item-cmd-ping").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("ping");
  const pingImg = screen.getByTestId("command-entry-image");
  await expect.element(pingImg).toBeVisible();
  expect(pingImg.element().getAttribute("src")).toBe("/images/commands/ping.jpg");
  // DOM order: name precedes image, image precedes description
  const pingNameEl = screen.getByTestId("command-entry-name").element();
  const pingImgEl = pingImg.element();
  const pingDescEl = screen.getByTestId("command-entry-description").element();
  expect(pingNameEl.compareDocumentPosition(pingImgEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(pingImgEl.compareDocumentPosition(pingDescEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // 2. curl
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-curl").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("curl");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/curl.jpg");

  // 3. ip
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-ip").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("ip");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/ip.jpg");

  // 4. netstat
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-netstat").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("netstat");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/netstat.jpg");

  // 5. nc (netcat)
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-nc-netcat").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("nc (netcat)");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/nc.jpg");

  // 6. wget (parked: must have NO picture)
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-wget").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("wget");
  expect(document.querySelector('[data-testid="command-entry-image"]')).toBeNull();
  expect(document.querySelector('[data-testid="command-entry-image-trigger"]')).toBeNull();

  // Return to categories and check Section 1 commands still have pictures
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("reference-category-back").click();
  await screen.getByTestId("reference-section-row-cat-1").click();

  for (const cmd of ["pwd", "ls", "cd", "vdir", "cat"]) {
    await screen.getByTestId(`command-item-cmd-${cmd}`).click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent(cmd);
    expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe(`/images/commands/${cmd}.jpg`);
    await screen.getByTestId("command-entry-back").click();
  }
});

test("Round 4.24: Section 7 illustrations render correctly for spot-checked commands (dpkg, rpm, docker, podman), existing commands (pwd, ls, cd, vdir, cat) still show theirs, and parked command snap has no picture", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/coach");

  await screen.getByTestId("easy-section-reference").click();

  // Section 7: check spot-check commands and parked words
  await screen.getByTestId("reference-section-row-cat-7").click();

  // 1. dpkg
  await screen.getByTestId("command-item-cmd-dpkg").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("dpkg");
  const dpkgImg = screen.getByTestId("command-entry-image");
  await expect.element(dpkgImg).toBeVisible();
  expect(dpkgImg.element().getAttribute("src")).toBe("/images/commands/dpkg.jpg");
  // DOM order: name precedes image, image precedes description
  const dpkgNameEl = screen.getByTestId("command-entry-name").element();
  const dpkgImgEl = dpkgImg.element();
  const dpkgDescEl = screen.getByTestId("command-entry-description").element();
  expect(dpkgNameEl.compareDocumentPosition(dpkgImgEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(dpkgImgEl.compareDocumentPosition(dpkgDescEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // 2. rpm
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-rpm").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("rpm");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/rpm.jpg");

  // 3. docker
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-docker").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("docker");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/docker.jpg");

  // 4. podman
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-podman").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("podman");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/podman.jpg");

  // 5. snap (parked: must have NO picture)
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-snap").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("snap");
  expect(document.querySelector('[data-testid="command-entry-image"]')).toBeNull();
  expect(document.querySelector('[data-testid="command-entry-image-trigger"]')).toBeNull();

  // Return to categories and check Section 1 commands still have pictures
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("reference-category-back").click();
  await screen.getByTestId("reference-section-row-cat-1").click();

  for (const cmd of ["pwd", "ls", "cd", "vdir", "cat"]) {
    await screen.getByTestId(`command-item-cmd-${cmd}`).click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent(cmd);
    expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe(`/images/commands/${cmd}.jpg`);
    await screen.getByTestId("command-entry-back").click();
  }
});

test("Round 4.25: Section 8 illustrations render correctly for spot-checked commands (alias, history, clear, nano), existing commands (pwd, ls, cd, vdir, cat) still show theirs, and parked command whatis has no picture", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/coach");

  await screen.getByTestId("easy-section-reference").click();

  // Section 8: check spot-check commands and parked words
  await screen.getByTestId("reference-section-row-cat-8").click();

  // 1. alias
  await screen.getByTestId("command-item-cmd-alias").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("alias");
  const aliasImg = screen.getByTestId("command-entry-image");
  await expect.element(aliasImg).toBeVisible();
  expect(aliasImg.element().getAttribute("src")).toBe("/images/commands/alias.jpg");
  // DOM order: name precedes image, image precedes description
  const aliasNameEl = screen.getByTestId("command-entry-name").element();
  const aliasImgEl = aliasImg.element();
  const aliasDescEl = screen.getByTestId("command-entry-description").element();
  expect(aliasNameEl.compareDocumentPosition(aliasImgEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(aliasImgEl.compareDocumentPosition(aliasDescEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // 2. history
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-history").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("history");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/history.jpg");

  // 3. clear
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-clear").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("clear");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/clear.jpg");

  // 4. nano
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-nano").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("nano");
  expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe("/images/commands/nano.jpg");

  // 5. whatis (parked: must have NO picture)
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-whatis").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("whatis");
  expect(document.querySelector('[data-testid="command-entry-image"]')).toBeNull();
  expect(document.querySelector('[data-testid="command-entry-image-trigger"]')).toBeNull();

  // Return to categories and check Section 1 commands still have pictures
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("reference-category-back").click();
  await screen.getByTestId("reference-section-row-cat-1").click();

  for (const cmd of ["pwd", "ls", "cd", "vdir", "cat"]) {
    await screen.getByTestId(`command-item-cmd-${cmd}`).click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent(cmd);
    expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe(`/images/commands/${cmd}.jpg`);
    await screen.getByTestId("command-entry-back").click();
  }
});

test("Round 4.26: /coach_echo subpath routing and asset resolution work alongside root /", async () => {
  await page.viewport(390, 844);
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.localStorage.setItem(TOUR_DONE_STORAGE_KEY, "true");
  window.history.pushState({}, "", "/coach_echo/coach");

  try {
    const screen = await render(<App />);

    await screen.getByTestId("easy-section-reference").click();
    await screen.getByTestId("reference-section-row-cat-8").click();

    await screen.getByTestId("command-item-cmd-nano").click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("nano");
    expect(screen.getByTestId("command-entry-image").element().getAttribute("src")).toBe(
      "/coach_echo/images/commands/nano.jpg",
    );

    await screen.getByTestId("command-entry-back").click();
    await screen.getByTestId("command-item-cmd-whatis").click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("whatis");
    expect(document.querySelector('[data-testid="command-entry-image"]')).toBeNull();
  } finally {
    window.history.pushState({}, "", "/");
  }
});

test("Round 4.27: Reference entry redesign (Help left + Report Bug right, no 'X of Y' counter, terminal window with title bar & cursor) and bug reporting (3 types, screenshot + confirm without screenshot, signed-in More list)", async () => {
  await page.viewport(390, 844);
  const screen = await renderApp("/coach");

  await screen.getByTestId("easy-section-reference").click();
  await screen.getByTestId("reference-section-row-cat-1").click();
  await screen.getByTestId("command-item-cmd-cp").click();

  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("cp");

  // 1. Help on left, Report Bug on right with inline SVG
  const helpBtn = screen.getByTestId("page-help-button").element();
  const reportBugBtn = screen.getByTestId("report-bug-button").element();
  await expect.element(screen.getByTestId("report-bug-icon-svg")).toBeVisible();
  expect(helpBtn.getBoundingClientRect().left).toBeLessThan(reportBugBtn.getBoundingClientRect().left);

  // 2. "X of 81" counter removed from Prev/Next row
  const navRowText = screen.getByTestId("command-entry-nav-row").element().textContent ?? "";
  expect(navRowText).not.toMatch(/\bof\s+\d+/i);

  // 3. Section 6 is a terminal window with title bar, viewport, output area, prompt at bottom, and blinking cursor
  await expect.element(screen.getByTestId("command-entry-terminal-window")).toBeVisible();
  await expect.element(screen.getByTestId("command-entry-terminal-titlebar")).toBeVisible();
  await expect.element(screen.getByTestId("command-entry-terminal-viewport")).toBeVisible();
  await expect.element(screen.getByTestId("command-entry-terminal-output")).toBeInTheDocument();
  await expect.element(screen.getByTestId("command-entry-example")).toHaveTextContent("cp");
  await expect.element(screen.getByTestId("terminal-cursor")).toBeVisible();

  // 4. Report 1 (without screenshot -> shows short confirm -> send without screenshot)
  await screen.getByTestId("report-bug-button").click();
  await expect.element(screen.getByTestId("bug-report-sheet")).toBeVisible();
  await expect.element(screen.getByTestId("bug-report-type-broken")).toHaveTextContent("Something's broken");
  await expect.element(screen.getByTestId("bug-report-type-confused")).toHaveTextContent(
    "The explanation confused me",
  );
  await expect.element(screen.getByTestId("bug-report-type-better")).toHaveTextContent(
    "I have a better explanation",
  );

  await screen.getByTestId("bug-report-description").fill("Test report without screenshot on cp");
  await screen.getByTestId("bug-report-submit").click();
  await expect.element(screen.getByTestId("bug-report-no-screenshot-confirm")).toBeVisible();
  await screen.getByTestId("bug-report-confirm-send-without").click();
  await expect.element(screen.getByTestId("bug-report-success")).toBeVisible();

  // Wait for sheet auto-close
  await new Promise((r) => setTimeout(r, 700));

  // 5. Report 2 (with type "The explanation confused me" and a screenshot)
  await screen.getByTestId("report-bug-button").click();
  await expect.element(screen.getByTestId("bug-report-sheet")).toBeVisible();
  await screen.getByTestId("bug-report-type-confused").click();

  const fileInput = screen.getByTestId("bug-report-file-input").element() as HTMLInputElement;
  const fakePng = new File(["fake-image-bytes"], "cp-page.png", { type: "image/png" });
  const dt = new DataTransfer();
  dt.items.add(fakePng);
  fileInput.files = dt.files;
  fileInput.dispatchEvent(new Event("change", { bubbles: true }));

  await expect.element(screen.getByTestId("bug-report-preview-image")).toBeVisible();
  await screen.getByTestId("bug-report-description").fill("Confused about -r flag on cp");
  await screen.getByTestId("bug-report-submit").click();
  await expect.element(screen.getByTestId("bug-report-success")).toBeVisible();
  await new Promise((r) => setTimeout(r, 700));

  // 6. Navigate to More screen: hidden for guest, visible when signed in
  await screen.getByTestId("bottom-nav-more").click();
  expect(document.querySelector('[data-testid="bug-reports-section"]')).toBeNull();

  await screen.getByTestId("google-signin-button").click();
  await screen.getByTestId("signin-display-name-input").fill("Tobias");
  await screen.getByTestId("google-signin-submit").click();

  await expect.element(screen.getByTestId("bug-reports-section")).toBeVisible();
  await expect.element(screen.getByTestId("bug-reports-list")).toBeVisible();
  const items = document.querySelectorAll('[data-testid="bug-report-item"]');
  expect(items.length).toBeGreaterThanOrEqual(2);
  expect(items[0].textContent).toContain("The explanation confused me");
  expect(items[0].textContent).toContain("Confused about -r flag on cp");
  expect(items[0].textContent).toContain("cp");
  expect(items[0].textContent).toContain("BUILD_ID:");
  expect(items[0].querySelector('[data-testid="bug-report-item-photo"]')).not.toBeNull();
  expect(items[1].textContent).toContain("Something's broken");
  expect(items[1].textContent).toContain("Test report without screenshot on cp");
});

test("Round 4.16: Reference speaker clips auto-play when entry opens, continue on Next/Prev navigation, stop on navigate away or speaker button tap, and replay on speaker tap", async () => {
  await page.viewport(375, 812);

  const playedSources: string[] = [];

  const playSpy = vi
    .spyOn(window.HTMLMediaElement.prototype, "play")
    .mockImplementation(function (this: HTMLMediaElement) {
      if (this.src) {
        playedSources.push(this.src);
      }
      return Promise.resolve();
    });

  const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");

  try {
    const screen = await renderApp("/coach");

    await screen.getByTestId("easy-section-reference").click();
    await screen.getByTestId("reference-section-row-cat-1").click();

    // 1. Open cd from category list: auto-plays immediately without tapping speaker button
    const blobCountBeforeCd = playedSources.filter((s) => s.startsWith("blob:")).length;
    await screen.getByTestId("command-item-cmd-cd").click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("cd");

    const cdSpeakBtn = screen.getByTestId("command-entry-speak");
    await expect
      .poll(() => playedSources.filter((s) => s.startsWith("blob:")).length)
      .toBe(blobCountBeforeCd + 1);
    await expect.element(cdSpeakBtn).toHaveAttribute("aria-pressed", "true");

    // 2. Next button: navigates to next entry and auto-plays the new entry's clip
    const blobCountBeforeNext = playedSources.filter((s) => s.startsWith("blob:")).length;
    await screen.getByTestId("command-entry-next").click();
    await expect
      .poll(() => playedSources.filter((s) => s.startsWith("blob:")).length)
      .toBe(blobCountBeforeNext + 1);
    const nextEntryName = screen.getByTestId("command-entry-name").element().textContent;
    expect(nextEntryName).not.toBe("cd");

    // 3. Prev button: navigates back to cd and auto-plays cd clip
    const blobCountBeforePrev = playedSources.filter((s) => s.startsWith("blob:")).length;
    await screen.getByTestId("command-entry-prev").click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("cd");
    await expect
      .poll(() => playedSources.filter((s) => s.startsWith("blob:")).length)
      .toBe(blobCountBeforePrev + 1);
    await expect.element(cdSpeakBtn).toHaveAttribute("aria-pressed", "true");

    // 4. Tap speaker button while auto-playing: stops playback
    await cdSpeakBtn.click();
    expect(pauseSpy).toHaveBeenCalled();
    await expect.element(cdSpeakBtn).toHaveAttribute("aria-pressed", "false");

    // 5. Tap speaker button while stopped: replays the clip
    const blobCountBeforeReplay = playedSources.filter((s) => s.startsWith("blob:")).length;
    await cdSpeakBtn.click();
    await expect
      .poll(() => playedSources.filter((s) => s.startsWith("blob:")).length)
      .toBe(blobCountBeforeReplay + 1);
    await expect.element(cdSpeakBtn).toHaveAttribute("aria-pressed", "true");

    // 6. Navigate away (back to category): cancels playback
    pauseSpy.mockClear();
    await screen.getByTestId("command-entry-back").click();
    await expect.element(screen.getByTestId("command-reference-category-view")).toBeInTheDocument();
    expect(pauseSpy).toHaveBeenCalled();

    // 7. Verify layout: fits phone screen with zero horizontal scroll, no extra controls or checkboxes
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  } finally {
    playSpy.mockRestore();
    pauseSpy.mockRestore();
  }
});

test("Round 4.17: 82 command illustrations in mapping, spot-checks (vdir, cat, find, tar, sync, pwd, ls, cd) render picture correctly, and wc/xz have no picture", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/coach");

  await screen.getByTestId("easy-section-reference").click();
  await screen.getByTestId("reference-section-row-cat-1").click();

  // 1. Spot-check 5 requested new entries: vdir, cat, find, tar, sync
  for (const cmd of ["vdir", "cat", "find", "tar", "sync"] as const) {
    await screen.getByTestId(`command-item-cmd-${cmd}`).click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent(cmd);

    const imgEl = screen.getByTestId("command-entry-image").element() as HTMLImageElement;
    expect(imgEl).not.toBeNull();
    expect(imgEl.getAttribute("src")).toBe(`/images/commands/${cmd}.jpg`);
    expect(imgEl.getAttribute("alt")).toBe(`A picture of the library for the ${cmd} command`);

    // Verify DOM order: name precedes image, image precedes description
    const nameEl = screen.getByTestId("command-entry-name").element() as HTMLElement;
    const descEl = screen.getByTestId("command-entry-description").element() as HTMLElement;
    expect(Boolean(nameEl.compareDocumentPosition(imgEl) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(Boolean(imgEl.compareDocumentPosition(descEl) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    await screen.getByTestId("command-entry-back").click();
  }

  // 2. Confirm pwd, ls, cd still show theirs
  for (const cmd of ["pwd", "ls", "cd"] as const) {
    await screen.getByTestId(`command-item-cmd-${cmd}`).click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent(cmd);
    const imgEl = screen.getByTestId("command-entry-image").element() as HTMLImageElement;
    expect(imgEl.getAttribute("src")).toBe(`/images/commands/${cmd}.jpg`);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    await screen.getByTestId("command-entry-back").click();
  }

  // 3. Confirm wc and xz have NO picture (parked words)
  for (const cmd of ["wc", "xz"] as const) {
    await screen.getByTestId(`command-item-cmd-${cmd}`).click();
    await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent(cmd);
    const entryCard = screen.getByTestId("command-entry-card").element();
    expect(entryCard.querySelector('[data-testid="command-entry-image"]')).toBeNull();
    expect(entryCard.querySelector("img")).toBeNull();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    await screen.getByTestId("command-entry-back").click();
  }
});

test("Round 4.18: Who's Who narration + speaker button, first-run guided tour with highlight & Skip, Settings Walk Through replay, and Page Help buttons", async () => {
  await page.viewport(375, 812);

  const playedSources: string[] = [];

  const playSpy = vi
    .spyOn(window.HTMLMediaElement.prototype, "play")
    .mockImplementation(function (this: HTMLMediaElement) {
      if (this.src) {
        playedSources.push(this.src);
      }
      return Promise.resolve();
    });

  const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");

  try {
    // 1. First run (no tour-done flag): starts on Who's Who, autoplays narration, highlights Modes
    const screen = await renderApp("/", { firstRunTour: true });

    await expect.element(screen.getByTestId("whos-who-screen")).toBeInTheDocument();
    await expect
      .element(
        screen.getByText(
          /Head librarian and coach\. Knows the library, shows you around, trains you until you don't need them\./,
        ),
      )
      .toBeInTheDocument();

    const whosWhoSpeakBtn = screen.getByTestId("whos-who-speak");
    await expect.poll(() => playedSources.filter((s) => s.startsWith("blob:")).length).toBeGreaterThanOrEqual(1);
    await expect.element(whosWhoSpeakBtn).toHaveAttribute("aria-pressed", "true");

    // Tour banner is visible and Modes is highlighted
    await expect.element(screen.getByTestId("guided-tour-banner")).toBeInTheDocument();
    await expect.element(screen.getByTestId("bottom-nav-modes")).toHaveAttribute("data-tour-highlighted", "true");
    await expect.element(screen.getByTestId("bottom-nav-coach")).toHaveAttribute("data-tour-highlighted", "false");

    // Tapping a non-highlighted button does nothing to the tour
    await screen.getByTestId("bottom-nav-jobs").click();
    await expect.element(screen.getByTestId("bottom-nav-modes")).toHaveAttribute("data-tour-highlighted", "true");

    // Tapping Modes advances the tour to Coach and navigates to Home
    const blobsBeforeModes = playedSources.filter((s) => s.startsWith("blob:")).length;
    await screen.getByTestId("bottom-nav-modes").click();
    await expect.element(screen.getByTestId("mode-card-easy")).toBeInTheDocument();
    await expect.element(screen.getByTestId("bottom-nav-coach")).toHaveAttribute("data-tour-highlighted", "true");
    await expect.poll(() => playedSources.filter((s) => s.startsWith("blob:")).length).toBeGreaterThan(blobsBeforeModes);

    // 2. Skip ends the tour and sets the tour-done flag
    await screen.getByTestId("guided-tour-skip").click();
    expect(document.querySelector('[data-testid="guided-tour-banner"]')).toBeNull();
    expect(window.localStorage.getItem(TOUR_DONE_STORAGE_KEY)).toBe("true");

    // 3. Page Help on Home plays and toggles off on second tap
    const homeHelpBtn = screen.getByTestId("page-help-button");
    await expect.element(homeHelpBtn).toHaveAttribute("data-help-page", "home");
    const blobsBeforeHomeHelp = playedSources.filter((s) => s.startsWith("blob:")).length;
    await homeHelpBtn.click();
    await expect
      .poll(() => playedSources.filter((s) => s.startsWith("blob:")).length)
      .toBe(blobsBeforeHomeHelp + 1);
    await expect.element(homeHelpBtn).toHaveAttribute("aria-pressed", "true");
    await homeHelpBtn.click();
    await expect.element(homeHelpBtn).toHaveAttribute("aria-pressed", "false");

    // 4. Settings -> Walk Through replays the full tour from Who's Who
    await screen.getByTestId("bottom-nav-more").click();
    await expect.element(screen.getByTestId("walk-through-button")).toBeInTheDocument();
    await screen.getByTestId("walk-through-button").click();

    await expect.element(screen.getByTestId("whos-who-screen")).toBeInTheDocument();
    await expect.element(screen.getByTestId("guided-tour-banner")).toBeInTheDocument();
    await expect.element(screen.getByTestId("bottom-nav-modes")).toHaveAttribute("data-tour-highlighted", "true");

    // Walk through all 5 steps: Modes -> Coach -> Jobs -> Terminal -> More -> returns to Who's Who
    await screen.getByTestId("bottom-nav-modes").click();
    await expect.element(screen.getByTestId("bottom-nav-coach")).toHaveAttribute("data-tour-highlighted", "true");
    await screen.getByTestId("bottom-nav-coach").click();
    await expect.element(screen.getByTestId("bottom-nav-jobs")).toHaveAttribute("data-tour-highlighted", "true");
    await screen.getByTestId("bottom-nav-jobs").click();
    await expect.element(screen.getByTestId("bottom-nav-terminal")).toHaveAttribute("data-tour-highlighted", "true");
    await screen.getByTestId("bottom-nav-terminal").click();
    await expect.element(screen.getByTestId("bottom-nav-more")).toHaveAttribute("data-tour-highlighted", "true");
    await screen.getByTestId("bottom-nav-more").click();

    // After More explanation finishes, returns to Who's Who and ends tour
    await expect.element(screen.getByTestId("whos-who-screen")).toBeInTheDocument();
    expect(document.querySelector('[data-testid="guided-tour-banner"]')).toBeNull();

    // 5. Who's Who speaker button stops and replays narration
    const speakBtnOnWhosWho = screen.getByTestId("whos-who-speak");
    await expect.element(speakBtnOnWhosWho).toHaveAttribute("aria-pressed", "true");
    await speakBtnOnWhosWho.click();
    expect(pauseSpy).toHaveBeenCalled();
    await expect.element(speakBtnOnWhosWho).toHaveAttribute("aria-pressed", "false");
    const blobsBeforeWhosWhoReplay = playedSources.filter((s) => s.startsWith("blob:")).length;
    await speakBtnOnWhosWho.click();
    await expect
      .poll(() => playedSources.filter((s) => s.startsWith("blob:")).length)
      .toBe(blobsBeforeWhosWhoReplay + 1);
    await expect.element(speakBtnOnWhosWho).toHaveAttribute("aria-pressed", "true");

    // 6. Page Help on a Reference entry (pwd)
    await screen.getByTestId("whos-who-back").click();
    await screen.getByTestId("reference-section-row-cat-1").click();
    await screen.getByTestId("command-item-cmd-pwd").click();
    const refEntryHelpBtn = screen.getByTestId("page-help-button");
    await expect.element(refEntryHelpBtn).toHaveAttribute("data-help-page", "reference-entry");
    const blobsBeforeEntryHelp = playedSources.filter((s) => s.startsWith("blob:")).length;
    await refEntryHelpBtn.click();
    await expect
      .poll(() => playedSources.filter((s) => s.startsWith("blob:")).length)
      .toBe(blobsBeforeEntryHelp + 1);
    await expect.element(refEntryHelpBtn).toHaveAttribute("aria-pressed", "true");
  } finally {
    playSpy.mockRestore();
    pauseSpy.mockRestore();
  }
});

test("Round 4.28: app display name is Over Your Shoulder while coach character remains Coach Echo", async () => {
  const screen = await renderApp("/");

  // 1. App header title & subtitle on home/Modes screen
  const headerHeading = screen.getByRole("heading", { name: "Over Your Shoulder", exact: true });
  await expect.element(headerHeading).toBeInTheDocument();
  await expect
    .element(screen.getByText("Learn Linux with Coach Echo over your shoulder", { exact: true }))
    .toBeInTheDocument();

  // 2. Tab title is "Over Your Shoulder"
  expect(document.title).toBe("Over Your Shoulder");

  // 3. Who's Who screen retains Coach Echo character name
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Coach" }).click();
  await screen.getByRole("button", { name: /Command Reference/i }).click();
  await screen.getByTestId("reference-whos-who-row").click();
  await expect.element(screen.getByTestId("whos-who-screen")).toBeInTheDocument();
  await expect.element(screen.getByRole("heading", { name: "Coach Echo", exact: true })).toBeInTheDocument();
  await expect
    .element(screen.getByText(/Head librarian and coach\. Knows the library, shows you around, trains you until you don't need them\./))
    .toBeInTheDocument();
});

test("Round 4.29: Report Bug row (Help left, Report Bug right) renders on all 12 screens with Screen: <name> context, sits below Flash Cards action buttons, and keeps Reference entry row unchanged", async () => {
  await page.viewport(390, 844);
  const screen = await renderApp("/");

  const assertHelpAndBugRow = async (expectedPageId: string, expectedScreenLabel?: string) => {
    const helpBtnLoc = screen.getByTestId("page-help-button");
    const reportBugBtnLoc = screen.getByTestId("report-bug-button");
    await expect.element(helpBtnLoc).toHaveAttribute("data-help-page", expectedPageId);
    await expect.element(reportBugBtnLoc).toBeVisible();
    await expect.element(screen.getByTestId("report-bug-icon-svg")).toBeVisible();

    const helpRect = helpBtnLoc.element().getBoundingClientRect();
    const bugRect = reportBugBtnLoc.element().getBoundingClientRect();
    expect(helpRect.left).toBeLessThan(bugRect.left);

    if (expectedScreenLabel) {
      await reportBugBtnLoc.click();
      await expect.element(screen.getByTestId("bug-report-sheet")).toBeVisible();
      await expect
        .element(screen.getByTestId("bug-report-context-label"))
        .toHaveTextContent(`Screen: ${expectedScreenLabel}`);
      await screen.getByTestId("bug-report-close").click();
      expect(document.querySelector('[data-testid="bug-report-sheet"]')).toBeNull();
    }
  };

  // 1. Home / Modes
  await assertHelpAndBugRow("home", "Home / Modes");

  // 2. Easy (via mode card -> /coach?mode=easy)
  await screen.getByTestId("mode-card-easy").click();
  await assertHelpAndBugRow("easy", "Easy");

  // 3. Coach (via bottom nav -> /coach)
  await screen.getByTestId("bottom-nav-coach").click();
  await assertHelpAndBugRow("coach", "Coach");

  // 4. Command Reference list
  await screen.getByTestId("easy-section-reference").click();
  await assertHelpAndBugRow("reference-list", "Command Reference list");

  // 5. Who's Who
  await screen.getByTestId("reference-whos-who-row").click();
  await assertHelpAndBugRow("whos-who", "Who's Who");

  // Reference entry (unchanged: shows Entry: cp)
  await screen.getByTestId("whos-who-back").click();
  await screen.getByTestId("reference-section-row-cat-1").click();
  await screen.getByTestId("command-item-cmd-cp").click();
  await assertHelpAndBugRow("reference-entry");
  await screen.getByTestId("report-bug-button").click();
  await expect
    .element(screen.getByTestId("bug-report-context-label"))
    .toHaveTextContent("Entry: cp");
  await screen.getByTestId("bug-report-close").click();
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("reference-category-back").click();
  await screen.getByTestId("easy-section-back").click();

  // 6. Flash Cards (row sits below Mastered / Flip / Next action buttons)
  await screen.getByTestId("easy-section-flashcards").click();
  const masteredRect = screen.getByTestId("flashcard-action-mastered").element().getBoundingClientRect();
  const fcHelpRect = screen.getByTestId("page-help-button").element().getBoundingClientRect();
  expect(fcHelpRect.top).toBeGreaterThanOrEqual(masteredRect.bottom);
  await assertHelpAndBugRow("flashcards", "Flash Cards");
  await screen.getByTestId("easy-section-back").click();

  // 7. Exams
  await screen.getByTestId("easy-section-exams").click();
  await assertHelpAndBugRow("exams", "Exams");

  // 8. Jobs
  await screen.getByTestId("bottom-nav-jobs").click();
  await assertHelpAndBugRow("jobs", "Jobs");

  // 9. Job detail
  await screen.getByTestId("job-row-coach-sb-chmod-750").click();
  await assertHelpAndBugRow("job-detail", "Job detail");

  // 10. Practice Terminal
  await screen.getByTestId("bottom-nav-terminal").click();
  await assertHelpAndBugRow("practice-terminal", "Practice Terminal");

  // 11. Settings (/settings via More bottom nav)
  await screen.getByTestId("bottom-nav-more").click();
  await assertHelpAndBugRow("settings", "Settings");

  // 12. More (/more route)
  await screen.unmount();
  const moreScreen = await renderApp("/more");
  const moreHelpBtn = moreScreen.getByTestId("page-help-button");
  const moreBugBtn = moreScreen.getByTestId("report-bug-button");
  await expect.element(moreHelpBtn).toHaveAttribute("data-help-page", "more");
  expect(moreHelpBtn.element().getBoundingClientRect().left).toBeLessThan(
    moreBugBtn.element().getBoundingClientRect().left,
  );
  await moreBugBtn.click();
  await expect
    .element(moreScreen.getByTestId("bug-report-context-label"))
    .toHaveTextContent("Screen: More");
  await moreScreen.getByTestId("bug-report-close").click();
});

test("Round 4.31: More screen renders Privacy Policy link pointing to /privacy.html", async () => {
  const screen = await renderApp("/more");

  const privacyLink = screen.getByTestId("privacy-policy-link");
  await expect.element(privacyLink).toBeVisible();
  await expect.element(privacyLink).toHaveAttribute("target", "_blank");
  await expect.element(privacyLink).toHaveAttribute("href", expect.stringMatching(/\/privacy\.html$/));
  await expect.element(screen.getByText("Privacy Policy")).toBeInTheDocument();

  // Also verify on /settings
  await screen.unmount();
  const settingsScreen = await renderApp("/settings");
  await expect.element(settingsScreen.getByTestId("privacy-policy-link")).toBeVisible();
});
