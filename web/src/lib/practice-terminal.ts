export interface LibraryBook {
  type: "book";
  name: string;
  pages: number;
  lastRead: string;
}

export interface LibraryShelf {
  type: "shelf";
  name: string;
  children: LibraryNode[];
}

export type LibraryNode = LibraryBook | LibraryShelf;

export type LsItemDisplayKind = "shelf" | "book" | "hidden";

export interface LsShortItem {
  name: string;
  kind: LsItemDisplayKind;
}

export interface LsLongRow {
  name: string;
  kind: LsItemDisplayKind;
  detail: string;
  lastRead: string;
}

export interface HelpRow {
  command: string;
  description: string;
}

export type PracticeCommandOutput =
  | { type: "none" }
  | { type: "ls-short"; items: LsShortItem[] }
  | { type: "ls-long"; rows: LsLongRow[] }
  | { type: "ls-empty"; text: string }
  | { type: "pwd"; text: string }
  | { type: "help"; rows: HelpRow[] }
  | { type: "error"; text: string };

export type PracticeTranscriptEntry =
  | {
      id: string;
      kind: "welcome";
      text: string;
    }
  | {
      id: string;
      kind: "command";
      prompt: string;
      command: string;
      output: PracticeCommandOutput;
    };

export interface PracticeSessionState {
  root: LibraryShelf;
  cwd: string[];
  transcript: PracticeTranscriptEntry[];
  history: string[];
  nextId: number;
}

export const PRACTICE_WELCOME_TEXT =
  "Welcome to the practice library. Type a command and press Enter.";

export const PRACTICE_HINT_TEXT =
  "Try: ls · ls -a · ls -la · cd maps · pwd · mkdir school · help";

export const PRACTICE_HELP_ROWS: HelpRow[] = [
  { command: "ls", description: "what's on the shelf in front of you" },
  { command: "ls -a", description: "plus the hidden books" },
  { command: "ls -la", description: "plus the details on each" },
  { command: "cd [shelf]", description: "walk to another shelf (cd with nothing goes home)" },
  { command: "pwd", description: "where am I standing right now" },
  { command: "mkdir [name]", description: "put up a new empty shelf" },
  { command: "clear", description: "wipe the screen clean" },
];

export function createPracticeLibrary(): LibraryShelf {
  return {
    type: "shelf",
    name: "~",
    children: [
      {
        type: "book",
        name: "cooking",
        pages: 12,
        lastRead: "Nov 11",
      },
      {
        type: "book",
        name: "history",
        pages: 40,
        lastRead: "Nov 10",
      },
      {
        type: "shelf",
        name: "maps",
        children: [
          {
            type: "book",
            name: "world",
            pages: 22,
            lastRead: "Nov 9",
          },
          {
            type: "book",
            name: "city",
            pages: 15,
            lastRead: "Nov 8",
          },
          {
            type: "book",
            name: "stars",
            pages: 30,
            lastRead: "Nov 7",
          },
        ],
      },
      {
        type: "book",
        name: "novels",
        pages: 96,
        lastRead: "Nov 8",
      },
      {
        type: "book",
        name: ".old-notes",
        pages: 3,
        lastRead: "Oct 30",
      },
    ],
  };
}

function cloneLibraryShelf(shelf: LibraryShelf): LibraryShelf {
  return {
    type: "shelf",
    name: shelf.name,
    children: shelf.children.map((child) =>
      child.type === "shelf" ? cloneLibraryShelf(child) : { ...child },
    ),
  };
}

export function formatPracticePrompt(cwd: string[]): string {
  if (cwd.length === 0) {
    return "Tobias@coach:~$";
  }
  return `Tobias@coach:~/${cwd.join("/")}$`;
}

export function formatPracticePwd(cwd: string[]): string {
  if (cwd.length === 0) {
    return "/home/Tobias";
  }
  return `/home/Tobias/${cwd.join("/")}`;
}

function getShelfAtCwd(root: LibraryShelf, cwd: string[]): LibraryShelf {
  let curr: LibraryShelf = root;
  for (const segment of cwd) {
    const next = curr.children.find((c) => c.name === segment);
    if (next && next.type === "shelf") {
      curr = next;
    }
  }
  return curr;
}

type PathResolutionResult =
  | { ok: true; node: LibraryNode; path: string[] }
  | { ok: false; error: string };

