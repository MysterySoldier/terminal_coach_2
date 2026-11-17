import { useEffect, useRef, useState } from "react";

import { PageHelpButton } from "@/components/PageHelpButton";
import {
  createPracticeSession,
  formatPracticePrompt,
  PRACTICE_HINT_TEXT,
  runPracticeCommand,
  type LsItemDisplayKind,
  type PracticeCommandOutput,
  type PracticeSessionState,
} from "@/lib/practice-terminal";

function itemColorClass(kind: LsItemDisplayKind): string {
  if (kind === "shelf") return "text-sky-400 font-semibold";
  if (kind === "book") return "text-emerald-400";
  return "text-zinc-500";
}

function renderCommandOutput(output: PracticeCommandOutput) {
  switch (output.type) {
    case "none":
      return null;
    case "ls-short":
      return (
        <div
          data-testid="practice-output-ls-short"
          className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-relaxed"
        >
          {output.items.map((item) => (
            <span
              key={item.name}
              data-item-kind={item.kind}
              className={itemColorClass(item.kind)}
            >
              {item.name}
            </span>
          ))}
        </div>
      );
    case "ls-long":
      return (
        <div
          data-testid="practice-output-ls-long"
          className="mt-1 space-y-0.5 text-xs leading-relaxed"
        >
          {output.rows.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-3"
            >
              <span
                data-item-kind={row.kind}
                className={`truncate ${itemColorClass(row.kind)}`}
              >
                {row.name}
              </span>
              <span className="text-zinc-300">{row.detail}</span>
              <span className="text-zinc-400">{row.lastRead}</span>
            </div>
          ))}
        </div>
      );
    case "ls-empty":
      return (
        <div
          data-testid="practice-output-ls-empty"
          className="mt-1 text-xs text-zinc-500"
        >
          {output.text}
        </div>
      );
    case "pwd":
      return (
        <div
          data-testid="practice-output-pwd"
          className="mt-1 break-all text-xs text-zinc-200"
        >
          {output.text}
        </div>
      );
    case "help":
      return (
        <div
          data-testid="practice-output-help"
          className="mt-1 space-y-1 text-xs leading-relaxed text-zinc-200"
        >
          {output.rows.map((row) => (
            <div key={row.command} className="break-words">
              <span className="font-semibold text-amber-300">{row.command}</span>
              <span className="text-zinc-400"> — </span>
              <span className="text-zinc-200">{row.description}</span>
            </div>
          ))}
        </div>
      );
    case "error":
      return (
        <div
          data-testid="practice-output-error"
          className="mt-1 break-words text-xs text-rose-400"
        >
          {output.text}
        </div>
      );
  }
}

export default function PracticeTerminal() {
  const [session, setSession] = useState<PracticeSessionState>(() =>
    createPracticeSession(),
  );
  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [session.transcript]);

  const currentPrompt = formatPracticePrompt(session.cwd);

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSession((prev) => runPracticeCommand(prev, input));
    setInput("");
    setHistoryIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (session.history.length === 0) return;
      const nextIdx =
        historyIndex === null
          ? session.history.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInput(session.history[nextIdx] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === null) return;
      if (historyIndex + 1 >= session.history.length) {
        setHistoryIndex(null);
        setInput("");
      } else {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInput(session.history[nextIdx] ?? "");
      }
    }
  };

  return (
    <div
      data-testid="practice-terminal-screen"
      className="mx-auto max-w-2xl px-4 py-4 pb-8"
    >
      <header className="mb-3">
        <h1
          data-testid="practice-terminal-title"
          className="text-lg font-bold tracking-tight text-foreground"
        >
          Practice Terminal
        </h1>
        <p
          data-testid="practice-terminal-subtitle"
          className="mt-1 text-xs leading-relaxed text-muted-foreground"
        >
          A pretend terminal. The library is the computer — nothing here is real, so you can&apos;t break anything.
        </p>
      </header>

      <div
        data-testid="practice-terminal-window"
        onClick={handleTerminalClick}
        className="flex min-h-[380px] max-h-[65vh] cursor-text flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0e14] p-3.5 font-mono text-xs text-zinc-100 shadow-inner"
      >
        <div
          ref={transcriptRef}
          data-testid="practice-terminal-transcript"
          className="min-w-0 flex-1 space-y-2.5 overflow-y-auto pr-1"
        >
          {session.transcript.map((entry) => {
            if (entry.kind === "welcome") {
              return (
                <div
                  key={entry.id}
                  data-testid="practice-terminal-welcome"
                  className="break-words text-xs leading-relaxed text-zinc-300"
                >
                  {entry.text}
                </div>
              );
            }

            return (
              <div
                key={entry.id}
                data-testid="practice-transcript-entry"
                className="min-w-0"
              >
                <div className="flex flex-wrap items-baseline gap-x-1.5 break-all text-xs">
                  <span
                    data-testid="practice-transcript-prompt"
                    className=" shrink-0 font-semibold text-orange-400"
                  >
                    {entry.prompt}
                  </span>
                  <span
                    data-testid="practice-transcript-command"
                    className="break-all text-zinc-100"
                  >
                    {entry.command}
                  </span>
                </div>
                {renderCommandOutput(entry.output)}
              </div>
            );
          })}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-3 flex min-w-0 items-center gap-1.5 border-t border-zinc-800/80 pt-2.5"
        >
          <span
            data-testid="practice-terminal-prompt"
            className="shrink-0 font-semibold text-orange-400"
          >
            {currentPrompt}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            data-testid="practice-terminal-input"
            aria-label="Practice terminal command input"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent font-mono text-xs text-zinc-100 caret-orange-400 outline-none placeholder:text-zinc-600"
          />
        </form>
      </div>

      <p
        data-testid="practice-terminal-hint"
        className="mt-2.5 break-words text-[11px] leading-relaxed text-muted-foreground"
      >
        {PRACTICE_HINT_TEXT}
      </p>

      <PageHelpButton pageId="practice-terminal" className="mt-3" />
    </div>
  );
}
