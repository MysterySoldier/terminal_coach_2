import { CircleHelp, Volume2 } from "lucide-react";

import { PAGE_HELP_CLIPS, type PageHelpId } from "@/data/tour-and-help";
import { useCardAudio } from "@/hooks/useCardAudio";
import { cn } from "@/lib/utils";

export function PageHelpButton({
  pageId,
  className,
}: {
  pageId: PageHelpId;
  className?: string;
}) {
  const { activeKey, phase, toggle, unlock } = useCardAudio();
  const clip = PAGE_HELP_CLIPS[pageId];
  const isPlaying = Boolean(activeKey === clip.key && phase !== "idle");

  return (
    <div className={cn("flex justify-center pt-0.5", className)}>
      <button
        type="button"
        data-testid="page-help-button"
        data-help-page={pageId}
        aria-label={`Help — ${clip.label}`}
        aria-pressed={isPlaying}
        onClick={() => {
          unlock();
          toggle(clip.key, clip.text);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
          isPlaying
            ? "border-sky-400 bg-sky-500/20 text-sky-200"
            : "border-border bg-card/80 text-muted-foreground hover:border-foreground/40 hover:text-foreground",
        )}
      >
        <CircleHelp className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>Help</span>
        <Volume2 className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
      </button>
    </div>
  );
}
