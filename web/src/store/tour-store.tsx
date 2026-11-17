import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  TOUR_CLOSE_AUDIO_KEY,
  TOUR_DONE_STORAGE_KEY,
  TOUR_INTRO_AUDIO_KEY,
  TOUR_STEPS,
  WHOS_WHO_CLOSE_TEXT,
  WHOS_WHO_OPENING_TEXT,
  type TourStepClipDef,
} from "@/data/tour-and-help";
import { useCardAudio } from "@/hooks/useCardAudio";

export function isTourDone(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(TOUR_DONE_STORAGE_KEY) === "true";
  } catch {
    return true;
  }
}

export function markTourDone(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOUR_DONE_STORAGE_KEY, "true");
  } catch {
    // ignore storage errors
  }
}

interface TourContextValue {
  tourActive: boolean;
  stepIndex: number;
  currentStep: TourStepClipDef | null;
  bannerText: string;
  startTour: () => void;
  skipTour: () => void;
  handleTourNavClick: (navLabel: TourStepClipDef["navLabel"]) => boolean;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { speak, stop, unlock } = useCardAudio();

  const [tourActive, setTourActive] = useState<boolean>(() => !isTourDone());
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [tourRunId, setTourRunId] = useState<number>(() => (!isTourDone() ? 1 : 0));
  const [closingRunId, setClosingRunId] = useState<number>(0);
  const [bannerText, setBannerText] = useState<string>(TOUR_STEPS[0].promptText);

  const tourActiveRef = useRef<boolean>(tourActive);
  const stepIndexRef = useRef<number>(stepIndex);
  const tourRunIdRef = useRef<number>(tourRunId);
  const didInitialRedirectRef = useRef<boolean>(false);

  tourActiveRef.current = tourActive;
  stepIndexRef.current = stepIndex;
  tourRunIdRef.current = tourRunId;

  const startTour = useCallback(() => {
    unlock();
    const nextRunId = tourRunIdRef.current + 1;
    tourRunIdRef.current = nextRunId;
    tourActiveRef.current = true;
    stepIndexRef.current = 0;

    setTourRunId(nextRunId);
    setTourActive(true);
    setStepIndex(0);
    setBannerText(TOUR_STEPS[0].promptText);

    navigate("/coach?whoswho=1");
  }, [navigate, unlock]);

  const skipTour = useCallback(() => {
    unlock();
    tourRunIdRef.current += 1;
    tourActiveRef.current = false;
    setTourRunId(tourRunIdRef.current);
    setTourActive(false);
    markTourDone();
    stop();
  }, [stop, unlock]);

  const handleTourNavClick = useCallback(
    (navLabel: TourStepClipDef["navLabel"]): boolean => {
      if (!tourActiveRef.current) return true;
      const targetStep = TOUR_STEPS[stepIndexRef.current];
      if (!targetStep || targetStep.navLabel !== navLabel) {
        // Tapping any other button does nothing to the tour (no punishment, no restart)
        return false;
      }

      unlock();
      const currentIdx = stepIndexRef.current;

      if (currentIdx < TOUR_STEPS.length - 1) {
        const nextIdx = currentIdx + 1;
        const nextStep = TOUR_STEPS[nextIdx];
        stepIndexRef.current = nextIdx;
        setStepIndex(nextIdx);
        setBannerText(`${targetStep.explainText} — ${nextStep.promptText}`);
        return true;
      }

      // Final step ("More"): advance to stepIndex = 5 (closing phase on More)
      markTourDone();
      stepIndexRef.current = TOUR_STEPS.length;
      setStepIndex(TOUR_STEPS.length);
      setBannerText(targetStep.explainText);
      return true;
    },
    [unlock],
  );

  // Redirect to Who's Who on first run mount
  useEffect(() => {
    if (didInitialRedirectRef.current) return;
    didInitialRedirectRef.current = true;
    if (tourActive) {
      navigate("/coach?whoswho=1", { replace: true });
    }
  }, [navigate, tourActive]);

  // Play the appropriate tour audio after navigation / step transition commits
  useEffect(() => {
    if (!tourActive || tourRunId === 0) return;
    const runId = tourRunId;

    if (stepIndex === 0) {
      void speak(TOUR_INTRO_AUDIO_KEY, WHOS_WHO_OPENING_TEXT, {
        onEnded: () => {
          if (
            tourActiveRef.current &&
            stepIndexRef.current === 0 &&
            tourRunIdRef.current === runId
          ) {
            void speak(TOUR_STEPS[0].promptKey, TOUR_STEPS[0].promptText);
          }
        },
      });
      return;
    }

    if (stepIndex > 0 && stepIndex < TOUR_STEPS.length) {
      const completedStep = TOUR_STEPS[stepIndex - 1];
      const nextStep = TOUR_STEPS[stepIndex];
      void speak(completedStep.explainKey, completedStep.explainText, {
        onEnded: () => {
          if (
            tourActiveRef.current &&
            stepIndexRef.current === stepIndex &&
            tourRunIdRef.current === runId
          ) {
            setBannerText(nextStep.promptText);
            void speak(nextStep.promptKey, nextStep.promptText);
          }
        },
      });
      return;
    }

    if (stepIndex === TOUR_STEPS.length) {
      const finalStep = TOUR_STEPS[TOUR_STEPS.length - 1];
      void speak(finalStep.explainKey, finalStep.explainText, {
        onEnded: () => {
          if (tourRunIdRef.current !== runId) return;
          tourActiveRef.current = false;
          setTourActive(false);
          setClosingRunId(runId);
          navigate("/coach?whoswho=1&tourclose=1");
        },
      });
    }
  }, [navigate, speak, stepIndex, tourActive, tourRunId]);

  // Play the close line once we have returned to Who's Who after completing More
  useEffect(() => {
    if (closingRunId === 0) return;
    void speak(TOUR_CLOSE_AUDIO_KEY, WHOS_WHO_CLOSE_TEXT);
  }, [closingRunId, speak]);

  const currentStep =
    tourActive && stepIndex < TOUR_STEPS.length ? (TOUR_STEPS[stepIndex] ?? null) : null;

  const value = useMemo<TourContextValue>(
    () => ({
      tourActive,
      stepIndex: Math.min(stepIndex, TOUR_STEPS.length - 1),
      currentStep,
      bannerText,
      startTour,
      skipTour,
      handleTourNavClick,
    }),
    [bannerText, currentStep, handleTourNavClick, skipTour, startTour, stepIndex, tourActive],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useGuidedTour(): TourContextValue | null {
  return useContext(TourContext);
}
