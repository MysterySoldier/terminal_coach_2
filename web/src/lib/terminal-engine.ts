import { SANDBOX_FS, type ArchivedItem, type FsNode, type ParsedCommand } from "../data/sandbox";

/**
 * Parse a raw shell line into a normalized command description.
 * Bundled short flags (-la) are expanded so flag order and grouping never matter.
 */
export function parseCommand(raw: string): ParsedCommand {
  const { commandPart } = extractRedirection(raw.trim());
  const trimmed = commandPart.trim();
  const tokens = tokenize(trimmed).map(expandEnvVars);
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

  return { name, shortFlags, longFlags, args: args.filter((a) => !a.startsWith("-")), raw: raw.trim() };
}

function expandEnvVars(value: string): string {
  return value
    .replace(/\$\{USER\}|\$USER\b/g, "user")
    .replace(/\$\{HOME\}|\$HOME\b/g, "/home/user")
    .replace(/\$\{PATH\}|\$PATH\b/g, "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin");
}

function extractRedirection(rawStage: string): {
  commandPart: string;
  redirect: { op: ">" | ">>"; target: string } | null;
  error?: string;
} {
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < rawStage.length; i += 1) {
    const ch = rawStage[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === ">") {
      const isAppend = rawStage[i + 1] === ">";
      const op: ">" | ">>" = isAppend ? ">>" : ">";
      const commandPart = rawStage.slice(0, i).trim();
      const afterRaw = rawStage.slice(i + (isAppend ? 2 : 1)).trim();
      const targetTokens = tokenizeWithQuotes(afterRaw);
      const target = targetTokens[0] ? expandEnvVars(targetTokens[0].value) : "";
      if (!target) {
        return {
          commandPart,
          redirect: null,
          error: "bash: syntax error near unexpected token `newline'",
        };
      }
      return { commandPart, redirect: { op, target } };
    }
  }
  return { commandPart: rawStage, redirect: null };
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

