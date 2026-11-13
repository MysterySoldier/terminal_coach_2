import { COACH_JOBS, createJobSession } from "@/data/coach-jobs";
import { SANDBOX_TASKS } from "@/data/sandbox";
import {
  createSession,
  getNodeInSession,
  parseCommand,
  rebootSession,
  runCommandInSession,
} from "@/lib/terminal-engine";
import { isTaskSolved } from "@/lib/coach";

const HOME = "/home/user";

function run(session: ReturnType<typeof createSession>, raw: string, cwd = HOME) {
  return runCommandInSession(session, raw, cwd);
}

describe("truthful shell: chmod and chown actually change state", () => {
  it("chmod 750 changes the mode and ls -l shows it", () => {
    const session = createSession();
    expect(getNodeInSession(session, "/home/user/deploy.sh")?.mode).toBe(0o644);
    const result = run(session, "chmod 750 deploy.sh");
    expect(result.output[0]).toContain("750");
    expect(getNodeInSession(session, "/home/user/deploy.sh")?.mode).toBe(0o750);
    const listing = run(session, "ls -l deploy.sh");
    expect(listing.output.join("\n")).toContain("rwxr-x---");
  });

  it("chmod 777 then ls -l shows everyone has everything", () => {
    const session = createSession();
    run(session, "chmod 777 deploy.sh");
    expect(run(session, "ls -l deploy.sh").output.join("\n")).toContain("rwxrwxrwx");
  });

  it("symbolic chmod u=rwx,g=rx,o= gives 750", () => {
    const session = createSession();
    run(session, "chmod u=rwx,g=rx,o= deploy.sh");
    expect(getNodeInSession(session, "/home/user/deploy.sh")?.mode).toBe(0o750);
  });

  it("chmod on a missing file changes nothing and says so", () => {
    const session = createSession();
    const result = run(session, "chmod 750 nope.sh");
    expect(result.output[0]).toContain("No such file or directory");
    expect(getNodeInSession(session, "/home/user/deploy.sh")?.mode).toBe(0o644);
  });

  it("chown changes owner and group and stat shows it", () => {
    const session = createSession();
    run(session, "chown alice:web deploy.sh");
    const node = getNodeInSession(session, "/home/user/deploy.sh");
    expect(node?.owner).toBe("alice");
    expect(node?.group).toBe("web");
    expect(run(session, "stat deploy.sh").output.join("\n")).toContain("alice");
  });

  it("chmod -R changes a whole tree", () => {
    const session = createSession();
    run(session, "chmod -R 700 /home/user/notes");
    expect(getNodeInSession(session, "/home/user/notes")?.mode).toBe(0o700);
    expect(getNodeInSession(session, "/home/user/notes/todo.md")?.mode).toBe(0o700);
  });
});

describe("truthful shell: tar really creates the archive", () => {
  it("tar -czf creates etc.tar.gz and tar -tf lists what is inside", () => {
    const session = createSession();
    expect(getNodeInSession(session, "/home/user/etc.tar.gz")).toBeNull();
    const result = run(session, "tar -czf etc.tar.gz /etc");
    expect(result.changed?.created).toContain("/home/user/etc.tar.gz");
    expect(getNodeInSession(session, "/home/user/etc.tar.gz")).not.toBeNull();
    expect(run(session, "ls").output.join(" ")).toContain("etc.tar.gz");
    const listing = run(session, "tar -tf etc.tar.gz");
    expect(listing.output).toContain("/etc/passwd");
  });
});

describe("truthful shell: services, ss, curl, and reboot", () => {
  it("nginx is down at first: ss shows no :80 and curl is refused", () => {
    const session = createSession();
    expect(run(session, "ss -tlnp").output.join("\n")).not.toContain(":80");
    expect(run(session, "curl localhost").output[0]).toContain("Connection refused");
    expect(run(session, "systemctl is-active nginx").output).toEqual(["inactive"]);
  });

  it("systemctl start nginx brings the website up, and curl proves it", () => {
    const session = createSession();
    run(session, "systemctl start nginx");
    expect(run(session, "ss -tlnp").output.join("\n")).toContain(":80");
    expect(run(session, "curl localhost").output).toContain("<h1>it works</h1>");
  });

  it("a started-but-not-enabled service does NOT survive a reboot", () => {
    const session = createSession();
    run(session, "systemctl start nginx");
    expect(session.services.nginx.running).toBe(true);
    rebootSession(session);
    expect(session.services.nginx.running).toBe(false);
    expect(run(session, "curl localhost").output[0]).toContain("Connection refused");
  });

  it("an enabled service survives a reboot", () => {
    const session = createSession();
    run(session, "systemctl enable --now nginx");
    expect(session.services.nginx.enabled).toBe(true);
    rebootSession(session);
    expect(session.services.nginx.running).toBe(true);
    expect(run(session, "curl localhost").output).toContain("<h1>it works</h1>");
  });

  it("the reboot command itself works and reports what came back", () => {
    const session = createSession();
    run(session, "systemctl enable nginx");
    const result = run(session, "reboot");
    expect(result.output.join("\n")).toContain("System back up");
    expect(session.services.nginx.running).toBe(true);
  });

  it("chmod survives a reboot — it is on disk, not in memory", () => {
    const session = createSession();
    run(session, "chmod 750 deploy.sh");
    rebootSession(session);
    expect(getNodeInSession(session, "/home/user/deploy.sh")?.mode).toBe(0o750);
  });
});

