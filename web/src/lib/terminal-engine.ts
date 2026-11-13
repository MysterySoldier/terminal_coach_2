import { SANDBOX_FS, type ArchivedItem, type FsNode, type ParsedCommand } from "../data/sandbox";

/**
 * Parse a raw shell line into a normalized command description.
 * Bundled short flags (-la) are expanded so flag order and grouping never matter.
 */
export function parseCommand(raw: string): ParsedCommand {
  const trimmed = raw.trim();
  const tokens = tokenize(trimmed);
  const name = tokens[0] ?? "";
  const shortFlags = new Set<string>();
  const longFlags = new Map<string, string | undefined>();
  const args: string[] = [];

  for (const token of tokens.slice(1)) {
    if (token.startsWith("--")) {
      const [key, value] = token.slice(2).split("=");
      longFlags.set(key, value);
    } else if (token.startsWith("-") && token.length > 1 && !/^-\d/.test(token)) {
      for (const ch of token.slice(1)) {
        // Flags like -size or +100M are find-style predicates, keep them as args too.
        shortFlags.add(ch);
      }
      args.push(token);
    } else {
      args.push(token);
    }
  }

  return { name, shortFlags, longFlags, args: args.filter((a) => !a.startsWith("-")), raw: trimmed };
}

interface TokenInfo {
  value: string;
  quoted: boolean;
}

function tokenizeWithQuotes(input: string): TokenInfo[] {
  const out: TokenInfo[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let sawQuote = false;

  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      sawQuote = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (current || sawQuote) {
        out.push({ value: current, quoted: sawQuote });
        current = "";
        sawQuote = false;
      }
      continue;
    }
    current += ch;
  }
  if (current || sawQuote) out.push({ value: current, quoted: sawQuote });
  return out;
}

function tokenize(input: string): string[] {
  return tokenizeWithQuotes(input).map((t) => t.value);
}

/** Split compound shell lines on unquoted `;` and `&&`. */
function splitChainSegments(raw: string): Array<{ segment: string; opBefore: "start" | ";" | "&&" }> {
  const segments: Array<{ segment: string; opBefore: "start" | ";" | "&&" }> = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let opBefore: "start" | ";" | "&&" = "start";

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (quote) {
      if (ch === quote) quote = null;
      current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === ";") {
      if (current.trim()) segments.push({ segment: current.trim(), opBefore });
      current = "";
      opBefore = ";";
      continue;
    }
    if (ch === "&" && raw[i + 1] === "&") {
      if (current.trim()) segments.push({ segment: current.trim(), opBefore });
      current = "";
      opBefore = "&&";
      i += 1;
      continue;
    }
    current += ch;
  }
  if (current.trim()) segments.push({ segment: current.trim(), opBefore });
  return segments;
}

