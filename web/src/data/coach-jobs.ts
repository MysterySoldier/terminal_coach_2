import { SANDBOX_TASKS, type ArchivedItem, type ParsedCommand } from "./sandbox";
import type { DomainId } from "./types";
import {
  canUserAccess,
  createSession,
  ensureDirInSession,
  getMountUsage,
  getNodeInSession,
  putFileInSession,
  resetSession,
  syncServiceProcesses,
  type ShellSession,
} from "../lib/terminal-engine";

/**
 * Over Your Shoulder — the coach jobs.
 *
 * Job 1 is the website-down job from the coach plan. Jobs 2–9 are the 8
 * sandbox tasks, converted: same objectives, but now framed as real jobs,
 * graded by what the machine says, with five plain-words hints each that
 * never hand over the command. Jobs 10–16 are the Phase 1 sysadmin incidents
 * from `coach-jobs-all-300.md` (#10, #18, #19, #20, #21, #22, #23), each with
 * its own seeded broken machine state and real-state pass check.
 */

export interface CoachJob {
  id: string;
  domain: DomainId;
  title: string;
  /** The job, in plain words — one short paragraph, no command in it. */
  job: string;
  /** Five plain-words hints, in order. They say where to look and what to look for, never the command. */
  hints: string[];
  /** Shown only on give-up. Never counted as a cold pass. */
  solution: string;
  /** Optional per-job broken starting state applied on top of a clean reset session. */
  seed?: (session: ShellSession) => void;
  /** State check: the machine says the job is done. Read-only jobs leave this unset and use `match`. */
  checkState?: (session: ShellSession, cwd: string) => boolean;
  /** Intent match for read-only jobs (same matcher as the sandbox task). */
  match?: (parsed: ParsedCommand, cwd: string) => boolean;
  /** The fix must survive a reboot to count. */
  rebootCheck: boolean;
  /** The three proof checks, in the job's own words. */
  proof: string[];
}

/** Reset `session` to a fresh baseline and apply `job.seed` if present. */
export function prepareJobSession(session: ShellSession, job: CoachJob): void {
  resetSession(session);
  job.seed?.(session);
}

/** Create a brand-new isolated session pre-seeded for `job`. */
export function createJobSession(job: CoachJob): ShellSession {
  const session = createSession();
  job.seed?.(session);
  return session;
}

interface ConvertedTask {
  title: string;
  job: string;
  hints: string[];
  checkState?: (session: ShellSession, cwd: string) => boolean;
}