/** Split compound shell lines on unquoted `;` and `&&`, keeping `for ...; do ...; done` intact as one segment. */
function splitChainSegments(raw: string): Array<{ segment: string; opBefore: "start" | ";" | "&&" }> {
  const segments: Array<{ segment: string; opBefore: "start" | ";" | "&&" }> = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let opBefore: "start" | ";" | "&&" = "start";
  let forDepth = 0;

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
    if ((i === 0 || /[\s;&]/.test(raw[i - 1])) && /^for\s+[A-Za-z_][A-Za-z0-9_]*\s+in\b/.test(raw.slice(i))) {
      forDepth += 1;
    }
    if (forDepth > 0 && (i === 0 || /[\s;]/.test(raw[i - 1])) && /^done(?=$|[\s;&])/.test(raw.slice(i))) {
      forDepth = Math.max(0, forDepth - 1);
    }
    if (ch === ";" && forDepth === 0) {
      if (current.trim()) segments.push({ segment: current.trim(), opBefore });
      current = "";
      opBefore = ";";
      continue;
    }
    if (ch === "&" && raw[i + 1] === "&" && forDepth === 0) {
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
  binaryPath?: string;
  failed?: boolean;
}

export interface JournalEntry {
  timestamp: string;
  unit?: string;
  priority: "info" | "notice" | "warning" | "err" | "crit";
  message: string;
}

export interface ProcessEntry {
  pid: number;
  ppid?: number;
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
  passwordSet?: boolean;
  home?: string;
  shell?: string;
}

export interface DeletedOpenFile {
  pid: number;
  procName: string;
  user: string;
  fd: string;
  path: string;
  sizeBytes: number;
  serviceUnit?: string;
}

export interface BlockPartition {
  name: string;
  sizeLabel: string;
  fsType?: string;
}

export interface BlockDisk {
  device: string;
  sizeBytes: number;
  label?: "gpt" | "msdos";
  partitions: BlockPartition[];
}

export interface LvmState {
  pvs: string[];
  vgs: Record<string, { pvs: string[]; freeGiB: number }>;
  lvs: Record<string, { vg: string; name: string; sizeGiB: number; fsSizeGiB: number; active: boolean }>;
  restoredVgs: Record<string, boolean>;
}

export interface UfwState {
  enabled: boolean;
  allowed: string[];
}

export interface ShellSession {
  fs: FsNode;
  services: Record<string, ServiceState>;
  processes: ProcessEntry[];
  mounts: MountEntry[];
  users: Record<string, UserAccount>;
  crontabs: Record<string, string[]>;
  packages: Record<string, boolean>;
  openDeletedFiles: DeletedOpenFile[];
  journal: JournalEntry[];
  executedScripts: Record<string, string[]>;
  verifiedChecksums: Record<string, boolean>;
  commandHashCleared: boolean;
  nofileSoftLimit: number;
  nofileHardLimit: number;
  extraOpenFilesCount: number;
  clockOffsetSeconds: number;
  ntpSynchronized: boolean;
  ntpActive: boolean;
  disks: Record<string, BlockDisk>;
  lvm: LvmState;
  ufw: UfwState;
  mountedShares: Record<string, boolean>;
}

const GiB = 1024 ** 3;

const DEFAULT_PACKAGES: Record<string, boolean> = {
  nginx: true,
  httpd: true,
  openssh: true,
  postgresql: true,
  cronie: true,
  lsof: true,
};

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
  "worker-mgr": {
    pid: 3410,
    user: "user",
    cpu: 0.2,
    mem: 0.6,
    stat: "Ss",
    start: "14:00",
    time: "0:01",
    procName: "worker-mgr",
    command: "/usr/sbin/worker-mgr --daemon",
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
  syslog: { uid: 104, gid: 110, primaryGroup: "syslog", groups: ["syslog", "adm"] },
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
    packages: structuredClone(DEFAULT_PACKAGES),
    openDeletedFiles: [],
    journal: [],
    executedScripts: {},
    verifiedChecksums: {},
    commandHashCleared: false,
    nofileSoftLimit: 1024,
    nofileHardLimit: 65536,
    extraOpenFilesCount: 0,
    clockOffsetSeconds: 0,
    ntpSynchronized: true,
    ntpActive: true,
    disks: {},
    lvm: { pvs: [], vgs: {}, lvs: {}, restoredVgs: {} },
    ufw: { enabled: false, allowed: [] },
    mountedShares: {},
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
  session.packages = structuredClone(DEFAULT_PACKAGES);
  session.openDeletedFiles = [];
  session.journal = [];
  session.executedScripts = {};
  session.verifiedChecksums = {};
  session.commandHashCleared = false;
  session.nofileSoftLimit = 1024;
  session.nofileHardLimit = 65536;
  session.extraOpenFilesCount = 0;
  session.clockOffsetSeconds = 0;
  session.ntpSynchronized = true;
  session.ntpActive = true;
  session.disks = {};
  session.lvm = { pvs: [], vgs: {}, lvs: {}, restoredVgs: {} };
  session.ufw = { enabled: false, allowed: [] };
  session.mountedShares = {};
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
  session.openDeletedFiles = [];
  for (const [unit, service] of Object.entries(session.services)) {
    service.running = service.enabled && session.packages[unit] !== false;
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
  const heldDeletedBytes = (session.openDeletedFiles ?? [])
    .filter((entry) => findMountForPath(session, entry.path).mountPoint === mount.mountPoint)
    .reduce((sum, entry) => sum + entry.sizeBytes, 0);
  const usedBytes = Math.min(mount.totalBytes, Math.max(0, mount.baseUsedBytes + treeBytes + heldDeletedBytes));
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
  const cmdName = expandEnvVars(tokenInfos[0].value);
  const out: string[] = [cmdName];

  for (let i = 1; i < tokenInfos.length; i += 1) {
    const tok = { ...tokenInfos[i], value: expandEnvVars(tokenInfos[i].value) };
    const prev = tokenInfos[i - 1]?.value ?? "";
    const isFindPatternArg = cmdName === "find" && (prev === "-name" || prev === "-iname" || prev === "-path");
    const isGrepPatternArg =
      cmdName === "grep" && !tok.value.startsWith("-") && out.slice(1).every((existing) => existing.startsWith("-"));

    if (!tok.quoted && !tok.value.startsWith("-") && !isFindPatternArg && !isGrepPatternArg && /[*?[\]]/.test(tok.value)) {
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

function writeRedirectedOutput(
  session: ShellSession,
  cwd: string,
  op: ">" | ">>",
  rawTarget: string,
  lines: string[],
): { error?: string; changedPaths: string[]; changedCreated: string[] } {
  const targetAbs = resolvePath(cwd, rawTarget);
  const existing = getNodeFrom(session.fs, targetAbs);
  if (existing && existing.type === "dir") {
    return { error: `bash: ${rawTarget}: Is a directory`, changedPaths: [], changedCreated: [] };
  }
  const { parentPath, name: fileName } = splitParentAndName(targetAbs);
  const parent = getNodeFrom(session.fs, parentPath);
  if (!parent || parent.type !== "dir") {
    return { error: `bash: ${rawTarget}: No such file or directory`, changedPaths: [], changedCreated: [] };
  }

  const incomingText = lines.length > 0 ? `${lines.join("\n")}\n` : "";
  const finalText = op === ">>" && existing?.type === "file" ? `${existing.content ?? ""}${incomingText}` : incomingText;
  const neededBytes = Math.max(0, finalText.length - (existing?.size ?? 0));
  const neededInodes = existing ? 0 : 1;

  if (!checkSpaceForWrite(session, targetAbs, neededBytes, neededInodes)) {
    return { error: `bash: ${rawTarget}: No space left on device`, changedPaths: [], changedCreated: [] };
  }

  parent.children = parent.children ?? {};
  parent.children[fileName] = {
    name: fileName,
    type: "file",
    mode: existing?.mode ?? 0o644,
    owner: existing?.owner ?? "user",
    group: existing?.group ?? "user",
    size: finalText.length,
    mtime: "Sep 21 14:35",
    content: finalText,
  };

  return existing
    ? { changedPaths: [targetAbs], changedCreated: [] }
    : { changedPaths: [], changedCreated: [targetAbs] };
}

function runSingleStage(
  session: ShellSession,
  rawStage: string,
  cwd: string,
  stdinLines?: string[],
): CommandResult {
  const { commandPart, redirect, error: redirectError } = extractRedirection(rawStage);
  if (redirectError) {
    return { output: [redirectError], cwd, exitCode: 2 };
  }

  const baseResult = runSingleStageCommand(session, commandPart, cwd, stdinLines);
  if (!redirect || baseResult.unknown || (baseResult.exitCode ?? 0) !== 0) {
    return baseResult;
  }

  const writeRes = writeRedirectedOutput(session, baseResult.cwd, redirect.op, redirect.target, baseResult.output);
  if (writeRes.error) {
    return { output: [writeRes.error], cwd: baseResult.cwd, exitCode: 1 };
  }

  return {
    output: [],
    cwd: baseResult.cwd,
    exitCode: 0,
    changed: {
      paths: [...(baseResult.changed?.paths ?? []), ...writeRes.changedPaths],
      created: [...(baseResult.changed?.created ?? []), ...writeRes.changedCreated],
      services: [...(baseResult.changed?.services ?? [])],
    },
  };
}

function runSingleStageCommand(
  session: ShellSession,
  rawStage: string,
  cwd: string,
  stdinLines?: string[],
): CommandResult {
  const trimmedStage = rawStage.trim();
  const forLoopRes = tryRunForLoop(session, trimmedStage, cwd);
  if (forLoopRes) return forLoopRes;

  const tokenInfos = tokenizeWithQuotes(rawStage);
  const tokens = expandCommandTokens(session.fs, cwd, tokenInfos);
  const parsed = parseExpandedTokens(tokens, trimmedStage);
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
          "  mkdir  touch  cp  mv  rm  chmod  chown  chgrp  tar  tee  sha256sum",
          "  ps  top  uptime  kill  lsof  ss  df  du  crontab  id  whoami  journalctl",
          "  yum  dnf  systemctl  service  ssh  curl  reboot  echo  printf  hash  clear",
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
      const crlfSuffix = node.content?.includes("\r") ? ", with CRLF line terminators" : "";
      const kind = node.content?.startsWith("#!")
        ? `Bourne-Again shell script, ASCII text executable${crlfSuffix}`
        : `ASCII text${crlfSuffix}`;
      return { output: [`${node.name}: ${kind}`], cwd, exitCode: 0 };
    }

    case "echo": {
      const joined = args.join(" ");
      const unescaped =
        shortFlags.has("e") || joined.includes("\\n") || joined.includes("\\t")
          ? joined.replace(/\\n/g, "\n").replace(/\\t/g, "\t")
          : joined;
      const lines = unescaped.split("\n");
      if (lines.length > 1 && lines[lines.length - 1] === "") {
        lines.pop();
      }
      return { output: lines, cwd, exitCode: 0 };
    }

    case "printf": {
      if (args.length === 0) return { output: [], cwd, exitCode: 0 };
      const fmt = args[0];
      const rest = args.slice(1);
      let rendered: string;
      if ((fmt === "%s\\n" || fmt === "%s\n") && rest.length > 0) {
        rendered = rest.map((r) => `${r}\n`).join("");
      } else if (fmt.includes("%s") && rest.length > 0) {
        let idx = 0;
        rendered = fmt.replace(/%s/g, () => rest[idx++] ?? "");
      } else {
        rendered = args.join(" ");
      }
      const unescaped = rendered.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
      const lines = unescaped.split("\n");
      if (lines.length > 1 && lines[lines.length - 1] === "") {
        lines.pop();
      }
      return { output: lines, cwd, exitCode: 0 };
    }

    case "tee": {
      const append = shortFlags.has("a") || longFlags.has("append");
      const lines = stdinLines ?? [];
      const changedPaths: string[] = [];
      const changedCreated: string[] = [];
      for (const target of args) {
        const writeRes = writeRedirectedOutput(session, cwd, append ? ">>" : ">", target, lines);
        if (writeRes.error) {
          return { output: [writeRes.error], cwd, exitCode: 1 };
        }
        changedPaths.push(...writeRes.changedPaths);
        changedCreated.push(...writeRes.changedCreated);
      }
      return {
        output: lines,
        cwd,
        exitCode: 0,
        changed: { paths: changedPaths, created: changedCreated, services: [] },
      };
    }

    case "find": {
      const nameMatch = matchOptionValueFromTokens(tokens, "-name") ?? matchOptionValueFromTokens(tokens, "-iname");
      const typeFilter = matchOptionValueFromTokens(tokens, "-type");
      const sizeSpec = matchOptionValueFromTokens(tokens, "-size");
      const userFilter = matchOptionValueFromTokens(tokens, "-user");
      const uidFilter = matchOptionValueFromTokens(tokens, "-uid");
      const maxDepthSpec = matchOptionValueFromTokens(tokens, "-maxdepth");
      const maxDepth = maxDepthSpec && /^\d+$/.test(maxDepthSpec) ? Number(maxDepthSpec) : null;
      const noUser = tokens.includes("-nouser");
      const noGroup = tokens.includes("-nogroup");
      const knownUsers = new Set(Object.keys(session.users));
      const knownGroups = new Set([
        ...Object.keys(GROUP_GIDS),
        ...Object.values(session.users).flatMap((u) => [u.primaryGroup, ...u.groups]),
      ]);
      const startArg =
        args.find(
          (a) =>
            a !== nameMatch &&
            a !== typeFilter &&
            a !== sizeSpec &&
            a !== userFilter &&
            a !== uidFilter &&
            a !== maxDepthSpec &&
            !a.startsWith("+"),
        ) ?? ".";
      const start = resolvePath(cwd, startArg);
      const node = getNodeFrom(session.fs, start);
      if (!node) return { output: [`find: '${startArg}': No such file or directory`], cwd, exitCode: 1 };

      const startDepth = start === "/" ? 0 : start.split("/").filter(Boolean).length;
      const results: string[] = [];
      walk(node, start, (n, path) => {
        if (maxDepth !== null) {
          const depth = path === "/" ? 0 : path.split("/").filter(Boolean).length - startDepth;
          if (depth > maxDepth) return;
        }
        if (typeFilter === "f" && n.type !== "file") return;
        if (typeFilter === "d" && n.type !== "dir") return;
        if (nameMatch && !globMatch(n.name, nameMatch)) return;
        if (sizeSpec && !sizeMatches(n.size, sizeSpec)) return;
        if (noUser && (knownUsers.has(n.owner) && !/^\d+$/.test(n.owner))) return;
        if (noGroup && (knownGroups.has(n.group) && !/^\d+$/.test(n.group))) return;
        if (userFilter && n.owner !== userFilter) return;
        if (uidFilter && n.owner !== uidFilter && String(session.users[n.owner]?.uid ?? "") !== uidFilter) return;
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

      const hasEo = tokens.some((t) => t === "-o" || t === "-eo" || t.startsWith("-o") || t.startsWith("-eo"));
      if (hasEo) {
        const header = "  PID  PPID STAT COMMAND";
        const rows = procs.map(
          (p) =>
            `${String(p.pid).padStart(5)} ${String(p.ppid ?? 1).padStart(5)} ${p.stat.padEnd(4)} ${p.stat.startsWith("Z") ? `${p.procName} <defunct>` : p.procName}`,
        );
        return { output: [header, ...rows], cwd, exitCode: 0 };
      }

      if (shortFlags.has("f") && (shortFlags.has("e") || shortFlags.has("A"))) {
        const header = "UID        PID  PPID  C STIME TTY          TIME CMD";
        const rows = procs.map(
          (p) =>
            `${p.user.padEnd(8)} ${String(p.pid).padStart(5)} ${String(p.ppid ?? 1).padStart(5)}  0 ${p.start.padEnd(5)} ?        00:0${p.time} ${p.command}`,
        );
        return { output: [header, ...rows], cwd, exitCode: 0 };
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

    case "yum":
    case "dnf": {
      return runYumCommand(session, name, args, cwd);
    }

    case "lsof": {
      return runLsofCommand(session, tokens, cwd);
    }

    case "ssh": {
      return runSshCommand(session, args, cwd);
    }

    case "journalctl": {
      return runJournalctlCommand(session, tokens, shortFlags, cwd);
    }

    case "sha256sum": {
      return runSha256sumCommand(session, args, shortFlags, longFlags, cwd);
    }

    case "hash": {
      if (shortFlags.has("r")) {
        session.commandHashCleared = true;
        return { output: [], cwd, exitCode: 0, changed: { paths: ["/proc/self/hash"], created: [], services: [] } };
      }
      return { output: ["hits\tcommand", "   2\t/usr/bin/ls", "   1\t/usr/bin/chmod"], cwd, exitCode: 0 };
    }

    case "bash":
    case "sh": {
      const scriptArg = args[0];
      if (!scriptArg) return { output: [], cwd, exitCode: 0 };
      return executeShellScript(session, scriptArg, cwd, true);
    }

    case "ulimit": {
      return runUlimitCommand(session, tokens, shortFlags, cwd);
    }

    case "date": {
      return runDateCommand(session, tokens, shortFlags, cwd);
    }

    case "timedatectl": {
      return runTimedatectlCommand(session, args, cwd);
    }

    case "chronyc": {
      return runChronycCommand(session, args, cwd);
    }

    case "awk": {
      return runAwkCommand(session, tokens, stdinLines, cwd);
    }

    case "sort": {
      return runSortCommand(session, args, shortFlags, longFlags, stdinLines, cwd);
    }

    case "uniq": {
      return runUniqCommand(session, args, shortFlags, longFlags, stdinLines, cwd);
    }

    case "cut": {
      return runCutCommand(session, tokens, args, stdinLines, cwd);
    }

    case "tr": {
      return runTrCommand(tokens, shortFlags, stdinLines, cwd);
    }

    case "diff": {
      return runDiffCommand(session, args, cwd);
    }

    case "gzip":
    case "gunzip": {
      return runGzipCommand(session, name, args, shortFlags, longFlags, cwd);
    }

    case "useradd": {
      return runUseraddCommand(session, tokens, shortFlags, longFlags, cwd);
    }

    case "usermod": {
      return runUsermodCommand(session, tokens, shortFlags, longFlags, cwd);
    }

    case "passwd": {
      return runPasswdCommand(session, args, shortFlags, longFlags, cwd);
    }

    case "ping": {
      return runPingCommand(session, tokens, cwd);
    }

    case "dig":
    case "nslookup": {
      return runDigCommand(session, name, tokens, cwd);
    }

    case "parted": {
      return runPartedCommand(session, args, cwd);
    }

    case "mkfs.ext4":
    case "mkfs": {
      return runMkfsCommand(session, name, tokens, args, cwd);
    }

    case "lsblk": {
      return runLsblkCommand(session, cwd);
    }

    case "blkid": {
      return runBlkidCommand(session, args, cwd);
    }

    case "pvcreate":
    case "vgextend":
    case "lvextend":
    case "resize2fs":
    case "pvs":
    case "vgs":
    case "lvs":
    case "vgcfgrestore":
    case "lvchange": {
      return runLvmCommand(session, name, tokens, args, shortFlags, longFlags, cwd);
    }

    case "mount": {
      return runMountCommand(session, args, shortFlags, cwd);
    }

    case "umount": {
      return runUmountCommand(session, args, cwd);
    }

    case "fuser": {
      return runFuserCommand(session, args, shortFlags, cwd);
    }

    case "dos2unix": {
      return runDos2UnixCommand(session, args, cwd);
    }

    case "sed": {
      return runSedCommand(session, tokens, args, shortFlags, stdinLines, cwd);
    }

    case "logrotate": {
      return runLogrotateCommand(session, args, shortFlags, cwd);
    }

    case "ufw": {
      return runUfwCommand(session, args, cwd);
    }

    default: {
      if (name.startsWith("./") || name.startsWith("/") || name.startsWith("~/")) {
        return executeShellScript(session, name, cwd, false);
      }
      return { output: [`${name}: command not found`], cwd, unknown: true, exitCode: 127 };
    }
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
  let signal: "SIGTERM" | "SIGKILL" | "SIGCHLD" | "SIGHUP" = "SIGTERM";
  const pidTokens: string[] = [];

  for (let i = 1; i < tokens.length; i += 1) {
    const tok = tokens[i];
    if (tok === "-l") {
      return { output: ["1) SIGHUP   2) SIGINT   9) SIGKILL  15) SIGTERM  17) SIGCHLD"], cwd, exitCode: 0 };
    }
    if (tok === "-s" || tok === "-n") {
      const spec = (tokens[++i] ?? "").toUpperCase();
      if (spec === "9" || spec === "KILL" || spec === "SIGKILL") signal = "SIGKILL";
      else if (spec === "17" || spec === "CHLD" || spec === "SIGCHLD") signal = "SIGCHLD";
      else if (spec === "1" || spec === "HUP" || spec === "SIGHUP") signal = "SIGHUP";
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
      if (spec === "17" || spec === "CHLD" || spec === "SIGCHLD") {
        signal = "SIGCHLD";
        continue;
      }
      if (spec === "1" || spec === "HUP" || spec === "SIGHUP") {
        signal = "SIGHUP";
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
    if (proc.stat.startsWith("Z")) {
      // Zombie processes are already dead; signaling them directly cannot reap them.
      continue;
    }
    // Reap any zombie children belonging to this parent process
    const beforeCount = session.processes.length;
    session.processes = session.processes.filter((p) => !(p.ppid === pid && p.stat.startsWith("Z")));
    if (session.processes.length !== beforeCount) {
      changedPaths.push(`/proc/${pid}/children`);
    }
    if (signal === "SIGCHLD" || signal === "SIGHUP") {
      continue;
    }
    if (proc.ignoresSigterm && signal !== "SIGKILL") {
      // Polite SIGTERM sent cleanly; stuck process ignores it and stays in the table.
      continue;
    }
    const updatedIdx = session.processes.findIndex((p) => p.pid === pid);
    if (updatedIdx !== -1) {
      session.processes.splice(updatedIdx, 1);
    }
    changedPaths.push(`/proc/${pid}`);
    session.openDeletedFiles = (session.openDeletedFiles ?? []).filter(
      (entry) => entry.pid !== pid && (!proc.serviceUnit || entry.serviceUnit !== proc.serviceUnit),
    );
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
  if (!isServiceCmd && verb === "daemon-reload") {
    return { output: [], cwd, exitCode: 0 };
  }
  const unitRaw = isServiceCmd ? operands[0] : operands[1];
  if (!verb || !unitRaw) {
    return {
      output: [isServiceCmd ? "Usage: service <unit> {start|stop|restart|status}" : "Usage: systemctl <verb> <unit>"],
      cwd,
      exitCode: 1,
    };
  }
  const unit = resolveServiceUnit(session, unitRaw);
  if (!session.services[unit]) {
    const customUnitNode =
      getNodeFrom(session.fs, `/etc/systemd/system/${unit}.service`) ??
      getNodeFrom(session.fs, `/usr/lib/systemd/system/${unit}.service`);
    if (customUnitNode?.type === "file" && customUnitNode.content) {
      const execMatch = /^\s*ExecStart\s*=\s*(\S+)/m.exec(customUnitNode.content);
      const binPath = execMatch ? execMatch[1].trim() : undefined;
      session.services[unit] = {
        running: false,
        enabled: false,
        port: 0,
        process: unit,
        ...(binPath ? { binaryPath: binPath } : {}),
      };
    }
  }
  const service = session.services[unit];
  if (!service || session.packages[unit] === false) {
    return {
      output: [`Failed to ${verb} ${unit}.service: Unit ${unit}.service could not be found.`],
      cwd,
      exitCode: 5,
    };
  }

  const changedServices: string[] = [];
  const changedPaths: string[] = [];

  const releaseDeletedFilesForUnit = (): void => {
    const before = session.openDeletedFiles ?? [];
    const remaining = before.filter((entry) => entry.serviceUnit !== unit && entry.procName !== service.process);
    if (remaining.length !== before.length) {
      session.openDeletedFiles = remaining;
      changedPaths.push(`/proc/${unit}/fd`);
    }
    const svcPids = new Set(
      session.processes.filter((p) => p.serviceUnit === unit || p.procName === service.process).map((p) => p.pid),
    );
    const beforeProcs = session.processes.length;
    session.processes = session.processes.filter((p) => !(p.stat.startsWith("Z") && (svcPids.has(p.ppid ?? -1) || unit === "worker-mgr")));
    if (session.processes.length !== beforeProcs) {
      changedPaths.push(`/proc/${unit}/children`);
    }
  };

  const startUnitNow = (): string[] | null => {
    if (service.binaryPath) {
      const binNode = getNodeFrom(session.fs, service.binaryPath);
      if (!binNode || binNode.type !== "file") {
        service.running = false;
        service.failed = true;
        session.journal.push({
          timestamp: "Sep 21 14:35:10",
          unit: `${unit}.service`,
          priority: "err",
          message: `${unit}.service: Failed at step EXEC spawning ${service.binaryPath}: No such file or directory`,
        });
        syncServiceProcesses(session);
        return [
          `Job for ${unit}.service failed because the control process exited with error code.`,
          `See "systemctl status ${unit}.service" and "journalctl -xeu ${unit}.service" for details.`,
        ];
      }
      if ((binNode.mode & 0o111) === 0) {
        service.running = false;
        service.failed = true;
        session.journal.push(
          {
            timestamp: "Sep 21 14:35:10",
            unit: `${unit}.service`,
            priority: "err",
            message: `${unit}.service: Failed to execute ${service.binaryPath}: Permission denied`,
          },
          {
            timestamp: "Sep 21 14:35:10",
            unit: `${unit}.service`,
            priority: "err",
            message: `${unit}.service: Failed at step EXEC spawning ${service.binaryPath}: Permission denied (status=203/EXEC)`,
          },
        );
        syncServiceProcesses(session);
        return [
          `Job for ${unit}.service failed because the control process exited with error code.`,
          `See "systemctl status ${unit}.service" and "journalctl -xeu ${unit}.service" for details.`,
        ];
      }
    }
    const conflict = findPortConflict(session, unit, service.port);
    if (conflict) {
      service.running = false;
      service.failed = true;
      syncServiceProcesses(session);
      return [
        `Job for ${unit}.service failed because the control process exited with error code.`,
        `${unit}.service: Failed to bind 0.0.0.0:${service.port}: Address already in use (held by ${conflict.procName}, PID ${conflict.pid})`,
      ];
    }
    service.failed = false;
    if (!service.running) {
      service.running = true;
      changedServices.push(unit);
    }
    if (unit === "chronyd" || unit === "systemd-timesyncd") {
      session.ntpActive = true;
      session.ntpSynchronized = true;
      session.clockOffsetSeconds = 0;
    }
    session.journal.push({
      timestamp: "Sep 21 14:35:12",
      unit: `${unit}.service`,
      priority: "info",
      message: `Started ${unit}.service — ${service.process} daemon online.`,
    });
    syncServiceProcesses(session);
    return null;
  };

  switch (verb) {
    case "start": {
      const err = startUnitNow();
      if (err) return { output: err, cwd, exitCode: 1 };
      return { output: [], cwd, exitCode: 0, changed: { paths: changedPaths, created: [], services: changedServices } };
    }
    case "stop":
      releaseDeletedFilesForUnit();
      if (service.running) {
        service.running = false;
        changedServices.push(unit);
        syncServiceProcesses(session);
      }
      return { output: [], cwd, exitCode: 0, changed: { paths: changedPaths, created: [], services: changedServices } };
    case "restart": {
      releaseDeletedFilesForUnit();
      service.running = false;
      syncServiceProcesses(session);
      const err = startUnitNow();
      if (err) return { output: err, cwd, exitCode: 1 };
      if (!changedServices.includes(unit)) changedServices.push(unit);
      return { output: [], cwd, exitCode: 0, changed: { paths: changedPaths, created: [], services: changedServices } };
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
            changed: { paths: changedPaths, created: [], services: changedServices },
          };
        }
      }
      return { output: out, cwd, exitCode: 0, changed: { paths: changedPaths, created: [], services: changedServices } };
    }
    case "disable":
      if (service.enabled) {
        service.enabled = false;
        changedServices.push(unit);
      }
      if (longFlags.has("now") && service.running) {
        releaseDeletedFilesForUnit();
        service.running = false;
        syncServiceProcesses(session);
      }
      return {
        output: [`Removed /etc/systemd/system/multi-user.target.wants/${unit}.service.`],
        cwd,
        exitCode: 0,
        changed: { paths: changedPaths, created: [], services: changedServices },
      };
    case "status":
      return {
        output: [
          `● ${unit}.service - ${unit} service`,
          `     Loaded: loaded (/usr/lib/systemd/system/${unit}.service; ${service.enabled ? "enabled" : "disabled"}; preset: enabled)`,
          `     Active: ${
            service.running
              ? "active (running)"
              : service.failed
                ? "failed (Result: exit-code) (status=203/EXEC)"
                : "inactive (dead)"
          }`,
        ],
        cwd,
        exitCode: service.running ? 0 : 3,
      };
    case "is-active":
      return {
        output: [service.running ? "active" : service.failed ? "failed" : "inactive"],
        cwd,
        exitCode: service.running ? 0 : 3,
      };
    case "is-enabled":
      return { output: [service.enabled ? "enabled" : "disabled"], cwd, exitCode: service.enabled ? 0 : 1 };
    default:
      if (isServiceCmd) return { output: [`service: unknown action '${verb}'`], cwd, exitCode: 2 };
      return { output: [`Unknown operation ${verb}.`], cwd, exitCode: 1 };
  }
}

function runYumCommand(session: ShellSession, toolName: string, args: string[], cwd: string): CommandResult {
  const operands = args.filter((a) => !a.startsWith("-"));
  const sub = operands[0] ?? "";
  if (!sub) {
    return { output: [`usage: ${toolName} [options] COMMAND`], cwd, exitCode: 1 };
  }

  if (sub === "list") {
    const installed = Object.entries(session.packages)
      .filter(([, ok]) => ok)
      .map(([pkg]) => `${pkg}.x86_64                      2.4.58-1.el9                   @appstream`);
    return {
      output: ["Installed Packages", ...installed],
      cwd,
      exitCode: 0,
    };
  }

  if (sub === "info" || sub === "search") {
    const pkg = operands[1] ?? "httpd";
    const isInstalled = Boolean(session.packages[pkg]);
    return {
      output: [
        `${ isInstalled ? "Installed" : "Available" } Packages`,
        `Name         : ${pkg}`,
        "Version      : 2.4.58",
        "Release      : 1.el9",
        "Architecture : x86_64",
        `Summary      : ${pkg === "httpd" ? "Apache HTTP Server" : `${pkg} package`}`,
      ],
      cwd,
      exitCode: 0,
    };
  }

  if (sub === "install") {
    const pkgs = operands.slice(1);
    if (pkgs.length === 0) {
      return { output: [`Error: ${toolName} install requires a package name.`], cwd, exitCode: 1 };
    }
    const out: string[] = ["Last metadata expiration check: 0:14:22 ago."];
    const changedPaths: string[] = [];
    const changedCreated: string[] = [];
    const changedServices: string[] = [];

    for (const rawPkg of pkgs) {
      const pkg = rawPkg.replace(/\.x86_64$/, "");
      if (pkg === "apache2") {
        return {
          output: [
            ...out,
            "No match for argument: apache2",
            "Error: Unable to find a match: apache2 (on Red Hat systems the Apache package is httpd).",
          ],
          cwd,
          exitCode: 1,
        };
      }
      if (!(pkg in DEFAULT_PACKAGES)) {
        return {
          output: [...out, `No match for argument: ${rawPkg}`, `Error: Unable to find a match: ${rawPkg}`],
          cwd,
          exitCode: 1,
        };
      }
      if (session.packages[pkg]) {
        out.push(`Package ${pkg}-2.4.58-1.el9.x86_64 is already installed.`);
        continue;
      }
      session.packages[pkg] = true;
      if (pkg === "httpd") {
        session.services.httpd ??= { running: false, enabled: false, port: 80, process: "httpd" };
        ensureDirInSession(session, "/var/www/html", { mode: 0o755, owner: "root", group: "root" });
        if (!getNodeFrom(session.fs, "/var/www/html/index.html")) {
          putFileInSession(session, "/var/www/html/index.html", {
            mode: 0o644,
            owner: "apache",
            group: "apache",
            content: "<h1>Apache httpd online</h1>\n",
          });
        }
        changedCreated.push("/usr/sbin/httpd");
        changedPaths.push("/usr/lib/systemd/system/httpd.service");
        changedServices.push("httpd");
      } else {
        changedCreated.push(`/usr/bin/${pkg}`);
      }
      out.push(
        "Dependencies resolved.",
        `Installing: ${pkg} x86_64 2.4.58-1.el9 appstream 1.4 M`,
        `Installed: ${pkg}-2.4.58-1.el9.x86_64`,
      );
    }
    out.push("Complete!");
    return {
      output: out,
      cwd,
      exitCode: 0,
      changed: { paths: changedPaths, created: changedCreated, services: changedServices },
    };
  }

  return { output: [`No such command: ${sub}. Please use ${toolName} install <package>.`], cwd, exitCode: 1 };
}

function runLsofCommand(session: ShellSession, tokens: string[], cwd: string): CommandResult {
  const unlinkedOnly = tokens.includes("+L1");
  const filterPathArg = tokens.slice(1).find((t) => t.startsWith("/"));
  const header = "COMMAND     PID     USER   FD   TYPE DEVICE    SIZE/OFF   NODE NAME";
  const rows: string[] = [];

  if (!unlinkedOnly) {
    for (const proc of session.processes) {
      const binPath = proc.command.split(/\s+/)[0] || `/usr/sbin/${proc.procName}`;
      rows.push(
        `${proc.procName.padEnd(9)} ${String(proc.pid).padStart(5)} ${proc.user.padStart(8)}  txt    REG    8,1      184320   9102 ${binPath}`,
      );
      if (proc.command.includes("/mnt/backup")) {
        rows.push(
          `${proc.procName.padEnd(9)} ${String(proc.pid).padStart(5)} ${proc.user.padStart(8)}   4w    REG   8,16     1048576  44102 /mnt/backup/daily/archive.tmp`,
        );
      }
    }
    const extraCount = session.extraOpenFilesCount ?? 0;
    for (let i = 0; i < extraCount; i += 1) {
      const fdNum = 4 + i;
      rows.push(
        `app-worke  4410     user ${String(fdNum).padStart(3)}r   REG    8,1        4096 ${String(30000 + i).padStart(6)} /var/lib/app/shard-${String(i).padStart(4, "0")}.dat`,
      );
    }
  }

  for (const entry of session.openDeletedFiles ?? []) {
    rows.push(
      `${entry.procName.padEnd(9)} ${String(entry.pid).padStart(5)} ${entry.user.padStart(8)} ${entry.fd.padStart(4)}    REG    8,1 ${String(entry.sizeBytes).padStart(11)}  14209 ${entry.path} (deleted)`,
    );
  }

  const filteredRows = filterPathArg ? rows.filter((r) => r.includes(filterPathArg)) : rows;
  return { output: [header, ...filteredRows], cwd, exitCode: 0 };
}

export function hasValidServer1SshConfig(content: string): boolean {
  const lines = content
    .split(/\r?\n|\\n/)
    .map((l) => l.replace(/#.*$/, "").trim())
    .filter(Boolean);

  let inServer1 = false;
  let sawHostServer1 = false;
  let hostName = "";
  let port = "";
  let user = "";
  let identityFile = "";

  const consumePair = (keyRaw: string, valRaw: string): void => {
    const key = keyRaw.toLowerCase();
    const val = expandEnvVars(valRaw.replace(/^['"]|['"]$/g, "").trim());
    if (key === "host") {
      const hosts = val.split(/\s+/).map((h) => h.toLowerCase());
      inServer1 = hosts.includes("server1");
      if (inServer1) sawHostServer1 = true;
      return;
    }
    if (!inServer1) return;
    if (key === "hostname") hostName = val.toLowerCase();
    else if (key === "port") port = val;
    else if (key === "user") user = val;
    else if (key === "identityfile") identityFile = val;
  };

  for (const line of lines) {
    const tokens = line.split(/\s+/);
    if (tokens.length === 2 || (tokens.length >= 2 && tokens[0].toLowerCase() === "host")) {
      const eqIdx = line.indexOf("=");
      if (eqIdx !== -1 && tokens.length === 1) {
        consumePair(line.slice(0, eqIdx).trim(), line.slice(eqIdx + 1).trim());
      } else {
        const [k, ...rest] = tokens;
        consumePair(k.replace(/=$/, ""), rest.join(" ").replace(/^=/, "").trim());
      }
      continue;
    }
    // Support multiple directives placed on one line
    for (let i = 0; i < tokens.length - 1; i += 2) {
      consumePair(tokens[i].replace(/=$/, ""), tokens[i + 1].replace(/^=/, ""));
    }
  }

  const validIdentity =
    identityFile === "~/.ssh/admin" ||
    identityFile === "/home/user/.ssh/admin";

  return sawHostServer1 && hostName === "server1" && port === "2222" && user === "admin" && validIdentity;
}

function runSshCommand(session: ShellSession, args: string[], cwd: string): CommandResult {
  const target = args.find((a) => !a.startsWith("-")) ?? "";
  if (!target) {
    return { output: ["usage: ssh destination"], cwd, exitCode: 255 };
  }
  const host = target.includes("@") ? target.split("@")[1] : target;
  if (host !== "server1") {
    return { output: [`ssh: Could not resolve hostname ${host}: Name or service not known`], cwd, exitCode: 255 };
  }
  const cfg = getNodeFrom(session.fs, "/home/user/.ssh/config");
  if (!cfg || cfg.type !== "file" || !hasValidServer1SshConfig(cfg.content ?? "")) {
    return { output: ["ssh: connect to host server1 port 22: Connection refused"], cwd, exitCode: 255 };
  }
  const keyNode = getNodeFrom(session.fs, "/home/user/.ssh/admin");
  if (!keyNode || keyNode.type !== "file") {
    return { output: ["admin@server1: Permission denied (publickey)."], cwd, exitCode: 255 };
  }
  if ((keyNode.mode & 0o777) !== 0o600 || keyNode.owner !== "user") {
    return {
      output: [
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
        "@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @",
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
        `Permissions 0${(keyNode.mode & 0o777).toString(8)} for '/home/user/.ssh/admin' are too open.`,
        "It is required that your private key files are NOT accessible by others.",
        "This private key will be ignored.",
        "admin@server1: Permission denied (publickey).",
      ],
      cwd,
      exitCode: 255,
    };
  }
  return {
    output: [
      'Authenticated to server1 ([10.0.10.21]:2222) using "publickey" (/home/user/.ssh/admin).',
      "Last login: Fri Sep 21 14:30:02 from 10.0.10.5",
      "admin@server1:~$ Connection to server1 closed.",
    ],
    cwd,
    exitCode: 0,
  };
}

function runJournalctlCommand(
  session: ShellSession,
  tokens: string[],
  shortFlags: Set<string>,
  cwd: string,
): CommandResult {
  const unitOpt = matchOptionValueFromTokens(tokens, "-u") ?? matchOptionValueFromTokens(tokens, "--unit");
  const normalizedUnit = unitOpt ? `${resolveServiceUnit(session, unitOpt)}.service` : null;
  const lineLimitOpt = matchOptionValueFromTokens(tokens, "-n") ?? matchOptionValueFromTokens(tokens, "--lines");
  const lineLimit = lineLimitOpt && /^\d+$/.test(lineLimitOpt) ? Number(lineLimitOpt) : null;

  let entries = [...session.journal];
  if (entries.length === 0) {
    entries = [
      {
        timestamp: "Sep 21 09:12:01",
        unit: "systemd",
        priority: "info",
        message: "Reached target Multi-User System.",
      },
      {
        timestamp: "Sep 21 09:12:02",
        unit: "sshd.service",
        priority: "info",
        message: "Server listening on 0.0.0.0 port 22.",
      },
    ];
  }

  if (normalizedUnit) {
    entries = entries.filter((e) => e.unit === normalizedUnit);
  }
  if (shortFlags.has("p")) {
    const prio = matchOptionValueFromTokens(tokens, "-p") ?? "";
    if (prio.includes("err")) {
      entries = entries.filter((e) => e.priority === "err" || e.priority === "crit");
    }
  }
  if (lineLimit !== null) {
    entries = entries.slice(-lineLimit);
  }

  const lines = entries.map(
    (e) => `${e.timestamp} coach ${e.unit ? e.unit.replace(/\.service$/, "") : "kernel"}: ${e.message}`,
  );
  return { output: lines.length > 0 ? lines : ["-- No entries --"], cwd, exitCode: 0 };
}

export function computeSha256Hex(content: string): string {
  // Deterministic 64-hex digest for known files and arbitrary sandbox contents.
  if (content === "RELEASE_BINARY=mystery-agent-2.4.0\nARCH=x86_64\nBUILD=2026-09-21\n") {
    return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  }
  let h1 = 0x6a09e667;
  let h2 = 0xbb67ae85;
  let h3 = 0x3c6ef372;
  let h4 = 0xa54ff53a;
  let h5 = 0x510e527f;
  let h6 = 0x9b05688c;
  let h7 = 0x1f83d9ab;
  let h8 = 0x5be0cd19;
  for (let i = 0; i < content.length; i += 1) {
    const ch = content.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (ch + i), 0x85ebca6b) >>> 0;
    h3 = Math.imul(h3 ^ (ch * 7), 0xc2b2ae35) >>> 0;
    h4 = Math.imul(h4 ^ (ch + 17), 0x27d4eb2f) >>> 0;
    h5 = Math.imul(h5 ^ (ch * 13), 0x165667b1) >>> 0;
    h6 = Math.imul(h6 ^ (ch + 31), 0xd3a2646c) >>> 0;
    h7 = Math.imul(h7 ^ (ch * 29), 0xfd7046c5) >>> 0;
    h8 = Math.imul(h8 ^ (ch + 53), 0xb55a4f09) >>> 0;
  }
  return [h1, h2, h3, h4, h5, h6, h7, h8].map((n) => (n >>> 0).toString(16).padStart(8, "0")).join("");
}

function runSha256sumCommand(
  session: ShellSession,
  args: string[],
  shortFlags: Set<string>,
  longFlags: Map<string, string | undefined>,
  cwd: string,
): CommandResult {
  const checkMode = shortFlags.has("c") || longFlags.has("check");
  if (args.length === 0) {
    return { output: ["sha256sum: missing file operand"], cwd, exitCode: 1 };
  }

  if (checkMode) {
    const out: string[] = [];
    const changedPaths: string[] = [];
    let failedCount = 0;
    let exitCode = 0;

    for (const checkFileArg of args) {
      const checkFileAbs = resolvePath(cwd, checkFileArg);
      const checkNode = getNodeFrom(session.fs, checkFileAbs);
      if (!checkNode || checkNode.type !== "file") {
        out.push(`sha256sum: ${checkFileArg}: No such file or directory`);
        exitCode = 1;
        continue;
      }
      const { parentPath: checkDir } = splitParentAndName(checkFileAbs);
      const lines = (checkNode.content ?? "")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      for (const line of lines) {
        const m = /^([0-9a-fA-F]{64})\s+\*?(.+)$/.exec(line);
        if (!m) continue;
        const [, expectedHex, targetRel] = m;
        const targetAbs = targetRel.startsWith("/")
          ? resolvePath(cwd, targetRel)
          : resolvePath(cwd, targetRel);
        const fallbackAbs = resolvePath(checkDir, targetRel);
        const targetNode = getNodeFrom(session.fs, targetAbs) ?? getNodeFrom(session.fs, fallbackAbs);
        const resolvedAbs = getNodeFrom(session.fs, targetAbs) ? targetAbs : fallbackAbs;

        if (!targetNode || targetNode.type !== "file") {
          out.push(`sha256sum: ${targetRel}: No such file or directory`);
          out.push(`${targetRel}: FAILED open or read`);
          failedCount += 1;
          exitCode = 1;
          continue;
        }
        const actualHex = computeSha256Hex(targetNode.content ?? "");
        if (actualHex.toLowerCase() === expectedHex.toLowerCase()) {
          out.push(`${targetRel}: OK`);
          session.verifiedChecksums[resolvedAbs] = true;
          session.verifiedChecksums[checkFileAbs] = true;
          changedPaths.push(resolvedAbs);
        } else {
          out.push(`${targetRel}: FAILED`);
          session.verifiedChecksums[resolvedAbs] = false;
          failedCount += 1;
          exitCode = 1;
        }
      }
    }

    if (failedCount > 0) {
      out.push(`sha256sum: WARNING: ${failedCount} computed checksum did NOT match`);
    }
    return {
      output: out,
      cwd,
      exitCode,
      ...(changedPaths.length > 0 ? { changed: { paths: changedPaths, created: [], services: [] } } : {}),
    };
  }

  const out: string[] = [];
  const changedPaths: string[] = [];
  let exitCode = 0;
  for (const arg of args) {
    const absPath = resolvePath(cwd, arg);
    const node = getNodeFrom(session.fs, absPath);
    if (!node) {
      out.push(`sha256sum: ${arg}: No such file or directory`);
      exitCode = 1;
      continue;
    }
    if (node.type === "dir") {
      out.push(`sha256sum: ${arg}: Is a directory`);
      exitCode = 1;
      continue;
    }
    const digest = computeSha256Hex(node.content ?? "");
    out.push(`${digest}  ${arg}`);
    // If there is a companion .sha256 file in the same directory whose hash matches, record verification
    const { parentPath, name } = splitParentAndName(absPath);
    const companionA = getNodeFrom(session.fs, `${absPath}.sha256`);
    const companionB = getNodeFrom(session.fs, `${parentPath}/SHA256SUMS`);
    for (const comp of [companionA, companionB]) {
      if (comp?.type === "file" && (comp.content ?? "").toLowerCase().includes(`${digest.toLowerCase()}  ${name}`.toLowerCase())) {
        session.verifiedChecksums[absPath] = true;
        changedPaths.push(absPath);
      }
    }
  }
  return {
    output: out,
    cwd,
    exitCode,
    ...(changedPaths.length > 0 ? { changed: { paths: changedPaths, created: [], services: [] } } : {}),
  };
}

function executeShellScript(
  session: ShellSession,
  scriptRef: string,
  cwd: string,
  viaInterpreter: boolean,
): CommandResult {
  const absPath = resolvePath(cwd, scriptRef);
  const node = getNodeFrom(session.fs, absPath);
  if (!node) {
    return { output: [`bash: ${scriptRef}: No such file or directory`], cwd, exitCode: 127 };
  }
  if (node.type === "dir") {
    return { output: [`bash: ${scriptRef}: Is a directory`], cwd, exitCode: 126 };
  }
  if (!viaInterpreter && (node.mode & 0o111) === 0) {
    return { output: [`bash: ${scriptRef}: Permission denied`], cwd, exitCode: 126 };
  }
  if ((node.content ?? "").includes("\r")) {
    return {
      output: [`bash: ${scriptRef}: /bin/bash^M: bad interpreter: No such file or directory`],
      cwd,
      exitCode: 126,
    };
  }

  const rawLines = (node.content ?? "").split(/\r?\n/);
  const out: string[] = [];
  const changedPaths: string[] = [absPath];
  const changedCreated: string[] = [];
  const changedServices: string[] = [];
  let currentCwd = cwd;
  let lastExit = 0;

  for (let idx = 0; idx < rawLines.length; idx += 1) {
    const line = rawLines[idx].trim();
    if (!line || line.startsWith("#")) continue;

    const forRes = tryRunForLoop(session, line, currentCwd);
    if (forRes) {
      out.push(...forRes.output);
      currentCwd = forRes.cwd;
      lastExit = forRes.exitCode ?? 0;
      if (forRes.changed) {
        changedPaths.push(...forRes.changed.paths);
        changedCreated.push(...forRes.changed.created);
        changedServices.push(...forRes.changed.services);
      }
      continue;
    }

    const res = runCommandInSession(session, line, currentCwd);
    out.push(...res.output);
    currentCwd = res.cwd;
    lastExit = res.exitCode ?? 0;
    if (res.changed) {
      changedPaths.push(...res.changed.paths);
      changedCreated.push(...res.changed.created);
      changedServices.push(...res.changed.services);
    }
  }

  session.executedScripts[absPath] = out;
  return {
    output: out,
    cwd: currentCwd,
    exitCode: lastExit,
    changed: { paths: changedPaths, created: changedCreated, services: changedServices },
  };
}

export function getEffectiveNofileLimit(session: ShellSession): number {
  let limit = session.nofileSoftLimit ?? 1024;
  const limitsNode = getNodeFrom(session.fs, "/etc/security/limits.conf");
  if (limitsNode?.type === "file" && limitsNode.content) {
    for (const rawLine of limitsNode.content.split(/\r?\n/)) {
      const line = rawLine.replace(/#.*$/, "").trim();
      if (!line) continue;
      const m = /^(?:\*|user|app|app-worker|root)\s+(?:soft|hard|-)\s+nofile\s+(\d+)$/i.exec(line);
      if (m) {
        const val = Number(m[1]);
        if (Number.isFinite(val) && val > limit) {
          limit = val;
        }
      }
    }
  }
  return limit;
}

function runUlimitCommand(session: ShellSession, tokens: string[], shortFlags: Set<string>, cwd: string): CommandResult {
  if (shortFlags.has("a")) {
    const nofile = getEffectiveNofileLimit(session);
    return {
      output: [
        "core file size          (blocks, -c) 0",
        "data seg size           (kbytes, -d) unlimited",
        "scheduling priority             (-e) 0",
        "file size               (blocks, -f) unlimited",
        `open files                      (-n) ${nofile}`,
        "pipe size            (512 bytes, -p) 8",
        "stack size              (kbytes, -s) 8192",
        "cpu time               (seconds, -t) unlimited",
        "max user processes              (-u) 31482",
      ],
      cwd,
      exitCode: 0,
    };
  }

  const numArg = tokens.slice(1).find((t) => /^\d+$/.test(t));
  if (numArg) {
    const newLimit = Number(numArg);
    if (newLimit > session.nofileHardLimit && !shortFlags.has("H")) {
      return { output: ["bash: ulimit: open files: cannot modify limit: Operation not permitted"], cwd, exitCode: 1 };
    }
    session.nofileSoftLimit = newLimit;
    if (shortFlags.has("H")) {
      session.nofileHardLimit = newLimit;
    }
    return {
      output: [],
      cwd,
      exitCode: 0,
      changed: { paths: ["/proc/self/limits"], created: [], services: [] },
    };
  }

  if (shortFlags.has("H") && !shortFlags.has("S")) {
    return { output: [String(session.nofileHardLimit)], cwd, exitCode: 0 };
  }
  return { output: [String(getEffectiveNofileLimit(session))], cwd, exitCode: 0 };
}

function getSimulatedTimestampParts(session: ShellSession): {
  dow: string;
  month: string;
  dayNum: string;
  isoDate: string;
  hms: string;
  year: string;
} {
  const baseMs = Date.UTC(2026, 8, 21, 14, 32, 10);
  const actualMs = baseMs + (session.clockOffsetSeconds ?? 0) * 1000;
  const d = new Date(actualMs);
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dow = dows[d.getUTCDay()];
  const month = months[d.getUTCMonth()];
  const dayNum = String(d.getUTCDate()).padStart(2, "0");
  const year = String(d.getUTCFullYear());
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const isoDate = `${year}-${mm}-${dayNum}`;
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return { dow, month, dayNum, isoDate, hms: `${hh}:${min}:${ss}`, year };
}

function runDateCommand(session: ShellSession, tokens: string[], shortFlags: Set<string>, cwd: string): CommandResult {
  const setVal = matchOptionValueFromTokens(tokens, "-s") ?? matchOptionValueFromTokens(tokens, "--set");
  if (setVal || shortFlags.has("s")) {
    session.clockOffsetSeconds = 0;
    const p = getSimulatedTimestampParts(session);
    return {
      output: [`${p.dow} ${p.month} ${p.dayNum} ${p.hms} UTC ${p.year}`],
      cwd,
      exitCode: 0,
      changed: { paths: ["/dev/rtc0"], created: [], services: [] },
    };
  }
  const p = getSimulatedTimestampParts(session);
  return {
    output: [`${p.dow} ${p.month} ${p.dayNum} ${p.hms} UTC ${p.year}`],
    cwd,
    exitCode: 0,
  };
}

function runTimedatectlCommand(session: ShellSession, args: string[], cwd: string): CommandResult {
  const sub = args[0] ?? "status";
  if (sub === "set-ntp") {
    const val = (args[1] ?? "").toLowerCase();
    const enable = val === "true" || val === "1" || val === "yes" || val === "on";
    session.ntpActive = enable;
    if (enable) {
      if (Math.abs(session.clockOffsetSeconds) < 60) {
        session.clockOffsetSeconds = 0;
        session.ntpSynchronized = true;
      }
      if (session.services.chronyd) {
        session.services.chronyd.running = true;
      }
      syncServiceProcesses(session);
    } else {
      session.ntpSynchronized = false;
    }
    return {
      output: [],
      cwd,
      exitCode: 0,
      changed: { paths: ["/etc/systemd/timesyncd.conf"], created: [], services: ["chronyd"] },
    };
  }

  const p = getSimulatedTimestampParts(session);
  return {
    output: [
      `               Local time: ${p.dow} ${p.isoDate} ${p.hms} UTC`,
      `           Universal time: ${p.dow} ${p.isoDate} ${p.hms} UTC`,
      "                 RTC time: Mon 2026-09-21 14:32:10",
      "                Time zone: Etc/UTC (UTC, +0000)",
      `System clock synchronized: ${session.ntpSynchronized ? "yes" : "no"}`,
      `              NTP service: ${session.ntpActive ? "active" : "inactive"}`,
      "          RTC in local TZ: no",
    ],
    cwd,
    exitCode: 0,
  };
}

function runChronycCommand(session: ShellSession, args: string[], cwd: string): CommandResult {
  const sub = args.find((a) => !a.startsWith("-")) ?? "tracking";
  if (sub === "makestep") {
    session.clockOffsetSeconds = 0;
    session.ntpSynchronized = true;
    session.ntpActive = true;
    if (session.services.chronyd) {
      session.services.chronyd.running = true;
      syncServiceProcesses(session);
    }
    return {
      output: ["200 OK"],
      cwd,
      exitCode: 0,
      changed: { paths: ["/var/lib/chrony/drift"], created: [], services: ["chronyd"] },
    };
  }

  if (sub === "sources") {
    const synced = session.ntpSynchronized && Math.abs(session.clockOffsetSeconds) < 5;
    return {
      output: [
        "MS Name/IP address         Stratum Poll Reach LastRx Last sample",
        "===============================================================================",
        synced
          ? "^* time.cloudflare.com           3   6   377    14    +85ns[ +142ns] +/-   12ms"
          : "^? time.cloudflare.com           0   6     0     -     +0ns[   +0ns] +/-    0ns",
      ],
      cwd,
      exitCode: 0,
    };
  }

  const absOffset = Math.abs(session.clockOffsetSeconds);
  const isSlow = session.clockOffsetSeconds < 0;
  const synced = session.ntpSynchronized && absOffset < 5;
  if (!synced) {
    return {
      output: [
        "Reference ID    : 00000000 ()",
        "Stratum         : 0",
        "Ref time (UTC)  : Thu Jan 01 00:00:00 1970",
        `System time     : ${absOffset.toFixed(9)} seconds ${isSlow ? "slow" : "fast"} of NTP time`,
        `Last offset     : ${session.clockOffsetSeconds.toFixed(9)} seconds`,
        `RMS offset      : ${absOffset.toFixed(9)} seconds`,
        "Leap status     : Not synchronised",
      ],
      cwd,
      exitCode: 0,
    };
  }

  return {
    output: [
      "Reference ID    : A29FC801 (time.cloudflare.com)",
      "Stratum         : 3",
      "Ref time (UTC)  : Mon Sep 21 14:32:09 2026",
      "System time     : 0.000000142 seconds fast of NTP time",
      "Last offset     : +0.000000085 seconds",
      "RMS offset      : 0.000000210 seconds",
      "Leap status     : Normal",
    ],
    cwd,
    exitCode: 0,
  };
}

function tryRunForLoop(session: ShellSession, line: string, cwd: string): CommandResult | null {
  const m = /^for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+(.+?)\s*;\s*do\s+(.+?)\s*;\s*done$/.exec(line);
  if (!m) return null;
  const [, varName, listExprRaw, bodyCmd] = m;
  const listExpr = listExprRaw.trim();
  let items: string[] = [];

  const subshellMatch = /^\$\(([^)]+)\)$/.exec(listExpr) ?? /^`([^`]+)`$/.exec(listExpr);
  if (subshellMatch) {
    const listRes = runCommandInSession(session, subshellMatch[1].trim(), cwd);
    items = listRes.output.flatMap((l) => l.trim().split(/\s+/)).filter(Boolean);
  } else {
    const tokenInfos = tokenizeWithQuotes(`echo ${listExpr}`);
    const expanded = expandCommandTokens(session.fs, cwd, tokenInfos).slice(1);
    items = expanded;
  }

  const out: string[] = [];
  const changedPaths: string[] = [];
  const changedCreated: string[] = [];
  const changedServices: string[] = [];
  let currentCwd = cwd;
  let lastExit = 0;

  for (const item of items) {
    const expandedBody = bodyCmd
      .replace(new RegExp(`"\\$\\{${varName}\\}"|"\\$${varName}\\b"`, "g"), item)
      .replace(new RegExp(`\\$\\{${varName}\\}|\\$${varName}\\b`, "g"), item);
    const bodyRes = runCommandInSession(session, expandedBody, currentCwd);
    out.push(...bodyRes.output);
    currentCwd = bodyRes.cwd;
    lastExit = bodyRes.exitCode ?? 0;
    if (bodyRes.changed) {
      changedPaths.push(...bodyRes.changed.paths);
      changedCreated.push(...bodyRes.changed.created);
      changedServices.push(...bodyRes.changed.services);
    }
  }

  return {
    output: out,
    cwd: currentCwd,
    exitCode: lastExit,
    changed: { paths: changedPaths, created: changedCreated, services: changedServices },
  };
}

function readInputLinesOrFiles(
  session: ShellSession,
  fileArgs: string[],
  stdinLines: string[] | undefined,
  cwd: string,
  toolName: string,
): { lines: string[]; error?: string } {
  if (fileArgs.length === 0) {
    return { lines: [...(stdinLines ?? [])] };
  }
  const all: string[] = [];
  for (const arg of fileArgs) {
    const absPath = resolvePath(cwd, arg);
    const node = getNodeFrom(session.fs, absPath);
    if (!node) {
      return { lines: [], error: `${toolName}: ${arg}: No such file or directory` };
    }
    if (node.type === "dir") {
      return { lines: [], error: `${toolName}: ${arg}: Is a directory` };
    }
    const lines = (node.content ?? "").split(/\r?\n/).filter((l, idx, arr) => idx < arr.length - 1 || l !== "");
    all.push(...lines);
  }
  return { lines: all };
}

function runAwkCommand(
  session: ShellSession,
  tokens: string[],
  stdinLines: string[] | undefined,
  cwd: string,
): CommandResult {
  let fieldSep: string | RegExp = /\s+/;
  const positional: string[] = [];

  for (let i = 1; i < tokens.length; i += 1) {
    const tok = tokens[i];
    if (tok === "-F") {
      fieldSep = tokens[++i] ?? " ";
      continue;
    }
    if (tok.startsWith("-F") && tok.length > 2) {
      fieldSep = tok.slice(2);
      continue;
    }
    positional.push(tok);
  }

  const prog = (positional[0] ?? "").trim();
  const fileArgs = positional.slice(1);
  const { lines, error } = readInputLinesOrFiles(session, fileArgs, stdinLines, cwd, "awk");
  if (error) return { output: [error], cwd, exitCode: 2 };

  // Parse optional condition + `{ print ... }` block
  const blockIdx = prog.indexOf("{");
  const condPart = blockIdx > 0 ? prog.slice(0, blockIdx).trim() : "";
  const actionPart = blockIdx !== -1 ? prog.slice(blockIdx).replace(/^\{|\}$/g, "").trim() : prog;

  const out: string[] = [];
  for (const line of lines) {
    const trimmed = typeof fieldSep === "string" ? line : line.trim();
    if (!trimmed && typeof fieldSep !== "string") continue;
    const fields = typeof fieldSep === "string" ? trimmed.split(fieldSep) : trimmed.split(fieldSep);
    const getField = (idx: number): string => {
      if (idx === 0) return line;
      return fields[idx - 1] ?? "";
    };

    if (condPart) {
      const regexCond = /^\/(.+)\/$/.exec(condPart);
      if (regexCond) {
        if (!new RegExp(regexCond[1]).test(line)) continue;
      } else {
        const eqCond = /^\(?\s*\$(\d+)\s*==\s*['"]?([^)'"\s]+)['"]?\s*\)?$/.exec(condPart);
        if (eqCond) {
          const fVal = getField(Number(eqCond[1]));
          if (fVal !== eqCond[2]) continue;
        }
      }
    }

    const printMatch = /^print(?:\s+(.+))?$/.exec(actionPart);
    if (printMatch) {
      const expr = (printMatch[1] ?? "$0").trim();
      const parts = expr.split(/\s*,\s*/).map((part) => {
        const p = part.trim();
        if (p === "$NF") return fields[fields.length - 1] ?? "";
        const fm = /^\$(\d+)$/.exec(p);
        if (fm) return getField(Number(fm[1]));
        return p.replace(/^['"]|['"]$/g, "");
      });
      out.push(parts.join(" "));
    } else {
      out.push(line);
    }
  }

  return { output: out, cwd, exitCode: 0 };
}

function runSortCommand(
  session: ShellSession,
  args: string[],
  shortFlags: Set<string>,
  longFlags: Map<string, string | undefined>,
  stdinLines: string[] | undefined,
  cwd: string,
): CommandResult {
  const reverse = shortFlags.has("r") || longFlags.has("reverse");
  const numeric = shortFlags.has("n") || longFlags.has("numeric-sort");
  const unique = shortFlags.has("u") || longFlags.has("unique");

  const { lines, error } = readInputLinesOrFiles(session, args, stdinLines, cwd, "sort");
  if (error) return { output: [error], cwd, exitCode: 2 };

  const sorted = [...lines].sort((a, b) => {
    const cmp = numeric ? (parseFloat(a.trim()) || 0) - (parseFloat(b.trim()) || 0) : a.localeCompare(b);
    return reverse ? -cmp : cmp;
  });

  if (unique) {
    const deduped: string[] = [];
    for (const l of sorted) {
      if (deduped.length === 0 || deduped[deduped.length - 1] !== l) {
        deduped.push(l);
      }
    }
    return { output: deduped, cwd, exitCode: 0 };
  }

  return { output: sorted, cwd, exitCode: 0 };
}

function runUniqCommand(
  session: ShellSession,
  args: string[],
  shortFlags: Set<string>,
  longFlags: Map<string, string | undefined>,
  stdinLines: string[] | undefined,
  cwd: string,
): CommandResult {
  const showCount = shortFlags.has("c") || longFlags.has("count");
  const onlyRepeated = shortFlags.has("d") || longFlags.has("repeated");
  const onlyUnique = shortFlags.has("u") || longFlags.has("unique");

  const { lines, error } = readInputLinesOrFiles(session, args, stdinLines, cwd, "uniq");
  if (error) return { output: [error], cwd, exitCode: 1 };

  const groups: Array<{ line: string; count: number }> = [];
  for (const line of lines) {
    const prev = groups[groups.length - 1];
    if (prev && prev.line === line) {
      prev.count += 1;
    } else {
      groups.push({ line, count: 1 });
    }
  }

  const filtered = groups.filter((g) => {
    if (onlyRepeated) return g.count > 1;
    if (onlyUnique) return g.count === 1;
    return true;
  });

  const out = filtered.map((g) => (showCount ? `${String(g.count).padStart(7)} ${g.line}` : g.line));
  return { output: out, cwd, exitCode: 0 };
}

function runCutCommand(
  session: ShellSession,
  tokens: string[],
  args: string[],
  stdinLines: string[] | undefined,
  cwd: string,
): CommandResult {
  let delim = "\t";
  let fieldSpec = "1";
  const consumed = new Set<string>();

  for (let i = 1; i < tokens.length; i += 1) {
    const tok = tokens[i];
    if (tok === "-d") {
      delim = tokens[++i] ?? "\t";
      consumed.add(delim);
    } else if (tok.startsWith("-d") && tok.length > 2) {
      delim = tok.slice(2);
    } else if (tok === "-f") {
      fieldSpec = tokens[++i] ?? "1";
      consumed.add(fieldSpec);
    } else if (tok.startsWith("-f") && tok.length > 2) {
      fieldSpec = tok.slice(2);
    }
  }

  const fileArgs = args.filter((a) => !consumed.has(a));
  const { lines, error } = readInputLinesOrFiles(session, fileArgs, stdinLines, cwd, "cut");
  if (error) return { output: [error], cwd, exitCode: 1 };

  const fieldNums = fieldSpec
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 1);

  const out = lines.map((line) => {
    const parts = line.split(delim);
    return fieldNums.map((n) => parts[n - 1] ?? "").join(delim);
  });
  return { output: out, cwd, exitCode: 0 };
}

function runTrCommand(
  tokens: string[],
  shortFlags: Set<string>,
  stdinLines: string[] | undefined,
  cwd: string,
): CommandResult {
  const nonFlag = tokens.slice(1).filter((t) => !t.startsWith("-"));
  const set1 = nonFlag[0] ?? "";
  const set2 = nonFlag[1] ?? "";
  const squeeze = shortFlags.has("s");
  const del = shortFlags.has("d");

  const lines = stdinLines ?? [];
  const out = lines.map((line) => {
    if (del && set1) {
      return line.split("").filter((ch) => !set1.includes(ch)).join("");
    }
    if (squeeze && set1 === " ") {
      return line.replace(/ +/g, set2 || " ");
    }
    if (set1 === "[:lower:]" && set2 === "[:upper:]") return line.toUpperCase();
    if (set1 === "[:upper:]" && set2 === "[:lower:]") return line.toLowerCase();
    if (set1 && set2) {
      return line
        .split("")
        .map((ch) => {
          const idx = set1.indexOf(ch);
          return idx !== -1 ? (set2[Math.min(idx, set2.length - 1)] ?? ch) : ch;
        })
        .join("");
    }
    return line;
  });
  return { output: out, cwd, exitCode: 0 };
}

function runDiffCommand(session: ShellSession, args: string[], cwd: string): CommandResult {
  if (args.length < 2) {
    return { output: ["diff: missing operand"], cwd, exitCode: 2 };
  }
  const nodeA = getNodeFrom(session.fs, resolvePath(cwd, args[0]));
  const nodeB = getNodeFrom(session.fs, resolvePath(cwd, args[1]));
  if (!nodeA) return { output: [`diff: ${args[0]}: No such file or directory`], cwd, exitCode: 2 };
  if (!nodeB) return { output: [`diff: ${args[1]}: No such file or directory`], cwd, exitCode: 2 };
  const textA = (nodeA.content ?? "").trimEnd();
  const textB = (nodeB.content ?? "").trimEnd();
  if (textA === textB) {
    return { output: [], cwd, exitCode: 0 };
  }
  return {
    output: [`< ${textA.split("\n")[0] ?? ""}`, "---", `> ${textB.split("\n")[0] ?? ""}`],
    cwd,
    exitCode: 1,
  };
}

export const GZIP_MAGIC_PREFIX = "\u001f\u008b\b\u0000";

function runGzipCommand(
  session: ShellSession,
  toolName: string,
  args: string[],
  shortFlags: Set<string>,
  longFlags: Map<string, string | undefined>,
  cwd: string,
): CommandResult {
  const testMode = shortFlags.has("t") || longFlags.has("test");
  const decompress = toolName === "gunzip" || shortFlags.has("d") || longFlags.has("decompress");
  const keep = shortFlags.has("k") || longFlags.has("keep");

  if (args.length === 0) {
    return { output: [`${toolName}: missing file operand`], cwd, exitCode: 1 };
  }

  const out: string[] = [];
  const changedPaths: string[] = [];
  const changedCreated: string[] = [];
  let exitCode = 0;

  for (const arg of args) {
    const absPath = resolvePath(cwd, arg);
    const node = getNodeFrom(session.fs, absPath);
    if (!node) {
      out.push(`${toolName}: ${arg}: No such file or directory`);
      exitCode = 1;
      continue;
    }
    if (node.type === "dir") {
      out.push(`${toolName}: ${arg}: is a directory -- ignored`);
      exitCode = 2;
      continue;
    }

    if (testMode) {
      if (!absPath.endsWith(".gz") || !(node.content ?? "").startsWith(GZIP_MAGIC_PREFIX)) {
        out.push(`${toolName}: ${arg}: not in gzip format`);
        exitCode = 1;
      }
      continue;
    }

    const { parentPath, name: fileName } = splitParentAndName(absPath);
    const parent = getNodeFrom(session.fs, parentPath);
    if (!parent || !parent.children) continue;

    if (decompress) {
      if (!fileName.endsWith(".gz")) {
        out.push(`${toolName}: ${arg}: unknown suffix -- ignored`);
        exitCode = 2;
        continue;
      }
      const rawName = fileName.slice(0, -3);
      const rawAbs = parentPath === "/" ? `/${rawName}` : `${parentPath}/${rawName}`;
      const rawContent = (node.content ?? "").startsWith(GZIP_MAGIC_PREFIX)
        ? (node.content ?? "").slice(GZIP_MAGIC_PREFIX.length)
        : (node.content ?? "");
      parent.children[rawName] = {
        name: rawName,
        type: "file",
        mode: node.mode,
        owner: node.owner,
        group: node.group,
        size: rawContent.length,
        mtime: "Sep 21 14:40",
        content: rawContent,
      };
      changedCreated.push(rawAbs);
      if (!keep) {
        delete parent.children[fileName];
        changedPaths.push(absPath);
      }
      continue;
    }

    if (fileName.endsWith(".gz")) {
      out.push(`${toolName}: ${arg} already has .gz suffix -- unchanged`);
      continue;
    }

    const gzName = `${fileName}.gz`;
    const gzAbs = parentPath === "/" ? `/${gzName}` : `${parentPath}/${gzName}`;
    const gzContent = `${GZIP_MAGIC_PREFIX}${node.content ?? ""}`;
    parent.children[gzName] = {
      name: gzName,
      type: "file",
      mode: node.mode,
      owner: node.owner,
      group: node.group,
      size: Math.max(32, Math.ceil(node.size * 0.35)),
      mtime: "Sep 21 14:40",
      content: gzContent,
    };
    changedCreated.push(gzAbs);
    if (!keep) {
      delete parent.children[fileName];
      changedPaths.push(absPath);
    }
  }

  return {
    output: out,
    cwd,
    exitCode,
    ...(changedPaths.length > 0 || changedCreated.length > 0
      ? { changed: { paths: changedPaths, created: changedCreated, services: [] } }
      : {}),
  };
}

function syncPasswdAndGroupFiles(session: ShellSession): void {
  const passwdLines: string[] = [];
  const groupMembers: Record<string, Set<string>> = {};

  for (const grp of Object.keys(GROUP_GIDS)) {
    groupMembers[grp] = new Set();
  }

  for (const [uname, acct] of Object.entries(session.users)) {
    const home = acct.home ?? (uname === "root" ? "/root" : `/home/${uname}`);
    const shell = acct.shell ?? "/bin/bash";
    passwdLines.push(`${uname}:x:${acct.uid}:${acct.gid}:${uname}:${home}:${shell}`);
    for (const grp of acct.groups) {
      if (!groupMembers[grp]) {
        GROUP_GIDS[grp] = acct.gid;
        groupMembers[grp] = new Set();
      }
      if (grp !== acct.primaryGroup) {
        groupMembers[grp].add(uname);
      }
    }
  }

  putFileInSession(session, "/etc/passwd", {
    mode: 0o644,
    owner: "root",
    group: "root",
    content: `${passwdLines.join("\n")}\n`,
  });

  const groupLines: string[] = [];
  for (const [grp, gid] of Object.entries(GROUP_GIDS)) {
    const members = Array.from(groupMembers[grp] ?? []).join(",");
    groupLines.push(`${grp}:x:${gid}:${members}`);
  }
  putFileInSession(session, "/etc/group", {
    mode: 0o644,
    owner: "root",
    group: "root",
    content: `${groupLines.join("\n")}\n`,
  });
}

function runUseraddCommand(
  session: ShellSession,
  tokens: string[],
  shortFlags: Set<string>,
  longFlags: Map<string, string | undefined>,
  cwd: string,
): CommandResult {
  const createHome = shortFlags.has("m") || longFlags.has("create-home");
  const shellOpt = matchOptionValueFromTokens(tokens, "-s") ?? longFlags.get("shell") ?? "/bin/bash";
  const groupsOpt = matchOptionValueFromTokens(tokens, "-G") ?? longFlags.get("groups") ?? "";
  const primaryOpt = matchOptionValueFromTokens(tokens, "-g") ?? longFlags.get("gid") ?? "";

  const consumed = new Set([shellOpt, groupsOpt, primaryOpt].filter(Boolean));
  const username = tokens.slice(1).find((t) => !t.startsWith("-") && !consumed.has(t));
  if (!username) {
    return { output: ["Usage: useradd [options] LOGIN"], cwd, exitCode: 2 };
  }
  if (session.users[username]) {
    return { output: [`useradd: user '${username}' already exists`], cwd, exitCode: 9 };
  }

  const maxUid = Object.values(session.users).reduce((max, u) => Math.max(max, u.uid), 1002);
  const uid = maxUid + 1;
  const primaryGroup = primaryOpt || username;
  const gid = GROUP_GIDS[primaryGroup] ?? uid;
  GROUP_GIDS[primaryGroup] = gid;

  const extraGroups = groupsOpt
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  const allGroups = Array.from(new Set([primaryGroup, ...extraGroups]));
  const homePath = `/home/${username}`;

  session.users[username] = {
    uid,
    gid,
    primaryGroup,
    groups: allGroups,
    passwordSet: false,
    home: homePath,
    shell: shellOpt,
  };

  const changedCreated: string[] = [];
  if (createHome) {
    ensureDirInSession(session, homePath, { mode: 0o750, owner: username, group: primaryGroup });
    changedCreated.push(homePath);
  }
  syncPasswdAndGroupFiles(session);

  return {
    output: [],
    cwd,
    exitCode: 0,
    changed: { paths: ["/etc/passwd", "/etc/group"], created: changedCreated, services: [] },
  };
}

function runUsermodCommand(
  session: ShellSession,
  tokens: string[],
  shortFlags: Set<string>,
  longFlags: Map<string, string | undefined>,
  cwd: string,
): CommandResult {
  const append = shortFlags.has("a") || longFlags.has("append");
  const groupsOpt =
    matchOptionValueFromTokens(tokens, "-G") ??
    matchOptionValueFromTokens(tokens, "-aG") ??
    matchOptionValueFromTokens(tokens, "-Ga") ??
    longFlags.get("groups") ??
    "";
  const shellOpt = matchOptionValueFromTokens(tokens, "-s") ?? longFlags.get("shell") ?? "";

  const consumed = new Set([groupsOpt, shellOpt].filter(Boolean));
  const username = tokens.slice(1).find((t) => !t.startsWith("-") && !consumed.has(t));
  if (!username) {
    return { output: ["Usage: usermod [options] LOGIN"], cwd, exitCode: 2 };
  }
  const acct = session.users[username];
  if (!acct) {
    return { output: [`usermod: user '${username}' does not exist`], cwd, exitCode: 6 };
  }

  if (groupsOpt) {
    const newGroups = groupsOpt
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);
    for (const g of newGroups) {
      if (GROUP_GIDS[g] === undefined) {
        GROUP_GIDS[g] = 1050 + Object.keys(GROUP_GIDS).length;
      }
    }
    acct.groups = append
      ? Array.from(new Set([...acct.groups, ...newGroups]))
      : Array.from(new Set([acct.primaryGroup, ...newGroups]));
  }

  if (shellOpt) {
    acct.shell = shellOpt;
  }

  syncPasswdAndGroupFiles(session);
  return {
    output: [],
    cwd,
    exitCode: 0,
    changed: { paths: ["/etc/passwd", "/etc/group"], created: [], services: [] },
  };
}

function runPasswdCommand(
  session: ShellSession,
  args: string[],
  shortFlags: Set<string>,
  longFlags: Map<string, string | undefined>,
  cwd: string,
): CommandResult {
  const username = args[0] ?? "user";
  const acct = session.users[username];
  if (!acct) {
    return { output: [`passwd: user '${username}' does not exist`], cwd, exitCode: 1 };
  }
  if (shortFlags.has("S") || longFlags.has("status")) {
    return {
      output: [`${username} ${acct.passwordSet ? "P" : "L"} 2026-09-21 0 99999 7 -1`],
      cwd,
      exitCode: 0,
    };
  }
  acct.passwordSet = true;
  return {
    output: [
      `Changing password for user ${username}.`,
      "passwd: all authentication tokens updated successfully.",
    ],
    cwd,
    exitCode: 0,
    changed: { paths: ["/etc/shadow"], created: [], services: [] },
  };
}

export function hasWorkingDns(session: ShellSession): boolean {
  const resolv = getNodeFrom(session.fs, "/etc/resolv.conf");
  if (!resolv || resolv.type !== "file" || !resolv.content) return false;
  for (const rawLine of resolv.content.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = /^nameserver\s+(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i.exec(line);
    if (!m) continue;
    const octets = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
    if (octets.some((o) => o < 0 || o > 255)) continue;
    const ip = octets.join(".");
    // 0.0.0.0 or dead loopback stub 127.0.0.53 (when systemd-resolved is broken) do not resolve
    if (ip === "0.0.0.0" || ip === "127.0.0.53" || ip === "127.0.0.1") continue;
    return true;
  }
  return false;
}

function runPingCommand(session: ShellSession, tokens: string[], cwd: string): CommandResult {
  const countOpt = matchOptionValueFromTokens(tokens, "-c");
  const target = tokens
    .slice(1)
    .find((t) => !t.startsWith("-") && t !== countOpt);
  if (!target) {
    return { output: ["ping: usage error: Destination address required"], cwd, exitCode: 1 };
  }

  const isIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(target) || target === "localhost";
  if (!isIp && !hasWorkingDns(session)) {
    return {
      output: [`ping: ${target}: Temporary failure in name resolution`],
      cwd,
      exitCode: 2,
    };
  }

  const resolvedIp = isIp ? (target === "localhost" ? "127.0.0.1" : target) : "93.184.215.14";
  return {
    output: [
      `PING ${target} (${resolvedIp}) 56(84) bytes of data.`,
      `64 bytes from ${resolvedIp}: icmp_seq=1 ttl=56 time=11.8 ms`,
      "",
      `--- ${target} ping statistics ---`,
      "1 packets transmitted, 1 received, 0% packet loss, time 0ms",
    ],
    cwd,
    exitCode: 0,
  };
}

function runDigCommand(session: ShellSession, toolName: string, tokens: string[], cwd: string): CommandResult {
  const explicitServer = tokens.slice(1).find((t) => t.startsWith("@"));
  const domain =
    tokens
      .slice(1)
      .find((t) => !t.startsWith("-") && !t.startsWith("@") && !["A", "AAAA", "MX", "TXT", "NS"].includes(t.toUpperCase())) ??
    "example.com";

  const canResolve =
    (explicitServer && explicitServer !== "@127.0.0.53" && explicitServer !== "@127.0.0.1") ||
    hasWorkingDns(session);

  if (!canResolve) {
    return {
      output: [
        `; <<>> DiG 9.18.24 <<>> ${domain}`,
        ";; global options: +cmd",
        ";; connection timed out; no servers could be reached",
      ],
      cwd,
      exitCode: 9,
    };
  }

  if (toolName === "nslookup") {
    return {
      output: [
        "Server:\t\t8.8.8.8",
        "Address:\t8.8.8.8#53",
        "",
        "Non-authoritative answer:",
        `Name:\t${domain}`,
        "Address: 93.184.215.14",
      ],
      cwd,
      exitCode: 0,
    };
  }

  return {
    output: [
      `; <<>> DiG 9.18.24 <<>> ${domain}`,
      ";; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 48210",
      ";; QUESTION SECTION:",
      `;${domain}.\t\t\tIN\tA`,
      "",
      ";; ANSWER SECTION:",
      `${domain}.\t\t300\tIN\tA\t93.184.215.14`,
      "",
      ";; Query time: 12 msec",
    ],
    cwd,
    exitCode: 0,
  };
}

function runPartedCommand(session: ShellSession, args: string[], cwd: string): CommandResult {
  const dev = args[0] ?? "";
  const disk = session.disks[dev];
  if (!disk) {
    return { output: [`Error: Could not stat device ${dev} - No such file or directory.`], cwd, exitCode: 1 };
  }
  const sub = (args[1] ?? "print").toLowerCase();
  if (sub === "mklabel" || sub === "mktable") {
    const labelType = (args[2] ?? "").toLowerCase();
    if (labelType !== "gpt" && labelType !== "msdos") {
      return { output: [`parted: invalid token: ${labelType}`], cwd, exitCode: 1 };
    }
    disk.label = labelType;
    disk.partitions = [];
    return { output: [], cwd, exitCode: 0, changed: { paths: [dev], created: [], services: [] } };
  }
  if (sub === "mkpart") {
    if (!disk.label) {
      return { output: [`Error: ${dev}: unrecognised disk label`], cwd, exitCode: 1 };
    }
    const endSpec = args[args.length - 1] ?? "10G";
    const partNum = disk.partitions.length + 1;
    const partDev = `${dev}${partNum}`;
    disk.partitions.push({ name: partDev, sizeLabel: endSpec });
    return {
      output: [],
      cwd,
      exitCode: 0,
      changed: { paths: [dev], created: [partDev], services: [] },
    };
  }
  return {
    output: [
      `Model: Virtio Block Device (virtblk)`,
      `Disk ${dev}: ${humanSize(disk.sizeBytes)}`,
      `Partition Table: ${disk.label ?? "unknown"}`,
      ...disk.partitions.map((p, i) => ` ${i + 1}      1049kB  ${p.sizeLabel}   ${p.sizeLabel}   primary   ${p.fsType ?? ""}`),
    ],
    cwd,
    exitCode: 0,
  };
}

function runMkfsCommand(
  session: ShellSession,
  toolName: string,
  tokens: string[],
  args: string[],
  cwd: string,
): CommandResult {
  const typeOpt = toolName === "mkfs.ext4" ? "ext4" : (matchOptionValueFromTokens(tokens, "-t") ?? "ext4");
  const targetDev = args.find((a) => a.startsWith("/dev/")) ?? "";
  if (!targetDev) {
    return { output: [`Usage: ${toolName} /dev/<partition>`], cwd, exitCode: 1 };
  }
  for (const disk of Object.values(session.disks)) {
    const part = disk.partitions.find((p) => p.name === targetDev);
    if (part) {
      part.fsType = typeOpt;
      return {
        output: [
          `mke2fs 1.47.0 (5-Feb-2023)`,
          `Creating filesystem with 2621440 4k blocks and 655360 inodes`,
          `Allocating group tables: done`,
          `Writing superblocks and filesystem accounting information: done`,
        ],
        cwd,
        exitCode: 0,
        changed: { paths: [targetDev], created: [], services: [] },
      };
    }
  }
  return { output: [`${toolName}: ${targetDev}: No such file or directory`], cwd, exitCode: 1 };
}

function runLsblkCommand(session: ShellSession, cwd: string): CommandResult {
  const lines = [
    "NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS",
    "sda      8:0    0   40G  0 disk ",
    "└─sda1   8:1    0   40G  0 part /",
    "sdb      8:16   0  100G  0 disk ",
    "└─sdb1   8:17   0  100G  0 part /home",
  ];
  for (const disk of Object.values(session.disks)) {
    const shortDisk = disk.device.replace(/^\/dev\//, "");
    lines.push(`${shortDisk.padEnd(6)}   8:32   0   ${humanSize(disk.sizeBytes).padStart(3)}  0 disk `);
    for (const p of disk.partitions) {
      const shortPart = p.name.replace(/^\/dev\//, "");
      lines.push(`└─${shortPart.padEnd(4)}   8:33   0   ${p.sizeLabel.padStart(3)}  0 part `);
    }
  }
  return { output: lines, cwd, exitCode: 0 };
}

function runBlkidCommand(session: ShellSession, args: string[], cwd: string): CommandResult {
  const filterDev = args[0];
  const lines: string[] = [];
  if (!filterDev || filterDev === "/dev/sda1") {
    lines.push('/dev/sda1: UUID="a1b2c3d4-0001" TYPE="ext4"');
  }
  for (const disk of Object.values(session.disks)) {
    for (const p of disk.partitions) {
      if ((!filterDev || filterDev === p.name) && p.fsType) {
        lines.push(`${p.name}: UUID="e4f5a6b7-1001" TYPE="${p.fsType}"`);
      }
    }
  }
  return { output: lines, cwd, exitCode: 0 };
}

function runLvmCommand(
  session: ShellSession,
  name: string,
  tokens: string[],
  args: string[],
  shortFlags: Set<string>,
  longFlags: Map<string, string | undefined>,
  cwd: string,
): CommandResult {
  switch (name) {
    case "pvs": {
      const rows = session.lvm.pvs.map((pv) => `  ${pv.padEnd(10)} vgdata lvm2 a--  10.00g 10.00g`);
      return { output: ["  PV         VG     Fmt  Attr PSize  PFree", ...rows], cwd, exitCode: 0 };
    }
    case "vgs": {
      const rows = Object.entries(session.lvm.vgs).map(
        ([vg, info]) => `  ${vg.padEnd(10)}   ${info.pvs.length}   1   0 wz--n- 20.00g ${info.freeGiB.toFixed(2)}g`,
      );
      return { output: ["  VG         #PV #LV #SN Attr   VSize  VFree", ...rows], cwd, exitCode: 0 };
    }
    case "lvs": {
      const rows = Object.entries(session.lvm.lvs).map(
        ([lvPath, info]) =>
          `  ${info.name.padEnd(12)} ${info.vg.padEnd(10)} -wi-${info.active ? "ao" : "--"}---- ${info.sizeGiB.toFixed(2)}g (${lvPath})`,
      );
      return { output: ["  LV           VG         Attr       LSize", ...rows], cwd, exitCode: 0 };
    }
    case "pvcreate": {
      const dev = args[0] ?? "";
      if (!dev.startsWith("/dev/")) {
        return { output: ["  Please enter a physical volume path."], cwd, exitCode: 1 };
      }
      if (!session.lvm.pvs.includes(dev)) {
        session.lvm.pvs.push(dev);
      }
      return {
        output: [`  Physical volume "${dev}" successfully created.`],
        cwd,
        exitCode: 0,
        changed: { paths: [dev], created: [], services: [] },
      };
    }
    case "vgextend": {
      const [vgName, pvDev] = args;
      const vg = session.lvm.vgs[vgName ?? ""];
      if (!vg || !pvDev) {
        return { output: [`  Volume group "${vgName ?? ""}" not found.`], cwd, exitCode: 5 };
      }
      if (!session.lvm.pvs.includes(pvDev)) {
        session.lvm.pvs.push(pvDev);
      }
      if (!vg.pvs.includes(pvDev)) {
        vg.pvs.push(pvDev);
        vg.freeGiB += 10;
      }
      return {
        output: [`  Volume group "${vgName}" successfully extended`],
        cwd,
        exitCode: 0,
        changed: { paths: [`/dev/${vgName}`], created: [], services: [] },
      };
    }
    case "lvextend": {
      const sizeOpt = matchOptionValueFromTokens(tokens, "-L") ?? "";
      const lvTarget = args.find((a) => a.startsWith("/dev/")) ?? "/dev/mapper/vgdata-data";
      const lv =
        session.lvm.lvs[lvTarget] ??
        (lvTarget === "/dev/vgdata/data" ? session.lvm.lvs["/dev/mapper/vgdata-data"] : undefined);
      if (!lv) {
        return { output: [`  Logical volume "${lvTarget}" not found.`], cwd, exitCode: 5 };
      }
      const vg = session.lvm.vgs[lv.vg];
      const addMatch = /^\+?(\d+)\s*[gG][bB]?$/.exec(sizeOpt);
      const addGiB = addMatch ? Number(addMatch[1]) : 10;
      if (vg && vg.freeGiB < addGiB) {
        return { output: [`  Insufficient free space: ${addGiB}GB needed, only ${vg.freeGiB}GB available`], cwd, exitCode: 5 };
      }
      if (vg) vg.freeGiB = Math.max(0, vg.freeGiB - addGiB);
      lv.sizeGiB += addGiB;
      if (shortFlags.has("r") || longFlags.has("resizefs")) {
        lv.fsSizeGiB = lv.sizeGiB;
        const dataMount = session.mounts.find((m) => m.device === "/dev/mapper/vgdata-data");
        if (dataMount) dataMount.totalBytes = lv.fsSizeGiB * GiB;
      }
      return {
        output: [`  Size of logical volume ${lv.vg}/${lv.name} changed to ${lv.sizeGiB.toFixed(2)} GiB.`, `  Logical volume ${lv.vg}/${lv.name} successfully resized.`],
        cwd,
        exitCode: 0,
        changed: { paths: [lvTarget], created: [], services: [] },
      };
    }
    case "resize2fs": {
      const lvTarget = args[0] ?? "/dev/mapper/vgdata-data";
      const lv =
        session.lvm.lvs[lvTarget] ??
        (lvTarget === "/dev/vgdata/data" ? session.lvm.lvs["/dev/mapper/vgdata-data"] : undefined);
      if (!lv) {
        return { output: [`resize2fs: No such device or address while trying to open ${lvTarget}`], cwd, exitCode: 1 };
      }
      lv.fsSizeGiB = lv.sizeGiB;
      const dataMount = session.mounts.find((m) => m.device === "/dev/mapper/vgdata-data");
      if (dataMount) {
        dataMount.totalBytes = lv.fsSizeGiB * GiB;
      }
      return {
        output: [
          "resize2fs 1.47.0 (5-Feb-2023)",
          `Filesystem at ${lvTarget} is mounted on /data; on-line resizing required`,
          `The filesystem on ${lvTarget} is now ${lv.fsSizeGiB * 262144} (4k) blocks long.`,
        ],
        cwd,
        exitCode: 0,
        changed: { paths: [lvTarget], created: [], services: [] },
      };
    }
    case "vgcfgrestore": {
      if (longFlags.has("list") || shortFlags.has("l")) {
        return {
          output: [
            "  File:        /etc/lvm/archive/vg_replays_00041.vg",
            "  VG name:     vg_replays",
            "  Description: Created *before* executing 'lvremove /dev/vg_replays/lv_matches'",
            "  Backup Time: Mon Sep 21 13:55:10 2026",
            "",
            "  File:        /etc/lvm/archive/vg_replays_00042.vg",
            "  VG name:     vg_replays",
            "  Description: Created *after* executing 'lvremove /dev/vg_replays/lv_matches'",
            "  Backup Time: Mon Sep 21 13:55:12 2026",
          ],
          cwd,
          exitCode: 0,
        };
      }
      const fileOpt = matchOptionValueFromTokens(tokens, "-f") ?? "";
      const vgName = args.find((a) => a !== fileOpt && !a.startsWith("-")) ?? "vg_replays";
      if (!fileOpt || !getNodeFrom(session.fs, resolvePath(cwd, fileOpt))) {
        return { output: [`  Couldn't find archive file '${fileOpt}'.`], cwd, exitCode: 5 };
      }
      session.lvm.restoredVgs[vgName] = true;
      session.lvm.vgs[vgName] = { pvs: ["/dev/sde1"], freeGiB: 0 };
      session.lvm.lvs["/dev/vg_replays/lv_matches"] = {
        vg: vgName,
        name: "lv_matches",
        sizeGiB: 15,
        fsSizeGiB: 15,
        active: false,
      };
      return {
        output: [`  Restored volume group ${vgName}.`],
        cwd,
        exitCode: 0,
        changed: { paths: [`/dev/${vgName}`], created: ["/dev/vg_replays/lv_matches"], services: [] },
      };
    }
    case "lvchange": {
      const activateVal = matchOptionValueFromTokens(tokens, "-a") ?? (tokens.includes("-ay") ? "y" : "");
      const lvPath = args.find((a) => a.startsWith("/dev/")) ?? "/dev/vg_replays/lv_matches";
      const lv = session.lvm.lvs[lvPath];
      if (!lv) {
        return { output: [`  Logical volume "${lvPath}" not found.`], cwd, exitCode: 5 };
      }
      lv.active = activateVal.startsWith("y");
      return {
        output: [],
        cwd,
        exitCode: 0,
        changed: { paths: [lvPath], created: [], services: [] },
      };
    }
    default:
      return { output: [], cwd, exitCode: 0 };
  }
}

function runMountCommand(session: ShellSession, args: string[], shortFlags: Set<string>, cwd: string): CommandResult {
  if (shortFlags.has("a")) {
    const fstab = getNodeFrom(session.fs, "/etc/fstab");
    const content = fstab?.content ?? "";
    const changedPaths: string[] = [];
    if (content.includes("/srv/replays") && session.lvm.lvs["/dev/vg_replays/lv_matches"]?.active) {
      session.mountedShares["/srv/replays"] = true;
      ensureDirInSession(session, "/srv/replays", { mode: 0o755, owner: "root", group: "root" });
      putFileInSession(session, "/srv/replays/finals-match-01.rec", {
        mode: 0o644,
        owner: "user",
        group: "user",
        content: "MATCH_REPLAY_HEADER v2.1 teams=alpha-vs-omega winner=alpha\n",
      });
      changedPaths.push("/srv/replays");
    }
    return {
      output: [],
      cwd,
      exitCode: 0,
      changed: { paths: changedPaths, created: [], services: [] },
    };
  }
  const lines = session.mounts.map((m) => `${m.device} on ${m.mountPoint} type ${m.fsType} (rw,relatime)`);
  for (const mp of Object.keys(session.mountedShares)) {
    if (session.mountedShares[mp]) {
      lines.push(`/dev/mapper/vg_replays-lv_matches on ${mp} type ext4 (rw,relatime)`);
    }
  }
  if (args.length >= 2) {
    const [dev, mp] = args;
    session.mountedShares[mp] = true;
    return { output: [], cwd, exitCode: 0, changed: { paths: [mp, dev], created: [], services: [] } };
  }
  return { output: lines, cwd, exitCode: 0 };
}

function runUfwCommand(session: ShellSession, args: string[], cwd: string): CommandResult {
  const sub = (args[0] ?? "status").toLowerCase();
  if (sub === "status") {
    if (!session.ufw.enabled) {
      return { output: ["Status: inactive"], cwd, exitCode: 0 };
    }
    const rows = session.ufw.allowed.map((rule) => `${rule.padEnd(26)} ALLOW       Anywhere`);
    return {
      output: [
        "Status: active",
        "",
        "To                         Action      From",
        "--                         ------      ----",
        ...rows,
      ],
      cwd,
      exitCode: 0,
    };
  }
  if (sub === "allow") {
    const ruleRaw = (args[1] ?? "").toLowerCase();
    if (!ruleRaw) {
      return { output: ["ERROR: Need a port or service name"], cwd, exitCode: 1 };
    }
    const normalized = ruleRaw === "ssh" || ruleRaw === "22" ? "22/tcp" : ruleRaw;
    if (!session.ufw.allowed.includes(normalized)) {
      session.ufw.allowed.push(normalized);
    }
    return {
      output: ["Rule added", "Rule added (v6)"],
      cwd,
      exitCode: 0,
      changed: { paths: ["/etc/ufw/user.rules"], created: [], services: ["ufw"] },
    };
  }
  if (sub === "disable") {
    session.ufw.enabled = false;
    return {
      output: ["Firewall stopped and disabled on system startup"],
      cwd,
      exitCode: 0,
      changed: { paths: ["/etc/ufw/ufw.conf"], created: [], services: ["ufw"] },
    };
  }
  if (sub === "enable") {
    session.ufw.enabled = true;
    return {
      output: ["Firewall is active and enabled on system startup"],
      cwd,
      exitCode: 0,
      changed: { paths: ["/etc/ufw/ufw.conf"], created: [], services: ["ufw"] },
    };
  }
  return { output: [`ERROR: Invalid syntax`], cwd, exitCode: 1 };
}

function runUmountCommand(session: ShellSession, args: string[], cwd: string): CommandResult {
  const target = (args[0] ?? "").replace(/\/+$/, "") || "/";
  if (!target || args.length === 0) {
    return { output: ["umount: bad usage"], cwd, exitCode: 1 };
  }
  const busyProc = session.processes.find((p) => p.command.includes(target));
  if (busyProc) {
    return {
      output: [`umount: ${target}: target is busy.`],
      cwd,
      exitCode: 32,
    };
  }
  if (session.mountedShares[target]) {
    session.mountedShares[target] = false;
    return {
      output: [],
      cwd,
      exitCode: 0,
      changed: { paths: [target], created: [], services: [] },
    };
  }
  return { output: [`umount: ${target}: not mounted.`], cwd, exitCode: 32 };
}

function runFuserCommand(
  session: ShellSession,
  args: string[],
  shortFlags: Set<string>,
  cwd: string,
): CommandResult {
  const target = (args[0] ?? "").replace(/\/+$/, "");
  if (!target) {
    return { output: ["No process specification given"], cwd, exitCode: 1 };
  }
  const holders = session.processes.filter((p) => p.command.includes(target));
  if (holders.length === 0) {
    return { output: [], cwd, exitCode: 1 };
  }
  if (shortFlags.has("k")) {
    const killedPids = holders.map((h) => h.pid);
    session.processes = session.processes.filter((p) => !killedPids.includes(p.pid));
    return {
      output: [`${target}: ${killedPids.map((id) => `${id}c`).join(" ")}`],
      cwd,
      exitCode: 0,
      changed: { paths: [`/proc/${killedPids[0] ?? 0}`], created: [], services: [] },
    };
  }
  if (shortFlags.has("v")) {
    return {
      output: [
        "                     USER        PID ACCESS COMMAND",
        ...holders.map(
          (h) => `${target.padEnd(20)} ${h.user.padEnd(10)} ${String(h.pid).padStart(4)} ..c.. ${h.procName}`,
        ),
      ],
      cwd,
      exitCode: 0,
    };
  }
  return {
    output: [`${target}: ${holders.map((h) => `${h.pid}c`).join(" ")}`],
    cwd,
    exitCode: 0,
  };
}

function runDos2UnixCommand(session: ShellSession, args: string[], cwd: string): CommandResult {
  if (args.length === 0) {
    return { output: ["dos2unix: missing file operand"], cwd, exitCode: 1 };
  }
  const out: string[] = [];
  const changedPaths: string[] = [];
  let exitCode = 0;

  for (const arg of args) {
    const absPath = resolvePath(cwd, arg);
    const node = getNodeFrom(session.fs, absPath);
    if (!node || node.type !== "file") {
      out.push(`dos2unix: ${arg}: No such file or directory`);
      exitCode = 1;
      continue;
    }
    node.content = (node.content ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "");
    node.size = node.content.length;
    out.push(`dos2unix: converting file ${arg} to Unix format...`);
    changedPaths.push(absPath);
  }
  return {
    output: out,
    cwd,
    exitCode,
    changed: { paths: changedPaths, created: [], services: [] },
  };
}

function runSedCommand(
  session: ShellSession,
  tokens: string[],
  args: string[],
  shortFlags: Set<string>,
  stdinLines: string[] | undefined,
  cwd: string,
): CommandResult {
  const inPlace = shortFlags.has("i");
  const expr = args[0] ?? "";
  const fileArgs = args.slice(1);
  if (!expr) {
    return { output: ["sed: no script specified"], cwd, exitCode: 1 };
  }

  const applySedToContent = (text: string): string => {
    if (expr.includes("\\r") && expr.startsWith("s/")) {
      return text.replace(/\r\n/g, "\n").replace(/\r/g, "");
    }
    const delMatch = /^\/(.+)\/d$/.exec(expr);
    if (delMatch) {
      const re = new RegExp(delMatch[1]);
      return text
        .split(/\r?\n/)
        .filter((l) => !re.test(l))
        .join("\n");
    }
    const subMatch = /^s\/([^/]*)\/([^/]*)\/([gi]*)$/.exec(expr);
    if (subMatch) {
      const [, pat, rep, flags] = subMatch;
      const re = new RegExp(pat, flags.includes("g") ? "gm" : "m");
      return text.replace(re, rep);
    }
    return text;
  };

  if (inPlace) {
    const changedPaths: string[] = [];
    for (const fArg of fileArgs) {
      const abs = resolvePath(cwd, fArg);
      const node = getNodeFrom(session.fs, abs);
      if (!node || node.type !== "file") {
        return { output: [`sed: can't read ${fArg}: No such file or directory`], cwd, exitCode: 2 };
      }
      node.content = applySedToContent(node.content ?? "");
      node.size = node.content.length;
      changedPaths.push(abs);
    }
    return {
      output: [],
      cwd,
      exitCode: 0,
      changed: { paths: changedPaths, created: [], services: [] },
    };
  }

  if (fileArgs.length > 0) {
    const abs = resolvePath(cwd, fileArgs[0]);
    const node = getNodeFrom(session.fs, abs);
    if (!node || node.type !== "file") {
      return { output: [`sed: can't read ${fileArgs[0]}: No such file or directory`], cwd, exitCode: 2 };
    }
    const updated = applySedToContent(node.content ?? "");
    return { output: updated.split(/\r?\n/).filter((l, idx, arr) => !(idx === arr.length - 1 && l === "")), cwd, exitCode: 0 };
  }

  const input = (stdinLines ?? []).join("\n");
  const updated = applySedToContent(input);
  return { output: updated ? updated.split(/\r?\n/) : [], cwd, exitCode: 0 };
}

function runLogrotateCommand(
  session: ShellSession,
  args: string[],
  shortFlags: Set<string>,
  cwd: string,
): CommandResult {
  const cfgArg = args[0] ?? "";
  if (!cfgArg) {
    return { output: ["logrotate: missing config file argument"], cwd, exitCode: 1 };
  }
  const cfgAbs = resolvePath(cwd, cfgArg);
  const cfgNode = getNodeFrom(session.fs, cfgAbs);
  if (!cfgNode || cfgNode.type !== "file") {
    return { output: [`error: cannot stat ${cfgArg}: No such file or directory`], cwd, exitCode: 1 };
  }
  const cfgContent = cfgNode.content ?? "";
  if (!cfgContent.includes("/var/log/")) {
    return { output: [`error: ${cfgArg}:1 missing log path specification`], cwd, exitCode: 1 };
  }

  const debugOnly = shortFlags.has("d");
  if (debugOnly) {
    return {
      output: [`reading config file ${cfgArg}`, "Handling 1 logs"],
      cwd,
      exitCode: 0,
    };
  }

  const changedPaths: string[] = [];
  const changedCreated: string[] = [];
  if (cfgContent.includes("/var/log/myapp")) {
    const logNode = getNodeFrom(session.fs, "/var/log/myapp/app.log");
    const gzPath = "/var/log/myapp/app.log.1.gz";
    putFileInSession(session, gzPath, {
      mode: 0o640,
      owner: "root",
      group: "adm",
      size: 4096,
      content: `<gzip compressed: ${(logNode?.content ?? "").slice(0, 60)}>\n`,
    });
    if (logNode && logNode.type === "file") {
      logNode.content = "";
      logNode.size = 0;
      changedPaths.push("/var/log/myapp/app.log");
    }
    changedCreated.push(gzPath);
  }
  return {
    output: [],
    cwd,
    exitCode: 0,
    changed: { paths: changedPaths, created: changedCreated, services: [] },
  };
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

function patternToRegexBody(pattern: string): string {
  let out = "";
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i];
    if (ch === "*") {
      out += ".*";
    } else if (ch === "?") {
      out += ".";
    } else if (ch === "[") {
      const close = pattern.indexOf("]", i + 1);
      if (close !== -1) {
        out += pattern.slice(i, close + 1);
        i = close;
      } else {
        out += "\\[";
      }
    } else if (/[.+^${}()|\\]/.test(ch)) {
      out += `\\${ch}`;
    } else {
      out += ch;
    }
  }
  return out;
}

function globMatch(name: string, pattern: string): boolean {
  const re = new RegExp("^" + patternToRegexBody(pattern) + "$", "i");
  return re.test(name);
}

function globMatchCaseSensitive(name: string, pattern: string): boolean {
  const re = new RegExp("^" + patternToRegexBody(pattern) + "$");
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
  "awk", "sort", "uniq", "cut", "tr", "diff", "gzip", "gunzip",
  "useradd", "usermod", "passwd", "ping", "dig", "nslookup",
  "parted", "mkfs", "mkfs.ext4", "lsblk", "blkid", "pvcreate", "vgextend", "lvextend", "resize2fs", "pvs", "vgs", "lvs", "vgcfgrestore", "lvchange", "mount", "umount", "fuser", "dos2unix", "sed", "logrotate", "ufw",
  "mkdir", "touch", "cp", "mv", "rm", "chmod", "chown", "chgrp", "tar", "tee", "sha256sum",
  "ps", "top", "uptime", "kill", "lsof", "ulimit", "ss", "df", "du", "crontab", "id", "journalctl",
  "date", "timedatectl", "chronyc", "yum", "dnf", "ssh", "echo", "printf", "hash", "whoami", "clear", "help", "systemctl", "service", "curl", "reboot",
];

/** Completion for the first token on the line. */
export function completeCommand(fragment: string): string[] {
  return COMMAND_VOCABULARY.filter((c) => c.startsWith(fragment)).sort();
}