function resolvePath(
  root: LibraryShelf,
  cwd: string[],
  rawTarget: string,
  forCd: boolean,
): PathResolutionResult {
  const trimmed = rawTarget.trim();
  if (trimmed === "" || trimmed === "~" || trimmed === "/" || trimmed === "~/") {
    return { ok: true, node: root, path: [] };
  }

  let currentPath: string[];
  let remainder = trimmed;

  if (remainder.startsWith("/home/Tobias/")) {
    currentPath = [];
    remainder = remainder.slice("/home/Tobias/".length);
  } else if (remainder === "/home/Tobias") {
    return { ok: true, node: root, path: [] };
  } else if (remainder.startsWith("~/")) {
    currentPath = [];
    remainder = remainder.slice(2);
  } else if (remainder.startsWith("/")) {
    currentPath = [];
    remainder = remainder.slice(1);
  } else {
    currentPath = [...cwd];
  }

  const segments = remainder.split("/").filter((s) => s.length > 0);
  let currentNode: LibraryNode = getShelfAtCwd(root, currentPath);

  for (let i = 0; i < segments.length; i += 1) {
    const seg = segments[i];
    const isLast = i === segments.length - 1;

    if (currentNode.type === "book") {
      return {
        ok: false,
        error: `"${currentNode.name}" is a book, not a shelf — you can't walk through it.`,
      };
    }

    if (seg === ".") {
      continue;
    }

    if (seg === "..") {
      if (currentPath.length > 0) {
        currentPath.pop();
      }
      currentNode = getShelfAtCwd(root, currentPath);
      continue;
    }

    const found = currentNode.children.find((c) => c.name === seg);
    if (!found) {
      return {
        ok: false,
        error: `There is no shelf or book called "${seg}" here.`,
      };
    }

    if (found.type === "book") {
      if (!isLast) {
        return {
          ok: false,
          error: `"${seg}" is a book, not a shelf — you can't walk through it.`,
        };
      }
      if (forCd) {
        return {
          ok: false,
          error: `"${seg}" is a book, not a shelf — you can't walk into it.`,
        };
      }
      return { ok: true, node: found, path: [...currentPath, seg] };
    }

    currentPath.push(seg);
    currentNode = found;
  }

  return { ok: true, node: currentNode, path: currentPath };
}

function classifyItemKind(node: LibraryNode): LsItemDisplayKind {
  if (node.name.startsWith(".")) {
    return "hidden";
  }
  return node.type === "shelf" ? "shelf" : "book";
}

function countShelfItems(shelf: LibraryShelf): number {
  return shelf.children.filter((c) => !c.name.startsWith(".")).length;
}

function buildLsOutput(shelf: LibraryShelf, showAll: boolean, longFormat: boolean): PracticeCommandOutput {
  const visibleChildren = showAll
    ? shelf.children
    : shelf.children.filter((c) => !c.name.startsWith("."));

  if (!showAll && visibleChildren.length === 0) {
    return {
      type: "ls-empty",
      text: "(empty shelf — nothing here yet)",
    };
  }

  if (!longFormat) {
    const items: LsShortItem[] = [];
    if (showAll) {
      items.push({ name: ".", kind: "hidden" });
      items.push({ name: "..", kind: "hidden" });
    }
    for (const child of visibleChildren) {
      items.push({
        name: child.name,
        kind: classifyItemKind(child),
      });
    }
    return { type: "ls-short", items };
  }

  const rows: LsLongRow[] = [];
  if (showAll) {
    rows.push({ name: ".", kind: "hidden", detail: "—", lastRead: "—" });
    rows.push({ name: "..", kind: "hidden", detail: "—", lastRead: "—" });
  }
  for (const child of visibleChildren) {
    const kind = classifyItemKind(child);
    if (child.type === "book") {
      rows.push({
        name: child.name,
        kind,
        detail: `${child.pages} ${child.pages === 1 ? "page" : "pages"}`,
        lastRead: `last read ${child.lastRead}`,
      });
    } else {
      const count = countShelfItems(child);
      rows.push({
        name: child.name,
        kind,
        detail: `${count} ${count === 1 ? "book" : "books"}`,
        lastRead: "—",
      });
    }
  }

  return { type: "ls-long", rows };
}

function executeLs(root: LibraryShelf, cwd: string[], args: string[]): PracticeCommandOutput {
  let showAll = false;
  let longFormat = false;
  const targetArgs: string[] = [];

  for (const arg of args) {
    if (arg.startsWith("-") && arg.length > 1) {
      if (arg === "--all") {
        showAll = true;
      } else {
        const flags = arg.slice(1);
        for (const ch of flags) {
          if (ch === "a") showAll = true;
          if (ch === "l") longFormat = true;
        }
      }
    } else {
      targetArgs.push(arg);
    }
  }

  if (targetArgs.length === 0) {
    const shelf = getShelfAtCwd(root, cwd);
    return buildLsOutput(shelf, showAll, longFormat);
  }

  const targetRaw = targetArgs[0];
  const resolved = resolvePath(root, cwd, targetRaw, false);
  if (!resolved.ok) {
    return { type: "error", text: resolved.error };
  }

  if (resolved.node.type === "book") {
    return {
      type: "error",
      text: `"${resolved.node.name}" is a book, not a shelf.`,
    };
  }

  return buildLsOutput(resolved.node, showAll, longFormat);
}