describe("truthful shell: the old commands still work", () => {
  it("pwd, cd, ls, cat, find, grep behave as before", () => {
    const session = createSession();
    expect(run(session, "pwd").output).toEqual([HOME]);
    const cd = run(session, "cd /var/log");
    expect(cd.cwd).toBe("/var/log");
    expect(run(session, "cat /etc/fstab", "/etc").output.join("\n")).toContain("UUID");
    expect(run(session, "find /var -type f -size +100M").output).toEqual([]);
    const grep = run(session, "grep -rn Port /etc");
    expect(grep.output.join("\n")).toContain("Port 22");
    expect(run(session, "ls -la", HOME).output.join("\n")).toContain(".bashrc");
  });

  it("an unknown command still says command not found", () => {
    const session = createSession();
    const result = run(session, "vim notes/todo.md");
    expect(result.unknown).toBe(true);
    expect(result.output[0]).toContain("command not found");
  });
});

describe("state-based grading", () => {
  const chmodTask = SANDBOX_TASKS.find((t) => t.id === "sb-chmod-750")!;

  it("chmod 750 solves the task because the state is right", () => {
    const session = createSession();
    const before = chmodTask.checkState!(session, HOME);
    expect(before).toBe(false);
    const result = run(session, "chmod 750 deploy.sh");
    const solved = isTaskSolved(
      chmodTask,
      session,
      before,
      { parsed: parseCommand("chmod 750 deploy.sh"), cwdBefore: HOME, cwdAfter: HOME, result },
    );
    expect(solved).toBe(true);
  });

  it("chmod 755 does not solve it — the state is wrong", () => {
    const session = createSession();
    const before = chmodTask.checkState!(session, HOME);
    const result = run(session, "chmod 755 deploy.sh");
    const solved = isTaskSolved(
      chmodTask,
      session,
      before,
      { parsed: parseCommand("chmod 755 deploy.sh"), cwdBefore: HOME, cwdAfter: HOME, result },
    );
    expect(solved).toBe(false);
    expect(getNodeInSession(session, "/home/user/deploy.sh")?.mode).toBe(0o755);
  });

  it("an unrelated command does not get a free pass when the state is already right", () => {
    const session = createSession();
    run(session, "chmod 750 deploy.sh");
    const before = chmodTask.checkState!(session, HOME);
    expect(before).toBe(true);
    const result = run(session, "ls");
    const solved = isTaskSolved(
      chmodTask,
      session,
      before,
      { parsed: parseCommand("ls"), cwdBefore: HOME, cwdAfter: HOME, result },
    );
    expect(solved).toBe(false);
  });

  it("a symbolic chmod that lands on 750 also solves it — any way that works, works", () => {
    const session = createSession();
    const before = chmodTask.checkState!(session, HOME);
    const result = run(session, "chmod u=rwx,g=rx,o= deploy.sh");
    const solved = isTaskSolved(
      chmodTask,
      session,
      before,
      { parsed: parseCommand("chmod u=rwx,g=rx,o= deploy.sh"), cwdBefore: HOME, cwdAfter: HOME, result },
    );
    expect(solved).toBe(true);
  });
});