/** Split a single pipeline on unquoted `|` (ignoring `||`). */
function splitPipeline(segment: string): string[] {
  const stages: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < segment.length; i += 1) {
    const ch = segment[i];
    if (quote) {
      if (ch === quote) quote = null;
      current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "|" && segment[i + 1] !== "|") {
      stages.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  stages.push(current.trim());
  return stages.filter(Boolean);
}

/** Resolve a possibly relative path against the working directory. */
export function resolvePath(cwd: string, target: string): string {
  if (!target || target === "~") return "/home/user";
  let base: string[];
  if (target.startsWith("/")) base = [];
  else if (target.startsWith("~/")) {
    base = ["home", "user"];
    target = target.slice(2);
  } else base = cwd.split("/").filter(Boolean);

  for (const part of target.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") base.pop();
    else base.push(part);
  }
  return "/" + base.join("/");
}

function splitParentAndName(absPath: string): { parentPath: string; name: string } {
  const idx = absPath.lastIndexOf("/");
  const parentPath = idx <= 0 ? "/" : absPath.slice(0, idx);
  const name = absPath.slice(idx + 1);
  return { parentPath, name };
}

// ---------------------------------------------------------------------------
// Session: the shell's mutable state (filesystem, services, process table,
// mounts with byte + inode accounting, users/groups, crontabs).
// ---------------------------------------------------------------------------

export interface ServiceState {
  running: boolean;
  enabled: boolean;
  port: number;
  process: string;
}

export interface ProcessEntry {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  stat: string;
  start: string;
  time: string;
  /** Binary name shown in `ss -tlnp` socket ownership. */
  procName: string;
  /** Full command line shown in `ps aux`. */
  command: string;
  /** TCP port held by this process, if any. */
  listenPort?: number;
  /** Bind address for `ss -tlnp` (defaults to "0.0.0.0"). */
  listenAddr?: string;
  /** File descriptor number shown in `ss -tlnp`. */
  listenFd?: number;
  /** Associated systemd unit name, if managed by systemd. */
  serviceUnit?: string;
  /** When true, polite SIGTERM (`kill <pid>`) is ignored and SIGKILL (`kill -9 <pid>`) is required. */
  ignoresSigterm?: boolean;
}

export interface MountEntry {
  device: string;
  mountPoint: string;
  fsType: string;
  totalBytes: number;
  baseUsedBytes: number;
  totalInodes: number;
  baseUsedInodes: number;
}

export interface MountUsage {
  device: string;
  mountPoint: string;
  fsType: string;
  totalBytes: number;
  usedBytes: number;
  availBytes: number;
  usePct: number;
  totalInodes: number;
  usedInodes: number;
  freeInodes: number;
  inodePct: number;
}

export interface UserAccount {
  uid: number;
  gid: number;
  primaryGroup: string;
  groups: string[];
}

export interface ShellSession {
  fs: FsNode;
  services: Record<string, ServiceState>;
  processes: ProcessEntry[];
  mounts: MountEntry[];
  users: Record<string, UserAccount>;
  crontabs: Record<string, string[]>;
}

const GiB = 1024 ** 3;

const DEFAULT_SERVICES: Record<string, ServiceState> = {
  nginx: { running: false, enabled: false, port: 80, process: "nginx" },
  httpd: { running: false, enabled: false, port: 80, process: "httpd" },
  sshd: { running: true, enabled: true, port: 22, process: "sshd" },
  postgres: { running: true, enabled: true, port: 5432, process: "postgres" },
  cron: { running: true, enabled: true, port: 0, process: "cron" },
};

interface ServiceProcessTemplate {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  stat: string;
  start: string;
  time: string;
  procName: string;
  command: string;
  listenAddr?: string;
  listenFd?: number;
}

const SERVICE_PROCESS_TEMPLATES: Record<string, ServiceProcessTemplate> = {
  sshd: {
    pid: 1180,
    user: "root",
    cpu: 0.0,
    mem: 0.3,
    stat: "Ss",
    start: "09:12",
    time: "0:01",
    procName: "sshd",
    command: "/usr/sbin/sshd -D",
    listenAddr: "0.0.0.0",
    listenFd: 3,
  },
  postgres: {
    pid: 1344,
    user: "postgres",
    cpu: 0.2,
    mem: 1.8,
    stat: "Ss",
    start: "09:12",
    time: "0:04",
    procName: "postgres",
    command: "/usr/lib/postgresql/16/bin/postgres -D /var/lib/postgresql/data",
    listenAddr: "127.0.0.1",
    listenFd: 5,
  },
  cron: {
    pid: 1420,
    user: "root",
    cpu: 0.0,
    mem: 0.1,
    stat: "Ss",
    start: "09:12",
    time: "0:00",
    procName: "cron",
    command: "/usr/sbin/cron -f",
  },
  nginx: {
    pid: 1902,
    user: "root",
    cpu: 0.1,
    mem: 0.6,
    stat: "Ss",
    start: "14:18",
    time: "0:01",
    procName: "nginx",
    command: "nginx: master process /usr/sbin/nginx -g daemon on;",
    listenAddr: "0.0.0.0",
    listenFd: 6,
  },
  httpd: {
    pid: 3120,
    user: "apache",
    cpu: 0.1,
    mem: 0.9,
    stat: "Ss",
    start: "14:22",
    time: "0:01",
    procName: "httpd",
    command: "/usr/sbin/httpd -DFOREGROUND",
    listenAddr: "0.0.0.0",
    listenFd: 4,
  },
};

const DEFAULT_MOUNTS: MountEntry[] = [
  {
    device: "/dev/sda1",
    mountPoint: "/",
    fsType: "ext4",
    totalBytes: 40 * GiB,
    baseUsedBytes: 18 * GiB,
    totalInodes: 1_310_720,
    baseUsedInodes: 182_000,
  },
  {
    device: "/dev/sdb1",
    mountPoint: "/home",
    fsType: "xfs",
    totalBytes: 100 * GiB,
    baseUsedBytes: 62 * GiB,
    totalInodes: 655_360,
    baseUsedInodes: 42_100,
  },
];

const DEFAULT_USERS: Record<string, UserAccount> = {
  root: { uid: 0, gid: 0, primaryGroup: "root", groups: ["root"] },
  user: { uid: 1000, gid: 1000, primaryGroup: "user", groups: ["user", "developers"] },
  alice: { uid: 1001, gid: 1001, primaryGroup: "alice", groups: ["alice", "developers"] },
  deploy: { uid: 1002, gid: 1020, primaryGroup: "web", groups: ["web"] },
  "www-data": { uid: 33, gid: 33, primaryGroup: "www-data", groups: ["www-data"] },
  apache: { uid: 48, gid: 48, primaryGroup: "apache", groups: ["apache"] },
  postgres: { uid: 109, gid: 115, primaryGroup: "postgres", groups: ["postgres"] },
};

const GROUP_GIDS: Record<string, number> = {
  root: 0,
  adm: 4,
  "www-data": 33,
  apache: 48,
  postgres: 115,
  user: 1000,
  alice: 1001,
  developers: 1010,
  web: 1020,
};

function cloneFs(root: FsNode): FsNode {
  const cloned = structuredClone(root);
  // Ensure /etc/group and /tmp exist on every fresh machine without altering SANDBOX_FS exports.
  if (cloned.children?.etc) {
    cloned.children.etc.children = cloned.children.etc.children ?? {};
    cloned.children.etc.children.group ??= {
      name: "group",
      type: "file",
      mode: 0o644,
      owner: "root",
      group: "root",
      size: 214,
      mtime: "Sep 19 08:00",
      content:
        "root:x:0:\nadm:x:4:syslog\nuser:x:1000:\nalice:x:1001:\ndevelopers:x:1010:alice,user\nweb:x:1020:deploy\n",
    };
  }
  cloned.children = cloned.children ?? {};
  cloned.children.tmp ??= {
    name: "tmp",
    type: "dir",
    mode: 0o1777,
    owner: "root",
    group: "root",
    size: 4096,
    mtime: "Sep 21 09:12",
    children: {},
  };
  return cloned;
}

function cloneServices(): Record<string, ServiceState> {
  return structuredClone(DEFAULT_SERVICES);
}

function buildServiceProcess(unit: string, service: ServiceState): ProcessEntry {
  const tpl = SERVICE_PROCESS_TEMPLATES[unit] ?? {
    pid: 2400 + Math.abs(hashUnit(unit)) % 500,
    user: "root",
    cpu: 0.0,
    mem: 0.2,
    stat: "Ss",
    start: "14:00",
    time: "0:00",
    procName: service.process || unit,
    command: `/usr/sbin/${service.process || unit}`,
    listenAddr: "0.0.0.0",
    listenFd: 3,
  };
  return {
    pid: tpl.pid,
    user: tpl.user,
    cpu: tpl.cpu,
    mem: tpl.mem,
    stat: tpl.stat,
    start: tpl.start,
    time: tpl.time,
    procName: tpl.procName,
    command: tpl.command,
    listenPort: service.port > 0 ? service.port : undefined,
    listenAddr: service.port > 0 ? (tpl.listenAddr ?? "0.0.0.0") : undefined,
    listenFd: service.port > 0 ? (tpl.listenFd ?? 3) : undefined,
    serviceUnit: unit,
  };
}

function hashUnit(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** Synchronize systemd service processes with `session.services` while preserving non-service processes. */
export function syncServiceProcesses(session: ShellSession): void {
  const nonService = session.processes.filter((p) => !p.serviceUnit);
  const initExists = nonService.some((p) => p.pid === 1);
  const base: ProcessEntry[] = initExists
    ? [...nonService]
    : [
        {
          pid: 1,
          user: "root",
          cpu: 0.0,
          mem: 0.4,
          stat: "Ss",
          start: "09:12",
          time: "0:02",
          procName: "systemd",
          command: "/sbin/init",
        },
        ...nonService,
      ];

  for (const [unit, svc] of Object.entries(session.services)) {
    if (svc.running) {
      base.push(buildServiceProcess(unit, svc));
    }
  }
  base.sort((a, b) => a.pid - b.pid);
  session.processes = base;
}

/** A fresh machine: the shipped filesystem, nginx down (the website is down). */
export function createSession(): ShellSession {
  const session: ShellSession = {
    fs: cloneFs(SANDBOX_FS),
    services: cloneServices(),
    processes: [],
    mounts: structuredClone(DEFAULT_MOUNTS),
    users: structuredClone(DEFAULT_USERS),
    crontabs: {},
  };
  syncServiceProcesses(session);
  return session;
}

/** Reset a session to a fresh machine. Used by the Sandbox reset button and when a coach job starts. */
export function resetSession(session: ShellSession): void {
  session.fs = cloneFs(SANDBOX_FS);
  session.services = cloneServices();
  session.processes = [];
  session.mounts = structuredClone(DEFAULT_MOUNTS);
  session.users = structuredClone(DEFAULT_USERS);
  session.crontabs = {};
  syncServiceProcesses(session);
}

/**
 * Reboot: volatile runtime state is lost, on-disk state survives.
 * Services that were enabled come back up; services that were only started do not;
 * non-service processes vanish across reboot.
 * Filesystem modes, owners, and created/extracted files survive — they are on disk.
 */
export function rebootSession(session: ShellSession): string[] {
  session.processes = [];
  for (const service of Object.values(session.services)) {
    service.running = service.enabled;
  }
  syncServiceProcesses(session);
  const up = Object.entries(session.services)
    .filter(([, s]) => s.running)
    .map(([name]) => name)
    .join(", ");
  return [
    "Rebooting...",
    "System back up.",
    up ? `Services running after boot: ${up}.` : "No services running after boot.",
  ];
}

function getNodeFrom(root: FsNode, path: string): FsNode | null {
  if (path === "/" || path === "") return root;
  const parts = path.split("/").filter(Boolean);
  let node: FsNode = root;
  for (const part of parts) {
    const next = node.children?.[part];
    if (!next) return null;
    node = next;
  }
  return node;
}

/** Ensure a directory path exists in `session.fs` (used by per-job seeders and `mkdir -p`). */
export function ensureDirInSession(
  session: ShellSession,
  absPath: string,
  meta?: Partial<Pick<FsNode, "mode" | "owner" | "group" | "mtime">>,
): FsNode {
  const parts = absPath.split("/").filter(Boolean);
  let cursor = session.fs;
  for (const part of parts) {
    cursor.children = cursor.children ?? {};
    let child = cursor.children[part];
    if (!child) {
      child = {
        name: part,
        type: "dir",
        mode: meta?.mode ?? 0o755,
        owner: meta?.owner ?? "root",
        group: meta?.group ?? "root",
        size: 4096,
        mtime: meta?.mtime ?? "Sep 21 09:12",
        children: {},
      };
      cursor.children[part] = child;
    }
    cursor = child;
  }
  if (meta?.mode !== undefined) cursor.mode = meta.mode;
  if (meta?.owner !== undefined) cursor.owner = meta.owner;
  if (meta?.group !== undefined) cursor.group = meta.group;
  if (meta?.mtime !== undefined) cursor.mtime = meta.mtime;
  return cursor;
}

/** Create or overwrite a regular file in `session.fs` (used by per-job seeders). */
export function putFileInSession(
  session: ShellSession,
  absPath: string,
  spec: {
    content?: string;
    size?: number;
    mode?: number;
    owner?: string;
    group?: string;
    mtime?: string;
    archiveEntries?: string[];
    archiveItems?: ArchivedItem[];
  },
): FsNode {
  const { parentPath, name } = splitParentAndName(absPath);
  const parent = ensureDirInSession(session, parentPath);
  parent.children = parent.children ?? {};
  const content = spec.content ?? "";
  const node: FsNode = {
    name,
    type: "file",
    mode: spec.mode ?? 0o644,
    owner: spec.owner ?? "root",
    group: spec.group ?? "root",
    size: spec.size ?? content.length,
    mtime: spec.mtime ?? "Sep 21 09:12",
    content,
    ...(spec.archiveEntries ? { archiveEntries: spec.archiveEntries } : {}),
    ...(spec.archiveItems ? { archiveItems: spec.archiveItems } : {}),
  };
  parent.children[name] = node;
  return node;
}

// ---------------------------------------------------------------------------
// Mount & Unix permission accounting helpers
// ---------------------------------------------------------------------------

function findMountForPath(session: ShellSession, absPath: string): MountEntry {
  const sorted = [...session.mounts].sort((a, b) => b.mountPoint.length - a.mountPoint.length);
  for (const m of sorted) {
    if (m.mountPoint === "/") return m;
    if (absPath === m.mountPoint || absPath.startsWith(`${m.mountPoint}/`)) return m;
  }
  return session.mounts[0];
}

function measureMountTree(session: ShellSession, mountPoint: string): { bytes: number; inodes: number } {
  const startNode = getNodeFrom(session.fs, mountPoint);
  if (!startNode) return { bytes: 0, inodes: 0 };

  const childMountPoints = new Set(
    session.mounts
      .map((m) => m.mountPoint)
      .filter((mp) => mp !== mountPoint && (mountPoint === "/" ? mp.startsWith("/") : mp.startsWith(`${mountPoint}/`))),
  );

  let bytes = 0;
  let inodes = 0;

  const visit = (node: FsNode, path: string): void => {
    if (path !== mountPoint && childMountPoints.has(path)) return;
    inodes += 1;
    bytes += node.size;
    if (node.type === "dir") {
      for (const child of Object.values(node.children ?? {})) {
        visit(child, path === "/" ? `/${child.name}` : `${path}/${child.name}`);
      }
    }
  };

  visit(startNode, mountPoint);
  return { bytes, inodes };
}

export function getMountUsage(session: ShellSession, mountPoint: string): MountUsage {
  const mount = session.mounts.find((m) => m.mountPoint === mountPoint) ?? findMountForPath(session, mountPoint);
  const { bytes: treeBytes, inodes: treeInodes } = measureMountTree(session, mount.mountPoint);
  const usedBytes = Math.min(mount.totalBytes, Math.max(0, mount.baseUsedBytes + treeBytes));
  const availBytes = Math.max(0, mount.totalBytes - usedBytes);
  const usePct = mount.totalBytes > 0 ? Math.min(100, Math.ceil((usedBytes / mount.totalBytes) * 100)) : 0;

  const usedInodes = Math.min(mount.totalInodes, Math.max(0, mount.baseUsedInodes + treeInodes));
  const freeInodes = Math.max(0, mount.totalInodes - usedInodes);
  const inodePct = mount.totalInodes > 0 ? Math.min(100, Math.ceil((usedInodes / mount.totalInodes) * 100)) : 0;

  return {
    device: mount.device,
    mountPoint: mount.mountPoint,
    fsType: mount.fsType,
    totalBytes: mount.totalBytes,
    usedBytes,
    availBytes,
    usePct,
    totalInodes: mount.totalInodes,
    usedInodes,
    freeInodes,
    inodePct,
  };
}

function checkSpaceForWrite(session: ShellSession, targetAbsPath: string, neededBytes: number, neededInodes: number): boolean {
  const mount = findMountForPath(session, targetAbsPath);
  const usage = getMountUsage(session, mount.mountPoint);
  if (neededInodes > 0 && usage.freeInodes < neededInodes) return false;
  if (neededBytes > 0 && usage.availBytes < neededBytes) return false;
  if (neededInodes > 0 && usage.availBytes === 0 && usage.usedBytes >= usage.totalBytes) return false;
  return true;
}

function checkNodeBits(user: UserAccount, username: string, node: FsNode, requiredBits: number): boolean {
  if (user.uid === 0) return true;
  let effectiveBits: number;
  if (node.owner === username) {
    effectiveBits = (node.mode >> 6) & 0o7;
  } else if (user.groups.includes(node.group)) {
    effectiveBits = (node.mode >> 3) & 0o7;
  } else {
    effectiveBits = node.mode & 0o7;
  }
  return (effectiveBits & requiredBits) === requiredBits;
}

/** Evaluate real Unix path traversal + file permission bits (`4` read, `2` write, `1` execute) for `username`. */
export function canUserAccess(session: ShellSession, username: string, absPath: string, requiredBits: number): boolean {
  const user = session.users[username];
  if (!user) return false;
  const parts = absPath.split("/").filter(Boolean);
  let cursor: FsNode = session.fs;
  if (!checkNodeBits(user, username, cursor, 0o1)) return false;

  for (let i = 0; i < parts.length; i += 1) {
    const next = cursor.children?.[parts[i]];
    if (!next) return false;
    const isLast = i === parts.length - 1;
    if (!isLast) {
      if (next.type !== "dir" || !checkNodeBits(user, username, next, 0o1)) return false;
    } else if (!checkNodeBits(user, username, next, requiredBits)) {
      return false;
    }
    cursor = next;
  }
  return true;
}

/** The shared session behind the plain runCommand() entry point (the Sandbox & Coach pages). */
let defaultSession: ShellSession = createSession();

export function getDefaultSession(): ShellSession {
  return defaultSession;
}

export function resetDefaultSession(): void {
  resetSession(defaultSession);
}

export function rebootDefaultSession(): string[] {
  return rebootSession(defaultSession);
}

export function getNode(path: string): FsNode | null {
  return getNodeFrom(defaultSession.fs, path);
}

export function getNodeInSession(session: ShellSession, path: string): FsNode | null {
  return getNodeFrom(session.fs, path);
}

export function modeToSymbolic(mode: number, isDir: boolean): string {
  const userX = mode & 0o4000 ? (mode & 0o100 ? "s" : "S") : mode & 0o100 ? "x" : "-";
  const groupX = mode & 0o2000 ? (mode & 0o010 ? "s" : "S") : mode & 0o010 ? "x" : "-";
  const otherX = mode & 0o1000 ? (mode & 0o001 ? "t" : "T") : mode & 0o001 ? "x" : "-";
  const user = `${mode & 0o400 ? "r" : "-"}${mode & 0o200 ? "w" : "-"}${userX}`;
  const group = `${mode & 0o040 ? "r" : "-"}${mode & 0o020 ? "w" : "-"}${groupX}`;
  const other = `${mode & 0o004 ? "r" : "-"}${mode & 0o002 ? "w" : "-"}${otherX}`;
  return `${isDir ? "d" : "-"}${user}${group}${other}`;
}

export interface CommandResult {
  output: string[];
  cwd: string;
  /** True when the command is not implemented by the simulator. */
  unknown?: boolean;
  /** Exit status (0 = success, non-zero = error). */
  exitCode?: number;
  /**
   * What this command actually changed in the machine's state.
   * Grading reads this (and the resulting state), never the command text.
   */
  changed?: { paths: string[]; created: string[]; services: string[] };
}

/** Execute a command against the shared session filesystem. */
export function runCommand(raw: string, cwd: string): CommandResult {
  return runCommandInSession(defaultSession, raw, cwd);
}

/** Execute a command (including `;`, `&&`, `|`, and `*` globs) against an explicit session. */
export function runCommandInSession(session: ShellSession, raw: string, cwd: string): CommandResult {
  const trimmed = raw.trim();
  if (!trimmed) return { output: [], cwd, exitCode: 0 };

  const chainSegments = splitChainSegments(trimmed);
  if (chainSegments.length === 0) return { output: [], cwd, exitCode: 0 };

  let currentCwd = cwd;
  const allOutput: string[] = [];
  const changedPaths: string[] = [];
  const changedCreated: string[] = [];
  const changedServices: string[] = [];
  let lastExit = 0;
  let sawUnknown = false;

  for (const { segment, opBefore } of chainSegments) {
    if (opBefore === "&&" && (lastExit !== 0 || sawUnknown)) {
      break;
    }
    const pipeStages = splitPipeline(segment);
    let stdinLines: string[] | undefined;
    let stageResult: CommandResult = { output: [], cwd: currentCwd, exitCode: 0 };

    for (let i = 0; i < pipeStages.length; i += 1) {
      stageResult = runSingleStage(session, pipeStages[i], currentCwd, stdinLines);
      currentCwd = stageResult.cwd;
      if (stageResult.changed) {
        changedPaths.push(...stageResult.changed.paths);
        changedCreated.push(...stageResult.changed.created);
        changedServices.push(...stageResult.changed.services);
      }
      if (stageResult.unknown) {
        sawUnknown = true;
        break;
      }
      stdinLines = stageResult.output;
    }

    if (stageResult.output[0] === "\u0000clear") {
      return stageResult;
    }
    allOutput.push(...stageResult.output);
    lastExit = stageResult.exitCode ?? (stageResult.unknown ? 127 : 0);
    if (sawUnknown) break;
  }

  const hasChanges = changedPaths.length > 0 || changedCreated.length > 0 || changedServices.length > 0;
  return {
    output: allOutput,
    cwd: currentCwd,
    exitCode: lastExit,
    ...(sawUnknown ? { unknown: true } : {}),
    ...(hasChanges
      ? { changed: { paths: changedPaths, created: changedCreated, services: changedServices } }
      : {}),
  };
}

function expandPathGlob(root: FsNode, cwd: string, rawPattern: string): string[] {
  const slashIdx = rawPattern.lastIndexOf("/");
  const dirPrefix = slashIdx === -1 ? "" : rawPattern.slice(0, slashIdx + 1);
  const basePattern = slashIdx === -1 ? rawPattern : rawPattern.slice(slashIdx + 1);

  // Only expand wildcards in the final path segment (e.g. `/var/log/*`, `*.log`, `/var/spool/maildrop/*`).
  if (dirPrefix.includes("*") || dirPrefix.includes("?")) return [rawPattern];

  const dirAbs = resolvePath(cwd, dirPrefix || ".");
  const dirNode = getNodeFrom(root, dirAbs);
  if (!dirNode || dirNode.type !== "dir") return [rawPattern];

  const includeHidden = basePattern.startsWith(".");
  const matches = Object.values(dirNode.children ?? {})
    .filter((child) => (includeHidden || !child.name.startsWith(".")) && globMatchCaseSensitive(child.name, basePattern))
    .map((child) => `${dirPrefix}${child.name}`)
    .sort((a, b) => a.localeCompare(b));

  return matches.length > 0 ? matches : [rawPattern];
}

function expandCommandTokens(root: FsNode, cwd: string, tokenInfos: TokenInfo[]): string[] {
  if (tokenInfos.length === 0) return [];
  const cmdName = tokenInfos[0].value;
  const out: string[] = [cmdName];

  for (let i = 1; i < tokenInfos.length; i += 1) {
    const tok = tokenInfos[i];
    const prev = tokenInfos[i - 1]?.value ?? "";
    const isFindPatternArg = cmdName === "find" && (prev === "-name" || prev === "-iname" || prev === "-path");
    const isGrepPatternArg =
      cmdName === "grep" && !tok.value.startsWith("-") && out.slice(1).every((existing) => existing.startsWith("-"));

    if (!tok.quoted && !tok.value.startsWith("-") && !isFindPatternArg && !isGrepPatternArg && /[*?]/.test(tok.value)) {
      out.push(...expandPathGlob(root, cwd, tok.value));
    } else {
      out.push(tok.value);
    }
  }
  return out;
}

function parseExpandedTokens(tokens: string[], raw: string): ParsedCommand {
  const name = tokens[0] ?? "";
  const shortFlags = new Set<string>();
  const longFlags = new Map<string, string | undefined>();
  const args: string[] = [];

  for (const token of tokens.slice(1)) {
    if (token.startsWith("--")) {
      const [key, value] = token.slice(2).split("=");
      longFlags.set(key, value);
    } else if (token.startsWith("-") && token.length > 1 && !/^-\d/.test(token)) {
      for (const ch of token.slice(1)) {
        shortFlags.add(ch);
      }
      args.push(token);
    } else {
      args.push(token);
    }
  }

  return { name, shortFlags, longFlags, args: args.filter((a) => !a.startsWith("-")), raw };
}

function runSingleStage(
  session: ShellSession,
  rawStage: string,
  cwd: string,
  stdinLines?: string[],
): CommandResult {
  const tokenInfos = tokenizeWithQuotes(rawStage);
  const tokens = expandCommandTokens(session.fs, cwd, tokenInfos);
  const parsed = parseExpandedTokens(tokens, rawStage.trim());
  const { name, shortFlags, longFlags, args } = parsed;

  if (!name) return { output: [], cwd, exitCode: 0 };

  const nodeAt = (target: string): FsNode | null => getNodeFrom(session.fs, resolvePath(cwd, target));

  switch (name) {
    case "pwd":
      return { output: [cwd], cwd, exitCode: 0 };

    case "whoami":
      return { output: ["user"], cwd, exitCode: 0 };

    case "id": {
      const username = args[0] ?? "user";
      const account = session.users[username];
      if (!account) {
        return { output: [`id: ‘${username}’: no such user`], cwd, exitCode: 1 };
      }
      const groupEntries = account.groups.map((grp) => `${GROUP_GIDS[grp] ?? account.gid}(${grp})`).join(",");
      return {
        output: [`uid=${account.uid}(${username}) gid=${account.gid}(${account.primaryGroup}) groups=${groupEntries}`],
        cwd,
        exitCode: 0,
      };
    }

    case "clear":
      return { output: ["\u0000clear"], cwd, exitCode: 0 };

    case "help":
      return {
        output: [
          "Available in this sandbox:",
          "  ls  cd  pwd  cat  head  tail  wc  stat  file  find  grep",
          "  mkdir  touch  cp  mv  rm  chmod  chown  chgrp  tar",
          "  ps  top  uptime  kill  ss  df  du  crontab  id  whoami",
          "  systemctl  service  curl  reboot  echo  clear",
          "",
          "Tab completes paths. Up/Down arrows walk your history.",
        ],
        cwd,
        exitCode: 0,
      };

    case "cd": {
      const target = resolvePath(cwd, args[0] ?? "~");
      const node = getNodeFrom(session.fs, target);
      if (!node) return { output: [`cd: ${args[0]}: No such file or directory`], cwd, exitCode: 1 };
      if (node.type !== "dir") return { output: [`cd: ${args[0]}: Not a directory`], cwd, exitCode: 1 };
      return { output: [], cwd: target, exitCode: 0 };
    }

    case "ls": {
      const targetArg = args[0] ?? ".";
      const targetPath = resolvePath(cwd, targetArg);
      const node = getNodeFrom(session.fs, targetPath);
      if (!node) return { output: [`ls: cannot access '${targetArg}': No such file or directory`], cwd, exitCode: 2 };

      const showHidden = shortFlags.has("a") || longFlags.has("all");
      const longFormat = shortFlags.has("l");
      const dirItself = shortFlags.has("d") || longFlags.has("directory");

      let entries: FsNode[];
      if (node.type === "file" || dirItself) {
        entries = [dirItself ? { ...node, name: targetArg } : node];
      } else {
        entries = Object.values(node.children ?? {});
        if (showHidden) {
          const dot: FsNode = { ...node, name: "." };
          const dotdot: FsNode = { ...node, name: ".." };
          entries = [dot, dotdot, ...entries];
        } else {
          entries = entries.filter((e) => !e.name.startsWith("."));
        }
      }

      entries = entries.slice().sort((a, b) => a.name.localeCompare(b.name));

      if (!longFormat) {
        const names = entries.map((e) => e.name);
        return { output: names.length ? [names.join("  ")] : [], cwd, exitCode: 0 };
      }

      const lines = entries.map((e) => {
        const perms = modeToSymbolic(e.mode, e.type === "dir");
        const links = e.type === "dir" ? 2 : 1;
        const size = shortFlags.has("h") ? humanSize(e.size) : String(e.size);
        return `${perms}  ${links} ${e.owner.padEnd(8)} ${e.group.padEnd(8)} ${size.padStart(7)} ${e.mtime} ${e.name}`;
      });
      if (node.type === "file" || dirItself) {
        return { output: lines, cwd, exitCode: 0 };
      }
      const total = entries.reduce((sum, e) => sum + Math.ceil(e.size / 1024), 0);
      return { output: [`total ${total}`, ...lines], cwd, exitCode: 0 };
    }

    case "cat":
    case "head":
    case "tail":
    case "less":
    case "more": {
      let lineLimit = 10;
      const nVal = matchOptionValueFromTokens(tokens, "-n");
      const fileOperands = args.filter((a) => a !== nVal);
      if (nVal && /^\d+$/.test(nVal)) {
        lineLimit = Number(nVal);
      } else {
        const dashNum = tokens.slice(1).find((t) => /^-\d+$/.test(t));
        if (dashNum) lineLimit = Number(dashNum.slice(1));
      }

      if (!fileOperands.length) {
        if (stdinLines !== undefined) {
          let lines = [...stdinLines];
          if (name === "head") lines = lines.slice(0, lineLimit);
          if (name === "tail") lines = lines.slice(-lineLimit);
          return { output: lines, cwd, exitCode: 0 };
        }
        return { output: [`${name}: missing operand`], cwd, exitCode: 1 };
      }
      const out: string[] = [];
      let exitCode = 0;
      for (const arg of fileOperands) {
        const node = nodeAt(arg);
        if (!node) {
          out.push(`${name}: ${arg}: No such file or directory`);
          exitCode = 1;
          continue;
        }
        if (node.type === "dir") {
          out.push(`${name}: ${arg}: Is a directory`);
          exitCode = 1;
          continue;
        }
        let lines = (node.content ?? "").split("\n").filter((_, i, arr) => i < arr.length - 1 || arr[i] !== "");
        if (name === "head") lines = lines.slice(0, lineLimit);
        if (name === "tail") lines = lines.slice(-lineLimit);
        out.push(...lines);
      }
      return { output: out, cwd, exitCode };
    }

    case "wc": {
      const countLines = shortFlags.has("l") || longFlags.has("lines");
      const countWords = shortFlags.has("w") || longFlags.has("words");
      const countBytes = shortFlags.has("c") || longFlags.has("bytes");
      const defaultAll = !countLines && !countWords && !countBytes;

      const formatCounts = (lines: string[], label?: string): string => {
        const lCount = lines.length;
        const text = lines.length ? `${lines.join("\n")}\n` : "";
        const wCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const bCount = text.length;
        const cols: string[] = [];
        if (defaultAll || countLines) cols.push(String(lCount));
        if (defaultAll || countWords) cols.push(String(wCount));
        if (defaultAll || countBytes) cols.push(String(bCount));
        return label ? `${cols.join(" ")} ${label}` : cols.join(" ");
      };

      if (args.length === 0) {
        return { output: [formatCounts(stdinLines ?? [])], cwd, exitCode: 0 };
      }

      const out: string[] = [];
      let exitCode = 0;
      for (const arg of args) {
        const node = nodeAt(arg);
        if (!node) {
          out.push(`wc: ${arg}: No such file or directory`);
          exitCode = 1;
          continue;
        }
        if (node.type === "dir") {
          out.push(`wc: ${arg}: Is a directory`);
          exitCode = 1;
          continue;
        }
        const lines = (node.content ?? "").split("\n").filter((_, i, arr) => i < arr.length - 1 || arr[i] !== "");
        out.push(formatCounts(lines, arg));
      }
      return { output: out, cwd, exitCode };
    }

    case "stat": {
      const fmtVal = matchOptionValueFromTokens(tokens, "-c") ?? longFlags.get("format") ?? null;
      const fileArgs = args.filter((a) => a !== fmtVal);
      const targetArg = fileArgs[0] ?? ".";
      const node = nodeAt(targetArg);
      if (!node) return { output: [`stat: cannot stat '${targetArg}': No such file or directory`], cwd, exitCode: 1 };
      const octalShort = (node.mode & 0o7777).toString(8);
      const octal = node.mode.toString(8).padStart(4, "0");
      if (fmtVal) {
        const formatted = fmtVal
          .replace(/%U/g, node.owner)
          .replace(/%G/g, node.group)
          .replace(/%a/g, octalShort)
          .replace(/%A/g, modeToSymbolic(node.mode, node.type === "dir"))
          .replace(/%s/g, String(node.size))
          .replace(/%n/g, targetArg);
        return { output: [formatted], cwd, exitCode: 0 };
      }
      return {
        output: [
          `  File: ${node.name}`,
          `  Size: ${node.size}\tBlocks: ${Math.ceil(node.size / 512)}\t${node.type === "dir" ? "directory" : "regular file"}`,
          `Access: (${octal}/${modeToSymbolic(node.mode, node.type === "dir")})  Uid: ( ${node.owner} )   Gid: ( ${node.group} )`,
          `Modify: ${node.mtime}`,
        ],
        cwd,
        exitCode: 0,
      };
    }

    case "file": {
      const node = nodeAt(args[0] ?? ".");
      if (!node) return { output: [`${args[0]}: cannot open (No such file or directory)`], cwd, exitCode: 1 };
      if (node.type === "dir") return { output: [`${node.name}: directory`], cwd, exitCode: 0 };
      if (node.archiveItems || node.archiveEntries) {
        return { output: [`${node.name}: POSIX tar archive (GNU)`], cwd, exitCode: 0 };
      }
      const kind = node.content?.startsWith("#!") ? "Bourne-Again shell script, ASCII text executable" : "ASCII text";
      return { output: [`${node.name}: ${kind}`], cwd, exitCode: 0 };
    }

    case "echo":
      return { output: [args.join(" ")], cwd, exitCode: 0 };

    case "find": {
      const nameMatch = matchOptionValueFromTokens(tokens, "-name") ?? matchOptionValueFromTokens(tokens, "-iname");
      const typeFilter = matchOptionValueFromTokens(tokens, "-type");
      const sizeSpec = matchOptionValueFromTokens(tokens, "-size");
      const startArg =
        args.find((a) => a !== nameMatch && a !== typeFilter && a !== sizeSpec && !a.startsWith("+")) ?? ".";
      const start = resolvePath(cwd, startArg);
      const node = getNodeFrom(session.fs, start);
      if (!node) return { output: [`find: '${startArg}': No such file or directory`], cwd, exitCode: 1 };

      const results: string[] = [];
      walk(node, start, (n, path) => {
        if (typeFilter === "f" && n.type !== "file") return;
        if (typeFilter === "d" && n.type !== "dir") return;
        if (nameMatch && !globMatch(n.name, nameMatch)) return;
        if (sizeSpec && !sizeMatches(n.size, sizeSpec)) return;
        results.push(path);
      });
      return { output: results, cwd, exitCode: 0 };
    }

    case "grep": {
      const recursive = shortFlags.has("r") || shortFlags.has("R");
      const showLines = shortFlags.has("n");
      const insensitive = shortFlags.has("i");
      const countOnly = shortFlags.has("c");
      const pattern = args[0];
      if (!pattern) return { output: ["usage: grep [OPTION]... PATTERN [FILE]..."], cwd, exitCode: 2 };
      const targets = args.slice(1);
      if (!targets.length) {
        if (stdinLines !== undefined) {
          const out: string[] = [];
          stdinLines.forEach((line, idx) => {
            const hay = insensitive ? line.toLowerCase() : line;
            const needle = insensitive ? pattern.toLowerCase() : pattern;
            if (!hay.includes(needle)) return;
            out.push(`${showLines ? `${idx + 1}:` : ""}${line}`);
          });
          if (countOnly) return { output: [String(out.length)], cwd, exitCode: out.length > 0 ? 0 : 1 };
          return { output: out, cwd, exitCode: out.length > 0 ? 0 : 1 };
        }
        return { output: ["grep: no input files in this sandbox"], cwd, exitCode: 2 };
      }

      const out: string[] = [];
      let matchCount = 0;
      for (const t of targets) {
        const start = resolvePath(cwd, t);
        const node = getNodeFrom(session.fs, start);
        if (!node) {
          out.push(`grep: ${t}: No such file or directory`);
          continue;
        }
        if (node.type === "dir" && !recursive) {
          out.push(`grep: ${t}: Is a directory`);
          continue;
        }
        walk(node, start, (n, path) => {
          if (n.type !== "file" || !n.content) return;
          n.content.split("\n").forEach((line, idx) => {
            const hay = insensitive ? line.toLowerCase() : line;
            const needle = insensitive ? pattern.toLowerCase() : pattern;
            if (!hay.includes(needle)) return;
            matchCount += 1;
            const prefix = recursive || targets.length > 1 ? `${path}:` : "";
            out.push(`${prefix}${showLines ? `${idx + 1}:` : ""}${line}`);
          });
        });
      }
      return { output: countOnly ? [String(matchCount)] : out, cwd, exitCode: matchCount > 0 ? 0 : 1 };
    }

    case "mkdir": {
      const parents = shortFlags.has("p") || longFlags.has("parents");
      const verbose = shortFlags.has("v") || longFlags.has("verbose");
      if (args.length === 0) return { output: ["mkdir: missing operand"], cwd, exitCode: 1 };

      const out: string[] = [];
      const created: string[] = [];
      let exitCode = 0;

      for (const arg of args) {
        const absPath = resolvePath(cwd, arg);
        if (absPath === "/") {
          if (!parents) {
            out.push(`mkdir: cannot create directory '${arg}': File exists`);
            exitCode = 1;
          }
          continue;
        }

        if (parents) {
          const parts = absPath.split("/").filter(Boolean);
          let cursor = session.fs;
          let curPath = "";
          let failed = false;
          for (const part of parts) {
            curPath += `/${part}`;
            cursor.children = cursor.children ?? {};
            const existing = cursor.children[part];
            if (existing) {
              if (existing.type !== "dir") {
                out.push(`mkdir: cannot create directory '${arg}': Not a directory`);
                exitCode = 1;
                failed = true;
                break;
              }
              cursor = existing;
              continue;
            }
            if (!checkSpaceForWrite(session, curPath, 4096, 1)) {
              out.push(`mkdir: cannot create directory '${arg}': No space left on device`);
              exitCode = 1;
              failed = true;
              break;
            }
            const dirNode: FsNode = {
              name: part,
              type: "dir",
              mode: 0o755,
              owner: "user",
              group: "user",
              size: 4096,
              mtime: "Sep 21 14:30",
              children: {},
            };
            cursor.children[part] = dirNode;
            created.push(curPath);
            if (verbose) out.push(`mkdir: created directory '${curPath}'`);
            cursor = dirNode;
          }
          if (failed) continue;
        } else {
          const { parentPath, name: dirName } = splitParentAndName(absPath);
          const parent = getNodeFrom(session.fs, parentPath);
          if (!parent) {
            out.push(`mkdir: cannot create directory '${arg}': No such file or directory`);
            exitCode = 1;
            continue;
          }
          if (parent.type !== "dir") {
            out.push(`mkdir: cannot create directory '${arg}': Not a directory`);
            exitCode = 1;
            continue;
          }
          if (parent.children?.[dirName]) {
            out.push(`mkdir: cannot create directory '${arg}': File exists`);
            exitCode = 1;
            continue;
          }
          if (!checkSpaceForWrite(session, absPath, 4096, 1)) {
            out.push(`mkdir: cannot create directory '${arg}': No space left on device`);
            exitCode = 1;
            continue;
          }
          parent.children = parent.children ?? {};
          parent.children[dirName] = {
            name: dirName,
            type: "dir",
            mode: 0o755,
            owner: "user",
            group: "user",
            size: 4096,
            mtime: "Sep 21 14:30",
            children: {},
          };
          created.push(absPath);
          if (verbose) out.push(`mkdir: created directory '${arg}'`);
        }
      }

      return { output: out, cwd, exitCode, changed: { paths: [], created, services: [] } };
    }

    case "touch": {
      if (args.length === 0) return { output: ["touch: missing file operand"], cwd, exitCode: 1 };
      const out: string[] = [];
      const created: string[] = [];
      const changed: string[] = [];
      let exitCode = 0;

      for (const arg of args) {
        const absPath = resolvePath(cwd, arg);
        const existing = getNodeFrom(session.fs, absPath);
        if (existing) {
          existing.mtime = "Sep 21 14:32";
          changed.push(absPath);
          continue;
        }
        const { parentPath, name: fileName } = splitParentAndName(absPath);
        const parent = getNodeFrom(session.fs, parentPath);
        if (!parent || parent.type !== "dir") {
          out.push(`touch: cannot touch '${arg}': No such file or directory`);
          exitCode = 1;
          continue;
        }
        if (!checkSpaceForWrite(session, absPath, 0, 1)) {
          out.push(`touch: cannot touch '${arg}': No space left on device`);
          exitCode = 1;
          continue;
        }
        parent.children = parent.children ?? {};
        parent.children[fileName] = {
          name: fileName,
          type: "file",
          mode: 0o644,
          owner: "user",
          group: "user",
          size: 0,
          mtime: "Sep 21 14:32",
          content: "",
        };
        created.push(absPath);
      }

      return { output: out, cwd, exitCode, changed: { paths: changed, created, services: [] } };
    }

    case "rm": {
      const recursive = shortFlags.has("r") || shortFlags.has("R") || longFlags.has("recursive");
      const force = shortFlags.has("f") || longFlags.has("force");
      const emptyDirOk = shortFlags.has("d") || longFlags.has("dir");
      const verbose = shortFlags.has("v") || longFlags.has("verbose");

      if (args.length === 0) {
        if (force) return { output: [], cwd, exitCode: 0 };
        return { output: ["rm: missing operand"], cwd, exitCode: 1 };
      }

      const out: string[] = [];
      const removed: string[] = [];
      let exitCode = 0;

      for (const arg of args) {
        const absPath = resolvePath(cwd, arg);
        if (absPath === "/") {
          out.push("rm: it is dangerous to operate recursively on '/'");
          exitCode = 1;
          continue;
        }
        const { parentPath, name: entryName } = splitParentAndName(absPath);
        const parent = getNodeFrom(session.fs, parentPath);
        const target = parent?.children?.[entryName];
        if (!target || !parent?.children) {
          if (!force) {
            out.push(`rm: cannot remove '${arg}': No such file or directory`);
            exitCode = 1;
          }
          continue;
        }
        if (target.type === "dir") {
          const childCount = Object.keys(target.children ?? {}).length;
          if (!recursive && !(emptyDirOk && childCount === 0)) {
            out.push(`rm: cannot remove '${arg}': Is a directory`);
            exitCode = 1;
            continue;
          }
        }
        delete parent.children[entryName];
        removed.push(absPath);
        if (verbose) out.push(`removed '${arg}'`);
      }

      return { output: out, cwd, exitCode, changed: { paths: removed, created: [], services: [] } };
    }

    case "cp": {
      const recursive =
        shortFlags.has("r") || shortFlags.has("R") || shortFlags.has("a") || longFlags.has("recursive") || longFlags.has("archive");
      const verbose = shortFlags.has("v") || longFlags.has("verbose");

      if (args.length < 2) {
        return { output: ["cp: missing destination file operand"], cwd, exitCode: 1 };
      }

      const destArg = args[args.length - 1];
      const srcArgs = args.slice(0, -1);
      const destAbs = resolvePath(cwd, destArg);
      const destExisting = getNodeFrom(session.fs, destAbs);
      const out: string[] = [];
      const created: string[] = [];
      const changed: string[] = [];
      let exitCode = 0;

      if (srcArgs.length > 1 && (!destExisting || destExisting.type !== "dir")) {
        return { output: [`cp: target '${destArg}' is not a directory`], cwd, exitCode: 1 };
      }

      for (const srcArg of srcArgs) {
        const srcAbs = resolvePath(cwd, srcArg);
        const srcNode = getNodeFrom(session.fs, srcAbs);
        if (!srcNode) {
          out.push(`cp: cannot stat '${srcArg}': No such file or directory`);
          exitCode = 1;
          continue;
        }
        if (srcNode.type === "dir" && !recursive) {
          out.push(`cp: -r not specified; omitting directory '${srcArg}'`);
          exitCode = 1;
          continue;
        }

        let targetAbs: string;
        let destParent: FsNode | null;
        let targetName: string;

        if (destExisting && destExisting.type === "dir") {
          destParent = destExisting;
          targetName = srcNode.name;
          targetAbs = destAbs === "/" ? `/${targetName}` : `${destAbs}/${targetName}`;
        } else {
          const split = splitParentAndName(destAbs);
          destParent = getNodeFrom(session.fs, split.parentPath);
          targetName = split.name;
          targetAbs = destAbs;
        }

        if (!destParent || destParent.type !== "dir") {
          out.push(`cp: cannot create regular file '${destArg}': No such file or directory`);
          exitCode = 1;
          continue;
        }
        if (srcAbs === targetAbs) {
          out.push(`cp: '${srcArg}' and '${destArg}' are the same file`);
          exitCode = 1;
          continue;
        }
        if (srcNode.type === "dir" && targetAbs.startsWith(`${srcAbs}/`)) {
          out.push(`cp: cannot copy a directory, '${srcArg}', into itself, '${targetAbs}'`);
          exitCode = 1;
          continue;
        }

        const neededBytes = subtreeSize(srcNode);
        const neededInodes = destParent.children?.[targetName] ? Math.max(0, countSubtreeNodes(srcNode) - 1) : countSubtreeNodes(srcNode);
        if (!checkSpaceForWrite(session, targetAbs, neededBytes, neededInodes)) {
          out.push(`cp: cannot create '${targetAbs}': No space left on device`);
          exitCode = 1;
          continue;
        }

        const copyNode = structuredClone(srcNode);
        copyNode.name = targetName;
        destParent.children = destParent.children ?? {};
        const existed = Boolean(destParent.children[targetName]);
        destParent.children[targetName] = copyNode;
        if (existed) changed.push(targetAbs);
        else created.push(targetAbs);
        if (verbose) out.push(`'${srcArg}' -> '${targetAbs}'`);
      }

      return { output: out, cwd, exitCode, changed: { paths: changed, created, services: [] } };
    }

    case "mv": {
      const noClobber = shortFlags.has("n") || longFlags.has("no-clobber");
      const verbose = shortFlags.has("v") || longFlags.has("verbose");

      if (args.length < 2) {
        return { output: ["mv: missing destination file operand"], cwd, exitCode: 1 };
      }

      const destArg = args[args.length - 1];
      const srcArgs = args.slice(0, -1);
      const destAbs = resolvePath(cwd, destArg);
      const destExisting = getNodeFrom(session.fs, destAbs);
      const out: string[] = [];
      const changed: string[] = [];
      const created: string[] = [];
      let exitCode = 0;

      if (srcArgs.length > 1 && (!destExisting || destExisting.type !== "dir")) {
        return { output: [`mv: target '${destArg}' is not a directory`], cwd, exitCode: 1 };
      }

      for (const srcArg of srcArgs) {
        const srcAbs = resolvePath(cwd, srcArg);
        if (srcAbs === "/") {
          out.push("mv: cannot move '/'");
          exitCode = 1;
          continue;
        }
        const { parentPath: srcParentPath, name: srcName } = splitParentAndName(srcAbs);
        const srcParent = getNodeFrom(session.fs, srcParentPath);
        const srcNode = srcParent?.children?.[srcName];
        if (!srcNode || !srcParent?.children) {
          out.push(`mv: cannot stat '${srcArg}': No such file or directory`);
          exitCode = 1;
          continue;
        }

        let targetAbs: string;
        let destParent: FsNode | null;
        let targetName: string;

        if (destExisting && destExisting.type === "dir") {
          destParent = destExisting;
          targetName = srcNode.name;
          targetAbs = destAbs === "/" ? `/${targetName}` : `${destAbs}/${targetName}`;
        } else {
          const split = splitParentAndName(destAbs);
          destParent = getNodeFrom(session.fs, split.parentPath);
          targetName = split.name;
          targetAbs = destAbs;
        }

        if (!destParent || destParent.type !== "dir") {
          out.push(`mv: cannot move '${srcArg}' to '${destArg}': No such file or directory`);
          exitCode = 1;
          continue;
        }
        if (srcAbs === targetAbs) continue;
        if (srcNode.type === "dir" && targetAbs.startsWith(`${srcAbs}/`)) {
          out.push(`mv: cannot move '${srcArg}' to a subdirectory of itself, '${targetAbs}'`);
          exitCode = 1;
          continue;
        }

        destParent.children = destParent.children ?? {};
        if (noClobber && destParent.children[targetName]) {
          continue;
        }

        const existedAtDest = Boolean(destParent.children[targetName]);
        delete srcParent.children[srcName];
        srcNode.name = targetName;
        destParent.children[targetName] = srcNode;
        changed.push(srcAbs);
        if (existedAtDest) changed.push(targetAbs);
        else created.push(targetAbs);
        if (verbose) out.push(`renamed '${srcArg}' -> '${targetAbs}'`);
      }

      return { output: out, cwd, exitCode, changed: { paths: changed, created, services: [] } };
    }

    case "chmod": {
      const recursive = shortFlags.has("R") || longFlags.has("recursive");
      const modeIndex = tokens.findIndex((t, i) => i > 0 && (applyModeSpec(t, 0o644) !== null || /^[ugoa]*[=+-][rwxXst]+$/.test(t)));
      if (modeIndex === -1 || modeIndex >= tokens.length - 1) {
        return { output: ["chmod: missing operand"], cwd, exitCode: 1 };
      }
      const modeSpec = tokens[modeIndex];
      const targets = tokens.slice(modeIndex + 1).filter((t) => !t.startsWith("-"));
      if (targets.length === 0) return { output: ["chmod: missing operand"], cwd, exitCode: 1 };

      const out: string[] = [];
      const changed: string[] = [];
      let exitCode = 0;
      for (const target of targets) {
        const targetPath = resolvePath(cwd, target);
        const node = getNodeFrom(session.fs, targetPath);
        if (!node) {
          out.push(`chmod: cannot access '${target}': No such file or directory`);
          exitCode = 1;
          continue;
        }
        const newMode = applyModeSpec(modeSpec, node.mode);
        if (newMode === null) {
          out.push(`chmod: invalid mode: '${modeSpec}'`);
          exitCode = 1;
          continue;
        }
        const apply = (n: FsNode, p: string): void => {
          const computed = applyModeSpec(modeSpec, n.mode) ?? newMode;
          if (n.mode !== computed) {
            n.mode = computed;
            changed.push(p);
          }
          if (recursive && n.type === "dir") {
            for (const child of Object.values(n.children ?? {})) {
              apply(child, p === "/" ? `/${child.name}` : `${p}/${child.name}`);
            }
          }
        };
        apply(node, targetPath);
        out.push(`mode of '${target}' changed to ${node.mode.toString(8)} (${modeToSymbolic(node.mode, node.type === "dir").slice(1)})`);
      }
      return { output: out, cwd, exitCode, changed: { paths: changed, created: [], services: [] } };
    }

    case "chown": {
      const recursive = shortFlags.has("R") || longFlags.has("recursive");
      const operands = args.filter((a) => !a.startsWith("-"));
      if (operands.length < 2) return { output: ["chown: missing operand"], cwd, exitCode: 1 };
      const [spec, ...targets] = operands;
      const parsedOwner = parseOwnerSpec(spec);
      if (!parsedOwner) {
        return { output: [`chown: invalid spec: '${spec}'`], cwd, exitCode: 1 };
      }
      const out: string[] = [];
      const changed: string[] = [];
      let exitCode = 0;
      for (const target of targets) {
        const targetPath = resolvePath(cwd, target);
        const node = getNodeFrom(session.fs, targetPath);
        if (!node) {
          out.push(`chown: cannot access '${target}': No such file or directory`);
          exitCode = 1;
          continue;
        }
        const apply = (n: FsNode, p: string): void => {
          if (parsedOwner.owner !== undefined && n.owner !== parsedOwner.owner) {
            n.owner = parsedOwner.owner;
            changed.push(p);
          }
          if (parsedOwner.group !== undefined && n.group !== parsedOwner.group) {
            n.group = parsedOwner.group;
            if (!changed.includes(p)) changed.push(p);
          }
          if (recursive && n.type === "dir") {
            for (const child of Object.values(n.children ?? {})) {
              apply(child, p === "/" ? `/${child.name}` : `${p}/${child.name}`);
            }
          }
        };
        apply(node, targetPath);
        out.push(`ownership of '${target}' changed to ${spec}`);
      }
      return { output: out, cwd, exitCode, changed: { paths: changed, created: [], services: [] } };
    }

    case "chgrp": {
      const recursive = shortFlags.has("R") || longFlags.has("recursive");
      const operands = args.filter((a) => !a.startsWith("-"));
      if (operands.length < 2) return { output: ["chgrp: missing operand"], cwd, exitCode: 1 };
      const [groupName, ...targets] = operands;
      const out: string[] = [];
      const changed: string[] = [];
      let exitCode = 0;

      for (const target of targets) {
        const targetPath = resolvePath(cwd, target);
        const node = getNodeFrom(session.fs, targetPath);
        if (!node) {
          out.push(`chgrp: cannot access '${target}': No such file or directory`);
          exitCode = 1;
          continue;
        }
        const apply = (n: FsNode, p: string): void => {
          if (n.group !== groupName) {
            n.group = groupName;
            changed.push(p);
          }
          if (recursive && n.type === "dir") {
            for (const child of Object.values(n.children ?? {})) {
              apply(child, p === "/" ? `/${child.name}` : `${p}/${child.name}`);
            }
          }
        };
        apply(node, targetPath);
        out.push(`group of '${target}' changed to ${groupName}`);
      }
      return { output: out, cwd, exitCode, changed: { paths: changed, created: [], services: [] } };
    }

    case "tar": {
      return runTarCommand(session, tokens, cwd);
    }

    case "crontab": {
      const userOpt = matchOptionValueFromTokens(tokens, "-u") ?? "user";
      if (shortFlags.has("l")) {
        const cronFile = getNodeFrom(session.fs, `/var/spool/cron/crontabs/${userOpt}`);
        if (cronFile && cronFile.type === "file") {
          const lines = (cronFile.content ?? "").split("\n").filter((l, i, a) => i < a.length - 1 || l !== "");
          return { output: lines, cwd, exitCode: 0 };
        }
        const memLines = session.crontabs[userOpt];
        if (memLines && memLines.length > 0) {
          return { output: memLines, cwd, exitCode: 0 };
        }
        return { output: [`no crontab for ${userOpt}`], cwd, exitCode: 1 };
      }
      return { output: ["usage: crontab [-u user] -l"], cwd, exitCode: 1 };
    }

    case "ps": {
      const sortFlag = longFlags.get("sort") ?? matchOptionValueFromTokens(tokens, "--sort") ?? "";
      const procs = [...session.processes];
      if (sortFlag === "-%cpu" || sortFlag === "-cpu" || sortFlag === "-pcpu") {
        procs.sort((a, b) => b.cpu - a.cpu || a.pid - b.pid);
      } else if (sortFlag === "%cpu" || sortFlag === "cpu" || sortFlag === "pcpu") {
        procs.sort((a, b) => a.cpu - b.cpu || a.pid - b.pid);
      } else if (sortFlag === "-%mem" || sortFlag === "-pmem") {
        procs.sort((a, b) => b.mem - a.mem || a.pid - b.pid);
      } else {
        procs.sort((a, b) => a.pid - b.pid);
      }

      const header = "USER         PID %CPU %MEM STAT START   TIME COMMAND";
      const rows = procs.map(
        (p) =>
          `${p.user.padEnd(10)} ${String(p.pid).padStart(5)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${p.stat.padEnd(4)} ${p.start.padEnd(7)} ${p.time.padStart(4)} ${p.command}`,
      );
      return { output: [header, ...rows], cwd, exitCode: 0 };
    }

    case "uptime": {
      const totalCpu = session.processes.reduce((sum, p) => sum + p.cpu, 0);
      const load1 = (totalCpu / 24 + 0.06).toFixed(2);
      const load5 = (totalCpu / 26 + 0.18).toFixed(2);
      const load15 = (totalCpu / 30 + 0.28).toFixed(2);
      return {
        output: [` 14:32:10 up 3 days,  5:20,  1 user,  load average: ${load1}, ${load5}, ${load15}`],
        cwd,
        exitCode: 0,
      };
    }

    case "top": {
      const totalCpu = session.processes.reduce((sum, p) => sum + p.cpu, 0);
      const load1 = (totalCpu / 24 + 0.06).toFixed(2);
      const procs = [...session.processes].sort((a, b) => b.cpu - a.cpu || a.pid - b.pid);
      const lines = [
        `top - 14:32:10 up 3 days, 5:20, 1 user, load average: ${load1}`,
        `Tasks: ${procs.length} total, ${procs.filter((p) => p.stat.startsWith("R")).length} running`,
        "  PID USER      %CPU %MEM TIME+   COMMAND",
        ...procs.map(
          (p) =>
            `${String(p.pid).padStart(5)} ${p.user.padEnd(9)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${p.time.padEnd(7)} ${p.procName}`,
        ),
      ];
      return { output: lines, cwd, exitCode: 0 };
    }

    case "kill": {
      return runKillCommand(session, tokens, cwd);
    }

    case "systemctl":
    case "service": {
      return runServiceCommand(session, name, parsed, cwd);
    }

    case "ss": {
      const header = "State    Recv-Q  Send-Q  Local Address:Port   Peer Address:Port  Process";
      const listening = session.processes
        .filter((p) => p.listenPort !== undefined && p.listenPort > 0)
        .sort((a, b) => (a.listenPort ?? 0) - (b.listenPort ?? 0) || a.pid - b.pid);

      const rows = listening.map((p) => {
        const addrPort = `${p.listenAddr ?? "0.0.0.0"}:${p.listenPort}`;
        const backlog = p.procName === "nginx" || p.procName === "httpd" ? "511" : p.procName === "postgres" ? "244" : "128";
        return `LISTEN   0       ${backlog.padEnd(7)} ${addrPort.padEnd(20)} 0.0.0.0:*          users:(("${p.procName}",pid=${p.pid},fd=${p.listenFd ?? 3}))`;
      });
      return { output: [header, ...rows], cwd, exitCode: 0 };
    }

    case "curl": {
      const headOnly = shortFlags.has("I") || longFlags.has("head");
      const target = args.find((a) => !a.startsWith("-")) ?? "";
      const stripped = target.replace(/^https?:\/\//, "").split("/")[0];
      const [host, portSpec] = stripped.split(":");
      const port = portSpec ? Number(portSpec) : 80;

      if (host === "localhost" || host === "127.0.0.1") {
        const listener = session.processes.find((p) => p.listenPort === port);
        if (!listener) {
          return {
            output: [`curl: (7) Failed to connect to ${host} port ${port}: Connection refused`],
            cwd,
            exitCode: 7,
          };
        }
        const isWebServer =
          (listener.serviceUnit === "nginx" && session.services.nginx?.running) ||
          (listener.serviceUnit === "httpd" && session.services.httpd?.running);

        if (!isWebServer) {
          return {
            output: [`curl: (56) Recv failure: port ${port} held by ${listener.procName} (PID ${listener.pid}), not a web server`],
            cwd,
            exitCode: 56,
          };
        }

        const serverHeader = listener.serviceUnit === "httpd" ? "Apache/2.4.58" : "nginx";
        if (headOnly) {
          return {
            output: ["HTTP/1.1 200 OK", `Server: ${serverHeader}`, "Content-Type: text/html"],
            cwd,
            exitCode: 0,
          };
        }
        const docNode =
          listener.serviceUnit === "httpd"
            ? (getNodeFrom(session.fs, "/var/www/html/index.html") ?? getNodeFrom(session.fs, "/var/www/index.html"))
            : getNodeFrom(session.fs, "/var/www/index.html");
        return {
          output: (docNode?.content ?? "<h1>it works</h1>").split("\n").filter(Boolean),
          cwd,
          exitCode: 0,
        };
      }
      if (!host) return { output: ["curl: no URL specified!"], cwd, exitCode: 2 };
      return { output: [`curl: (6) Could not resolve host: ${host}`], cwd, exitCode: 6 };
    }

    case "reboot": {
      return { output: rebootSession(session), cwd, exitCode: 0 };
    }

    case "df": {
      const human = shortFlags.has("h") || longFlags.has("human-readable");
      const inodes = shortFlags.has("i") || longFlags.has("inodes");
      const targetPath = args[0] ? resolvePath(cwd, args[0]) : null;
      const mountsToShow = targetPath ? [findMountForPath(session, targetPath)] : session.mounts;

      if (inodes) {
        const rows = mountsToShow.map((m) => {
          const u = getMountUsage(session, m.mountPoint);
          return `${u.device.padEnd(14)} ${String(u.totalInodes).padStart(7)} ${String(u.usedInodes).padStart(7)} ${String(u.freeInodes).padStart(7)} ${`${u.inodePct}%`.padStart(4)} ${u.mountPoint}`;
        });
        return {
          output: ["Filesystem      Inodes   IUsed   IFree IUse% Mounted on", ...rows],
          cwd,
          exitCode: 0,
        };
      }

      const rows = mountsToShow.map((m) => {
        const u = getMountUsage(session, m.mountPoint);
        const sizeStr = human ? humanSize(u.totalBytes) : String(Math.floor(u.totalBytes / 1024));
        const usedStr = human ? humanSize(u.usedBytes) : String(Math.floor(u.usedBytes / 1024));
        const availStr = human ? humanSize(u.availBytes) : String(Math.floor(u.availBytes / 1024));
        const colWidth = human ? 5 : 10;
        return `${u.device.padEnd(14)} ${sizeStr.padStart(colWidth)} ${usedStr.padStart(colWidth)} ${availStr.padStart(colWidth)} ${`${u.usePct}%`.padStart(4)} ${u.mountPoint}`;
      });
      const hdr = human
        ? "Filesystem      Size  Used Avail Use% Mounted on"
        : "Filesystem     1K-blocks       Used  Available Use% Mounted on";
      return { output: [hdr, ...rows], cwd, exitCode: 0 };
    }

    case "du": {
      const targets = args.length > 0 ? args : ["."];
      const out: string[] = [];
      let exitCode = 0;
      for (const rawTarget of targets) {
        const target = resolvePath(cwd, rawTarget);
        const node = getNodeFrom(session.fs, target);
        if (!node) {
          out.push(`du: cannot access '${rawTarget}': No such file or directory`);
          exitCode = 1;
          continue;
        }
        const total = subtreeSize(node);
        out.push(`${shortFlags.has("h") ? humanSize(total) : String(Math.ceil(total / 1024))}\t${target}`);
      }
      return { output: out, cwd, exitCode };
    }

    default:
      return { output: [`${name}: command not found`], cwd, unknown: true, exitCode: 127 };
  }
}

// ---------------------------------------------------------------------------
// Dedicated `tar` parser & stateful create/list/extract implementation
// ---------------------------------------------------------------------------

interface ParsedTar {
  mode: "c" | "x" | "t" | null;
  verbose: boolean;
  archiveArg: string | null;
  changeDir: string | null;
  sources: string[];
}

function parseTarTokens(tokens: string[]): ParsedTar {
  let mode: "c" | "x" | "t" | null = null;
  let verbose = false;
  let archiveArg: string | null = null;
  let changeDir: string | null = null;
  const positional: string[] = [];

  for (let i = 1; i < tokens.length; i += 1) {
    const tok = tokens[i];

    // BSD-style bundled tar options on the first argument (e.g. `tar xvf foo.tar`)
    if (i === 1 && !tok.startsWith("-") && /^[cxtzvfjp]+$/.test(tok) && /[cxt]/.test(tok)) {
      if (tok.includes("c")) mode = "c";
      else if (tok.includes("x")) mode = "x";
      else if (tok.includes("t")) mode = "t";
      if (tok.includes("v")) verbose = true;
      if (tok.includes("f") && i + 1 < tokens.length) {
        archiveArg = tokens[++i];
      }
      continue;
    }

    if (tok === "-C" || tok === "--directory") {
      if (i + 1 < tokens.length) changeDir = tokens[++i];
      continue;
    }
    if (tok.startsWith("-C") && tok.length > 2) {
      changeDir = tok.slice(2);
      continue;
    }
    if (tok.startsWith("--directory=")) {
      changeDir = tok.slice("--directory=".length);
      continue;
    }
    if (tok === "--extract" || tok === "--get") {
      mode = "x";
      continue;
    }
    if (tok === "--create") {
      mode = "c";
      continue;
    }
    if (tok === "--list") {
      mode = "t";
      continue;
    }
    if (tok === "--verbose") {
      verbose = true;
      continue;
    }
    if (tok.startsWith("--file=")) {
      archiveArg = tok.slice("--file=".length);
      continue;
    }
    if (tok.startsWith("--")) continue;

    if (tok.startsWith("-") && tok.length > 1) {
      const chars = tok.slice(1);
      for (let cIdx = 0; cIdx < chars.length; cIdx += 1) {
        const ch = chars[cIdx];
        if (ch === "c") mode = "c";
        else if (ch === "x") mode = "x";
        else if (ch === "t") mode = "t";
        else if (ch === "v") verbose = true;
        else if (ch === "C") {
          const rest = chars.slice(cIdx + 1);
          if (rest) changeDir = rest;
          else if (i + 1 < tokens.length) changeDir = tokens[++i];
          break;
        } else if (ch === "f") {
          const rest = chars.slice(cIdx + 1);
          if (rest) archiveArg = rest;
          else if (i + 1 < tokens.length) archiveArg = tokens[++i];
          break;
        }
      }
      continue;
    }

    positional.push(tok);
  }

  if (!archiveArg) {
    const fallback = positional.find((p) => p.includes(".tar") || p.endsWith(".tgz"));
    if (fallback) {
      archiveArg = fallback;
      positional.splice(positional.indexOf(fallback), 1);
    }
  }

  return { mode, verbose, archiveArg, changeDir, sources: positional };
}

function runTarCommand(session: ShellSession, tokens: string[], cwd: string): CommandResult {
  const tar = parseTarTokens(tokens);

  if (tar.mode === "c") {
    const sourceArg = tar.sources[0];
    if (!tar.archiveArg || !sourceArg) {
      return { output: ["tar: You must specify an archive name and a source"], cwd, exitCode: 2 };
    }
    const archivePath = resolvePath(cwd, tar.archiveArg);
    const baseDir = tar.changeDir ? resolvePath(cwd, tar.changeDir) : cwd;
    const sourcePath = resolvePath(baseDir, sourceArg);
    const sourceNode = getNodeFrom(session.fs, sourcePath);
    if (!sourceNode) {
      return { output: [`tar: ${sourceArg}: Cannot stat: No such file or directory`], cwd, exitCode: 2 };
    }
    const { parentPath, name } = splitParentAndName(archivePath);
    const parent = getNodeFrom(session.fs, parentPath);
    if (!parent || parent.type !== "dir") {
      return { output: [`tar: ${tar.archiveArg}: Cannot create: No such directory`], cwd, exitCode: 2 };
    }

    const totalSize = Math.max(1024, subtreeSize(sourceNode));
    const neededInodes = parent.children?.[name] ? 0 : 1;
    if (!checkSpaceForWrite(session, archivePath, totalSize, neededInodes)) {
      return { output: [`tar: ${tar.archiveArg}: Cannot write: No space left on device`], cwd, exitCode: 2 };
    }

    const entries: string[] = [];
    const items: ArchivedItem[] = [];
    walk(sourceNode, sourcePath, (n, p) => {
      entries.push(p);
      const rel = tar.changeDir
        ? p.slice(baseDir === "/" ? 1 : baseDir.length + 1)
        : p.replace(/^\/+/, "");
      if (!rel) return;
      items.push({
        path: rel,
        type: n.type,
        mode: n.mode,
        owner: n.owner,
        group: n.group,
        size: n.size,
        mtime: n.mtime,
        ...(n.type === "file" ? { content: n.content ?? "" } : {}),
      });
    });

    parent.children = parent.children ?? {};
    parent.children[name] = {
      name,
      type: "file",
      mode: 0o644,
      owner: "user",
      group: "user",
      size: totalSize,
      mtime: "Sep 21 14:30",
      archiveEntries: entries,
      archiveItems: items,
    };
    return {
      output: tar.verbose ? entries : [`tar: creating ${tar.archiveArg} from ${sourceArg}`],
      cwd,
      exitCode: 0,
      changed: { paths: [], created: [archivePath], services: [] },
    };
  }

  if (tar.mode === "t") {
    if (tar.archiveArg) {
      const node = getNodeFrom(session.fs, resolvePath(cwd, tar.archiveArg));
      if (!node) return { output: [`tar: ${tar.archiveArg}: Cannot open: No such file or directory`], cwd, exitCode: 2 };
      if (node.archiveEntries) return { output: node.archiveEntries, cwd, exitCode: 0 };
      if (node.archiveItems) {
        return {
          output: node.archiveItems.map((it) => (it.type === "dir" && !it.path.endsWith("/") ? `${it.path}/` : it.path)),
          cwd,
          exitCode: 0,
        };
      }
      return { output: [`tar: ${tar.archiveArg}: This does not look like a tar archive`], cwd, exitCode: 2 };
    }
    return { output: ["etc/", "etc/passwd", "etc/fstab", "etc/hosts"], cwd, exitCode: 0 };
  }

  if (tar.mode === "x") {
    if (!tar.archiveArg) {
      return { output: ["tar: You must specify an archive to extract"], cwd, exitCode: 2 };
    }
    const archivePath = resolvePath(cwd, tar.archiveArg);
    const archiveNode = getNodeFrom(session.fs, archivePath);
    if (!archiveNode) {
      return { output: [`tar: ${tar.archiveArg}: Cannot open: No such file or directory`], cwd, exitCode: 2 };
    }
    if (!archiveNode.archiveItems && !archiveNode.archiveEntries) {
      return { output: [`tar: ${tar.archiveArg}: This does not look like a tar archive`], cwd, exitCode: 2 };
    }

    const targetDir = tar.changeDir ? resolvePath(cwd, tar.changeDir) : cwd;
    const targetNode = getNodeFrom(session.fs, targetDir);
    if (!targetNode) {
      return { output: [`tar: ${tar.changeDir ?? targetDir}: Cannot open: No such file or directory`], cwd, exitCode: 2 };
    }
    if (targetNode.type !== "dir") {
      return { output: [`tar: ${tar.changeDir ?? targetDir}: Not a directory`], cwd, exitCode: 2 };
    }

    const items: ArchivedItem[] =
      archiveNode.archiveItems ??
      (archiveNode.archiveEntries ?? []).map((entry) => {
        const isDir = entry.endsWith("/");
        const rel = entry.replace(/^\/+/, "").replace(/\/+$/, "");
        return {
          path: rel,
          type: isDir ? ("dir" as const) : ("file" as const),
          mode: isDir ? 0o755 : 0o644,
          owner: "user",
          group: "user",
          size: isDir ? 4096 : 0,
          mtime: "Sep 21 14:30",
          ...(isDir ? {} : { content: "" }),
        };
      });

    const totalExtractBytes = items.reduce((s, it) => s + (it.type === "file" ? it.size : 0), 0);
    const newInodesNeeded = items.filter((it) => {
      const rel = it.path.replace(/^\/+/, "").replace(/\/+$/, "");
      if (!rel) return false;
      return !getNodeFrom(session.fs, resolvePath(targetDir, rel));
    }).length;

    if (!checkSpaceForWrite(session, targetDir, totalExtractBytes, newInodesNeeded)) {
      return { output: [`tar: ${tar.archiveArg}: Cannot write: No space left on device`], cwd, exitCode: 2 };
    }

    const created: string[] = [];
    const changed: string[] = [];
    const verboseOut: string[] = [];

    for (const item of items) {
      // GNU tar rule: strip leading '/' on extraction so archives unpack cleanly inside `targetDir`.
      const rel = item.path.replace(/^\/+/, "").replace(/\/+$/, "");
      if (!rel) continue;

      const destAbs = resolvePath(targetDir, rel);
      const { parentPath, name } = splitParentAndName(destAbs);

      // Ensure intermediate parent directories inside `targetDir` exist.
      const parentDir = ensureExtractedParents(session.fs, parentPath, created);
      parentDir.children = parentDir.children ?? {};
      const existing = parentDir.children[name];

      if (item.type === "dir") {
        if (!existing || existing.type !== "dir") {
          parentDir.children[name] = {
            name,
            type: "dir",
            mode: item.mode,
            owner: item.owner,
            group: item.group,
            size: item.size || 4096,
            mtime: item.mtime,
            children: existing?.type === "dir" ? existing.children : {},
          };
          if (existing) changed.push(destAbs);
          else created.push(destAbs);
        } else {
          existing.mode = item.mode;
          existing.owner = item.owner;
          existing.group = item.group;
          existing.mtime = item.mtime;
          changed.push(destAbs);
        }
        if (tar.verbose) verboseOut.push(`${rel}/`);
      } else {
        parentDir.children[name] = {
          name,
          type: "file",
          mode: item.mode,
          owner: item.owner,
          group: item.group,
          size: item.size,
          mtime: item.mtime,
          content: item.content ?? "",
        };
        if (existing) changed.push(destAbs);
        else created.push(destAbs);
        if (tar.verbose) verboseOut.push(rel);
      }
    }

    return {
      output: tar.verbose ? verboseOut : [],
      cwd,
      exitCode: 0,
      changed: { paths: changed, created, services: [] },
    };
  }

  return { output: ["tar: You must specify one of the '-Acdtrux' options"], cwd, exitCode: 2 };
}

function ensureExtractedParents(root: FsNode, absDirPath: string, created: string[]): FsNode {
  const parts = absDirPath.split("/").filter(Boolean);
  let cursor = root;
  let curPath = "";
  for (const part of parts) {
    curPath += `/${part}`;
    cursor.children = cursor.children ?? {};
    let next = cursor.children[part];
    if (!next || next.type !== "dir") {
      next = {
        name: part,
        type: "dir",
        mode: 0o755,
        owner: "root",
        group: "root",
        size: 4096,
        mtime: "Sep 21 14:30",
        children: {},
      };
      cursor.children[part] = next;
      created.push(curPath);
    }
    cursor = next;
  }
  return cursor;
}

// ---------------------------------------------------------------------------
// `kill` & `systemctl` / `service` against the process table + services
// ---------------------------------------------------------------------------

function runKillCommand(session: ShellSession, tokens: string[], cwd: string): CommandResult {
  let signal: "SIGTERM" | "SIGKILL" = "SIGTERM";
  const pidTokens: string[] = [];

  for (let i = 1; i < tokens.length; i += 1) {
    const tok = tokens[i];
    if (tok === "-l") {
      return { output: ["1) SIGHUP   2) SIGINT   9) SIGKILL  15) SIGTERM"], cwd, exitCode: 0 };
    }
    if (tok === "-s" || tok === "-n") {
      const spec = (tokens[++i] ?? "").toUpperCase();
      if (spec === "9" || spec === "KILL" || spec === "SIGKILL") signal = "SIGKILL";
      else signal = "SIGTERM";
      continue;
    }
    if (tok.startsWith("-") && !/^\d+$/.test(tok)) {
      const spec = tok.slice(1).toUpperCase();
      if (spec === "9" || spec === "KILL" || spec === "SIGKILL") {
        signal = "SIGKILL";
        continue;
      }
      if (spec === "15" || spec === "TERM" || spec === "SIGTERM") {
        signal = "SIGTERM";
        continue;
      }
      return { output: [`kill: ${spec}: invalid signal specification`], cwd, exitCode: 1 };
    }
    pidTokens.push(tok);
  }

  if (pidTokens.length === 0) {
    return { output: ["kill: usage: kill [-s sigspec | -n signum | -sigspec] pid ..."], cwd, exitCode: 2 };
  }

  const out: string[] = [];
  const changedPaths: string[] = [];
  const changedServices: string[] = [];
  let exitCode = 0;

  for (const pidStr of pidTokens) {
    if (!/^\d+$/.test(pidStr)) {
      out.push(`kill: ${pidStr}: arguments must be process or job IDs`);
      exitCode = 1;
      continue;
    }
    const pid = Number(pidStr);
    if (pid === 1) {
      out.push("kill: (1) - Operation not permitted");
      exitCode = 1;
      continue;
    }
    const idx = session.processes.findIndex((p) => p.pid === pid);
    if (idx === -1) {
      out.push(`kill: (${pid}) - No such process`);
      exitCode = 1;
      continue;
    }
    const proc = session.processes[idx];
    if (proc.ignoresSigterm && signal !== "SIGKILL") {
      // Polite SIGTERM sent cleanly; stuck process ignores it and stays in the table.
      continue;
    }
    session.processes.splice(idx, 1);
    changedPaths.push(`/proc/${pid}`);
    if (proc.serviceUnit && session.services[proc.serviceUnit]) {
      session.services[proc.serviceUnit].running = false;
      changedServices.push(proc.serviceUnit);
    }
  }

  return {
    output: out,
    cwd,
    exitCode,
    changed: { paths: changedPaths, created: [], services: changedServices },
  };
}

function resolveServiceUnit(session: ShellSession, rawUnit: string): string {
  const clean = rawUnit.replace(/\.service$/, "");
  if (clean === "crond" && !session.services.crond && session.services.cron) return "cron";
  return clean;
}

function findPortConflict(session: ShellSession, unit: string, port: number): ProcessEntry | undefined {
  if (port <= 0) return undefined;
  return session.processes.find((p) => p.listenPort === port && p.serviceUnit !== unit);
}

/** systemctl / service verbs against the session's service state and process table. */
function runServiceCommand(
  session: ShellSession,
  name: string,
  parsed: ParsedCommand,
  cwd: string,
): CommandResult {
  const { longFlags, args } = parsed;
  const operands = args.filter((a) => !a.startsWith("-"));
  const isServiceCmd = name === "service";
  const verb = isServiceCmd ? operands[1] : operands[0];
  const unitRaw = isServiceCmd ? operands[0] : operands[1];
  if (!verb || !unitRaw) {
    return {
      output: [isServiceCmd ? "Usage: service <unit> {start|stop|restart|status}" : "Usage: systemctl <verb> <unit>"],
      cwd,
      exitCode: 1,
    };
  }
  const unit = resolveServiceUnit(session, unitRaw);
  const service = session.services[unit];
  if (!service) {
    return {
      output: [`Failed to ${verb} ${unit}.service: Unit ${unit}.service could not be found.`],
      cwd,
      exitCode: 5,
    };
  }

  const changedServices: string[] = [];

  const startUnitNow = (): string[] | null => {
    const conflict = findPortConflict(session, unit, service.port);
    if (conflict) {
      service.running = false;
      syncServiceProcesses(session);
      return [
        `Job for ${unit}.service failed because the control process exited with error code.`,
        `${unit}.service: Failed to bind 0.0.0.0:${service.port}: Address already in use (held by ${conflict.procName}, PID ${conflict.pid})`,
      ];
    }
    if (!service.running) {
      service.running = true;
      changedServices.push(unit);
    }
    syncServiceProcesses(session);
    return null;
  };

  switch (verb) {
    case "start": {
      const err = startUnitNow();
      if (err) return { output: err, cwd, exitCode: 1 };
      return { output: [], cwd, exitCode: 0, changed: { paths: [], created: [], services: changedServices } };
    }
    case "stop":
      if (service.running) {
        service.running = false;
        changedServices.push(unit);
        syncServiceProcesses(session);
      }
      return { output: [], cwd, exitCode: 0, changed: { paths: [], created: [], services: changedServices } };
    case "restart": {
      service.running = false;
      syncServiceProcesses(session);
      const err = startUnitNow();
      if (err) return { output: err, cwd, exitCode: 1 };
      if (!changedServices.includes(unit)) changedServices.push(unit);
      return { output: [], cwd, exitCode: 0, changed: { paths: [], created: [], services: changedServices } };
    }
    case "enable": {
      if (!service.enabled) {
        service.enabled = true;
        changedServices.push(unit);
      }
      const out = [
        `Created symlink /etc/systemd/system/multi-user.target.wants/${unit}.service → /usr/lib/systemd/system/${unit}.service.`,
      ];
      if (longFlags.has("now")) {
        const err = startUnitNow();
        if (err) {
          return {
            output: [...out, ...err],
            cwd,
            exitCode: 1,
            changed: { paths: [], created: [], services: changedServices },
          };
        }
      }
      return { output: out, cwd, exitCode: 0, changed: { paths: [], created: [], services: changedServices } };
    }
    case "disable":
      if (service.enabled) {
        service.enabled = false;
        changedServices.push(unit);
      }
      if (longFlags.has("now") && service.running) {
        service.running = false;
        syncServiceProcesses(session);
      }
      return {
        output: [`Removed /etc/systemd/system/multi-user.target.wants/${unit}.service.`],
        cwd,
        exitCode: 0,
        changed: { paths: [], created: [], services: changedServices },
      };
    case "status":
      return {
        output: [
          `● ${unit}.service - ${unit} service`,
          `     Loaded: loaded (/usr/lib/systemd/system/${unit}.service; ${service.enabled ? "enabled" : "disabled"}; preset: enabled)`,
          `     Active: ${service.running ? "active (running)" : "inactive (dead)"}`,
        ],
        cwd,
        exitCode: service.running ? 0 : 3,
      };
    case "is-active":
      return { output: [service.running ? "active" : "inactive"], cwd, exitCode: service.running ? 0 : 3 };
    case "is-enabled":
      return { output: [service.enabled ? "enabled" : "disabled"], cwd, exitCode: service.enabled ? 0 : 1 };
    default:
      if (isServiceCmd) return { output: [`service: unknown action '${verb}'`], cwd, exitCode: 2 };
      return { output: [`Unknown operation ${verb}.`], cwd, exitCode: 1 };
  }
}

/** Numeric ("750", "0750") or symbolic ("u=rwx,g=rx,o=", "g+w") mode. Returns null when invalid. */
export function applyModeSpec(spec: string, current: number): number | null {
  if (/^[0-7]{3,4}$/.test(spec)) return parseInt(spec, 8);
  let mode = current & 0o7777;
  for (const clause of spec.split(",")) {
    const m = /^([ugoa]*)([=+-])([rwxXst]*)$/.exec(clause);
    if (!m) return null;
    const [, whoRaw, op, perms] = m;
    const who = whoRaw === "" ? "a" : whoRaw;
    const classes: Array<"u" | "g" | "o"> = [];
    if (who.includes("a")) classes.push("u", "g", "o");
    else {
      if (who.includes("u")) classes.push("u");
      if (who.includes("g")) classes.push("g");
      if (who.includes("o")) classes.push("o");
    }
    if (classes.length === 0) return null;
    for (const cls of classes) {
      const shift = cls === "u" ? 6 : cls === "g" ? 3 : 0;
      let bits = 0;
      if (perms.includes("r")) bits |= 4;
      if (perms.includes("w")) bits |= 2;
      if (perms.includes("x") || perms.includes("X")) bits |= 1;
      const specialBit = cls === "u" ? 0o4000 : cls === "g" ? 0o2000 : 0o1000;
      const hasSpecial = (perms.includes("s") && cls !== "o") || (perms.includes("t") && cls === "o");
      if (op === "=") {
        mode &= ~(0o7 << shift);
        mode &= ~specialBit;
        mode |= bits << shift;
        if (hasSpecial) mode |= specialBit;
      } else if (op === "+") {
        mode |= bits << shift;
        if (hasSpecial) mode |= specialBit;
      } else {
        mode &= ~(bits << shift);
        if (hasSpecial) mode &= ~specialBit;
      }
    }
  }
  return mode;
}

/** "alice", "alice:web", "alice.web", ":web" — owner and/or group. */
export function parseOwnerSpec(spec: string): { owner?: string; group?: string } | null {
  const m = /^([A-Za-z0-9_.-]+)?([:.]([A-Za-z0-9_.-]+))?$/.exec(spec);
  if (!m || (!m[1] && !m[3])) return null;
  return { owner: m[1] || undefined, group: m[3] || undefined };
}

function subtreeSize(node: FsNode): number {
  if (node.type === "file") return node.size;
  return Object.values(node.children ?? {}).reduce((sum, c) => sum + subtreeSize(c), node.size);
}

function countSubtreeNodes(node: FsNode): number {
  if (node.type === "file") return 1;
  return 1 + Object.values(node.children ?? {}).reduce((sum, c) => sum + countSubtreeNodes(c), 0);
}

function walk(node: FsNode, path: string, visit: (n: FsNode, p: string) => void): void {
  visit(node, path);
  if (node.type !== "dir") return;
  for (const child of Object.values(node.children ?? {})) {
    walk(child, path === "/" ? `/${child.name}` : `${path}/${child.name}`, visit);
  }
}

function matchOptionValueFromTokens(tokens: string[], option: string): string | null {
  const idx = tokens.indexOf(option);
  if (idx === -1 || idx === tokens.length - 1) return null;
  return tokens[idx + 1];
}

function globMatch(name: string, pattern: string): boolean {
  const re = new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i");
  return re.test(name);
}

function globMatchCaseSensitive(name: string, pattern: string): boolean {
  const re = new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
  return re.test(name);
}

function sizeMatches(size: number, spec: string): boolean {
  const m = /^([+-]?)(\d+)([kMG]?)$/.exec(spec);
  if (!m) return false;
  const [, sign, num, unit] = m;
  const mult = unit === "G" ? 1024 ** 3 : unit === "M" ? 1024 ** 2 : unit === "k" ? 1024 : 512;
  const bytes = Number(num) * mult;
  if (sign === "+") return size > bytes;
  if (sign === "-") return size < bytes;
  return Math.abs(size - bytes) < mult;
}

export function humanSize(bytes: number): string {
  if (bytes === 0) return "0";
  if (bytes < 1024) return `${bytes}`;
  const units = ["K", "M", "G", "T"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}${units[i]}`;
}

/** Tab-completion candidates for the token currently being typed. */
export function completePath(cwd: string, fragment: string): string[] {
  const lastSlash = fragment.lastIndexOf("/");
  const dirPart = lastSlash === -1 ? "" : fragment.slice(0, lastSlash + 1);
  const namePart = lastSlash === -1 ? fragment : fragment.slice(lastSlash + 1);
  const dirNode = getNode(resolvePath(cwd, dirPart || "."));
  if (!dirNode || dirNode.type !== "dir") return [];
  return Object.values(dirNode.children ?? {})
    .filter((c) => c.name.startsWith(namePart))
    .map((c) => `${dirPart}${c.name}${c.type === "dir" ? "/" : ""}`)
    .sort();
}

const COMMAND_VOCABULARY = [
  "ls", "cd", "pwd", "cat", "head", "tail", "wc", "stat", "file", "find", "grep",
  "mkdir", "touch", "cp", "mv", "rm", "chmod", "chown", "chgrp", "tar",
  "ps", "top", "uptime", "kill", "ss", "df", "du", "crontab", "id",
  "echo", "whoami", "clear", "help", "systemctl", "service", "curl", "reboot",
];

/** Completion for the first token on the line. */
export function completeCommand(fragment: string): string[] {
  return COMMAND_VOCABULARY.filter((c) => c.startsWith(fragment)).sort();
}
