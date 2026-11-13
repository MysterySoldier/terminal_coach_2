import { SANDBOX_TASKS, type ArchivedItem, type ParsedCommand } from "./sandbox";
import type { DomainId } from "./types";
import {
  canUserAccess,
  computeSha256Hex,
  createSession,
  ensureDirInSession,
  getEffectiveNofileLimit,
  getMountUsage,
  getNodeInSession,
  GZIP_MAGIC_PREFIX,
  hasValidServer1SshConfig,
  hasWorkingDns,
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
 * never hand over the command. Jobs 10–19 are the Phase 1 sysadmin incidents
 * from `coach-jobs-all-300.md` (#10, #11, #12, #18, #19, #20, #21, #22, #23, #24),
 * each with its own seeded broken machine state and real-state pass check.
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

  // #11 — Set up key login to server1 (D3 Security)
  {
    id: "coach-ssh-key-server1",
    domain: "security",
    title: "Set up key login to server1",
    job: "Get key login working for server1: put the private key ~/admin where SSH looks for it, lock it down so only you can read and write it, make sure your user account owns it, and add a Host server1 block to ~/.ssh/config for HostName server1, Port 2222, User admin, and IdentityFile ~/.ssh/admin.",
    hints: [
      "Look in your home folder first — the private key file named admin was dropped in ~ instead of inside your hidden ~/.ssh directory.",
      "Move the key into ~/.ssh/ so it is no longer sitting loose in your home directory.",
      "SSH refuses to use any private key that group members or other users can read. Lock ~/.ssh/admin down to owner read-and-write only (mode 0600).",
      "Check who owns ~/.ssh/admin as well — it was dropped here owned by root, so hand ownership over to your current user account.",
      "Finally, write the Host server1 section into ~/.ssh/config with HostName server1, Port 2222, User admin, and IdentityFile ~/.ssh/admin.",
    ],
    solution:
      'mv ~/admin ~/.ssh/ && chmod 0600 ~/.ssh/admin && chown $USER ~/.ssh/admin && printf "Host server1\\n  HostName server1\\n  Port 2222\\n  User admin\\n  IdentityFile ~/.ssh/admin\\n" > ~/.ssh/config',
    seed: (session) => {
      const sshDir = ensureDirInSession(session, "/home/user/.ssh", {
        mode: 0o700,
        owner: "user",
        group: "user",
        mtime: "Sep 21 09:00",
      });
      sshDir.children = {};
      putFileInSession(session, "/home/user/admin", {
        mode: 0o644,
        owner: "root",
        group: "root",
        mtime: "Sep 21 14:05",
        content:
          "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQ==\n-----END OPENSSH PRIVATE KEY-----\n",
      });
    },
    checkState: (session) => {
      if (getNodeInSession(session, "/home/user/admin")) return false;
      const keyNode = getNodeInSession(session, "/home/user/.ssh/admin");
      if (!keyNode || keyNode.type !== "file") return false;
      if ((keyNode.mode & 0o777) !== 0o600) return false;
      if (keyNode.owner !== "user") return false;
      const cfgNode = getNodeInSession(session, "/home/user/.ssh/config");
      if (!cfgNode || cfgNode.type !== "file") return false;
      return hasValidServer1SshConfig(cfgNode.content ?? "");
    },
    rebootCheck: false,
    proof: [
      "The private key lives at ~/.ssh/admin (gone from ~/admin) with mode 0600 owned by user, and ~/.ssh/config has the Host server1 block for port 2222.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #12 — Install the web server and make it stay up (D2 Services and User Management)
  {
    id: "coach-install-httpd",
    domain: "services-users",
    title: "Install the web server and make it stay up",
    job: "The web server isn't even on this machine yet — put the Red Hat Apache package (httpd) on it, get it running right now, and make sure it comes back on its own after a reboot.",
    hints: [
      "Try checking the web server unit first — the machine reports that the unit does not exist yet because the package is not installed.",
      "On Red Hat family systems, the Apache web server package and service are named httpd, not apache2.",
      "Use the Red Hat package manager to install the httpd package onto the machine.",
      "Installing a package on Red Hat does not start the daemon automatically — start the httpd service now so it answers on port 80.",
      "Enable the httpd service for boot as well, then check its status to confirm it is both active and enabled.",
    ],
    solution: "yum install -y httpd && systemctl start httpd && systemctl enable httpd",
    seed: (session) => {
      session.packages.httpd = false;
      session.services.httpd = { running: false, enabled: false, port: 80, process: "httpd" };
      syncServiceProcesses(session);
    },
    checkState: (session) => {
      return Boolean(session.packages.httpd && session.services.httpd?.running && session.services.httpd?.enabled);
    },
    rebootCheck: false,
    proof: [
      "The httpd package is installed, the httpd service is active (running) and enabled for boot, and localhost answers HTTP 200.",
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

  // #24 — A deleted file is still eating the disk (D5 Troubleshooting)
  {
    id: "coach-deleted-open-file",
    domain: "troubleshoot",
    title: "A deleted file is still eating the disk",
    job: "You deleted a huge log file under /var/log/httpd, but the root disk is still 100% full. The file is gone from the folder — but a running program is still holding it open. Find which service holds the deleted file handle and make it release the space.",
    hints: [
      "Check mounted filesystem usage in human-readable form first — notice the root partition is still at 100% with zero space available.",
      "When a file is unlinked from its folder while a program still has it open, the kernel keeps its disk blocks allocated until that file descriptor closes.",
      "List open files across the system and filter for entries marked deleted to see which running daemon is holding the unlinked 22 GB log file.",
      "Restart the service that owns that deleted open file handle so the process closes the old descriptor and opens a fresh log.",
      "Run the disk-free report again to verify the 22 GB is back and no deleted open handles remain.",
    ],
    solution: "systemctl restart httpd",
    seed: (session) => {
      session.services.httpd = { running: true, enabled: true, port: 80, process: "httpd" };
      syncServiceProcesses(session);
      ensureDirInSession(session, "/var/log/httpd", { mode: 0o750, owner: "root", group: "adm" });
      const heldBytes = 22 * 1024 ** 3;
      session.openDeletedFiles = [
        {
          pid: 3120,
          procName: "httpd",
          user: "apache",
          fd: "7w",
          path: "/var/log/httpd/access_log",
          sizeBytes: heldBytes,
          serviceUnit: "httpd",
        },
      ];
      const rootMount = session.mounts.find((m) => m.mountPoint === "/");
      if (rootMount) {
        rootMount.baseUsedBytes = Math.max(0, rootMount.totalBytes - heldBytes);
      }
    },
    checkState: (session) => {
      const usage = getMountUsage(session, "/");
      if (usage.usePct >= 90 || usage.availBytes <= 0) return false;
      if ((session.openDeletedFiles ?? []).length > 0) return false;
      return Boolean(session.services.httpd?.running);
    },
    rebootCheck: false,
    proof: [
      "The deleted open log handle is released, httpd is running cleanly, and df shows root disk space back well below 90%.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #27 — Find the files a deleted user left behind (D2 Services and User Management)
  {
    id: "coach-deleted-user-files",
    domain: "services-users",
    title: "Find the files a deleted user left behind",
    job: "An old contractor account was removed from the system, but their project files are still scattered under /srv/projects owned by numeric UID 1042 — a number nobody recognizes. Find every file owned by no valid user and hand ownership of those files to alice.",
    hints: [
      "When an account is deleted from the user database without cleaning up its files, those files stay owned by the old numeric user ID.",
      "Search the filesystem for files whose numeric owner ID does not belong to any existing user account.",
      "Notice the orphaned files sitting inside /srv/projects that show numeric owner 1042 instead of a username.",
      "Change the owner of those orphaned project files to teammate alice so the team can maintain them.",
      "Run the unowned-file search again to confirm zero files remain owned by an unknown UID.",
    ],
    solution: "chown -R alice /srv/projects",
    seed: (session) => {
      ensureDirInSession(session, "/srv", { mode: 0o755, owner: "root", group: "root" });
      ensureDirInSession(session, "/srv/projects", { mode: 0o755, owner: "1042", group: "developers" });
      putFileInSession(session, "/srv/projects/roadmap.txt", {
        mode: 0o644,
        owner: "1042",
        group: "developers",
        content: "Q4 Migration Roadmap\n",
      });
      putFileInSession(session, "/srv/projects/schema.sql", {
        mode: 0o640,
        owner: "1042",
        group: "developers",
        content: "CREATE TABLE invoices (id INT PRIMARY KEY);\n",
      });
    },
    checkState: (session) => {
      const dir = getNodeInSession(session, "/srv/projects");
      const f1 = getNodeInSession(session, "/srv/projects/roadmap.txt");
      const f2 = getNodeInSession(session, "/srv/projects/schema.sql");
      if (!dir || !f1 || !f2) return false;
      return f1.owner === "alice" && f2.owner === "alice" && dir.owner !== "1042";
    },
    rebootCheck: false,
    proof: [
      "No files remain owned by deleted UID 1042, and the project files under /srv/projects now belong to alice.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #28 — The service failed to start — read the journal (D5 Troubleshooting)
  {
    id: "coach-service-journal",
    domain: "troubleshoot",
    title: "The service failed to start — read the journal",
    job: "The nginx web server says failed to start and nothing else. Read the system journal for nginx to find the real error on disk, fix the file that broke, and get nginx running again.",
    hints: [
      "Check the service status first — notice it reports failed with exit status 203/EXEC.",
      "Read the system journal filtered for the nginx unit to see the exact path and error that stopped it from starting.",
      "The journal shows Permission denied when trying to execute /usr/sbin/nginx — inspect that binary's permissions.",
      "Restore execute permissions on /usr/sbin/nginx so systemd can launch the binary.",
      "Restart the nginx service and check that it is now active and running.",
    ],
    solution: "chmod +x /usr/sbin/nginx && systemctl restart nginx",
    seed: (session) => {
      ensureDirInSession(session, "/usr/sbin", { mode: 0o755, owner: "root", group: "root" });
      putFileInSession(session, "/usr/sbin/nginx", {
        mode: 0o644,
        owner: "root",
        group: "root",
        content: "#!/bin/sh\n# nginx master binary\n",
      });
      session.services.nginx = {
        running: false,
        enabled: true,
        port: 80,
        process: "nginx",
        binaryPath: "/usr/sbin/nginx",
        failed: true,
      };
      session.journal = [
        {
          timestamp: "Sep 21 14:19:04",
          unit: "nginx.service",
          priority: "info",
          message: "Starting A high performance web server and a reverse proxy server...",
        },
        {
          timestamp: "Sep 21 14:19:04",
          unit: "nginx.service",
          priority: "err",
          message: "nginx.service: Failed to execute /usr/sbin/nginx: Permission denied",
        },
        {
          timestamp: "Sep 21 14:19:04",
          unit: "nginx.service",
          priority: "err",
          message: "nginx.service: Failed at step EXEC spawning /usr/sbin/nginx: Permission denied (status=203/EXEC)",
        },
      ];
      syncServiceProcesses(session);
    },
    checkState: (session) => {
      const bin = getNodeInSession(session, "/usr/sbin/nginx");
      if (!bin || (bin.mode & 0o111) === 0) return false;
      return Boolean(session.services.nginx?.running && !session.services.nginx?.failed);
    },
    rebootCheck: false,
    proof: [
      "The /usr/sbin/nginx binary is executable again, nginx.service is active (running), and the journal logs a clean start.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #25 — "command not found" for your own script (D4 Automation & Scripting)
  {
    id: "coach-script-not-found",
    domain: "automation",
    title: "\"command not found\" for your own script",
    job: "You wrote ~/script.sh in your home folder, but typing script.sh says command not found and ./script.sh is blocked. Check the file permissions, make the script executable, and run it from your current directory so it prints its health report.",
    hints: [
      "The shell only searches directories listed in $PATH when you type a bare command name — your current directory is not in $PATH for safety.",
      "To run a script sitting in your current folder, you must prefix it with ./ so the shell knows the exact path.",
      "Check the permissions on script.sh first — right now it has read and write bits, but no execute bit.",
      "Add execute permission to script.sh so the kernel allows it to run as a program.",
      "Run the script using its relative path from your current folder and verify its output appears.",
    ],
    solution: "chmod +x script.sh && ./script.sh",
    seed: (session) => {
      putFileInSession(session, "/home/user/script.sh", {
        mode: 0o644,
        owner: "user",
        group: "user",
        mtime: "Sep 21 14:10",
        content: "#!/bin/bash\necho HEALTH_CHECK_OK\n",
      });
    },
    checkState: (session) => {
      const script = getNodeInSession(session, "/home/user/script.sh");
      if (!script || script.type !== "file" || (script.mode & 0o111) === 0) return false;
      const out = session.executedScripts["/home/user/script.sh"];
      return Array.isArray(out) && out.includes("HEALTH_CHECK_OK");
    },
    rebootCheck: false,
    proof: [
      "The script ~/script.sh has execute permission and ran cleanly via ./script.sh, printing HEALTH_CHECK_OK.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #36 — Prove a download wasn't tampered with (D3 Security)
  {
    id: "coach-verify-checksum",
    domain: "security",
    title: "Prove a download wasn't tampered with",
    job: "An installer archive agent.tar.gz and its published checksum file agent.tar.gz.sha256 just arrived in /tmp/downloads. Before anything gets installed on this server, verify the archive against its SHA-256 checksum file to prove the download was not tampered with.",
    hints: [
      "Look inside /tmp/downloads to see the downloaded archive and the companion .sha256 checksum file.",
      "Read the .sha256 file if you want to see the expected 64-character SHA-256 digest and filename.",
      "Use the SHA-256 checksum tool in check mode against /tmp/downloads/agent.tar.gz.sha256 so it computes the file's real hash and compares it automatically.",
      "When the computed hash matches the published digest in the file, the tool prints OK and exits 0.",
      "Never install a downloaded package unless the cryptographic checksum verification reports OK.",
    ],
    solution: "sha256sum -c /tmp/downloads/agent.tar.gz.sha256",
    seed: (session) => {
      ensureDirInSession(session, "/tmp/downloads", { mode: 0o755, owner: "user", group: "user" });
      const payload = "RELEASE_BINARY=mystery-agent-2.4.0\nARCH=x86_64\nBUILD=2026-09-21\n";
      const hash = computeSha256Hex(payload);
      putFileInSession(session, "/tmp/downloads/agent.tar.gz", {
        mode: 0o644,
        owner: "user",
        group: "user",
        content: payload,
      });
      putFileInSession(session, "/tmp/downloads/agent.tar.gz.sha256", {
        mode: 0o644,
        owner: "user",
        group: "user",
        content: `${hash}  /tmp/downloads/agent.tar.gz\n`,
      });
    },
    checkState: (session) => {
      return Boolean(session.verifiedChecksums["/tmp/downloads/agent.tar.gz"]);
    },
    rebootCheck: false,
    proof: [
      "The SHA-256 digest of /tmp/downloads/agent.tar.gz was verified against the published checksum file and reported OK.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #30 — "Too many open files" (D5 Troubleshooting)
  {
    id: "coach-too-many-open-files",
    domain: "troubleshoot",
    title: "\"Too many open files\"",
    job: "The app worker suddenly cannot open any new files — every request fails with \"Too many open files\". Check the current open-file descriptor limit, count how many files are held open, and raise the open-file limit to at least 4096 so the app has room to breathe.",
    hints: [
      "Each process has a per-session ceiling on how many file descriptors it is allowed to hold open at once.",
      "Check the current open-files resource limit in your shell — notice it sits at 1024.",
      "List open files across the machine and count the lines to see that app-worker is already hitting the 1024 descriptor ceiling.",
      "Raise the open-files limit to 4096 (or add a nofile rule in /etc/security/limits.conf) so the limit is well above the active open handles.",
      "Check the open-files limit again to confirm the new ceiling is active.",
    ],
    solution: "ulimit -n 4096",
    seed: (session) => {
      session.nofileSoftLimit = 1024;
      session.nofileHardLimit = 65536;
      session.extraOpenFilesCount = 1024;
      session.processes.push({
        pid: 4410,
        ppid: 1,
        user: "user",
        cpu: 1.8,
        mem: 3.1,
        stat: "Sl",
        start: "13:50",
        time: "0:09",
        procName: "app-worker",
        command: "/opt/app/bin/app-worker --shards=1024",
      });
      ensureDirInSession(session, "/etc/security", { mode: 0o755, owner: "root", group: "root" });
      putFileInSession(session, "/etc/security/limits.conf", {
        mode: 0o644,
        owner: "root",
        group: "root",
        content: "# /etc/security/limits.conf\n# <domain> <type> <item> <value>\n",
      });
    },
    checkState: (session) => {
      const limit = getEffectiveNofileLimit(session);
      return limit >= 2048 && limit > session.extraOpenFilesCount;
    },
    rebootCheck: false,
    proof: [
      "The open-file descriptor limit has been raised above the 1,024 active handles so the application can open files again.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #31 — The clock is wrong and certificates fail (D5 Troubleshooting / D1)
  {
    id: "coach-clock-wrong",
    domain: "troubleshoot",
    title: "The clock is wrong and certificates fail",
    job: "Secure connections keep failing with \"certificate is not yet valid\" — the machine's system clock is four days behind real time and NTP synchronization is turned off. Check the clock drift, turn network time synchronization back on, and step the clock so it matches true time.",
    hints: [
      "Check the machine's current date and time or time-sync status — notice the clock is stuck four days behind real time.",
      "Inspect the NTP service status or chrony tracking report to see how many seconds slow the system clock is.",
      "Enable network time synchronization or command the NTP daemon to step the system clock immediately instead of slewing over days.",
      "Once NTP synchronization is enabled and stepped, the system clock jumps forward to match true UTC time.",
      "Run the date or time-status check again to confirm the clock is synchronized and within seconds of true time.",
    ],
    solution: "timedatectl set-ntp true && chronyc makestep",
    seed: (session) => {
      session.clockOffsetSeconds = -345600;
      session.ntpSynchronized = false;
      session.ntpActive = false;
      session.services.chronyd = {
        running: false,
        enabled: true,
        port: 0,
        process: "chronyd",
      };
      syncServiceProcesses(session);
    },
    checkState: (session) => {
      return Math.abs(session.clockOffsetSeconds) < 5 && session.ntpSynchronized;
    },
    rebootCheck: false,
    proof: [
      "The system clock is stepped back to true UTC time and NTP synchronization reports active and synchronized.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #37 — Zombies are piling up (D5 Troubleshooting)
  {
    id: "coach-zombie-processes",
    domain: "troubleshoot",
    title: "Zombies are piling up",
    job: "Defunct zombie (Z) processes are piling up in the process table because their parent service worker-mgr stopped reaping exited child tasks. Inspect the process table to find the zombies and their parent, then restart or signal the parent so every defunct process is reaped.",
    hints: [
      "A zombie process (shown with STAT Z and <defunct>) has already exited, so trying to kill the zombie PID directly does nothing.",
      "List the process table with parent PIDs or service details to see which parent process owns the defunct worker-task entries.",
      "Notice that PID 3410 (the worker-mgr service) is the parent of all three Z-state processes.",
      "Signal the parent process to reap its children or restart the worker-mgr service so the old parent releases the zombie table entries.",
      "Check the process list again to verify zero Z-state processes remain.",
    ],
    solution: "systemctl restart worker-mgr",
    seed: (session) => {
      session.services["worker-mgr"] = {
        running: true,
        enabled: true,
        port: 0,
        process: "worker-mgr",
      };
      syncServiceProcesses(session);
      const mgrProc = session.processes.find((p) => p.serviceUnit === "worker-mgr");
      const parentPid = mgrProc ? mgrProc.pid : 3410;
      if (mgrProc) {
        mgrProc.pid = 3410;
      }
      session.processes.push(
        {
          pid: 3418,
          ppid: parentPid === mgrProc?.pid ? 3410 : parentPid,
          user: "user",
          cpu: 0.0,
          mem: 0.0,
          stat: "Z",
          start: "14:02",
          time: "0:00",
          procName: "worker-task",
          command: "[worker-task] <defunct>",
        },
        {
          pid: 3419,
          ppid: 3410,
          user: "user",
          cpu: 0.0,
          mem: 0.0,
          stat: "Z",
          start: "14:03",
          time: "0:00",
          procName: "worker-task",
          command: "[worker-task] <defunct>",
        },
        {
          pid: 3420,
          ppid: 3410,
          user: "user",
          cpu: 0.0,
          mem: 0.0,
          stat: "Z",
          start: "14:04",
          time: "0:00",
          procName: "worker-task",
          command: "[worker-task] <defunct>",
        },
      );
    },
    checkState: (session) => {
      const hasZombies = session.processes.some((p) => p.stat.startsWith("Z"));
      return !hasZombies;
    },
    rebootCheck: false,
    proof: [
      "All defunct (Z) zombie processes have been reaped from the process table.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #13 — Who logged in? (D5 Troubleshooting / D4)
  {
    id: "coach-who-logged-in",
    domain: "troubleshoot",
    title: "Who logged in?",
    job: "The login log file ~/lastlog has 25 raw login records with repeated usernames in unsorted order. Pull every username out of the first column of lastlog, sort them A to Z, drop the repeats, and save the clean list to ~/users.txt.",
    hints: [
      "Inspect ~/lastlog first to see the columns — each line starts with a username followed by terminal, IP address, and date.",
      "Extract only the first whitespace-separated column from lastlog so you have a stream of usernames.",
      "Pipe that stream of usernames into the line-sorting tool so identical names sit right next to each other in alphabetical order.",
      "Pipe the sorted lines into the duplicate-remover tool (or sort's unique flag) so each username appears once.",
      "Redirect the final clean output into users.txt in your home folder and read users.txt to verify.",
    ],
    solution: "awk '{ print $1 }' lastlog | sort | uniq > users.txt",
    seed: (session) => {
      const entries = [
        "dana     pts/0    10.0.2.14    Mar 11 08:12 - 09:40  (01:28)",
        "alice    pts/1    10.0.2.19    Mar 11 09:05 - 11:20  (02:15)",
        "frank    pts/2    10.0.2.31    Mar 11 10:14 - 10:55  (00:41)",
        "bob      pts/0    10.0.2.11    Mar 11 11:30 - 12:10  (00:40)",
        "alice    pts/3    10.0.2.19    Mar 11 13:02 - 14:15  (01:13)",
        "evan     pts/1    10.0.2.25    Mar 12 07:45 - 08:30  (00:45)",
        "charlie  pts/2    10.0.2.18    Mar 12 08:50 - 10:05  (01:15)",
        "dana     pts/0    10.0.2.14    Mar 12 09:15 - 11:00  (01:45)",
        "bob      pts/1    10.0.2.11    Mar 12 10:20 - 12:00  (01:40)",
        "alice    pts/2    10.0.2.19    Mar 12 13:10 - 15:40  (02:30)",
        "frank    pts/0    10.0.2.31    Mar 12 16:00 - 17:12  (01:12)",
        "charlie  pts/1    10.0.2.18    Mar 13 08:01 - 09:10  (01:09)",
        "evan     pts/2    10.0.2.25    Mar 13 08:30 - 09:50  (01:20)",
        "alice    pts/0    10.0.2.19    Mar 13 09:14 - 11:45  (02:31)",
        "dana     pts/3    10.0.2.14    Mar 13 10:05 - 10:50  (00:45)",
        "bob      pts/1    10.0.2.11    Mar 13 11:12 - 12:30  (01:18)",
        "frank    pts/2    10.0.2.31    Mar 13 12:40 - 13:20  (00:40)",
        "charlie  pts/0    10.0.2.18    Mar 13 14:00 - 15:15  (01:15)",
        "alice    pts/1    10.0.2.19    Mar 13 15:30 - 16:45  (01:15)",
        "evan     pts/2    10.0.2.25    Mar 14 08:10 - 09:00  (00:50)",
        "bob      pts/0    10.0.2.11    Mar 14 09:25 - 10:40  (01:15)",
        "dana     pts/1    10.0.2.14    Mar 14 11:00 - 12:15  (01:15)",
        "frank    pts/2    10.0.2.31    Mar 14 13:05 - 14:10  (01:05)",
        "charlie  pts/0    10.0.2.18    Mar 14 14:22 - 15:30  (01:08)",
        "alice    pts/1    10.0.2.19    Mar 14 16:00 - 17:05  (01:05)",
      ];
      putFileInSession(session, "/home/user/lastlog", {
        mode: 0o644,
        owner: "user",
        group: "user",
        content: `${entries.join("\n")}\n`,
      });
      putFileInSession(session, "/home/user/.expected_users", {
        mode: 0o644,
        owner: "root",
        group: "root",
        content: "alice\nbob\ncharlie\ndana\nevan\nfrank\n",
      });
    },
    checkState: (session) => {
      const usersNode = getNodeInSession(session, "/home/user/users.txt");
      if (!usersNode || usersNode.type !== "file") return false;
      const lines = (usersNode.content ?? "")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const expected = ["alice", "bob", "charlie", "dana", "evan", "frank"];
      if (lines.length !== expected.length) return false;
      return expected.every((u, i) => lines[i] === u);
    },
    rebootCheck: false,
    proof: [
      "The file ~/users.txt exists with all six unique usernames sorted alphabetically from A to Z and zero duplicates.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #14 — Squeeze the old logs (D4 Automation & Scripting)
  {
    id: "coach-squeeze-old-logs",
    domain: "automation",
    title: "Squeeze the old logs",
    job: "Old numbered log files (app.log.1 through app.log.6) inside ~/logs/ are eating up disk space while app.log is still live. Write an executable bash script ~/script.sh (starting with #!/bin/bash) that compresses each numbered log with gzip, then run ./script.sh so only the rotated logs become .gz files and app.log stays untouched.",
    hints: [
      "Look inside ~/logs/ first: app.log is the active log that must stay uncompressed, while app.log.1 through app.log.6 are the old rotated logs.",
      "Write ~/script.sh starting with the #!/bin/bash shebang line followed by a loop or command that runs gzip on ~/logs/app.log.[1-6].",
      "Make ~/script.sh executable so the system permits you to run it as a program.",
      "Execute ./script.sh so it compresses app.log.1 through app.log.6 into .gz archives.",
      "List ~/logs/ and test with gzip -t to confirm app.log.1.gz through app.log.6.gz exist and app.log is still uncompressed.",
    ],
    solution:
      'printf "#!/bin/bash\\nfor f in ~/logs/app.log.[1-6]; do gzip $f; done\\n" > script.sh && chmod +x script.sh && ./script.sh',
    seed: (session) => {
      ensureDirInSession(session, "/home/user/logs", { mode: 0o755, owner: "user", group: "user" });
      putFileInSession(session, "/home/user/logs/app.log", {
        mode: 0o644,
        owner: "user",
        group: "user",
        content: "2026-09-21 14:30:01 INFO live stream active\n",
      });
      for (let i = 1; i <= 6; i += 1) {
        putFileInSession(session, `/home/user/logs/app.log.${i}`, {
          mode: 0o644,
          owner: "user",
          group: "user",
          content: `2026-09-${String(21 - i).padStart(2, "0")} 23:59:59 INFO rotated log batch ${i}\n`,
        });
      }
    },
    checkState: (session) => {
      const scriptNode = getNodeInSession(session, "/home/user/script.sh");
      if (!scriptNode || scriptNode.type !== "file" || (scriptNode.mode & 0o111) === 0) return false;
      if (!(scriptNode.content ?? "").trimStart().startsWith("#!/bin/bash")) return false;

      const liveLog = getNodeInSession(session, "/home/user/logs/app.log");
      if (!liveLog || liveLog.type !== "file" || !(liveLog.content ?? "").includes("live stream active")) {
        return false;
      }
      if (getNodeInSession(session, "/home/user/logs/app.log.gz")) return false;

      for (let i = 1; i <= 6; i += 1) {
        if (getNodeInSession(session, `/home/user/logs/app.log.${i}`)) return false;
        const gz = getNodeInSession(session, `/home/user/logs/app.log.${i}.gz`);
        if (!gz || gz.type !== "file" || !(gz.content ?? "").startsWith(GZIP_MAGIC_PREFIX)) return false;
      }
      return true;
    },
    rebootCheck: false,
    proof: [
      "The executable script ~/script.sh compressed app.log.1 through app.log.6 into valid .gz files while leaving the live app.log untouched.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #26 — Set up a new user who can actually log in (D2 Services and User Management)
  {
    id: "coach-new-user-login",
    domain: "services-users",
    title: "Set up a new user who can actually log in",
    job: "A new teammate named alex starts Monday. Create the user account alex with a home folder at /home/alex, set a password for alex, and add alex to the supplementary group developers so they can log in and access team repositories.",
    hints: [
      "Check /etc/passwd or run id alex first — notice the account alex does not exist yet.",
      "Create the user account alex with the flag that automatically creates their /home/alex home directory.",
      "Set a login password for alex so the account is unlocked and allowed to authenticate.",
      "Modify alex's account to append the supplementary group developers without removing their primary group.",
      "Run id alex and check /etc/passwd to confirm alex exists with /home/alex, a set password, and membership in developers.",
    ],
    solution: "useradd -m alex && passwd alex && usermod -aG developers alex",
    seed: (session) => {
      delete session.users.alex;
    },
    checkState: (session) => {
      const acct = session.users.alex;
      if (!acct || !acct.passwordSet) return false;
      if (!acct.groups.includes("developers")) return false;
      const homeDir = getNodeInSession(session, "/home/alex");
      if (!homeDir || homeDir.type !== "dir") return false;
      const passwdNode = getNodeInSession(session, "/etc/passwd");
      return Boolean(passwdNode?.content?.includes("alex:x:"));
    },
    rebootCheck: false,
    proof: [
      "The account alex exists in /etc/passwd with home directory /home/alex, an active password, and membership in the developers group.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #29 — DNS won't resolve (D5 Troubleshooting / D1)
  {
    id: "coach-dns-broken",
    domain: "troubleshoot",
    title: "DNS won't resolve",
    job: "Nothing on this machine can reach any website by name (ping -c1 example.com fails), even though raw IP connectivity (ping -c1 8.8.8.8) works fine. Inspect the DNS resolver configuration, fix the broken nameserver entry in /etc/resolv.conf to point at a working resolver such as 8.8.8.8, and verify name lookup works.",
    hints: [
      "Test network reachability by IP first (ping -c1 8.8.8.8) and then by domain name (ping -c1 example.com or dig example.com) to confirm the problem is name resolution, not the network link.",
      "Read /etc/resolv.conf to see which DNS nameserver the system is configured to ask.",
      "Notice /etc/resolv.conf has its nameserver commented out or pointing at a dead local stub address.",
      "Write a valid nameserver line (such as nameserver 8.8.8.8) into /etc/resolv.conf.",
      "Run dig example.com or ping -c1 example.com again to confirm domain names resolve to IP addresses.",
    ],
    solution: 'echo "nameserver 8.8.8.8" > /etc/resolv.conf',
    seed: (session) => {
      putFileInSession(session, "/etc/resolv.conf", {
        mode: 0o644,
        owner: "root",
        group: "root",
        content: "# Dynamic resolv.conf(5) — stub resolver crashed\n# nameserver 127.0.0.53\n",
      });
    },
    checkState: (session) => {
      return hasWorkingDns(session);
    },
    rebootCheck: false,
    proof: [
      "A valid nameserver is configured in /etc/resolv.conf, dig example.com returns an A record, and ping by hostname succeeds.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #15 — Set up the new drive (D1 System Management)
  {
    id: "coach-new-drive",
    domain: "system-mgmt",
    title: "Set up the new drive",
    job: "A brand-new raw disk /dev/sdc just landed in the server. Give /dev/sdc a GPT partition table label, carve out one 10-gigabyte primary ext4 partition from 1 to 10G (/dev/sdc1), and format /dev/sdc1 with an ext4 filesystem so files can be stored on it.",
    hints: [
      "Run lsblk first to see the unpartitioned 20G disk /dev/sdc sitting alongside sda and sdb.",
      "Use the partition editor in script mode (-s) on /dev/sdc to create a gpt disk label.",
      "Still on /dev/sdc, create a primary partition labeled ext4 spanning from 1 to 10G so the kernel creates /dev/sdc1.",
      "Remember that mkpart only writes the partition boundary — format /dev/sdc1 (not the whole disk /dev/sdc) with the ext4 filesystem builder.",
      "Run lsblk and blkid /dev/sdc1 to verify the partition exists and reports TYPE=\"ext4\".",
    ],
    solution:
      "parted -s /dev/sdc mklabel gpt && parted -s /dev/sdc mkpart primary ext4 1 10G && mkfs.ext4 /dev/sdc1",
    seed: (session) => {
      session.disks["/dev/sdc"] = {
        device: "/dev/sdc",
        sizeBytes: 20 * 1024 ** 3,
        partitions: [],
      };
    },
    checkState: (session) => {
      const disk = session.disks["/dev/sdc"];
      if (!disk || disk.label !== "gpt") return false;
      const part1 = disk.partitions.find((p) => p.name === "/dev/sdc1");
      return Boolean(part1 && part1.fsType === "ext4");
    },
    rebootCheck: false,
    proof: [
      "The disk /dev/sdc has a GPT partition table, partition /dev/sdc1 exists, and blkid confirms an ext4 filesystem on /dev/sdc1.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #16 — Grow the disk (D1 System Management)
  {
    id: "coach-grow-disk",
    domain: "system-mgmt",
    title: "Grow the disk",
    job: "The /data volume (/dev/mapper/vgdata-data) is running out of room and a new disk /dev/sdd just arrived. Initialize /dev/sdd as an LVM physical volume, add it to the vgdata volume group, extend /dev/mapper/vgdata-data by +10GB, and resize the ext4 filesystem so df shows the extra 10 GB usable.",
    hints: [
      "Inspect current storage with lsblk, vgs, and lvs to see /dev/sdd waiting to be added to vgdata.",
      "Initialize /dev/sdd as an LVM physical volume first.",
      "Extend the vgdata volume group onto /dev/sdd so vgdata gains 10 GB of free space.",
      "Extend the logical volume /dev/mapper/vgdata-data by +10GB (be sure to include the + sign so you add 10 GB rather than setting total size to 10 GB).",
      "Growing the logical volume does not automatically grow the ext4 filesystem unless you run the ext2/ext3/ext4 filesystem resizer on /dev/mapper/vgdata-data.",
    ],
    solution:
      "pvcreate /dev/sdd && vgextend vgdata /dev/sdd && lvextend -L +10GB /dev/mapper/vgdata-data && resize2fs /dev/mapper/vgdata-data",
    seed: (session) => {
      session.disks["/dev/sdd"] = {
        device: "/dev/sdd",
        sizeBytes: 10 * 1024 ** 3,
        partitions: [],
      };
      session.lvm.pvs = ["/dev/sdc1"];
      session.lvm.vgs.vgdata = { pvs: ["/dev/sdc1"], freeGiB: 0 };
      session.lvm.lvs["/dev/mapper/vgdata-data"] = {
        vg: "vgdata",
        name: "data",
        sizeGiB: 20,
        fsSizeGiB: 20,
        active: true,
      };
      session.mounts.push({
        device: "/dev/mapper/vgdata-data",
        mountPoint: "/data",
        fsType: "ext4",
        totalBytes: 20 * 1024 ** 3,
        baseUsedBytes: 19 * 1024 ** 3,
        totalInodes: 524_288,
        baseUsedInodes: 18_400,
      });
    },
    checkState: (session) => {
      if (!session.lvm.pvs.includes("/dev/sdd")) return false;
      const vg = session.lvm.vgs.vgdata;
      if (!vg || !vg.pvs.includes("/dev/sdd")) return false;
      const lv = session.lvm.lvs["/dev/mapper/vgdata-data"];
      if (!lv || lv.sizeGiB < 30 || lv.fsSizeGiB < 30) return false;
      return true;
    },
    rebootCheck: false,
    proof: [
      "The disk /dev/sdd is an LVM physical volume in vgdata, /dev/mapper/vgdata-data is extended by 10 GB, and the ext4 filesystem is resized to 30 GB.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #17 — Bring back the deleted volume (D1/D5 Troubleshooting)
  {
    id: "coach-deleted-volume",
    domain: "troubleshoot",
    title: "Bring back the deleted volume",
    job: "Someone accidentally removed the logical volume /dev/vg_replays/lv_matches that holds the tournament match replays. The blocks are still intact on disk and LVM archived the volume group metadata in /etc/lvm/archive/vg_replays_00041.vg right before lvremove ran. Restore vg_replays from that archive file, activate /dev/vg_replays/lv_matches, and mount all filesystems in /etc/fstab so /srv/replays is back.",
    hints: [
      "List the LVM metadata archives for vg_replays (or check /etc/lvm/archive) to find the backup created right before lvremove ran: /etc/lvm/archive/vg_replays_00041.vg.",
      "Restore the vg_replays volume group configuration from /etc/lvm/archive/vg_replays_00041.vg.",
      "A restored logical volume starts inactive — activate /dev/vg_replays/lv_matches with lvchange.",
      "Once the logical volume is active again, mount all entries listed in /etc/fstab.",
      "List /srv/replays to confirm the tournament replay files are back and readable.",
    ],
    solution:
      "vgcfgrestore -f /etc/lvm/archive/vg_replays_00041.vg vg_replays && lvchange -a y /dev/vg_replays/lv_matches && mount -a",
    seed: (session) => {
      ensureDirInSession(session, "/etc/lvm/archive", { mode: 0o700, owner: "root", group: "root" });
      putFileInSession(session, "/etc/lvm/archive/vg_replays_00041.vg", {
        mode: 0o600,
        owner: "root",
        group: "root",
        content: "# LVM2 archive before lvremove /dev/vg_replays/lv_matches\nvg_replays { logical_volumes { lv_matches {} } }\n",
      });
      putFileInSession(session, "/etc/lvm/archive/vg_replays_00042.vg", {
        mode: 0o600,
        owner: "root",
        group: "root",
        content: "# LVM2 archive after lvremove\nvg_replays {}\n",
      });
      ensureDirInSession(session, "/srv/replays", { mode: 0o755, owner: "root", group: "root" });
      const fstab = getNodeInSession(session, "/etc/fstab");
      if (fstab) {
        fstab.content = `${fstab.content ?? ""}/dev/vg_replays/lv_matches /srv/replays ext4 defaults 0 2\n`;
      }
    },
    checkState: (session) => {
      const lv = session.lvm.lvs["/dev/vg_replays/lv_matches"];
      if (!lv || !lv.active) return false;
      if (!session.mountedShares["/srv/replays"]) return false;
      return Boolean(getNodeInSession(session, "/srv/replays/finals-match-01.rec"));
    },
    rebootCheck: false,
    proof: [
      "The volume group vg_replays is restored, /dev/vg_replays/lv_matches is active, and /srv/replays is mounted with the replay files intact.",
      "You did it without being given the command — hints only, no answer handed to you.",
      "You can do it again, cold, three days later — same kind of job, no hints.",
    ],
  },

  // #32 — The firewall locked you out of SSH (D3 Security)
  {
    id: "coach-firewall-ssh",
    domain: "security",
    title: "The firewall locked you out of SSH",
    job: "Someone enabled the host firewall (ufw) with only HTTP allowed, locking everyone out of SSH on port 22/tcp. From the local emergency console, open port 22/tcp in ufw without turning the firewall off.",
    hints: [
      "Check the current firewall status to see that ufw is active and only 80/tcp is allowed.",
      "Never disable the whole firewall just to let one service through — add an allow rule for SSH instead.",
      "Tell ufw to allow 22/tcp (or ssh) while keeping the firewall active.",
      "Run ufw status again to confirm 22/tcp shows ALLOW Anywhere while Status remains active.",
      "Keeping the firewall enabled while opening 22/tcp restores remote SSH access safely.",
    ],
    solution: "ufw allow 22/tcp",
    seed: (session) => {
      session.ufw = {
        enabled: true,
        allowed: ["80/tcp"],
      };
    },
    checkState: (session) => {
      return session.ufw.enabled && session.ufw.allowed.includes("22/tcp");
    },
    rebootCheck: false,
    proof: [
      "Port 22/tcp is allowed through ufw while the firewall remains active and enabled.",
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
