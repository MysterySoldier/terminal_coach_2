import type { DomainId } from "./types";

export interface ArchivedItem {
  /** Path inside the archive without leading slash (e.g. "storefront/server.js"). */
  path: string;
  type: "dir" | "file";
  mode: number;
  owner: string;
  group: string;
  size: number;
  mtime: string;
  content?: string;
}

export interface FsNode {
  name: string;
  type: "dir" | "file";
  mode: number;
  owner: string;
  group: string;
  size: number;
  mtime: string;
  content?: string;
  children?: Record<string, FsNode>;
  /** Paths packed inside this file when it was created by `tar -c`. */
  archiveEntries?: string[];
  /** Full node metadata and file contents packed in this archive for real `tar -x` extraction. */
  archiveItems?: ArchivedItem[];
}

/** A graded objective in the terminal sandbox. */
export interface SandboxTask {
  id: string;
  domain: DomainId;
  objective: string;
  hint: string;
  /** Canonical solution shown when the learner gives up. */
  solution: string;
  /**
   * Intent matcher: receives the parsed command and returns true when the
   * learner's command satisfies the objective, regardless of flag order,
   * flag bundling, or absolute vs relative paths.
   */
  match: (parsed: ParsedCommand, cwd: string) => boolean;
  /** Optional near-miss hints keyed by a predicate on the parsed command. */
  nearMiss?: { when: (parsed: ParsedCommand, cwd: string) => boolean; message: string }[];
  /**
   * State check: reads the machine after the command and returns true when
   * the objective is actually done. When present, grading uses this, not the
   * command text — any way that works, works. Read-only tasks leave this
   * unset and keep intent matching.
   *
   * The session type is imported as a type only, so there is no runtime
   * import cycle with the terminal engine.
   */
  checkState?: (session: import("@/lib/terminal-engine").ShellSession, cwd: string) => boolean;
}

/** Walk a session filesystem tree by absolute path. Local helper so this data file stays free of engine imports. */
function findNode(root: FsNode, path: string): FsNode | null {
  if (path === "/" || path === "") return root;
  let node: FsNode = root;
  for (const part of path.split("/").filter(Boolean)) {
    const next = node.children?.[part];
    if (!next) return null;
    node = next;
  }
  return node;
}

export interface ParsedCommand {
  /** The base command, e.g. "ls". */
  name: string;
  /** Every single-letter short flag, expanded from bundles like -la → l, a. */
  shortFlags: Set<string>;
  /** Long flags without the leading dashes, e.g. "all". */
  longFlags: Map<string, string | undefined>;
  /** Non-flag arguments in order. */
  args: string[];
  /** The original raw input. */
  raw: string;
}