const CONVERTED_TASKS: Record<string, ConvertedTask> = {
  "sb-ls-la": {
    title: "See everything in your home folder",
    job: "A file has gone missing in your home folder. List everything that is there — including the hidden ones — in long format, so you can see who owns what and what the permissions are.",
    hints: [
      "The missing file starts with a dot. Ordinary listing hides dotfiles.",
      "You need two views at once: the long view, and the hidden files.",
      "The long view shows permissions, owner, and size for each file.",
      "Both views can be asked for in one go. Flag order does not matter.",
      "If you can see the dotfiles and the permissions together, you have it.",
    ],
  },
  "sb-find-large": {
    title: "Find the big files",
    job: "The disk under /var is filling up. Find every regular file under /var that is larger than 100 megabytes, so you know what to clean up.",
    hints: [
      "Start at /var and search downwards through everything under it.",
      "You only want regular files, not directories.",
      "The size filter needs a plus sign in front of the number — without it, it means files of exactly that size.",
      "100 megabytes is written as a number with a letter after it.",
      "If the search returns the big files and nothing else, you have it.",
    ],
  },
  "sb-chmod-750": {
    title: "Lock down deploy.sh",
    job: "The script deploy.sh is too open. Give the owner full control, the group read and execute only, and others nothing at all. Check your work afterwards — the listing must show the new permissions.",
    hints: [
      "Read is 4, write is 2, execute is 1. Add them up for each group of three.",
      "The owner needs all three: read, write, execute.",
      "The group needs read and execute, but not write.",
      "Others need nothing. Zero.",
      "After you change it, list the file in long format. The permissions on screen must match what you wanted.",
    ],
    checkState: (session) => {
      const node = session.fs.children?.home?.children?.user?.children?.["deploy.sh"];
      return node?.mode === 0o750;
    },
  },
  "sb-grep-recursive": {
    title: "Search the config for Port",
    job: "Something changed the port the server listens on. Search all of /etc, in every subdirectory, for the word Port, and show the line numbers so you can find each setting.",
    hints: [
      "One directory is not enough — the search has to go down into every subdirectory.",
      "You also need the line numbers, or you will not know where each match sits.",
      "Both of those are flags on the same search command, and they can be bundled together.",
      "The search starts in /etc and looks for the word Port.",
      "If every match comes back with its file and line number, you have it.",
    ],
  },
  "sb-cd-logs": {
    title: "Go to the log directory",
    job: "Something went wrong and the answer is in the logs. Move into the system log directory at /var/log.",
    hints: [
      "The logs live under /var, one level further down.",
      "You can give the full path from the top, or walk there step by step.",
      "If you are already in /var, the last step is just one word.",
      "After you move, check where you are. The prompt shows your current folder.",
      "When the prompt says /var/log, you are there.",
    ],
    checkState: (_session, cwd) => cwd === "/var/log",
  },
  "sb-tar-create": {
    title: "Pack up /etc",
    job: "Before you change anything, pack a backup of /etc into a gzip-compressed archive called etc.tar.gz. The archive file itself must exist afterwards — check that it is really there.",
    hints: [
      "You need three things at once: create, gzip, and a file to write to.",
      "The archive is called etc.tar.gz and the thing being packed is /etc.",
      "Those three flags can be bundled together in one go.",
      "Creating is the opposite of extracting. Make sure you are creating.",
      "Afterwards, list your folder. The archive file must be sitting there.",
    ],
    checkState: (session) => {
      const home = session.fs.children?.home?.children?.user?.children?.["etc.tar.gz"];
      const root = session.fs.children?.["etc.tar.gz"];
      return Boolean(home ?? root);
    },
  },
  "sb-ss-listen": {
    title: "Who is listening?",
    job: "A service is supposed to be listening for connections, but nobody can reach it. List the listening TCP sockets, with numbers instead of names, and show which process owns each one.",
    hints: [
      "The tool for sockets is the modern one, not the old deprecated one.",
      "You need four flags: TCP only, listening only, numeric addresses, and the owning process.",
      "Listening only is what keeps the list short — otherwise you see every connection.",
      "Numeric means port numbers, not service names.",
      "If each line shows a port and the program that owns it, you have it.",
    ],
  },
  "sb-cat-fstab": {
    title: "Read the boot mount table",
    job: "The machine is not mounting a drive at boot. Display the filesystem table that is read at boot, so you can see what should be mounted.",
    hints: [
      "The table lives in /etc and it is a static list, not a live report.",
      "It is the file the system reads when it starts up.",
      "The file that shows what is mounted right now is a different one — you want what should be mounted at boot.",
      "Read the file with any reader you like. The contents are what matter.",
      "If you can see the list of drives and mount points, you have it.",
    ],
  },
};

const WEBSITE_DOWN_PROOF = [
  "The thing actually works — the website answers when you ask it for its front page.",
  "You did it without being given the command — hints only, no answer handed to you.",
  "You can do it again, cold, three days later — same kind of job, no hints.",
];

// ---------------------------------------------------------------------------
// Phase 1 job fixtures (#10, #18, #19, #20, #21, #22, #23)
// ---------------------------------------------------------------------------

const STOREFRONT_SERVER_JS =
  "const http = require('http');\n// Storefront v2.4.1\nhttp.createServer((_req, res) => res.end('storefront ok')).listen(3000);\n";
const STOREFRONT_CONF = "APP_ENV=production\nPORT=3000\nCURRENCY=USD\n";
const STOREFRONT_INDEX_HTML = "<!doctype html><title>Mystery Storefront</title><h1>Storefront Online</h1>\n";

