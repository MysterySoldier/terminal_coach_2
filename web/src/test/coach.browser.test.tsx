import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "vitest-browser-react";

import { CardAudioProvider } from "@/hooks/useCardAudio";
import { getDefaultSession, getNode } from "@/lib/terminal-engine";
import Coach from "@/pages/Coach";
import { StudyProvider } from "@/store/study-store";

async function renderCoach() {
  window.localStorage.clear();
  return render(
    <StudyProvider>
      <CardAudioProvider>
        <Coach />
      </CardAudioProvider>
    </StudyProvider>,
  );
}

async function typeCommand(screen: Awaited<ReturnType<typeof render>>, command: string) {
  const input = screen.getByLabelText(/user@coach/);
  await input.fill(command);
  // This vitest-browser-react version exposes only click/fill on locators,
  // so Enter is dispatched as a real keydown on the input element.
  const el = input.element() as HTMLInputElement;
  el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
}

test("coach: the website-down job is solved cold and survives the reboot test", async () => {
  const screen = await renderCoach();

  await expect.element(screen.getByText("Over Your Shoulder — Coach")).toBeInTheDocument();
  await expect.element(screen.getByText(/Job 1 of 16: The website is down/)).toBeInTheDocument();
  await expect.element(screen.getByText(/No points, no streaks/)).toBeInTheDocument();

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

test("coach: a hint costs the cold pass, and the chmod job is graded on state", async () => {
  const screen = await renderCoach();

  // Ask for one hint on the first job: the round can no longer be cold.
  await screen.getByRole("button", { name: /Hint/ }).click();
  await expect.element(screen.getByText(/Is that program running right now/)).toBeInTheDocument();

  // Switch to the chmod job (job 4) and solve it by state.
  await screen.getByRole("button", { name: /Lock down deploy\.sh/ }).click();
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
  const screen = await renderCoach();

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
  await screen.getByRole("button", { name: /Lock down deploy\.sh/ }).click();
  await typeCommand(screen, "chmod 750 deploy.sh");

  await expect.element(screen.getByText(/Locked for three days — pass the cold retest in three days/)).toBeInTheDocument();
  await expect.element(
    screen.getByText(/You passed "Lock down deploy\.sh" cold once\. It is locked for three days and needs a cold retest/),
  ).toBeInTheDocument();
  await expect.element(screen.getByText("Extreme: 0 of 16 jobs proved cold twice.")).toBeInTheDocument();

  // Re-selecting the locked job disables early attempts.
  await screen.getByRole("button", { name: /See everything in your home folder/ }).click();
  await screen.getByRole("button", { name: /Lock down deploy\.sh · locked/ }).click();
  await expect.element(screen.getByLabelText(/user@coach/)).toBeDisabled();
});

test("coach extreme: a wrong first try burns the session so a second try does not count", async () => {
  const screen = await renderCoach();
  await screen.getByRole("button", { name: /^Extreme$/i }).click();
  await screen.getByRole("button", { name: /Lock down deploy\.sh/ }).click();

  // Wrong chmod burns the first try in this session.
  await typeCommand(screen, "chmod 755 deploy.sh");
  await expect.element(screen.getByText(/did not finish the job on the first try/)).toBeInTheDocument();

  // Solving afterwards in the same session does not lock or count for Extreme.
  await typeCommand(screen, "chmod 750 deploy.sh");
  await expect.element(screen.getByText(/not solved cold on your first try in this session/)).toBeInTheDocument();
  await expect.element(screen.getByText(/You have not done "Lock down deploy\.sh" cold in Extreme yet\./)).toBeInTheDocument();
});

test("coach medium: shadow text visible, Hint present, cold shadow solve marks green, hint solve marks yellow, Extreme still has 0 hints", async () => {
  const screen = await renderCoach();

  const easyBtn = screen.getByRole("button", { name: /^Easy$/i });
  const mediumBtn = screen.getByRole("button", { name: /^Medium$/i });
  await expect.element(easyBtn).toBeEnabled();
  await expect.element(mediumBtn).toBeEnabled();

  await mediumBtn.click();

  // Shadow text visible for Job 1, Hint button present, step-by-step walkthrough card visible.
  await expect.element(screen.getByTestId("shadow-remaining")).toHaveTextContent("systemctl enable --now nginx");
  await expect.element(screen.getByRole("button", { name: /Hint/ })).toBeInTheDocument();
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

  // Switch to Job 2, use a hint, and finish -> marks yellow (hint used), does NOT increment pass count.
  await screen.getByRole("button", { name: /See everything in your home folder/ }).click();
  await screen.getByRole("button", { name: /Hint/ }).click();
  await expect.element(screen.getByTestId("medium-status-badge")).toHaveTextContent("hint used");
  await typeCommand(screen, "ls -la");
  await expect.element(screen.getByTestId("medium-status-badge")).toHaveTextContent("hint used");
  await expect.element(screen.getByText("Medium: 1 of 16 jobs passed.")).toBeInTheDocument();

  // Switch to Extreme -> still 0 hints and 0 solution buttons.
  await screen.getByRole("button", { name: /^Extreme$/i }).click();
  await expect.element(screen.getByRole("button", { name: /Hint/ })).not.toBeInTheDocument();
  await expect.element(screen.getByRole("button", { name: /solution/i })).not.toBeInTheDocument();
});

test("coach easy: open /coach, select Easy, build Job 4 from blocks, run it, and confirm deploy.sh mode is really 750 afterwards", async () => {
  window.localStorage.clear();
  const screen = await render(
    <MemoryRouter initialEntries={["/coach"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <StudyProvider>
        <CardAudioProvider>
          <Routes>
            <Route path="/coach" element={<Coach />} />
          </Routes>
        </CardAudioProvider>
      </StudyProvider>
    </MemoryRouter>,
  );

  // Select Easy mode in the mode picker
  const easyBtn = screen.getByRole("button", { name: /^Easy$/i });
  await expect.element(easyBtn).toBeEnabled();
  await easyBtn.click();

  // No typing input exists in Easy mode
  await expect.element(screen.getByLabelText(/user@coach/)).not.toBeInTheDocument();
  await expect.element(screen.getByText("Easy: 0 of 16 jobs passed.")).toBeInTheDocument();

  // Pick Job 4: Lock down deploy.sh
  await screen.getByRole("button", { name: /Lock down deploy\.sh/ }).click();
  expect(getNode("/home/user/deploy.sh")?.mode).toBe(0o644);
  await expect.element(screen.getByText(/^-rw-r--r--\s+1 user/)).toBeInTheDocument();

  // Try wrong order first ([750] [chmod] [deploy.sh]) -> plain-words order coaching, not solved yet
  await screen.getByRole("button", { name: /^750$/ }).click();
  await expect.element(screen.getByTestId("easy-block-meaning")).toHaveTextContent(
    "owner full control, group read and run, others nothing",
  );
  await screen.getByRole("button", { name: /^chmod$/ }).click();
  await expect.element(screen.getByTestId("easy-block-meaning")).toHaveTextContent("change who can use this");
  await screen.getByRole("button", { name: /^deploy\.sh$/ }).click();
  await expect.element(screen.getByTestId("easy-block-meaning")).toHaveTextContent("the file");

  await screen.getByRole("button", { name: /^Run$/i }).click();
  await expect.element(screen.getByText(/Order mix-up in slot 1/)).toBeInTheDocument();
  expect(getNode("/home/user/deploy.sh")?.mode).toBe(0o644);

  // Swap [750] and [chmod] into [chmod] [750] [deploy.sh], then tap Run
  await screen.getByRole("button", { name: /^Move chmod left$/i }).click();
  await screen.getByRole("button", { name: /^Run$/i }).click();

  // Confirm deploy.sh mode is really 0o750 in the truthful shell session and ls -l shows rwxr-x---
  expect(getDefaultSession().fs.children?.home?.children?.user?.children?.["deploy.sh"]?.mode).toBe(0o750);
  expect(getNode("/home/user/deploy.sh")?.mode).toBe(0o750);
  await expect.element(screen.getByText(/^-rwxr-x---\s+1 user/)).toBeInTheDocument();
  await expect.element(screen.getByTestId("easy-status-badge")).toHaveTextContent("Easy pass");
  await expect.element(screen.getByText("Easy: 1 of 16 jobs passed.")).toBeInTheDocument();

  // Hints in Easy show yellow on that job while STILL counting as a pass
  await screen.getByRole("button", { name: /See everything in your home folder/ }).click();
  await screen.getByRole("button", { name: /Hint/ }).click();
  await screen.getByRole("button", { name: /^ls$/ }).click();
  await screen.getByRole("button", { name: /^-la$/ }).click();
  await screen.getByRole("button", { name: /^Run$/i }).click();
  await expect.element(screen.getByTestId("easy-status-badge")).toHaveTextContent("Easy pass · hint used");
  await expect.element(screen.getByText("Easy: 2 of 16 jobs passed.")).toBeInTheDocument();
});

test("coach phase 1 across all 4 modes: Easy two-stage port-in-use, Medium backup-restore chain, Hard inode cleanup, Extreme runaway CPU", async () => {
  const screen = await renderCoach();

  // 1. Easy mode: two-stage Phase 1 job (#22 The port is already in use)
  await screen.getByRole("button", { name: /^Easy$/i }).click();
  await screen.getByRole("button", { name: /The port is already in use/ }).click();
  await expect.element(screen.getByTestId("easy-stage-badge")).toHaveTextContent("Step 1 of 2");

  await screen.getByRole("button", { name: /^kill$/ }).click();
  await screen.getByRole("button", { name: /^2847$/ }).click();
  await screen.getByRole("button", { name: /^Run$/i }).click();

  await expect.element(screen.getByTestId("easy-stage-badge")).toHaveTextContent("Step 2 of 2");
  await screen.getByRole("button", { name: /^systemctl$/ }).click();
  await screen.getByRole("button", { name: /^start$/ }).click();
  await screen.getByRole("button", { name: /^httpd$/ }).click();
  await screen.getByRole("button", { name: /^Run$/i }).click();

  await expect.element(screen.getByTestId("easy-status-badge")).toHaveTextContent("Easy pass");
  await expect.element(screen.getByText("Easy: 1 of 16 jobs passed.")).toBeInTheDocument();
  await expect.element(screen.getByText(/Apache httpd online/)).toBeInTheDocument();

  // 2. Medium mode: multi-stage shadow chain (#10 Bring the app back from backup)
  await screen.getByRole("button", { name: /^Medium$/i }).click();
  await screen.getByRole("button", { name: /Bring the app back from backup/ }).click();
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

  // 3. Hard mode: (#23 "No space left" — inodes gone)
  await screen.getByRole("button", { name: /^Hard$/i }).click();
  await screen.getByRole("button", { name: /the inodes are gone/ }).click();
  await typeCommand(screen, "df -i");
  await expect.element(screen.getByText(/100%/)).toBeInTheDocument();
  await typeCommand(screen, "rm -f /var/spool/maildrop/*");
  await expect.element(screen.getByText(/Hard: 1 of 16 jobs done cold\./)).toBeInTheDocument();

  // 4. Extreme mode: (#20 A runaway process is eating all the CPU)
  await screen.getByRole("button", { name: /^Extreme$/i }).click();
  await screen.getByRole("button", { name: /A runaway process is eating all the CPU/ }).click();
  await typeCommand(screen, "ps aux --sort=-%cpu");
  await typeCommand(screen, "kill 4412");
  await typeCommand(screen, "kill -9 4412");
  await expect.element(
    screen.getByText(/You passed "A runaway process is eating all the CPU" cold once\. It is locked for three days/),
  ).toBeInTheDocument();
});
