/**
 * Round 4.18 — Who's Who narration, first-run guided tour, and 13 page-help clips.
 * Voice: Kokoro af_heart (first person as Coach Echo).
 */

export const TOUR_DONE_STORAGE_KEY = "coach:tour-done:v1";

export type TourStepId = "modes" | "coach" | "jobs" | "terminal" | "more";

export interface TourStepClipDef {
  id: TourStepId;
  navLabel: "Modes" | "Coach" | "Jobs" | "Terminal" | "More";
  to: string;
  promptKey: string;
  promptText: string;
  explainKey: string;
  explainText: string;
}

export const WHOS_WHO_OPENING_TEXT = `Welcome to the Who's Who page. I built this library for one reason: to teach you Linux. Not for people who already know it. For you, walking in for the first time, never touched a terminal, don't know what a command is yet. Just like the first time you walked into a library. Remember, you didn't know where anything was. You didn't know who to ask. You didn't know how any of it worked. What we're trying to do here is simple. Take you from your first day to the day you walk in on your own. And the first thing you need to know is who does what. Who do you ask? Who owns the place? Where do you fit? Three people, that's all. The coach, the owner, and you.

I'm Coach Echo. Head librarian and coach. I know the library, I show you around, and I train you until you don't need me anymore.

The Owner, root. Owns the building. Can open any door and change any rule. Sudo borrows the owner's keys for one command.

Then there's you. A visitor, here to learn. Your home folder is your own shelf.`;

export const WHOS_WHO_CLOSE_TEXT =
  "First you're on a guided tour with the coach. After the basics, you come in on your own.";

export const WHOS_WHO_FULL_TEXT = `${WHOS_WHO_OPENING_TEXT}

Now let me show you around the app. Down at the bottom, five buttons. Modes is where you pick how hard you want it: Easy, Medium, Hard, Extreme. Coach is where you learn: the Command Reference, flash cards, and exams. Jobs is real work, tickets to solve. Terminal is the practice terminal, a safe place to type. And More holds everything else.

${WHOS_WHO_CLOSE_TEXT}`;

export const WHOS_WHO_AUDIO_KEY = "coach:whos-who:full";
export const TOUR_INTRO_AUDIO_KEY = "coach:tour:intro";
export const TOUR_CLOSE_AUDIO_KEY = "coach:tour:close";

export const TOUR_STEPS: TourStepClipDef[] = [
  {
    id: "modes",
    navLabel: "Modes",
    to: "/",
    promptKey: "coach:tour:modes:prompt",
    promptText: "Tap Modes.",
    explainKey: "coach:tour:modes:explain",
    explainText: "Modes is where you pick how hard you want it: Easy, Medium, Hard, Extreme.",
  },
  {
    id: "coach",
    navLabel: "Coach",
    to: "/coach",
    promptKey: "coach:tour:coach:prompt",
    promptText: "Tap Coach.",
    explainKey: "coach:tour:coach:explain",
    explainText: "Coach is where you learn: the Command Reference, flash cards, and exams.",
  },
  {
    id: "jobs",
    navLabel: "Jobs",
    to: "/jobs",
    promptKey: "coach:tour:jobs:prompt",
    promptText: "Tap Jobs.",
    explainKey: "coach:tour:jobs:explain",
    explainText: "Jobs is real work, tickets to solve.",
  },
  {
    id: "terminal",
    navLabel: "Terminal",
    to: "/terminal",
    promptKey: "coach:tour:terminal:prompt",
    promptText: "Tap Terminal.",
    explainKey: "coach:tour:terminal:explain",
    explainText: "Terminal is the practice terminal, a safe place to type.",
  },
  {
    id: "more",
    navLabel: "More",
    to: "/settings",
    promptKey: "coach:tour:more:prompt",
    promptText: "Tap More.",
    explainKey: "coach:tour:more:explain",
    explainText: "More holds everything else.",
  },
];

export type PageHelpId =
  | "home"
  | "coach"
  | "easy"
  | "reference-list"
  | "reference-entry"
  | "flashcards"
  | "exams"
  | "jobs"
  | "job-detail"
  | "practice-terminal"
  | "whos-who"
  | "more"
  | "settings";

export interface PageHelpClipDef {
  id: PageHelpId;
  key: string;
  label: string;
  text: string;
}