const STOREFRONT_ARCHIVE_ITEMS: ArchivedItem[] = [
  { path: "storefront", type: "dir", mode: 0o755, owner: "deploy", group: "web", size: 4096, mtime: "Sep 20 18:00" },
  {
    path: "storefront/server.js",
    type: "file",
    mode: 0o755,
    owner: "deploy",
    group: "web",
    size: STOREFRONT_SERVER_JS.length,
    mtime: "Sep 20 18:00",
    content: STOREFRONT_SERVER_JS,
  },
  { path: "storefront/config", type: "dir", mode: 0o755, owner: "deploy", group: "web", size: 4096, mtime: "Sep 20 18:00" },
  {
    path: "storefront/config/storefront.conf",
    type: "file",
    mode: 0o644,
    owner: "deploy",
    group: "web",
    size: STOREFRONT_CONF.length,
    mtime: "Sep 20 18:00",
    content: STOREFRONT_CONF,
  },
  { path: "storefront/public", type: "dir", mode: 0o755, owner: "deploy", group: "web", size: 4096, mtime: "Sep 20 18:00" },
  {
    path: "storefront/public/index.html",
    type: "file",
    mode: 0o644,
    owner: "deploy",
    group: "web",
    size: STOREFRONT_INDEX_HTML.length,
    mtime: "Sep 20 18:00",
    content: STOREFRONT_INDEX_HTML,
  },
];

const RELEASE_PLAN_CONTENT =
  "# Q4 Release Plan\n- Schema freeze: Friday 17:00 UTC\n- Cut release candidate: Monday 09:00 UTC\n";

