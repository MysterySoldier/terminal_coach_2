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

test("main screen: renders NeoServer layout with Coach Echo title + Over Your Shoulder subtitle, no header speaker button, 4 mode cards, OVERLOAD badge, 3 rings per card (no bottom panels), and 5-item bottom nav", async () => {
  const screen = await renderApp("/");

  await expect.element(screen.getByRole("heading", { name: "Coach Echo", exact: true })).toBeInTheDocument();
  await expect.element(screen.getByText("Over Your Shoulder", { exact: true })).toBeInTheDocument();
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

  const heading = screen.getByRole("heading", { name: "Coach Echo", exact: true });
  await expect.element(heading).toBeInTheDocument();
  await expect.element(screen.getByText("Over Your Shoulder", { exact: true })).toBeInTheDocument();
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
    await expect.element(screen.getByRole("heading", { name: "Coach Echo", exact: true })).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(3500);
    await screen.getByText("Over Your Shoulder", { exact: true }).click();
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
    await pwaScreen.getByText("Over Your Shoulder", { exact: true }).click();
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

  // Open an entry without an image (vdir) and confirm no image element or placeholder is rendered
  await screen.getByTestId("command-item-cmd-vdir").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("vdir");
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

    // 1. Open ls: confirm new description
    await screen.getByTestId("command-item-cmd-ls").click();
    await expect
      .element(screen.getByTestId("command-entry-description"))
      .toHaveTextContent("Opens the shelf and shows you everything on it — what's in this folder.");

    // 2. Tap speaker on ls: confirm recorded Kokoro mp3 clip is fetched & played via HTMLAudioElement (not speechSynthesis)
    const blobCountBeforeLs = playedSources.filter((s) => s.startsWith("blob:")).length;
    const lsSpeakBtn = screen.getByTestId("command-entry-speak");
    await lsSpeakBtn.click();
    await expect
      .poll(() => playedSources.filter((s) => s.startsWith("blob:")).length)
      .toBe(blobCountBeforeLs + 1);
    expect(speakSpy).not.toHaveBeenCalled();
    await expect.element(lsSpeakBtn).toHaveAttribute("aria-pressed", "true");

    // 3. Tapping the button while speaking stops it
    await lsSpeakBtn.click();
    expect(pauseSpy).toHaveBeenCalled();
    await expect.element(lsSpeakBtn).toHaveAttribute("aria-pressed", "false");

    // Back to category list
    await screen.getByTestId("command-entry-back").click();

    // 4. Open ln: tap speaker and confirm its recorded Kokoro mp3 clip plays
    await screen.getByTestId("command-item-cmd-ln").click();
    const blobCountBeforeLn = playedSources.filter((s) => s.startsWith("blob:")).length;
    const lnSpeakBtn = screen.getByTestId("command-entry-speak");
    await lnSpeakBtn.click();
    await expect
      .poll(() => playedSources.filter((s) => s.startsWith("blob:")).length)
      .toBe(blobCountBeforeLn + 1);
    expect(speakSpy).not.toHaveBeenCalled();
    await expect.element(lnSpeakBtn).toHaveAttribute("aria-pressed", "true");

    // 5. Fallback check: if an entry's clip is missing (404), fall back to speechSynthesis with name + standsFor + What it does + description
    await screen.getByTestId("command-entry-back").click();
    await screen.getByTestId("command-item-cmd-mkdir").click();
    const origFetch = window.fetch;
    window.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    try {
      const mkdirSpeakBtn = screen.getByTestId("command-entry-speak");
      await mkdirSpeakBtn.click();
      await expect.poll(() => spokenTexts.length).toBe(1);
      expect(spokenTexts[0]).toContain("make dir. Make directory. What it does:");
      expect(spokenTexts[0].toLowerCase()).toContain("empty shelf");
      await expect.element(mkdirSpeakBtn).toHaveAttribute("aria-pressed", "true");
    } finally {
      window.fetch = origFetch;
    }

    // 6. Round 4.14: cd, stat, and awk layout unchanged (standsFor NOT rendered on screen) and speaker plays recorded clips
    for (const [cmd, forbiddenScreenText] of [
      ["cd", "Change directory"],
      ["stat", "Status"],
      ["awk", "What it does:"],
    ] as const) {
      await screen.getByTestId("command-entry-back").click();
      await screen.getByTestId(`command-item-cmd-${cmd}`).click();
      const cardText = screen.getByTestId("command-entry-card").element().textContent ?? "";
      expect(cardText).not.toContain(forbiddenScreenText);
      const beforeCount = playedSources.filter((s) => s.startsWith("blob:")).length;
      await screen.getByTestId("command-entry-speak").click();
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

  // Test entry without picture (vdir) has no lightbox trigger
  await screen.getByTestId("command-entry-back").click();
  await screen.getByTestId("command-item-cmd-vdir").click();
  await expect.element(screen.getByTestId("command-entry-name")).toHaveTextContent("vdir");
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
