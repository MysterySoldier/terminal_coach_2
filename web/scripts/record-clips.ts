/**
 * Pre-bake pipeline for Kokoro af_heart narration in Terminal Coach.
 *
 * Builds the clip manifest for all 16 coach jobs across Easy, Medium, Hard,
 * and Extreme (preserving existing pre-baked base entries in manifest.json so
 * all 866 Kokoro af_heart clips remain accounted for) and writes
 * `web/public/audio/manifest.json`.
 *
 * Voice: Kokoro af_heart only (kokoro-v1.0). Zero Bella, zero speechSynthesis.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { COACH_JOBS } from "../src/data/coach-jobs";
import { COMMAND_REFERENCE } from "../src/data/command-reference";
import { FLASHCARDS } from "../src/data/flashcards";
import { MEDIUM_PLANS } from "../src/data/medium-coach";
import { normalizeForSpeech } from "../src/lib/pronounce";
import { hashText } from "../src/lib/tts-cache";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "audio");
const MANIFEST_PATH = join(OUT_DIR, "manifest.json");

/** Must match web/src/hooks/useCardAudio.tsx. */
const VOICE_ID = "kokoro-af_heart";
const MODEL_ID = "kokoro-v1.0";

export interface ClipEntry {
  id: string;
  side: "front" | "back";
  key: string;
  file: string;
  text: string;
  spoken: string;
}

function loadPreservedEntries(): ClipEntry[] {
  if (!existsSync(MANIFEST_PATH)) return [];
  try {
    const existing = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as ClipEntry[];
    return existing.filter(
      (entry) => !entry.key.startsWith("coach:") && !entry.key.startsWith("linuxdeck:"),
    );
  } catch {
    return [];
  }
}

function buildManifest(): ClipEntry[] {
  const entries: ClipEntry[] = [...loadPreservedEntries()];
  const add = (id: string, side: "front" | "back", key: string, text: string): void => {
    if (!text.trim()) return;
    const spoken = normalizeForSpeech(text);
    const cacheKey = `${VOICE_ID}:${MODEL_ID}:${key}:${hashText(spoken)}`;
    entries.push({ id, side, key, file: `${hashText(cacheKey)}.mp3`, text, spoken });
  };

  for (const job of COACH_JOBS) {
    add(job.id, "front", `coach:${job.id}:job`, job.job);
    job.hints.forEach((hint, i) => add(job.id, "back", `coach:${job.id}:hint-${i + 1}`, hint));
    const mediumPlan = MEDIUM_PLANS[job.id];
    if (mediumPlan) {
      add(job.id, "front", `coach:medium:${job.id}:look`, mediumPlan.whereToLook);
      mediumPlan.stages.forEach((stage, stageIdx) => {
        const prefix = stageIdx > 0 ? `:s${stageIdx + 1}` : "";
        for (const step of stage.steps) {
          add(job.id, "back", `coach:medium:${job.id}${prefix}:step-${step.stepNumber}`, step.walkthrough);
          add(job.id, "back", `coach:medium:${job.id}${prefix}:wrong-${step.stepNumber}`, step.wrongKeyHint);
        }
      });
    }
  }
  for (const cmd of COMMAND_REFERENCE) {
    add(
      cmd.id,
      "front",
      `coach:easy:ref:${cmd.id}`,
      `${cmd.name}. ${cmd.description} Example: ${cmd.example}`,
    );
  }
  for (const card of FLASHCARDS) {
    entries.push({
      id: card.id,
      side: "front",
      key: `linuxdeck:${card.id}:front`,
      file: `${card.id}--front.mp3`,
      text: card.command,
      spoken: normalizeForSpeech(card.command),
    });
    entries.push({
      id: card.id,
      side: "back",
      key: `linuxdeck:${card.id}:back`,
      file: `${card.id}--back.mp3`,
      text: card.description,
      spoken: normalizeForSpeech(card.description),
    });
  }
  return entries;
}

async function main(): Promise<void> {
  const entries = buildManifest();
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(entries, null, 2));
  console.log(`Manifest: ${entries.length} clips (${COACH_JOBS.length} coach jobs) -> public/audio/manifest.json`);
}

await main();