const PHASE_1_JOBS: CoachJob[] = [
  // #10 — Bring the app back from backup (D1 System Management)
  {
    id: "coach-restore-backup",
    domain: "system-mgmt",
    title: "Bring the app back from backup",
    job: "The latest rollout wiped the shop app under /opt/storefront/, leaving the folder empty while a known-good backup sits at /backups/storefront.tar. Unpack the backup so the app files are back inside /opt/storefront/ where they belong, with no stray folders dropped elsewhere.",
    hints: [
      "Look inside /opt/storefront/ first so you can confirm the rollout left the application directory empty.",
      "Before extracting an archive, inspect the list of paths stored inside /backups/storefront.tar.",
      "Every path inside the archive already starts with storefront/. That tells you which parent directory to unpack into.",
      "Unpacking into / drops a stray /storefront at root, and unpacking into /opt/storefront nests a second storefront folder. Point the target directory flag at /opt/.",
      "List /opt/storefront/ afterwards — server.js, config/storefront.conf, and public/index.html must all be back in place, and /backups/storefront.tar must still exist.",
    ],
    solution: "tar -xvf /backups/storefront.tar -C /opt/",
    seed: (session) => {
      const sf = ensureDirInSession(session, "/opt/storefront", {
        mode: 0o755,
        owner: "deploy",
        group: "web",
        mtime: "Sep 21 14:10",
      });
      sf.children = {};
      ensureDirInSession(session, "/backups", { mode: 0o755, owner: "root", group: "root" });
      putFileInSession(session, "/backups/storefront.tar", {
        mode: 0o644,
        owner: "root",
        group: "root",
        size: 10240,
        mtime: "Sep 20 18:05",
        archiveEntries: [
          "storefront/",
          "storefront/server.js",
          "storefront/config/",
          "storefront/config/storefront.conf",
          "storefront/public/",
          "storefront/public/index.html",
        ],
        archiveItems: structuredClone(STOREFRONT_ARCHIVE_ITEMS),
      });
    },
    checkState: (session) => {
      const backup = getNodeInSession(session, "/backups/storefront.tar");
      const serverJs = getNodeInSession(session, "/opt/storefront/server.js");
      const conf = getNodeInSession(session, "/opt/storefront/config/storefront.conf");
      const indexHtml = getNodeInSession(session, "/opt/storefront/public/index.html");
      const strayRoot = getNodeInSession(session, "/storefront");
      const nestedOpt = getNodeInSession(session, "/opt/opt");
      const nestedSf = getNodeInSession(session, "/opt/storefront/storefront");

      return Boolean(
        backup &&
          serverJs?.type === "file" &&
          serverJs.content === STOREFRONT_SERVER_JS &&
          conf?.type === "file" &&
          conf.content === STOREFRONT_CONF &&
          indexHtml?.type === "file" &&
          indexHtml.content === STOREFRONT_INDEX_HTML &&
          !strayRoot &&
          !nestedOpt &&
          !nestedSf,
      );
    },
    rebootCheck: false,
    proof: [
      "The shop app files are restored under /opt/storefront/ with matching contents, and no stray or nested directories were created.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #18 — "Permission denied" — fix it at the root cause (D3 Security)
  {
    id: "coach-permission-denied",
    domain: "security",
    title: "\"Permission denied\" — fix it at the root cause",
    job: "Teammate alice (a member of the developers group) gets Permission denied when trying to read and update /srv/shared/release-plan.md. Find out why she is locked out and fix the real cause so alice can read and write the file — without opening the file to everyone on the machine.",
    hints: [
      "Check the permissions and ownership on /srv/shared/release-plan.md and on its parent directory /srv/shared.",
      "Look up alice's account and group memberships, then compare them against the owner and group on the file.",
      "Notice the file mode already grants read and write to both owner and group, while others get nothing — the file was simply left in the root group instead of developers.",
      "Never use 777 or grant world access to an internal team file. Hand the file's group ownership to developers (or ownership to alice) so least privilege holds.",
      "Verify the file details again: alice can read and write it, the mode is not 777, and world permissions remain closed.",
    ],
    solution: "chgrp developers /srv/shared/release-plan.md",
    seed: (session) => {
      ensureDirInSession(session, "/srv", { mode: 0o755, owner: "root", group: "root" });
      ensureDirInSession(session, "/srv/shared", { mode: 0o775, owner: "root", group: "developers" });
      putFileInSession(session, "/srv/shared/release-plan.md", {
        mode: 0o660,
        owner: "root",
        group: "root",
        mtime: "Sep 21 11:40",
        content: RELEASE_PLAN_CONTENT,
      });
    },
    checkState: (session) => {
      const file = getNodeInSession(session, "/srv/shared/release-plan.md");
      if (!file || file.type !== "file") return false;
      if (file.content !== RELEASE_PLAN_CONTENT) return false;
      const perms = file.mode & 0o777;
      if (perms === 0o777) return false;
      // World ("other") bits must stay 0 — opening the file to everyone is not fixing the root cause.
      if ((perms & 0o007) !== 0) return false;
      return canUserAccess(session, "alice", "/srv/shared/release-plan.md", 0o6);
    },
    rebootCheck: false,
    proof: [
      "Teammate alice now has read and write access to /srv/shared/release-plan.md through proper ownership, and world permissions stay closed.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #19 — The cron job never ran (D2 Services and User Management)
  {
    id: "coach-cron-down",
    domain: "services-users",
    title: "The cron job never ran",
    job: "A nightly backup that should run every night at 2 AM has not run in a week. Find out why the scheduler is not doing its job, get it running again right now, and make sure it comes back automatically after a reboot.",
    hints: [
      "List the scheduled cron entries first to check whether the nightly backup line was deleted or is still valid.",
      "Read /var/log/cron as well — notice when the scheduler stopped logging runs.",
      "Even a valid schedule never runs if the background cron daemon itself is stopped. Check the status of the cron service.",
      "Starting the cron service fixes tonight, and enabling it ensures it starts on boot as well.",
      "Confirm the cron service is both active and enabled, and that the nightly backup crontab entry is still intact.",
    ],
    solution: "systemctl enable --now cron",
    seed: (session) => {
      session.services.cron = { running: false, enabled: false, port: 0, process: "cron" };
      syncServiceProcesses(session);
      ensureDirInSession(session, "/usr/local/bin", { mode: 0o755, owner: "root", group: "root" });
      putFileInSession(session, "/usr/local/bin/nightly-backup.sh", {
        mode: 0o755,
        owner: "root",
        group: "root",
        content: "#!/usr/bin/env bash\ntar -czf /var/backups/etc-nightly.tar.gz /etc\n",
      });
      ensureDirInSession(session, "/var/spool/cron/crontabs", { mode: 0o755, owner: "root", group: "root" });
      const cronLine = "0 2 * * * /usr/local/bin/nightly-backup.sh";
      putFileInSession(session, "/var/spool/cron/crontabs/user", {
        mode: 0o600,
        owner: "user",
        group: "user",
        content: `# Nightly system backup\n${cronLine}\n`,
      });
      session.crontabs.user = ["# Nightly system backup", cronLine];
      putFileInSession(session, "/var/log/cron", {
        mode: 0o640,
        owner: "root",
        group: "adm",
        content:
          "Sep 14 02:00:01 web01 CRON[1499]: (user) CMD (/usr/local/bin/nightly-backup.sh)\nSep 14 11:05:12 web01 systemd[1]: Stopping cron.service...\nSep 14 11:05:12 web01 systemd[1]: cron.service: Deactivated successfully.\n",
      });
    },
    checkState: (session) => {
      const cronSvc = session.services.cron;
      if (!cronSvc?.running || !cronSvc?.enabled) return false;
      const tab = getNodeInSession(session, "/var/spool/cron/crontabs/user");
      return Boolean(tab?.type === "file" && tab.content?.includes("/usr/local/bin/nightly-backup.sh"));
    },
    rebootCheck: false,
    proof: [
      "The cron daemon is active and enabled for boot, and the valid nightly backup entry is still in place.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #20 — A runaway process is eating all the CPU (D5 Troubleshooting)
  {
    id: "coach-runaway-cpu",
    domain: "troubleshoot",
    title: "A runaway process is eating all the CPU",
    job: "The server has slowed to a crawl because one stuck worker process is pegging the CPU. Find the process eating the CPU and stop it — try a polite stop first, check whether it actually exited, and force-stop it if it refuses to quit — while keeping core system services running.",
    hints: [
      "List every running process sorted from highest CPU percentage down so the culprit sits right at the top.",
      "Read the top process entry carefully: note its numeric PID and confirm it is the spinning worker, not sshd or postgres.",
      "Send a normal polite termination signal to that PID first so well-behaved software gets a chance to exit cleanly.",
      "Check the process list again right away — this hung worker traps the polite signal and keeps spinning, so send signal 9 to force the kernel to end it immediately.",
      "Verify in the process list and uptime report that PID 4412 is gone, CPU load is back down, and sshd and postgres are still up.",
    ],
    solution: "kill -9 4412",
    seed: (session) => {
      session.processes.push({
        pid: 4412,
        user: "user",
        cpu: 98.7,
        mem: 4.2,
        stat: "R",
        start: "08:14",
        time: "142:19",
        procName: "thumb-worker",
        command: "/usr/local/bin/thumb-worker --spin-retry",
        ignoresSigterm: true,
      });
    },
    checkState: (session) => {
      const runawayStillThere = session.processes.some((p) => p.pid === 4412);
      if (runawayStillThere) return false;
      const totalCpu = session.processes.reduce((sum, p) => sum + p.cpu, 0);
      if (totalCpu >= 20) return false;
      return Boolean(session.services.sshd?.running && session.services.postgres?.running);
    },
    rebootCheck: false,
    proof: [
      "The runaway worker process is gone from the process table, CPU load is back to normal, and core services remain up.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #21 — The disk is full — find what's eating it and free space (D5 Troubleshooting)
  {
    id: "coach-disk-full",
    domain: "troubleshoot",
    title: "The disk is full — find what's eating it and free space",
    job: "The root disk is 100% full and the application cannot write anything. Find what is eating the space under /var/log and remove the bloated old file so free space comes back below 90%, leaving all live logs untouched.",
    hints: [
      "Check mounted filesystem usage in human-readable units first to confirm which partition hit 100%.",
      "Inspect file sizes inside /var/log — either summarize each item under /var/log or search /var/log for files larger than 100 megabytes.",
      "Separate old junk from active logs: one leftover .old debug dump is 22 gigabytes, while syslog, auth.log, dmesg, and app.log are live logs.",
      "Remove only that bloated old debug log file — never delete the live log files or the /var/log directory itself.",
      "Run the disk-free report again to confirm root usage is well under 90% and the live logs are still intact.",
    ],
    solution: "rm /var/log/app-debug.log.old",
    seed: (session) => {
      putFileInSession(session, "/var/log/app.log", {
        mode: 0o640,
        owner: "root",
        group: "adm",
        size: 40960,
        mtime: "Sep 21 14:29",
        content: "[ERROR] 2026-09-21T14:29:01Z write failed: No space left on device\n",
      });
      const bloatedBytes = 22 * 1024 ** 3;
      putFileInSession(session, "/var/log/app-debug.log.old", {
        mode: 0o640,
        owner: "root",
        group: "adm",
        size: bloatedBytes,
        mtime: "Sep 14 03:11",
        content: "[DEBUG] legacy rotated trace dump — safe to remove\n",
      });
      const rootMount = session.mounts.find((m) => m.mountPoint === "/");
      if (rootMount) {
        // Calibrate baseline so root is at 100% (0 bytes free) with the 22 GiB old log present, and ~45% once removed.
        rootMount.baseUsedBytes = Math.max(0, rootMount.totalBytes - bloatedBytes);
      }
    },
    checkState: (session) => {
      const usage = getMountUsage(session, "/");
      if (usage.usePct >= 90 || usage.availBytes <= 0) return false;
      if (getNodeInSession(session, "/var/log/app-debug.log.old")) return false;
      return Boolean(
        getNodeInSession(session, "/var/log/syslog") &&
          getNodeInSession(session, "/var/log/auth.log") &&
          getNodeInSession(session, "/var/log/dmesg") &&
          getNodeInSession(session, "/var/log/app.log"),
      );
    },
    rebootCheck: false,
    proof: [
      "Root disk usage is back well below 90%, the bloated old debug log is gone, and every live log file is still intact.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #22 — The port is already in use (D5 Troubleshooting)
  {
    id: "coach-port-in-use",
    domain: "troubleshoot",
    title: "The port is already in use",
    job: "The Apache web server (httpd) refuses to start because something else is already sitting on port 80. Find which process holds port 80, clear it out, get httpd running, and verify it answers on localhost.",
    hints: [
      "Inspect the listening TCP sockets with numeric ports and owning processes to see what is bound to port 80 right now.",
      "Read the port 80 socket line: a leftover dev-preview process is holding port 80 — note its numeric PID.",
      "Terminate that rogue PID so port 80 is released, leaving sshd and postgres untouched.",
      "Now start the httpd service so Apache binds cleanly to port 80.",
      "Check both the listening sockets and a request to localhost — httpd must own port 80 and return its web page.",
    ],
    solution: "kill 2847 && systemctl start httpd",
    seed: (session) => {
      session.services.httpd = { running: false, enabled: false, port: 80, process: "httpd" };
      syncServiceProcesses(session);
      ensureDirInSession(session, "/var/www/html", { mode: 0o755, owner: "root", group: "root" });
      putFileInSession(session, "/var/www/html/index.html", {
        mode: 0o644,
        owner: "apache",
        group: "apache",
        content: "<h1>Apache httpd online</h1>\n",
      });
      session.processes.push({
        pid: 2847,
        user: "user",
        cpu: 0.3,
        mem: 0.6,
        stat: "Sl",
        start: "09:42",
        time: "0:03",
        procName: "dev-preview",
        command: "/usr/local/bin/dev-preview --port 80",
        listenPort: 80,
        listenAddr: "0.0.0.0",
        listenFd: 4,
      });
    },
    checkState: (session) => {
      if (session.processes.some((p) => p.pid === 2847)) return false;
      if (!session.services.httpd?.running) return false;
      const httpdOn80 = session.processes.some((p) => p.serviceUnit === "httpd" && p.listenPort === 80);
      if (!httpdOn80) return false;
      return Boolean(session.services.sshd?.running && session.services.postgres?.running);
    },
    rebootCheck: false,
    proof: [
      "The rogue listener on port 80 is gone, httpd is active and bound to port 80, and localhost answers HTTP 200.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #23 — "No space left" but the disk shows free — the inodes are gone (D5 Troubleshooting)
  {
    id: "coach-inodes-gone",
    domain: "troubleshoot",
    title: "\"No space left\" but the disk shows free — the inodes are gone",
    job: "Creating any new file fails with No space left on device even though the root drive has gigabytes of free space. Find what exhausted the filesystem's inodes under /var/spool and clear out the pile of tiny orphan files so new files can be created again.",
    hints: [
      "Check both byte usage and inode usage across mounted filesystems — bytes are barely half full, yet free inodes on / are down to zero.",
      "Every file takes one inode regardless of size. Count how many regular files sit under /var/spool.",
      "Look inside /var/spool/maildrop — 1,500 tiny orphan drop files are eating every remaining inode on the root filesystem.",
      "Delete the pile of orphan files inside /var/spool/maildrop while keeping /var/spool itself in place.",
      "Check inode usage again and test creating a file in /tmp — free inodes must be back and file creation must succeed.",
    ],
    solution: "rm -f /var/spool/maildrop/*",
    seed: (session) => {
      ensureDirInSession(session, "/var/spool", { mode: 0o755, owner: "root", group: "root" });
      ensureDirInSession(session, "/var/spool/cron/crontabs", { mode: 0o755, owner: "root", group: "root" });
      const maildrop = ensureDirInSession(session, "/var/spool/maildrop", {
        mode: 0o755,
        owner: "root",
        group: "root",
      });
      maildrop.children = {};
      for (let i = 1; i <= 1500; i += 1) {
        const fname = `msg-${String(i).padStart(4, "0")}.tmp`;
        maildrop.children[fname] = {
          name: fname,
          type: "file",
          mode: 0o600,
          owner: "user",
          group: "user",
          size: 32,
          mtime: "Sep 21 04:15",
          content: "queued-bounce\n",
        };
      }
      const rootMount = session.mounts.find((m) => m.mountPoint === "/");
      if (rootMount) {
        rootMount.totalInodes = 2048;
        rootMount.baseUsedInodes = 0;
        const currentTreeInodes = getMountUsage(session, "/").usedInodes;
        rootMount.baseUsedInodes = Math.max(0, 2048 - currentTreeInodes);
      }
    },
    checkState: (session) => {
      const usage = getMountUsage(session, "/");
      if (usage.freeInodes < 1000 || usage.inodePct >= 90) return false;
      if (getNodeInSession(session, "/var/spool")?.type !== "dir") return false;
      if (getNodeInSession(session, "/var/log/syslog")?.type !== "file") return false;
      return true;
    },
    rebootCheck: false,
    proof: [
      "Free inodes are restored on /, the 1,500 orphan spool files are cleared, and new files can be created on disk again.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },
];

export const COACH_JOBS: CoachJob[] = [
  {
    id: "coach-website-down",
    domain: "troubleshoot",
    title: "The website is down",
    job: "The website is down. Your job: get it back up — and make sure it stays up after a reboot. Nobody will tell you the command. The coach will only tell you where to look.",
    hints: [
      "The website is served by a program. Is that program running right now?",
      "You can ask the machine which programs are listening for visitors. Look for the one on port 80.",
      "A program that is not running cannot answer anyone. Start it, then check again whether it is listening.",
      "Starting it fixes today. If the machine restarts tonight, will it come back up on its own? There is a separate step that makes a program start at boot.",
      "Check it the way a visitor would: ask the website for its front page. If it answers, the job is done.",
    ],
    solution: "systemctl enable --now nginx",
    checkState: (session) => session.services.nginx.running && session.services.nginx.enabled,
    rebootCheck: true,
    proof: WEBSITE_DOWN_PROOF,
  },
  ...SANDBOX_TASKS.map((task): CoachJob => {
    const converted = CONVERTED_TASKS[task.id];
    return {
      id: `coach-${task.id}`,
      domain: task.domain,
      title: converted.title,
      job: converted.job,
      hints: converted.hints,
      solution: task.solution,
      checkState: converted.checkState,
      match: task.match,
      rebootCheck: false,
      proof: WEBSITE_DOWN_PROOF,
    };
  }),
  ...PHASE_1_JOBS,
];
