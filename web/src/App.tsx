import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from "react-router-dom";

import "./index.css";
import { CoachShell } from "@/components/CoachShell";
import { CardAudioProvider } from "@/hooks/useCardAudio";
import { loadCoachMode, type ActiveCoachMode } from "@/lib/coach";
import { loadActiveJobId } from "@/lib/mode-metrics";
import Coach from "@/pages/Coach";
import EasyMode from "@/pages/EasyMode";
import ModeJobs from "@/pages/ModeJobs";
import ModesHome from "@/pages/ModesHome";
import Settings from "@/pages/Settings";
import { CoachThemeProvider } from "@/store/theme-store";

const VALID_MODES: ActiveCoachMode[] = ["easy", "medium", "hard", "extreme"];

function CoachRoute({ terminalFocus = false }: { terminalFocus?: boolean }) {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode");
  const jobParam = searchParams.get("job");

  const rawMode: ActiveCoachMode =
    modeParam && (VALID_MODES as string[]).includes(modeParam)
      ? (modeParam as ActiveCoachMode)
      : loadCoachMode();
  const resolvedMode: ActiveCoachMode =
    terminalFocus && rawMode === "easy" ? "hard" : rawMode;
  const resolvedJobId = jobParam ?? loadActiveJobId();

  return <Coach initialMode={resolvedMode} initialJobId={resolvedJobId} terminalFocus={terminalFocus} />;
}

export function AppRoutes() {
  return (
    <CoachShell>
      <Routes>
        <Route path="/" element={<ModesHome />} />
        <Route path="/easy" element={<EasyMode />} />
        <Route path="/jobs" element={<ModeJobs />} />
        <Route path="/coach" element={<CoachRoute />} />
        <Route path="/terminal" element={<CoachRoute terminalFocus />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/more" element={<Navigate to="/settings" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CoachShell>
  );
}

export default function App() {
  return (
    <CoachThemeProvider>
      <CardAudioProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </CardAudioProvider>
    </CoachThemeProvider>
  );
}
