import type { ReactNode } from "react";

import { CoachThemeProvider, useCoachTheme } from "@/store/theme-store";

/**
 * Lightweight compatibility wrapper so moved tests (`coach.browser.test.tsx`)
 * and `Scanlines.tsx` continue working unchanged without any Linux+ study store bloat.
 */
export function StudyProvider({ children }: { children: ReactNode }) {
  return <CoachThemeProvider>{children}</CoachThemeProvider>;
}

export function useStudy() {
  const ctx = useCoachTheme();
  return {
    preferences: {
      scanlines: ctx?.settings.scanlines ?? false,
    },
  };
}
