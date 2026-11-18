import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { withBasePath } from "@/lib/base-path";
import { stopCoachEchoIntro } from "@/lib/intro-audio";
import { normalizeForSpeech } from "@/lib/pronounce";
import { loadState, saveState } from "@/lib/storage";
import { getClip, hashText, putClip } from "@/lib/tts-cache";

/**
 * Kokoro af_heart — the voice for this app. Clips are pre-baked Kokoro
 * recordings bundled under public/audio (see web/scripts/record-clips.ts)
 * and cached in IndexedDB. No ElevenLabs, no Rork toolkit call, no
 * speechSynthesis / device-voice fallback.
 */
const VOICE_ID = "kokoro-af_heart";
const MODEL_ID = "kokoro-v1.0";
const AUTO_READ_KEY = "audio-autoread";

export type AudioPhase = "idle" | "loading" | "playing";

/**
 * Kokoro af_heart flashcard narration + Linux pronunciation layer, clips
 * cached in IndexedDB, one shared player so clips never overlap.
 */
export const [CardAudioProvider, useCardAudio] = createContextHook(() => {
  const [autoRead, setAutoRead] = useState<boolean>(() => loadState<boolean>(AUTO_READ_KEY, true));
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [phase, setPhase] = useState<AudioPhase>("idle");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const tokenRef = useRef<number>(0);
  const inflight = useRef<Map<string, Promise<Blob | null>>>(new Map());
  const unlockedRef = useRef<boolean>(false);

  useEffect(() => saveState(AUTO_READ_KEY, autoRead), [autoRead]);

  const getAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const el = new Audio();
      el.preload = "auto";
      audioRef.current = el;
    }
    return audioRef.current;
  }, []);

  /** Prime the media element inside a user gesture so later auto-play is allowed. */
  const unlock = useCallback((): void => {
    if (unlockedRef.current || typeof window === "undefined") return;
    unlockedRef.current = true;
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.resume();
      }
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        void ctx.resume().catch(() => undefined).finally(() => void ctx.close().catch(() => undefined));
      }
      const el = getAudio();
      el.muted = true;
      void el
        .play()
        .catch(() => undefined)
        .finally(() => {
          if (!el.src) {
            el.pause();
          }
          el.muted = false;
        });
    } catch {
      /* unlocking is best-effort */
    }
  }, [getAudio]);

  useEffect(() => {
    const onGesture = (): void => unlock();
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, [unlock]);

  const releaseUrl = useCallback((): void => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stop = useCallback((): void => {
    tokenRef.current += 1;
    const el = audioRef.current;
    if (el) {
      el.onended = null;
      el.onerror = null;
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* best-effort */
      }
    }
    releaseUrl();
    setActiveKey(null);
    setPhase("idle");
  }, [releaseUrl]);

  /** Pre-baked clip bundled under public/audio (see web/scripts/record-clips.ts). */
  const loadBundled = useCallback(async (cacheKey: string, logicalKey?: string): Promise<Blob | null> => {
    try {
      let audioPath = `/audio/${hashText(cacheKey)}.mp3`;
      if (logicalKey?.startsWith("linuxdeck:")) {
        const parts = logicalKey.split(":");
        const cardId = parts[1];
        const side = parts[2];
        if (cardId && (side === "front" || side === "back")) {
          audioPath = `/audio/${cardId}--${side}.mp3`;
        }
      }
      const response = await fetch(withBasePath(audioPath));
      if (!response.ok) return null;
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) return null;
      const blob = await response.blob();
      if (blob.size < 200) return null;
      await putClip(cacheKey, blob);
      return blob;
    } catch {
      return null;
    }
  }, []);

  /**
   * Bundled Kokoro clip, or a clip already cached in IndexedDB. No network
   * voice generation and no device-voice fallback.
   */
  const loadClip = useCallback((cacheKey: string, _spoken: string, logicalKey?: string): Promise<Blob | null> => {
    const pending = inflight.current.get(cacheKey);
    if (pending) return pending;
    const job = (async (): Promise<Blob | null> => {
      const cached = await getClip(cacheKey);
      if (cached) return cached;
      const bundled = await loadBundled(cacheKey, logicalKey);
      if (bundled) return bundled;
      return null;
    })().finally(() => inflight.current.delete(cacheKey));
    inflight.current.set(cacheKey, job);
    return job;
  }, [loadBundled]);

  const clipKey = useCallback((key: string, text: string): string => `${VOICE_ID}:${MODEL_ID}:${key}:${hashText(text)}`, []);

  /** Speak [text] under [key] (e.g. "linuxdeck:files-0:front"), interrupting anything already playing. */
  const speak = useCallback(
    async (key: string, text: string, options?: { onEnded?: () => void }): Promise<void> => {
      if (!text.trim()) return;
      stopCoachEchoIntro();
      stop();
      const token = tokenRef.current;
      const spoken = normalizeForSpeech(text);
      setActiveKey(key);
      setPhase("loading");

      let blob: Blob | null = null;
      try {
        blob = await loadClip(clipKey(key, spoken), spoken, key);
      } catch (error) {
        console.warn("Kokoro clip unavailable", { reason: error instanceof Error ? error.message : "unknown" });
      }
      if (tokenRef.current !== token) return;
      if (!blob) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(spoken);
            utterance.rate = 1.0;
            utterance.onstart = () => {
              if (tokenRef.current === token) setPhase("playing");
            };
            utterance.onend = () => {
              if (tokenRef.current === token) {
                setActiveKey(null);
                setPhase("idle");
                options?.onEnded?.();
              }
            };
            utterance.onerror = () => {
              if (tokenRef.current === token) {
                setActiveKey(null);
                setPhase("idle");
              }
            };
            window.speechSynthesis.speak(utterance);
            setPhase("playing");
            return;
          } catch {}
        }
        setActiveKey(null);
        setPhase("idle");
        options?.onEnded?.();
        return;
      }

      const el = getAudio();
      releaseUrl();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      el.src = url;
      el.onended = () => {
        if (tokenRef.current !== token) return;
        releaseUrl();
        setActiveKey(null);
        setPhase("idle");
        options?.onEnded?.();
      };
      el.onerror = () => {
        if (tokenRef.current !== token) return;
        releaseUrl();
        setActiveKey(null);
        setPhase("idle");
      };
      try {
        await el.play();
        if (tokenRef.current === token) {
          setPhase("playing");
          if (el.paused && options?.onEnded) {
            window.setTimeout(() => {
              if (tokenRef.current === token) {
                el.onended?.(new Event("ended"));
              }
            }, 250);
          }
        }
      } catch {
        // Autoplay blocked before any gesture: stay quiet, never throw.
        if (tokenRef.current === token) {
          setActiveKey(null);
          setPhase("idle");
          options?.onEnded?.();
        }
      }
    },
    [clipKey, getAudio, loadClip, releaseUrl, stop],
  );

  /** Warm the cache for a side the learner will probably hear next. */
  const prefetch = useCallback(
    (key: string, text: string): void => {
      const spoken = normalizeForSpeech(text);
      void loadClip(clipKey(key, spoken), spoken, key).catch(() => undefined);
    },
    [clipKey, loadClip],
  );

  /** Tap on a corner speaker: stop if this side is active, otherwise play it. */
  const toggle = useCallback(
    (key: string, text: string): void => {
      if (activeKey === key && phase !== "idle") stop();
      else void speak(key, text);
    },
    [activeKey, phase, speak, stop],
  );

  const toggleAutoRead = useCallback((): void => {
    unlock();
    setAutoRead((on) => {
      if (on) stop();
      return !on;
    });
  }, [stop, unlock]);

  useEffect(() => () => stop(), [stop]);

  return useMemo(
    () => ({ autoRead, toggleAutoRead, activeKey, phase, speak, stop, toggle, prefetch, unlock }),
    [autoRead, toggleAutoRead, activeKey, phase, speak, stop, toggle, prefetch, unlock],
  );
});
