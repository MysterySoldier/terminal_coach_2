import { CheckCircle2, ImagePlus, Trash2, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";

import {
  BUG_REPORT_TYPES,
  compressScreenshotFile,
  DEFAULT_BUG_REPORT_TYPE,
  submitBugReport,
  type BugReportType,
} from "@/lib/bug-reports";
import { cn } from "@/lib/utils";

/**
 * Custom inline SVG: a document with `</>` on it and a small bug at the bottom-right corner.
 */
export function ReportBugIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-testid="report-bug-icon-svg"
      className={cn("h-3.5 w-3.5 shrink-0", className)}
    >
      {/* Document outline with folded top-right corner */}
      <path d="M13.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h6.5" />
      <path d="M13.5 2v4.5H18" />
      <path d="M13.5 2L18 6.5V11" />
      {/* </> code glyph inside document */}
      <path d="M7.6 10.2L5.9 11.8l1.7 1.6" />
      <path d="M10.4 9.6l-1.4 4.4" />
      <path d="M11.6 10.2l1.7 1.6-1.7 1.6" />
      {/* Small bug at the bottom-right corner */}
      <ellipse cx="18" cy="17.8" rx="2.3" ry="2.8" />
      <path d="M16.8 15.2l-1-1.1" />
      <path d="M19.2 15.2l1-1.1" />
      <path d="M15.7 16.8h-1.4" />
      <path d="M15.6 18.1h-1.4" />
      <path d="M15.9 19.4l-1.2.7" />
      <path d="M20.3 16.8h1.4" />
      <path d="M20.4 18.1h1.4" />
      <path d="M20.1 19.4l1.2.7" />
    </svg>
  );
}

export function ReportBugButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-testid="report-bug-button"
      aria-label="Report Bug"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/80 px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground",
        className,
      )}
    >
      <ReportBugIcon />
      <span>Report Bug</span>
    </button>
  );
}

const TYPE_TEST_IDS: Record<BugReportType, string> = {
  "Something's broken": "bug-report-type-broken",
  "The explanation confused me": "bug-report-type-confused",
  "I have a better explanation": "bug-report-type-better",
};