/** Fake filesystem root used by the terminal sandbox. */
export const SANDBOX_FS: FsNode = {
  name: "/",
  type: "dir",
  mode: 0o755,
  owner: "root",
  group: "root",
  size: 4096,
  mtime: "Sep 21 09:12",
  children: {
    home: {
      name: "home",
      type: "dir",
      mode: 0o755,
      owner: "root",
      group: "root",
      size: 4096,
      mtime: "Sep 20 11:02",
      children: {
        user: {
          name: "user",
          type: "dir",
          mode: 0o750,
          owner: "user",
          group: "user",
          size: 4096,
          mtime: "Sep 21 14:27",
          children: {
            ".bashrc": {
              name: ".bashrc",
              type: "file",
              mode: 0o644,
              owner: "user",
              group: "user",
              size: 220,
              mtime: "Sep 21 09:14",
              content: "# ~/.bashrc\nexport PS1='\\u@\\h:\\w\\$ '\nalias ll='ls -la'\n",
            },
            ".profile": {
              name: ".profile",
              type: "file",
              mode: 0o644,
              owner: "user",
              group: "user",
              size: 807,
              mtime: "Sep 21 09:14",
              content: "# ~/.profile\nPATH=\"$HOME/bin:$PATH\"\n",
            },
            "deploy.sh": {
              name: "deploy.sh",
              type: "file",
              mode: 0o644,
              owner: "user",
              group: "user",
              size: 412,
              mtime: "Sep 21 13:40",
              content: "#!/usr/bin/env bash\nset -euo pipefail\necho \"deploying...\"\n",
            },
            notes: {
              name: "notes",
              type: "dir",
              mode: 0o755,
              owner: "user",
              group: "user",
              size: 4096,
              mtime: "Sep 21 10:31",
              children: {
                "todo.md": {
                  name: "todo.md",
                  type: "file",
                  mode: 0o644,
                  owner: "user",
                  group: "user",
                  size: 96,
                  mtime: "Sep 21 10:31",
                  content: "- review firewall rules\n- rotate ssh keys\n",
                },
              },
            },
          },
        },
      },
    },
    etc: {
      name: "etc",
      type: "dir",
      mode: 0o755,
      owner: "root",
      group: "root",
      size: 4096,
      mtime: "Sep 19 08:00",
      children: {
        passwd: {
          name: "passwd",
          type: "file",
          mode: 0o644,
          owner: "root",
          group: "root",
          size: 1842,
          mtime: "Sep 19 08:00",
          content:
            "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nuser:x:1000:1000:user:/home/user:/bin/bash\nalice:x:1001:1001:alice:/home/alice:/bin/bash\n",
        },
        shadow: {
          name: "shadow",
          type: "file",
          mode: 0o640,
          owner: "root",
          group: "shadow",
          size: 1120,
          mtime: "Sep 19 08:00",
          content: "root:!:19900:0:99999:7:::\nuser:$6$rounds=...:19900:0:99999:7:::\n",
        },
        fstab: {
          name: "fstab",
          type: "file",
          mode: 0o644,
          owner: "root",
          group: "root",
          size: 465,
          mtime: "Sep 18 22:10",
          content:
            "UUID=7c4a-91bd  /       ext4  defaults        0 1\nUUID=2f19-88ac  /home   xfs   defaults        0 2\n/swapfile       none    swap  sw              0 0\n",
        },
        hosts: {
          name: "hosts",
          type: "file",
          mode: 0o644,
          owner: "root",
          group: "root",
          size: 210,
          mtime: "Sep 18 22:10",
          content: "127.0.0.1   localhost\n10.0.0.9    db.internal\n",
        },
        ssh: {
          name: "ssh",
          type: "dir",
          mode: 0o755,
          owner: "root",
          group: "root",
          size: 4096,
          mtime: "Sep 19 08:00",
          children: {
            sshd_config: {
              name: "sshd_config",
              type: "file",
              mode: 0o600,
              owner: "root",
              group: "root",
              size: 3264,
              mtime: "Sep 19 08:00",
              content: "Port 22\nPermitRootLogin no\nPasswordAuthentication yes\n",
            },
          },
        },
      },
    },
    var: {
      name: "var",
      type: "dir",
      mode: 0o755,
      owner: "root",
      group: "root",
      size: 4096,
      mtime: "Sep 21 14:00",
      children: {
        log: {
          name: "log",
          type: "dir",
          mode: 0o755,
          owner: "root",
          group: "root",
          size: 4096,
          mtime: "Sep 21 14:20",
          children: {
            syslog: {
              name: "syslog",
              type: "file",
              mode: 0o640,
              owner: "syslog",
              group: "adm",
              size: 184320,
              mtime: "Sep 21 14:20",
              content:
                "Sep 21 14:18:02 web01 systemd[1]: Started nginx.service\nSep 21 14:19:41 web01 kernel: [ 9124.0] EXT4-fs (sdb1): mounted filesystem\nSep 21 14:20:11 web01 CRON[2841]: (user) CMD (/opt/backup.sh)\n",
            },
            "auth.log": {
              name: "auth.log",
              type: "file",
              mode: 0o640,
              owner: "syslog",
              group: "adm",
              size: 20480,
              mtime: "Sep 21 14:12",
              content:
                "Sep 21 14:02:11 web01 sshd[1902]: Accepted publickey for user from 10.0.0.4\nSep 21 14:09:58 web01 sudo: user : TTY=pts/0 ; COMMAND=/usr/bin/systemctl restart nginx\nSep 21 14:12:30 web01 sshd[1955]: Failed password for invalid user admin from 203.0.113.7\n",
            },
            dmesg: {
              name: "dmesg",
              type: "file",
              mode: 0o644,
              owner: "root",
              group: "root",
              size: 51200,
              mtime: "Sep 21 09:12",
              content: "[    0.000000] Linux version 6.8.0-45-generic\n[    2.114900] EXT4-fs (sda1): mounted filesystem\n",
            },
          },
        },
        www: {
          name: "www",
          type: "dir",
          mode: 0o755,
          owner: "root",
          group: "root",
          size: 4096,
          mtime: "Sep 20 16:44",
          children: {
            "index.html": {
              name: "index.html",
              type: "file",
              mode: 0o644,
              owner: "www-data",
              group: "www-data",
              size: 512,
              mtime: "Sep 20 16:44",
              content: "<h1>it works</h1>\n",
            },
          },
        },
      },
    },
    opt: {
      name: "opt",
      type: "dir",
      mode: 0o755,
      owner: "root",
      group: "root",
      size: 4096,
      mtime: "Sep 20 16:44",
      children: {
        app: {
          name: "app",
          type: "dir",
          mode: 0o755,
          owner: "deploy",
          group: "web",
          size: 4096,
          mtime: "Sep 21 11:15",
          children: {
            "config.yml": {
              name: "config.yml",
              type: "file",
              mode: 0o644,
              owner: "deploy",
              group: "web",
              size: 318,
              mtime: "Sep 21 11:15",
              content: "log_level: debug\nport: 8080\n",
            },
          },
        },
      },
    },
  },
};