describe("Phase 1 engine: real tar -x extraction and path rules", () => {
  it("tar -c then tar -x -C rebuilds real files and contents with GNU leading-slash stripping", () => {
    const session = createSession();
    run(session, "tar -czf /tmp/notes.tar.gz /home/user/notes");
    run(session, "mkdir -p /tmp/ unpacked");
    run(session, "mkdir -p /tmp/unpacked");
    const extract = run(session, "tar -xzvf /tmp/notes.tar.gz -C /tmp/unpacked");
    expect(extract.exitCode).toBe(0);
    const restored = getNodeInSession(session, "/tmp/unpacked/home/user/notes/todo.md");
    expect(restored?.type).toBe("file");
    expect(restored?.content).toContain("rotate ssh keys");
  });

  it("unpacking storefront.tar with -C /opt/ restores /opt/storefront without stray /storefront or /opt/opt", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-restore-backup")!;
    const session = createJobSession(job);
    expect(getNodeInSession(session, "/opt/storefront/server.js")).toBeNull();

    const res = run(session, "tar -xvf /backups/storefront.tar -C /opt/");
    expect(res.exitCode).toBe(0);
    expect(getNodeInSession(session, "/opt/storefront/server.js")?.content).toContain("Storefront v2.4.1");
    expect(getNodeInSession(session, "/opt/storefront/config/storefront.conf")?.content).toContain("APP_ENV=production");
    expect(getNodeInSession(session, "/opt/storefront/public/index.html")?.content).toContain("Storefront Online");
    expect(getNodeInSession(session, "/storefront")).toBeNull();
    expect(getNodeInSession(session, "/opt/opt")).toBeNull();
    expect(getNodeInSession(session, "/opt/storefront/storefront")).toBeNull();
  });
});

describe("Phase 1 engine: mkdir, cp, mv, rm mutate real filesystem state", () => {
  it("mkdir -p, cp, mv, and rm create, copy, move, and delete real files", () => {
    const session = createSession();
    expect(run(session, "mkdir -p /tmp/work/sub").exitCode).toBe(0);
    expect(getNodeInSession(session, "/tmp/work/sub")?.type).toBe("dir");

    expect(run(session, "cp deploy.sh /tmp/work/deploy-copy.sh").exitCode).toBe(0);
    expect(getNodeInSession(session, "/home/user/deploy.sh")).not.toBeNull();
    expect(getNodeInSession(session, "/tmp/work/deploy-copy.sh")?.content).toContain("deploying");

    expect(run(session, "mv /tmp/work/deploy-copy.sh /tmp/work/sub/deploy-moved.sh").exitCode).toBe(0);
    expect(getNodeInSession(session, "/tmp/work/deploy-copy.sh")).toBeNull();
    expect(getNodeInSession(session, "/tmp/work/sub/deploy-moved.sh")?.content).toContain("deploying");

    // rm without -r refuses directory, rm on file removes it, rm -rf removes directory tree
    expect(run(session, "rm /tmp/work").exitCode).toBe(1);
    expect(run(session, "rm /tmp/work/sub/deploy-moved.sh").exitCode).toBe(0);
    expect(getNodeInSession(session, "/tmp/work/sub/deploy-moved.sh")).toBeNull();
    expect(run(session, "rm -rf /tmp/work").exitCode).toBe(0);
    expect(getNodeInSession(session, "/tmp/work")).toBeNull();
  });
});

describe("Phase 1 engine: process table, ps, kill (SIGTERM vs SIGKILL), and ss -tlnp port ownership", () => {
  it("ps aux --sort=-%cpu lists runaway first; SIGTERM leaves ignoresSigterm process running; SIGKILL (-9) removes it", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-runaway-cpu")!;
    const session = createJobSession(job);

    const psBefore = run(session, "ps aux --sort=-%cpu");
    expect(psBefore.output[1]).toContain("4412");
    expect(psBefore.output[1]).toContain("98.7");

    // Polite SIGTERM is ignored by this hung worker
    expect(run(session, "kill 4412").exitCode).toBe(0);
    expect(run(session, "ps aux --sort=-%cpu").output.join("\n")).toContain("4412");

    // SIGKILL (-9) forces immediate removal
    expect(run(session, "kill -9 4412").exitCode).toBe(0);
    expect(run(session, "ps aux --sort=-%cpu").output.join("\n")).not.toContain("4412");
  });

  it("ss -tlnp shows owning PID on port 80, systemctl start fails while occupied, and killing that PID frees port 80", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-port-in-use")!;
    const session = createJobSession(job);

    const ssBefore = run(session, "ss -tlnp").output.join("\n");
    expect(ssBefore).toContain(":80");
    expect(ssBefore).toContain("pid=2847");

    const blockedStart = run(session, "systemctl start httpd");
    expect(blockedStart.exitCode).not.toBe(0);
    expect(blockedStart.output.join("\n")).toContain("Address already in use");

    expect(run(session, "kill 2847").exitCode).toBe(0);
    expect(run(session, "ss -tlnp").output.join("\n")).not.toContain("pid=2847");

    expect(run(session, "systemctl start httpd").exitCode).toBe(0);
    expect(run(session, "ss -tlnp").output.join("\n")).toContain("httpd");
    expect(run(session, "curl localhost").output.join("\n")).toContain("Apache httpd online");
  });
});