export function BugReportSheet({
  open,
  onClose,
  pageRoute,
  commandName,
}: {
  open: boolean;
  onClose: () => void;
  pageRoute?: string;
  commandName?: string;
}) {
  const [reportType, setReportType] = useState<BugReportType>(DEFAULT_BUG_REPORT_TYPE);
  const [description, setDescription] = useState<string>("");
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [photoWarning, setPhotoWarning] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [confirmNoScreenshot, setConfirmNoScreenshot] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const resetAndClose = (): void => {
    setReportType(DEFAULT_BUG_REPORT_TYPE);
    setDescription("");
    setPhotoBase64("");
    setPhotoWarning("");
    setErrorMessage("");
    setConfirmNoScreenshot(false);
    setSubmitting(false);
    setSubmitted(false);
    onClose();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoWarning("");
    setErrorMessage("");

    const result = await compressScreenshotFile(file);
    if (!result.ok) {
      setPhotoBase64("");
      setPhotoWarning(result.message);
      setConfirmNoScreenshot(true);
      event.target.value = "";
      return;
    }

    setPhotoBase64(result.dataUrl);
    setConfirmNoScreenshot(false);
  };

  const performSubmit = async (): Promise<void> => {
    const trimmed = description.trim();
    if (!trimmed) {
      setErrorMessage("Please describe what went wrong before sending.");
      return;
    }

    setErrorMessage("");
    setSubmitting(true);
    try {
      await submitBugReport({
        reportType,
        description: trimmed,
        pageRoute,
        commandName,
        photoBase64: photoBase64 || undefined,
      });
      setSubmitted(true);
      window.setTimeout(() => {
        resetAndClose();
      }, 650);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not save report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) {
      setErrorMessage("Please describe what went wrong before sending.");
      return;
    }

    // Ask for a screenshot on every report, but let the user send without one after a short confirm
    if (!photoBase64 && !confirmNoScreenshot) {
      setConfirmNoScreenshot(true);
      return;
    }

    await performSubmit();
  };

  return (
    <div
      data-testid="bug-report-sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Report Bug"
      onClick={(e) => {
        if (e.target === e.currentTarget) resetAndClose();
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
    >
      <div
        data-testid="bug-report-sheet"
        className="w-full max-w-lg rounded-t-2xl border border-border bg-card p-4 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/80 pb-2.5">
          <div className="flex items-center gap-2">
            <ReportBugIcon className="h-4 w-4 text-sky-400" />
            <div>
              <h2 className="font-sans text-sm font-bold text-foreground sm:text-base">
                Report Bug
              </h2>
              {commandName ? (
                <p className="font-mono text-[11px] text-muted-foreground">
                  Entry: <span className="text-foreground">{commandName}</span>
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            data-testid="bug-report-close"
            aria-label="Close bug report form"
            onClick={resetAndClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background/70 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {submitted ? (
          <div
            data-testid="bug-report-success"
            className="flex items-center gap-2.5 py-6 font-mono text-xs text-emerald-300"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
            <span>Report saved. Thank you!</span>
          </div>
        ) : (
          <form onSubmit={(e) => void handleFormSubmit(e)} className="mt-3 space-y-3">
            {/* 1. Type picker */}
            <div data-testid="bug-report-type-picker" className="space-y-1.5">
              <span className="block font-mono text-[11px] font-semibold text-foreground">
                What kind of report is this?
              </span>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                {BUG_REPORT_TYPES.map((option) => {
                  const selected = reportType === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      data-testid={TYPE_TEST_IDS[option]}
                      aria-pressed={selected}
                      onClick={() => setReportType(option)}
                      className={cn(
                        "rounded-xl border px-2.5 py-1.5 text-left font-mono text-[11px] font-medium transition-colors",
                        selected
                          ? "border-sky-400 bg-sky-500/20 text-sky-200"
                          : "border-border bg-background/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Attach a screenshot */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold text-foreground">
                  Attach a screenshot
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Page screenshot (JPEG/PNG)
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                data-testid="bug-report-file-input"
                onChange={(e) => void handleFileChange(e)}
                className="hidden"
              />

              {photoBase64 ? (
                <div className="flex items-center justify-between gap-2.5 rounded-xl border border-border bg-background/60 p-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      data-testid="bug-report-preview-image"
                      src={photoBase64}
                      alt="Attached screenshot preview"
                      className="h-12 w-16 shrink-0 rounded-lg border border-border object-cover"
                    />
                    <span className="truncate font-mono text-[11px] text-emerald-300">
                      Screenshot attached
                    </span>
                  </div>
                  <button
                    type="button"
                    data-testid="bug-report-remove-photo"
                    onClick={() => {
                      setPhotoBase64("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="bug-report-attach-button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/50 px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-sky-400/60 hover:text-foreground"
                >
                  <ImagePlus className="h-4 w-4 text-sky-400" aria-hidden />
                  <span>Attach a screenshot</span>
                </button>
              )}

              {photoWarning ? (
                <p
                  data-testid="bug-report-photo-warning"
                  className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 font-mono text-[11px] text-amber-200"
                >
                  {photoWarning}
                </p>
              ) : null}
            </div>

            {/* 3. What went wrong? (required) */}
            <div className="space-y-1.5">
              <label
                htmlFor="bug-report-description-input"
                className="block font-mono text-[11px] font-semibold text-foreground"
              >
                What went wrong? <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="bug-report-description-input"
                data-testid="bug-report-description"
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder={
                  reportType === "The explanation confused me"
                    ? "Tell us which part of the explanation was confusing..."
                    : reportType === "I have a better explanation"
                      ? "Share your suggested way to explain this command..."
                      : "Describe the issue on this page..."
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 font-sans text-xs text-foreground placeholder:text-muted-foreground focus:border-sky-400 focus:outline-none sm:text-sm"
              />
            </div>

            {/* Short confirm when sending without a screenshot */}
            {confirmNoScreenshot && !photoBase64 ? (
              <div
                data-testid="bug-report-no-screenshot-confirm"
                className="space-y-2 rounded-xl border border-sky-400/50 bg-sky-500/10 p-2.5"
              >
                <p className="font-mono text-[11px] text-sky-100">
                  No screenshot attached. Attach a screenshot of the page, or send your report without one?
                </p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    data-testid="bug-report-confirm-attach"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-border bg-background/80 px-2.5 py-1 font-mono text-[11px] text-foreground hover:border-foreground/40"
                  >
                    Attach a screenshot
                  </button>
                  <button
                    type="button"
                    data-testid="bug-report-confirm-send-without"
                    disabled={submitting}
                    onClick={() => void performSubmit()}
                    className="rounded-lg border border-sky-400/70 bg-sky-500/25 px-2.5 py-1 font-mono text-[11px] font-semibold text-sky-100 hover:bg-sky-500/35 disabled:opacity-50"
                  >
                    Send without screenshot
                  </button>
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <p
                data-testid="bug-report-error"
                className="font-mono text-[11px] text-rose-400"
              >
                {errorMessage}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-xl border border-border bg-background/70 px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="bug-report-submit"
                disabled={submitting}
                className="rounded-xl border border-sky-400/70 bg-sky-500/20 px-3.5 py-1.5 font-mono text-xs font-semibold text-sky-100 transition-colors hover:bg-sky-500/30 disabled:opacity-50"
              >
                {submitting
                  ? "Sending..."
                  : confirmNoScreenshot && !photoBase64
                    ? "Send without screenshot"
                    : "Send Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
