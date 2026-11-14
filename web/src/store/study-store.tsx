import type { ReactNode } from "react";

import { CoachThemeProvider } from "@/store/theme-store";

/**
 * Lightweight compatibility wrapper so moved tests (`coach.browser.test.tsx`)
 * continue working unchanged without any Linux+ study store bloat.
 */
export function StudyProvider({ children }: { children: ReactNode }) {
  return <CoachThemeProvider>{children}</CoachThemeProvider>;
}