describe("Phase 1 engine: df and df -i byte vs inode exhaustion", () => {
  it("blocks file creation with No space left on device when inodes hit 0 even with gigabytes free, then recovers after rm", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-inodes-gone")!;
    const session = createJobSession(job);

    const dfBytes = run(session, "df -h").output.join("\n");
    expect(dfBytes).toContain("22G");

    const dfInodesBefore = run(session, "df -i").output.join("\n");
    expect(dfInodesBefore).toMatch(/\s0\s+100%\s+\/$/m);

    const touchBlocked = run(session, "touch /tmp/probe.txt");
    expect(touchBlocked.exitCode).not.toBe(0);
    expect(touchBlocked.output.join("\n")).toContain("No space left on device");

    expect(run(session, "rm -f /var/spool/maildrop/*").exitCode).toBe(0);

    const dfInodesAfter = run(session, "df -i").output.join("\n");
    expect(dfInodesAfter).toContain("1500");
    expect(run(session, "touch /tmp/probe.txt").exitCode).toBe(0);
    expect(getNodeInSession(session, "/tmp/probe.txt")?.type).toBe("file");
  });
});

describe("Phase 1 engine: mv with ~, $USER expansion, output redirection (> and >>), yum install httpd, and lsof", () => {
  it("expands ~ and $USER, moves ~/admin to ~/.ssh/, locks mode 0600, and writes ~/.ssh/config via > and >>", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-ssh-key-server1")!;
    const session = createJobSession(job);

    expect(getNodeInSession(session, "/home/user/admin")?.owner).toBe("root");
    expect(run(session, "mv ~/admin ~/.ssh/").exitCode).toBe(0);
    expect(getNodeInSession(session, "/home/user/admin")).toBeNull();
    expect(getNodeInSession(session, "/home/user/.ssh/admin")?.type).toBe("file");

    expect(run(session, "chmod 0600 ~/.ssh/admin").exitCode).toBe(0);
    expect((getNodeInSession(session, "/home/user/.ssh/admin")!.mode & 0o777)).toBe(0o600);

    expect(run(session, "chown $USER ~/.ssh/admin").exitCode).toBe(0);
    expect(getNodeInSession(session, "/home/user/.ssh/admin")?.owner).toBe("user");

    // Write config line-by-line using > and >>
    expect(run(session, 'echo "Host server1" > ~/.ssh/config').exitCode).toBe(0);
    expect(run(session, 'echo "  HostName server1" >> ~/.ssh/config').exitCode).toBe(0);
    expect(run(session, 'echo "  Port 2222" >> ~/.ssh/config').exitCode).toBe(0);
    expect(run(session, 'echo "  User admin" >> ~/.ssh/config').exitCode).toBe(0);
    expect(run(session, 'echo "  IdentityFile ~/.ssh/admin" >> ~/.ssh/config').exitCode).toBe(0);

    expect(job.checkState!(session, HOME)).toBe(true);
    expect(run(session, "ssh server1").exitCode).toBe(0);
  });

  it("yum install httpd installs the package so systemctl start/enable httpd succeed and curl localhost returns 200", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-install-httpd")!;
    const session = createJobSession(job);

    // Before yum install httpd, systemctl start httpd fails with unit not found
    const beforeInstall = run(session, "systemctl start httpd");
    expect(beforeInstall.exitCode).toBe(5);
    expect(beforeInstall.output.join("\n")).toContain("Unit httpd.service could not be found");

    // Installing apache2 fails on Red Hat family
    expect(run(session, "yum install apache2").exitCode).toBe(1);

    // Installing httpd succeeds
    const installRes = run(session, "yum install httpd");
    expect(installRes.exitCode).toBe(0);
    expect(session.packages.httpd).toBe(true);
    expect(job.checkState!(session, HOME)).toBe(false);

    expect(run(session, "systemctl start httpd").exitCode).toBe(0);
    expect(job.checkState!(session, HOME)).toBe(false);

    expect(run(session, "systemctl enable httpd").exitCode).toBe(0);
    expect(job.checkState!(session, HOME)).toBe(true);
    expect(run(session, "systemctl is-active httpd").output).toEqual(["active"]);
    expect(run(session, "systemctl is-enabled httpd").output).toEqual(["enabled"]);
    expect(run(session, "curl -I localhost").output[0]).toContain("200 OK");
  });

  it("lsof | grep deleted reports open deleted log file eating disk, and systemctl restart httpd frees the space", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-deleted-open-file")!;
    const session = createJobSession(job);

    expect(run(session, "df -h").output.join("\n")).toMatch(/100%\s+\/$/m);
    const lsofOut = run(session, "lsof | grep deleted");
    expect(lsofOut.exitCode).toBe(0);
    expect(lsofOut.output.join("\n")).toContain("httpd");
    expect(lsofOut.output.join("\n")).toContain("/var/log/httpd/access_log (deleted)");

    const restartRes = run(session, "systemctl restart httpd");
    expect(restartRes.exitCode).toBe(0);
    expect(session.openDeletedFiles).toHaveLength(0);
    expect(run(session, "lsof | grep deleted").output).toEqual([]);
    expect(run(session, "df -h").output.join("\n")).toContain("46% /");
    expect(job.checkState!(session, HOME)).toBe(true);
  });

  it("find -nouser lists files with unknown numeric UID and chown -R alice /srv/projects resolves them", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-deleted-user-files")!;
    const session = createJobSession(job);

    const before = run(session, "find / -nouser");
    expect(before.exitCode).toBe(0);
    expect(before.output).toContain("/srv/projects");
    expect(before.output).toContain("/srv/projects/roadmap.txt");
    expect(before.output).toContain("/srv/projects/schema.sql");

    expect(run(session, "chown -R alice /srv/projects").exitCode).toBe(0);
    expect(run(session, "find / -nouser").output).toEqual([]);
    expect(job.checkState!(session, HOME)).toBe(true);
  });

  it("journalctl -u nginx shows EXEC permission error, and chmod +x /usr/sbin/nginx + systemctl restart nginx recovers it", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-service-journal")!;
    const session = createJobSession(job);

    expect(run(session, "systemctl status nginx").output.join("\n")).toContain("failed");
    const jOut = run(session, "journalctl -u nginx");
    expect(jOut.exitCode).toBe(0);
    expect(jOut.output.join("\n")).toContain("Failed to execute /usr/sbin/nginx: Permission denied");

    expect(run(session, "chmod +x /usr/sbin/nginx").exitCode).toBe(0);
    expect(run(session, "systemctl restart nginx").exitCode).toBe(0);
    expect(run(session, "systemctl is-active nginx").output).toEqual(["active"]);
    expect(job.checkState!(session, HOME)).toBe(true);
  });

  it("./script.sh fails with Permission denied before chmod +x, then executes and records output after chmod +x", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-script-not-found")!;
    const session = createJobSession(job);

    expect(run(session, "script.sh").unknown).toBe(true);
    const denied = run(session, "./script.sh");
    expect(denied.exitCode).toBe(126);
    expect(denied.output[0]).toContain("Permission denied");

    expect(run(session, "chmod +x script.sh").exitCode).toBe(0);
    expect(run(session, "hash -r").exitCode).toBe(0);
    const ok = run(session, "./script.sh");
    expect(ok.exitCode).toBe(0);
    expect(ok.output).toContain("HEALTH_CHECK_OK");
    expect(job.checkState!(session, HOME)).toBe(true);
  });

  it("sha256sum -c verifies a good checksum file and fails on a tampered file", () => {
    const job = COACH_JOBS.find((j) => j.id === "coach-verify-checksum")!;
    const session = createJobSession(job);

    const checkRes = run(session, "sha256sum -c /tmp/downloads/agent.tar.gz.sha256");
    expect(checkRes.exitCode).toBe(0);
    expect(checkRes.output[0]).toContain("OK");
    expect(job.checkState!(session, HOME)).toBe(true);

    // Tamper with the file and verify sha256sum -c catches it
    const tampered = createJobSession(job);
    run(tampered, 'echo "corrupted" > /tmp/downloads/agent.tar.gz');
    const badRes = run(tampered, "sha256sum -c /tmp/downloads/agent.tar.gz.sha256");
    expect(badRes.exitCode).toBe(1);
    expect(badRes.output.join("\n")).toContain("FAILED");
    expect(job.checkState!(tampered, HOME)).toBe(false);
  });
});
