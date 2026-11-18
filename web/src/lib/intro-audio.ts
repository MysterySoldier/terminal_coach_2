import { withBasePath } from "@/lib/base-path";

export const COACH_ECHO_INTRO_SRC = "/audio/coach-echo-intro.mp3";
export const INTRO_PLAYED_SESSION_KEY = "coachEchoIntroPlayed";

let introAudioEl: HTMLAudioElement | null = null;
let introAudioSrc = "";
let fallbackSessionPlayed = false;
let playGeneration = 0;
let lastPlayStartedAt = 0;

export function hasPlayedIntroThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_PLAYED_SESSION_KEY) === "1";
  } catch {
    return fallbackSessionPlayed;
  }
}

export function markIntroPlayedThisSession(): void {
  fallbackSessionPlayed = true;
  try {
    window.sessionStorage.setItem(INTRO_PLAYED_SESSION_KEY, "1");
  } catch {
    /* sessionStorage unavailable */
  }
}

export function ensureCoachEchoIntroAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const resolvedSrc = withBasePath(COACH_ECHO_INTRO_SRC);
  if (!introAudioEl || introAudioSrc !== resolvedSrc) {
    introAudioEl = new Audio(resolvedSrc);
    introAudioEl.preload = "auto";
    introAudioSrc = resolvedSrc;
  }
  return introAudioEl;
}

export function stopCoachEchoIntro(): void {
  playGeneration += 1;
  if (!introAudioEl) return;
  introAudioEl.pause();
  try {
    if (introAudioEl.readyState > 0) {
      introAudioEl.currentTime = 0;
    }
  } catch {
    /* ignore seek before metadata */
  }
}

export function wasIntroJustStarted(withinMs = 150): boolean {
  return Date.now() - lastPlayStartedAt < withinMs;
}

export async function tryPlayCoachEchoIntro(): Promise<boolean> {
  const audio = ensureCoachEchoIntroAudio();
  if (!audio) return false;
  stopCoachEchoIntro();
  const gen = playGeneration;
  lastPlayStartedAt = Date.now();
  try {
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      await playPromise;
    }
    return gen === playGeneration;
  } catch {
    return false;
  }
}

export function playCoachEchoIntro(): void {
  void tryPlayCoachEchoIntro();
}
