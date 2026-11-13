import { memo, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useStudy } from "@/store/study-store";

interface ScanlineFrameProps {
  children: ReactNode;
  className?: string;
  /** Adds the slow sweeping highlight bar on top of the static scanlines. */
  sweep?: boolean;
}

/** CRT scanline texture wrapper, respecting the user's scanline preference. */
export const ScanlineFrame = memo(function ScanlineFrame({ children, className, sweep = false }: ScanlineFrameProps) {
  const { preferences } = useStudy();

  return (
    <div className={cn("relative overflow-hidden", preferences.scanlines && "scanlines", className)}>
      {preferences.scanlines && sweep ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-16 animate-sweep bg-gradient-to-b from-transparent via-phosphor/[0.055] to-transparent"
        />
      ) : null}
      {children}
    </div>
  );
});