export const SANDBOX_TASKS: SandboxTask[] = [
  {
    id: "sb-ls-la",
    domain: "system-mgmt",
    objective: "List all files in your home directory, including hidden ones, in long format.",
    hint: "Try combining -l and -a. Flag order and bundling do not matter.",
    solution: "ls -la",
    match: (p) => p.name === "ls" && p.shortFlags.has("l") && (p.shortFlags.has("a") || p.longFlags.has("all")),
    nearMiss: [
      { when: (p) => p.name === "ls" && p.shortFlags.has("l") && !p.shortFlags.has("a"), message: "Long format is right — now include hidden dotfiles too." },
      { when: (p) => p.name === "ls" && p.shortFlags.has("a") && !p.shortFlags.has("l"), message: "Hidden files are showing — now switch to long format." },
      { when: (p) => p.name === "ls" && p.shortFlags.size === 0, message: "Right command. Add the flags for long format and hidden files." },
    ],
  },
  {
    id: "sb-find-large",
    domain: "system-mgmt",
    objective: "Find every regular file under /var larger than 100 MB.",
    hint: "find takes a path, then -type and -size. A leading + means 'greater than'.",
    solution: "find /var -type f -size +100M",
    match: (p) =>
      p.name === "find" &&
      p.args.some((a) => a === "/var" || a === "/var/") &&
      p.raw.includes("-size") &&
      /\+100M/i.test(p.raw),
    nearMiss: [
      { when: (p) => p.name === "find" && p.raw.includes("-size") && !/\+/.test(p.raw), message: "Without a + sign, -size matches files of EXACTLY that size." },
      { when: (p) => p.name === "find" && !p.raw.includes("-size"), message: "You are searching the right tree — now filter by -size." },
    ],
  },
  {
    id: "sb-chmod-750",
    domain: "security",
    objective: "Give deploy.sh permissions rwx for the owner, r-x for the group, and nothing for others.",
    hint: "Read is 4, write 2, execute 1. Add them per triplet.",
    solution: "chmod 750 deploy.sh",
    match: (p) =>
      p.name === "chmod" &&
      p.args.some((a) => a.endsWith("deploy.sh")) &&
      (p.args.includes("750") || p.args.includes("0750") || /u=rwx.*g=rx.*o=/.test(p.raw)),
    checkState: (session) => findNode(session.fs, "/home/user/deploy.sh")?.mode === 0o750,
    nearMiss: [
      { when: (p) => p.name === "chmod" && p.args.includes("755"), message: "Close — 755 also grants r-x to others. Others should get nothing." },
      { when: (p) => p.name === "chmod" && p.args.includes("770"), message: "770 gives the group write access too. The group needs r-x only." },
      { when: (p) => p.name === "chmod" && p.args.includes("777"), message: "777 grants everyone everything — far too permissive here." },
    ],
  },
  {
    id: "sb-grep-recursive",
    domain: "automation",
    objective: "Search /etc recursively for the string 'Port', showing line numbers.",
    hint: "grep needs a recursion flag and a line-number flag. They can be bundled.",
    solution: "grep -rn Port /etc",
    match: (p) =>
      p.name === "grep" &&
      (p.shortFlags.has("r") || p.shortFlags.has("R")) &&
      p.shortFlags.has("n") &&
      p.args.some((a) => a.startsWith("/etc")),
    nearMiss: [
      { when: (p) => p.name === "grep" && (p.shortFlags.has("r") || p.shortFlags.has("R")) && !p.shortFlags.has("n"), message: "Recursion is set — now add the flag that prints line numbers." },
      { when: (p) => p.name === "grep" && !p.shortFlags.has("r") && !p.shortFlags.has("R"), message: "Without recursion, grep will not descend into /etc's subdirectories." },
    ],
  },
  {
    id: "sb-cd-logs",
    domain: "troubleshoot",
    objective: "Change into the system log directory at /var/log.",
    hint: "Both absolute and relative paths are accepted.",
    solution: "cd /var/log",
    match: (p, cwd) => {
      if (p.name !== "cd") return false;
      const target = p.args[0] ?? "";
      if (target === "/var/log" || target === "/var/log/") return true;
      if (cwd === "/var" && (target === "log" || target === "./log")) return true;
      if (cwd === "/var/www" && target === "../log") return true;
      return false;
    },
    nearMiss: [{ when: (p) => p.name === "cd" && p.args[0] === "/var", message: "You are in /var — one more level down to reach the logs." }],
  },
  {
    id: "sb-tar-create",
    domain: "system-mgmt",
    objective: "Create a gzip-compressed archive named etc.tar.gz containing /etc.",
    hint: "You need create, gzip, and file flags — bundled or separate, order does not matter.",
    solution: "tar -czf etc.tar.gz /etc",
    match: (p) =>
      p.name === "tar" &&
      p.shortFlags.has("c") &&
      p.shortFlags.has("z") &&
      p.shortFlags.has("f") &&
      p.args.some((a) => a.includes("etc.tar.gz")) &&
      p.args.some((a) => a === "/etc" || a === "/etc/"),
    checkState: (session, cwd) => {
      const inCwd = findNode(session.fs, cwd === "/" ? "/etc.tar.gz" : `${cwd}/etc.tar.gz`);
      const inHome = findNode(session.fs, "/home/user/etc.tar.gz");
      return Boolean(inCwd ?? inHome);
    },
    nearMiss: [
      { when: (p) => p.name === "tar" && p.shortFlags.has("x"), message: "-x extracts. You want to CREATE an archive." },
      { when: (p) => p.name === "tar" && p.shortFlags.has("c") && !p.shortFlags.has("z"), message: "That creates an uncompressed archive — add gzip compression." },
    ],
  },
  {
    id: "sb-ss-listen",
    domain: "troubleshoot",
    objective: "List listening TCP sockets numerically, with the owning process.",
    hint: "Four short flags on ss: tcp, listening, numeric, process.",
    solution: "ss -tlnp",
    match: (p) => p.name === "ss" && p.shortFlags.has("t") && p.shortFlags.has("l") && p.shortFlags.has("n") && p.shortFlags.has("p"),
    nearMiss: [
      { when: (p) => p.name === "ss" && p.shortFlags.has("t") && p.shortFlags.has("l") && !p.shortFlags.has("p"), message: "Almost — add the flag that reveals which process owns each socket." },
      { when: (p) => p.name === "netstat", message: "netstat is deprecated. The modern iproute2 tool for sockets is `ss`." },
    ],
  },
  {
    id: "sb-cat-fstab",
    domain: "system-mgmt",
    objective: "Display the contents of the filesystem table that is read at boot.",
    hint: "The static mount table lives in /etc.",
    solution: "cat /etc/fstab",
    match: (p, cwd) => {
      if (!["cat", "less", "more", "head", "tail"].includes(p.name)) return false;
      const t = p.args[p.args.length - 1] ?? "";
      return t === "/etc/fstab" || (cwd === "/etc" && t === "fstab");
    },
    nearMiss: [{ when: (p) => ["cat", "less"].includes(p.name) && (p.args[0] ?? "").includes("mtab"), message: "/etc/mtab shows what IS mounted. You want what SHOULD be mounted at boot." }],
  },
];
