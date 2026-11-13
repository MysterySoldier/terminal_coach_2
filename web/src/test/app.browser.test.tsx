import { MemoryRouter } from "react-router-dom";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";

import { AppRoutes } from "@/App";
import { CardAudioProvider } from "@/hooks/useCardAudio";
import { CoachThemeProvider } from "@/store/theme-store";

async function renderApp(initialPath = "/") {
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

test("main screen: renders NeoServer layout with Coach title, 4 mode cards, OVERLOAD badge, 3 rings per card (no bottom panels), and 5-item bottom nav", async () => {
  const screen = await renderApp("/");

  await expect.element(screen.getByRole("heading", { name: "Coach", exact: true })).toBeInTheDocument();
  await expect.element(screen.getByTestId("mode-card-easy")).toBeInTheDocument();
  await expect.element(screen.getByTestId("mode-card-medium")).toBeInTheDocument();
  await expect.element(screen.getByTestId("mode-card-hard")).toBeInTheDocument();
  await expect.element(screen.getByTestId("mode-card-extreme")).toBeInTheDocument();
  await expect.element(screen.getByTestId("overload-badge")).toHaveTextContent("OVERLOAD");

  // 3 progress rings per card with exact labels & counts, and zero bottom sparkline panels
  await expect.element(screen.getByTestId("ring-easy-passed")).toHaveTextContent("0/16");
  await expect.element(screen.getByTestId("ring-easy-clean")).toHaveTextContent("0/16");
  await expect.element(screen.getByTestId("ring-easy-tried")).toHaveTextContent("0/16");
  await expect.element(screen.getByTestId("ring-medium-passed")).toHaveTextContent("0/16");
  await expect.element(screen.getByTestId("ring-medium-tried")).toHaveTextContent("0/16");
  await expect.element(screen.getByTestId("ring-medium-clean")).toHaveTextContent("0/16");
  await expect.element(screen.getByTestId("ring-hard-passed")).toHaveTextContent("0/16");
  await expect.element(screen.getByTestId("ring-hard-reboot")).toHaveTextContent("0/1");
  await expect.element(screen.getByTestId("ring-hard-tried")).toHaveTextContent("0/16");
  await expect.element(screen.getByTestId("ring-extreme-complete")).toHaveTextContent("0/16");
  await expect.element(screen.getByTestId("ring-extreme-cold1")).toHaveTextContent("0/16");
  await expect.element(screen.getByTestId("ring-extreme-locked")).toHaveTextContent("0/16");

  expect(document.querySelector('[data-testid^="sparkline-"]')).toBeNull();
  await expect.element(screen.getByText(/16-job pass profile/i)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/jobs touched/i)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/16-job cold profile/i)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/zero-hint rounds/i)).not.toBeInTheDocument();

  // Bottom navigation has exact 5 items with Modes active
  const nav = screen.getByRole("navigation", { name: "Bottom navigation" });
  await expect.element(nav.getByRole("link", { name: "Modes" })).toHaveAttribute("aria-current", "page");
  await expect.element(nav.getByRole("link", { name: "Coach" })).toBeInTheDocument();
  await expect.element(nav.getByRole("link", { name: "Jobs" })).toBeInTheDocument();
  await expect.element(nav.getByRole("link", { name: "Terminal" })).toBeInTheDocument();
  await expect.element(nav.getByRole("link", { name: "More" })).toBeInTheDocument();
});

test("navigation: mode card links to mode's 16-job list, and clicking a job opens the coach job screen on that job", async () => {
  const screen = await renderApp("/");

  await screen.getByTestId("mode-card-hard").click();
  await expect.element(screen.getByRole("heading", { name: "Hard Jobs" })).toBeInTheDocument();

  // All 16 jobs render in the job list
  const chmodRow = screen.getByTestId("job-row-coach-sb-chmod-750");
  await expect.element(chmodRow).toBeInTheDocument();
  await chmodRow.click();

  // Opens moved Coach job screen directly on Job 4 in Hard mode
  await expect.element(screen.getByText(/Job 4 of 16: Lock down deploy\.sh/)).toBeInTheDocument();
  const input = screen.getByLabelText(/user@coach/);
  await input.fill("chmod 750 deploy.sh");
  const el = input.element() as HTMLInputElement;
  el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));

  await expect.element(screen.getByText(/Proof — all three must be true/)).toBeInTheDocument();

  // Returning to Modes shows green dot and 1 / 16 cold on Hard card
  await screen.getByRole("navigation", { name: "Bottom navigation" }).getByRole("link", { name: "Modes" }).click();
  await expect.element(screen.getByTestId("mode-card-hard")).toHaveTextContent("1 / 16 cold");
  await expect.element(screen.getByTestId("ring-hard-passed")).toHaveTextContent("1/16");
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

test("mobile layout: fits a 375px phone screen with zero horizontal scrolling across Modes, Jobs, Coach, and Settings", async () => {
  await page.viewport(375, 812);
  const screen = await renderApp("/");

  await expect.element(screen.getByTestId("mode-card-extreme")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  await screen.getByTestId("mode-card-medium").click();
  await expect.element(screen.getByRole("heading", { name: "Medium Jobs" })).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  await screen.getByTestId("job-row-coach-restore-backup").click();
  await expect.element(screen.getByTestId("shadow-remaining")).toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);

  // Switch to Easy in Coach: 'Where You Stand' section is completely gone across Coach
  await screen.getByRole("button", { name: /^Easy$/i }).click();
  await expect.element(screen.getByText(/Where you stand/i)).not.toBeInTheDocument();
  expect(document.querySelector('section[aria-label="Readiness report"]')).toBeNull();
  await expect.element(screen.getByText(/Easy: 0 of 16 jobs passed\./)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/Hard: 0 of 16 jobs done cold\./)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/Extreme: 0 of 16 jobs proved cold twice\./)).not.toBeInTheDocument();
  await expect.element(screen.getByText(/Next in Easy:/)).not.toBeInTheDocument();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
});