function executeMkdir(
  root: LibraryShelf,
  cwd: string[],
  args: string[],
): { ok: true } | { ok: false; error: string } {
  let makeParents = false;
  const targets: string[] = [];

  for (const arg of args) {
    if (arg === "-p" || arg === "--parents") {
      makeParents = true;
    } else if (!arg.startsWith("-")) {
      targets.push(arg);
    }
  }

  if (targets.length === 0) {
    return {
      ok: false,
      error: "mkdir needs a name — try: mkdir school",
    };
  }

  for (const rawTarget of targets) {
    let currentPath: string[];
    let remainder = rawTarget.trim();

    if (remainder.startsWith("/home/Tobias/")) {
      currentPath = [];
      remainder = remainder.slice("/home/Tobias/".length);
    } else if (remainder.startsWith("~/")) {
      currentPath = [];
      remainder = remainder.slice(2);
    } else if (remainder.startsWith("/")) {
      currentPath = [];
      remainder = remainder.slice(1);
    } else {
      currentPath = [...cwd];
    }

    const segments = remainder.split("/").filter((s) => s.length > 0);
    if (segments.length === 0) {
      return {
        ok: false,
        error: "mkdir needs a name — try: mkdir school",
      };
    }

    let currentShelf = getShelfAtCwd(root, currentPath);

    for (let i = 0; i < segments.length - 1; i += 1) {
      const seg = segments[i];
      if (seg === ".") continue;
      if (seg === "..") {
        if (currentPath.length > 0) currentPath.pop();
        currentShelf = getShelfAtCwd(root, currentPath);
        continue;
      }

      const existing = currentShelf.children.find((c) => c.name === seg);
      if (!existing) {
        if (!makeParents) {
          return {
            ok: false,
            error: `There is no shelf called "${seg}" here. Add -p to make the whole path at once.`,
          };
        }
        const created: LibraryShelf = {
          type: "shelf",
          name: seg,
          children: [],
        };
        currentShelf.children.push(created);
        currentPath.push(seg);
        currentShelf = created;
      } else if (existing.type === "book") {
        return {
          ok: false,
          error: `"${seg}" is a book, not a shelf — you can't walk through it.`,
        };
      } else {
        currentPath.push(seg);
        currentShelf = existing;
      }
    }

    const finalName = segments[segments.length - 1];
    if (finalName === "." || finalName === "..") {
      return {
        ok: false,
        error: `There is already something called "${finalName}" here.`,
      };
    }

    const already = currentShelf.children.find((c) => c.name === finalName);
    if (already) {
      if (makeParents && already.type === "shelf") {
        continue;
      }
      return {
        ok: false,
        error: `There is already something called "${finalName}" here.`,
      };
    }

    currentShelf.children.push({
      type: "shelf",
      name: finalName,
      children: [],
    });
  }

  return { ok: true };
}

export function createPracticeSession(): PracticeSessionState {
  const root = createPracticeLibrary();
  const cwd: string[] = [];
  const initialLsOutput = executeLs(root, cwd, []);

  return {
    root,
    cwd,
    transcript: [
      {
        id: "entry-1",
        kind: "welcome",
        text: PRACTICE_WELCOME_TEXT,
      },
      {
        id: "entry-2",
        kind: "command",
        prompt: formatPracticePrompt(cwd),
        command: "ls",
        output: initialLsOutput,
      },
    ],
    history: [],
    nextId: 3,
  };
}

export function runPracticeCommand(
  session: PracticeSessionState,
  rawInput: string,
): PracticeSessionState {
  const trimmed = rawInput.trim();
  const root = cloneLibraryShelf(session.root);
  let cwd = [...session.cwd];
  const prompt = formatPracticePrompt(cwd);

  if (trimmed.length === 0) {
    return {
      ...session,
      root,
      transcript: [
        ...session.transcript,
        {
          id: `entry-${session.nextId}`,
          kind: "command",
          prompt,
          command: "",
          output: { type: "none" },
        },
      ],
      nextId: session.nextId + 1,
    };
  }

  const tokens = trimmed.split(/\s+/);
  const cmd = tokens[0];
  const args = tokens.slice(1);
  const nextHistory = [...session.history, trimmed];

  if (cmd === "clear") {
    return {
      root,
      cwd,
      transcript: [],
      history: nextHistory,
      nextId: session.nextId + 1,
    };
  }

  let output: PracticeCommandOutput = { type: "none" };

  if (cmd === "ls") {
    output = executeLs(root, cwd, args);
  } else if (cmd === "pwd") {
    output = {
      type: "pwd",
      text: formatPracticePwd(cwd),
    };
  } else if (cmd === "cd") {
    const target = args[0] ?? "";
    const resolved = resolvePath(root, cwd, target, true);
    if (!resolved.ok) {
      output = { type: "error", text: resolved.error };
    } else {
      cwd = resolved.path;
      output = { type: "none" };
    }
  } else if (cmd === "mkdir") {
    const res = executeMkdir(root, cwd, args);
    if (!res.ok) {
      output = { type: "error", text: res.error };
    } else {
      output = { type: "none" };
    }
  } else if (cmd === "help") {
    output = {
      type: "help",
      rows: PRACTICE_HELP_ROWS,
    };
  } else {
    output = {
      type: "error",
      text: `I don't know "${cmd}" yet. Try: help`,
    };
  }

  return {
    root,
    cwd,
    transcript: [
      ...session.transcript,
      {
        id: `entry-${session.nextId}`,
        kind: "command",
        prompt,
        command: trimmed,
        output,
      },
    ],
    history: nextHistory,
    nextId: session.nextId + 1,
  };
}
