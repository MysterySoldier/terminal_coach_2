/** Exam blueprint domain identifiers for CompTIA Linux+ XK0-006 (V8). */
export type DomainId = "system-mgmt" | "troubleshoot" | "services-users" | "security" | "automation";

export interface Domain {
  id: DomainId;
  /** Short monospace label used in chips and terminal copy. */
  slug: string;
  name: string;
  /** Official blueprint weighting, as a percentage of the exam. */
  weight: number;
  blurb: string;
  objectives: string[];
}

export type Difficulty = "core" | "applied" | "expert";

export interface Question {
  id: string;
  domain: DomainId;
  /** Blueprint objective label, e.g. "1.3 Manage storage". */
  objective: string;
  difficulty: Difficulty;
  prompt: string;
  /** Optional monospace code block shown above the answer choices. */
  snippet?: string;
  choices: string[];
  /** Index into `choices`. */
  answer: number;
  explanation: string;
  tags: string[];
}

export interface Flashcard {
  id: string;
  domain: DomainId;
  /** Front of the card — usually a command or a term. */
  front: string;
  /** Back of the card — what it does. */
  back: string;
  /** Small label shown in the card corner, e.g. "Linux Containers". */
  topic: string;
  kind: "command" | "concept";
}

export interface CommandFlag {
  flag: string;
  description: string;
}

export interface CommandEntry {
  id: string;
  name: string;
  domain: DomainId;
  summary: string;
  synopsis: string;
  flags: CommandFlag[];
  examples: { cmd: string; note: string }[];
  related: string[];
}