export const PAGE_HELP_CLIPS: Record<PageHelpId, PageHelpClipDef> = {
  home: {
    id: "home",
    key: "coach:help:home",
    label: "Home / Modes",
    text: "This is home. Four cards, four ways to learn. Easy walks you through with the coach right beside you. Medium, Hard, and Extreme step the help back until you're on your own. Pick the one that fits where you are today. You can change it any time.",
  },
  coach: {
    id: "coach",
    key: "coach:help:coach",
    label: "Coach",
    text: "This is the Coach tab, where you learn. Three doors: the Command Reference, flash cards, and exams. The Reference is the library shelves, every command with what it does in plain words. Flash cards drill them into memory. Exams test you when you're ready.",
  },
  easy: {
    id: "easy",
    key: "coach:help:easy",
    label: "Easy",
    text: "Easy mode is the guided tour. I stay right beside you, explain everything in plain words, and never let you get lost. Start here. When Easy feels too easy, that's your sign to step up.",
  },
  "reference-list": {
    id: "reference-list",
    key: "coach:help:reference-list",
    label: "Command Reference list",
    text: "This is the Command Reference, all 388 commands across 8 sections. Tap any command to open it. Each one shows you what it does in plain words, an example, and a picture. Use the search when you know what you want to do but not the command's name.",
  },
  "reference-entry": {
    id: "reference-entry",
    key: "coach:help:reference-entry",
    label: "Command Reference entry",
    text: "This is one command, up close. The name at the top, a picture of what it does, then what it does in plain words, then an example line you can copy. Tap the speaker to hear it, or flip to the next one with Next. The clip plays on its own when you open the page.",
  },
  flashcards: {
    id: "flashcards",
    key: "coach:help:flashcards",
    label: "Flash Cards",
    text: "Flash cards are drills. A command on the front, what it does on the back. Tap to flip. If you knew it cold, mark it mastered. If not, it stays in the pile until you do. Master every card in a section and you've got that section down.",
  },
  exams: {
    id: "exams",
    key: "coach:help:exams",
    label: "Exams",
    text: "Exams test what stuck. Questions from the flash cards, same commands, but now you answer without peeking. Pass a section's exam and it counts toward your progress. Don't rush it, the cards are there whenever you want more practice.",
  },
  jobs: {
    id: "jobs",
    key: "coach:help:jobs",
    label: "Jobs",
    text: "Jobs are real work, tickets to solve. Each one gives you a situation and a goal, but never the command. You figure out what to type. Medium gives you hints. Hard gives you less. Extreme gives you nothing at all.",
  },
  "job-detail": {
    id: "job-detail",
    key: "coach:help:job-detail",
    label: "Job detail",
    text: "This is one ticket. Read the brief, it tells you what's wrong and what done looks like. Type your answer in the box. If you're stuck, the Hint button points you where to look, it never gives you the command. Give up shows the solution, but only in Medium and Hard. Extreme has neither.",
  },
  "practice-terminal": {
    id: "practice-terminal",
    key: "coach:help:practice-terminal",
    label: "Practice Terminal",
    text: "This is the practice terminal, a safe place to type. Nothing here can break anything, it's a pretend library, not a real computer. Try ls, cd, pwd, mkdir. Type help if you forget what's here. Make all your mistakes here, that's what it's for.",
  },
  "whos-who": {
    id: "whos-who",
    key: "coach:help:whos-who",
    label: "Who's Who",
    text: "This is the Who's Who page. Three people run this library: me, the coach, the owner, and you. I show you around and train you. The owner holds the keys. You're the visitor here to learn. When you're unsure who does what, come back here.",
  },
  more: {
    id: "more",
    key: "coach:help:more",
    label: "More",
    text: "More holds everything else, the Who's Who page, Settings, and the extras that don't live on the main tabs. If you're looking for something and can't find it, it's probably in here.",
  },
  settings: {
    id: "settings",
    key: "coach:help:settings",
    label: "Settings",
    text: "Settings is where the Walk Through button lives. Tap it any time you want the full guided tour again, from the top. It's for when you've been away a while and want to get your bearings back.",
  },
};

export interface Round418ManifestItem {
  id: string;
  key: string;
  text: string;
}

export const ALL_ROUND_418_CLIPS: Round418ManifestItem[] = [
  {
    id: "whos-who-full",
    key: WHOS_WHO_AUDIO_KEY,
    text: WHOS_WHO_FULL_TEXT,
  },
  {
    id: "tour-intro",
    key: TOUR_INTRO_AUDIO_KEY,
    text: WHOS_WHO_OPENING_TEXT,
  },
  ...TOUR_STEPS.flatMap((step) => [
    {
      id: `tour-${step.id}-prompt`,
      key: step.promptKey,
      text: step.promptText,
    },
    {
      id: `tour-${step.id}-explain`,
      key: step.explainKey,
      text: step.explainText,
    },
  ]),
  {
    id: "tour-close",
    key: TOUR_CLOSE_AUDIO_KEY,
    text: WHOS_WHO_CLOSE_TEXT,
  },
  ...Object.values(PAGE_HELP_CLIPS).map((clip) => ({
    id: `help-${clip.id}`,
    key: clip.key,
    text: clip.text,
  })),
];
