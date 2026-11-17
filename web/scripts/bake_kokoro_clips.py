#!/usr/bin/env python3
"""Bake all Kokoro af_heart clips for Terminal Coach.
Reads web/public/audio/manifest.json (`spoken` field, already normalized via pronounce.ts)
and writes web/public/audio/<file> (.mp3). Voice: af_heart only (kokoro-v1.0).
"""
import json
import os
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ProcessPoolExecutor

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.environ.get("KOKORO_MODEL", "/home/mystery_soldier/kokoro-models/kokoro-v1.0.onnx")
VOICES_PATH = os.environ.get("KOKORO_VOICES", "/home/mystery_soldier/kokoro-models/voices-v1.0.bin")
MANIFEST = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "public", "audio", "manifest.json"))
OUT_DIR = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "public", "audio"))
VOICE = "af_heart"
SPEED = 1.0
LANG = "en-us"
WORKERS = 4

_kokoro = None


def _init():
    global _kokoro
    from kokoro_onnx import Kokoro
    _kokoro = Kokoro(MODEL_PATH, VOICES_PATH)


def _job(job):
    import re
    import soundfile as sf
    out = os.path.join(OUT_DIR, job["file"])
    if os.path.exists(out) and os.path.getsize(out) > 500:
        return (job["file"], "skipped", "")
    try:
        spoken_text = re.sub(r"\b([A-Z]) (?=[A-Z]\b)", r"\1, ", job["spoken"])
        samples, rate = _kokoro.create(spoken_text, voice=VOICE, speed=SPEED, lang=LANG)
        if len(samples) == 0:
            return (job["file"], "failed", "empty audio")
        with tempfile.TemporaryDirectory() as td:
            wav = os.path.join(td, "clip.wav")
            sf.write(wav, samples, rate)
            r = subprocess.run(
                [
                    "ffmpeg", "-y", "-v", "error", "-i", wav,
                    "-codec:a", "libmp3lame", "-b:a", "64k", "-ac", "1", "-ar", "24000", out,
                ],
                capture_output=True,
                text=True,
                timeout=120,
            )
            if r.returncode != 0:
                return (job["file"], "failed", "ffmpeg: " + r.stderr.strip()[:200])
        if os.path.getsize(out) <= 500:
            return (job["file"], "failed", "mp3 too small")
        return (job["file"], "ok", "")
    except Exception as e:
        return (job["file"], "failed", str(e)[:200])


def main():
    with open(MANIFEST) as f:
        jobs = json.load(f)
    prefix = os.environ.get("KOKORO_KEY_PREFIX", "")
    if len(sys.argv) > 1 and sys.argv[1].startswith("--prefix="):
        prefix = sys.argv[1].split("=", 1)[1]
    if prefix:
        jobs = [j for j in jobs if j.get("key", "").startswith(prefix)]
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"jobs: {len(jobs)} (voice={VOICE}) -> {OUT_DIR}", flush=True)
    started = time.time()
    done = failed = skipped = 0
    failures = []
    with ProcessPoolExecutor(max_workers=WORKERS, initializer=_init) as ex:
        for i, (name, status, err) in enumerate(ex.map(_job, jobs), 1):
            if status == "ok":
                done += 1
            elif status == "skipped":
                skipped += 1
            else:
                failed += 1
                failures.append(f"{name}: {err}")
            if i % 25 == 0 or i == len(jobs):
                print(
                    f"[{i}/{len(jobs)}] ok={done} skipped={skipped} failed={failed} "
                    f"elapsed={time.time() - started:.0f}s",
                    flush=True,
                )
    print(
        f"DONE ok={done} skipped={skipped} failed={failed} "
        f"elapsed={time.time() - started:.0f}s",
        flush=True,
    )
    if failures:
        print("FAILURES:", flush=True)
        for fail in failures:
            print("  " + fail, flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
