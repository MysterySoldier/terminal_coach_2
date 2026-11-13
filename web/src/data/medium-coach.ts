import { COACH_JOBS } from "./coach-jobs";

/**
 * Over Your Shoulder — Medium mode walkthroughs & shadow-typing segments.
 *
 * Gives every coach job an ordered, plain-words walkthrough in everyday /
 * library metaphors and character-exact `[start, end)` segments over each
 * stage's shadow command. Jobs 1–9 use a single shadow command; Phase 1
 * incident jobs (#10, #18–#23) use multi-stage shadow chains (diagnose → fix).
 */

export interface MediumStep {
  /** 1-based step order within this stage. */
  stepNumber: number;
  /** Inclusive start index inside `target`. */
  start: number;
  /** Exclusive end index inside `target`. */
  end: number;
  /** Short plain-words title for this piece of the command. */
  partLabel: string;
  /** Plain-words coaching explaining where to look and what this part does. */
  walkthrough: string;
  /** Plain-words coaching shown when a wrong key is pressed in `[start, end)` — never gives the answer. */
  wrongKeyHint: string;
}

export interface MediumStage {
  /** Full target command shown as light-grey shadow text for this stage. */
  target: string;
  /** Ordered character segments covering `0..target.length` with no gaps. */
  steps: MediumStep[];
}

export interface MediumJobPlan {
  jobId: string;
  /** First stage's target command shown as light-grey shadow text in the terminal. */
  target: string;
  /** Plain-words orientation pointing where to look on the machine. */
  whereToLook: string;
  /** First stage's character segments covering `0..target.length` with no gaps. */
  steps: MediumStep[];
  /** Ordered shadow-typing chain (1 stage on single-command jobs, multi-stage on diagnose-then-fix jobs). */
  stages: MediumStage[];
}

type PlanSpec =
  | { whereToLook: string; steps: MediumStep[]; stages?: undefined }
  | { whereToLook: string; stages: MediumStage[]; steps?: undefined };

const PLANS_BY_ID: Record<string, PlanSpec> = {
  "coach-website-down": {
    whereToLook:
      "Look at the web server like the front-desk lights in a library: right now the switch is off, and the morning opening checklist has it unchecked too.",
    steps: [
      {
        stepNumber: 1,
        start: 0,
        end: 10,
        partLabel: "1. Open the service switchboard",
        walkthrough:
          "Start with the building's master service switchboard — the tool that controls background programs — followed by a space.",
        wrongKeyHint:
          "That part is the service switchboard program at the start of the line (or the space right after it). Check the spelling of that tool.",
      },
      {
        stepNumber: 2,
        start: 10,
        end: 17,
        partLabel: "2. Put it on the boot checklist",
        walkthrough:
          "Next, tell the switchboard to add this service to the startup checklist so it turns back on automatically after every reboot.",
        wrongKeyHint:
          "That part is the boot-startup action word (or the space after it) — the word that keeps a service enabled across restarts.",
      },
      {
        stepNumber: 3,
        start: 17,
        end: 23,
        partLabel: "3. Flip it on right this second",
        walkthrough:
          "Now add the two-dash flag that also starts the service immediately today, instead of waiting for the next reboot.",
        wrongKeyHint:
          "That part is the two-dash immediate-start flag (or the space after it) — start with two dashes so it runs right now too.",
      },
      {
        stepNumber: 4,
        start: 23,
        end: 28,
        partLabel: "4. Name the web server",
        walkthrough:
          "Finish with the name of the web server program itself, then press Enter to bring the site up for good.",
        wrongKeyHint:
          "That final part is the name of the web server program — check the letters of the service name.",
      },
    ],
  },
  "coach-sb-ls-la": {
    whereToLook:
      "Your home folder is like your personal desk drawer: an ordinary glance skips tucked-away dot-files and hides the ownership ledger.",
    steps: [
      {
        stepNumber: 1,
        start: 0,
        end: 3,
        partLabel: "1. Ask for the shelf list",
        walkthrough:
          "Begin with the folder-listing tool and a space — asking the clerk to read out what sits in your current drawer.",
        wrongKeyHint:
          "That first part is the short directory-listing command (or the space right after it).",
      },
      {
        stepNumber: 2,
        start: 3,
        end: 6,
        partLabel: "2. Long ledger + hidden dot-files",
        walkthrough:
          "Bundle both view switches behind one dash: one prints the full permission-and-owner ledger, and the other uncovers hidden dot-files.",
        wrongKeyHint:
          "That part is the dash and the two bundled view switches — one for the long ledger format and one for all hidden files.",
      },
    ],
  },
  "coach-sb-find-large": {
    whereToLook:
      "The variable-data wing holds growing logs and caches. Instead of opening every room by hand, send a search clerk down the whole wing with a size scale.",
    steps: [
      {
        stepNumber: 1,
        start: 0,
        end: 5,
        partLabel: "1. Send the search clerk",
        walkthrough:
          "Start with the deep-walking search tool and a space so it checks every sub-folder underneath.",
        wrongKeyHint:
          "That part is the file-searching command word at the beginning of the line (or the space after it).",
      },
      {
        stepNumber: 2,
        start: 5,
        end: 10,
        partLabel: "2. Point to the variable-data wing",
        walkthrough:
          "Give the starting folder where logs and variable data live, starting from the root slash, followed by a space.",
        wrongKeyHint:
          "That part is the starting folder path from the root slash for variable system data (or the space after it).",
      },
      {
        stepNumber: 3,
        start: 10,
        end: 18,
        partLabel: "3. Regular documents only",
        walkthrough:
          "Add the item-kind filter so the clerk reports real files only and ignores folder binders.",
        wrongKeyHint:
          "That part is the item-type option, a space, and the single letter that stands for a regular file.",
      },
      {
        stepNumber: 4,
        start: 18,
        end: 29,
        partLabel: "4. Strictly heavier than 100 megabytes",
        walkthrough:
          "Finish with the size filter: use a plus sign for 'larger than', the number one hundred, and the capital megabyte unit.",
        wrongKeyHint:
          "Check the size filter part: the option name, a plus sign for 'greater than', the number one hundred, and the capital megabyte letter.",
      },
    ],
  },
  "coach-sb-chmod-750": {
    whereToLook:
      "Look at the deployment script in your home folder like a staff-only room: the owner needs every key, the team group may read and run it, and visitors outside get locked out.",
    steps: [
      {
        stepNumber: 1,
        start: 0,
        end: 6,
        partLabel: "1. Pick up the lock-changing tool",
        walkthrough:
          "Start with the file-mode tool that changes permission locks, followed by a space.",
        wrongKeyHint:
          "That first part is the permission-changing command name (or the space right after it).",
      },
      {
        stepNumber: 2,
        start: 6,
        end: 10,
        partLabel: "2. Set owner, group, and outsider badges",
        walkthrough:
          "Type the three-digit lock code — full control for the owner, read-plus-run for the group, nothing for outsiders — then a space.",
        wrongKeyHint:
          "That part is the three-digit permission code (owner first, group second, outsiders third) or the space after it.",
      },
      {
        stepNumber: 3,
        start: 10,
        end: 19,
        partLabel: "3. Name the deployment script",
        walkthrough:
          "Finish with the exact script filename in your folder, then press Enter to re-key its permissions.",
        wrongKeyHint:
          "That final part is the deployment script's filename and extension — check the letters and the dot.",
      },
    ],
  },
  "coach-sb-grep-recursive": {
    whereToLook:
      "The configuration cabinet has sub-drawers inside it. You want a page scanner that checks every sub-drawer for the port setting and writes down the line number.",
    steps: [
      {
        stepNumber: 1,
        start: 0,
        end: 5,
        partLabel: "1. Start the line scanner",
        walkthrough:
          "Begin with the pattern-matching text scanner and a space.",
        wrongKeyHint:
          "That first part is the text-searching command name (or the space right after it).",
      },
      {
        stepNumber: 2,
        start: 5,
        end: 9,
        partLabel: "2. Walk sub-folders + stamp line numbers",
        walkthrough:
          "Bundle two switches after a dash: walk into every sub-folder, and print the line number beside every hit.",
        wrongKeyHint:
          "That part is the dash and two bundled switches — one for recursive sub-folders and one for line numbers.",
      },
      {
        stepNumber: 3,
        start: 9,
        end: 14,
        partLabel: "3. Spell the setting word",
        walkthrough:
          "Type the exact capitalized setting word you are hunting for, followed by a space.",
        wrongKeyHint:
          "That part is the search word itself (watch the capital first letter) or the space right after it.",
      },
      {
        stepNumber: 4,
        start: 14,
        end: 18,
        partLabel: "4. Point at the configuration cabinet",
        walkthrough:
          "Finish with the top-level configuration directory so every file underneath gets scanned.",
        wrongKeyHint:
          "That final part is the root-slash path to the system configuration directory.",
      },
    ],
  },
  "coach-sb-cd-logs": {
    whereToLook:
      "System journals and error records sit in the log room inside the variable-data wing. Step directly from your home folder into that room.",
    steps: [
      {
        stepNumber: 1,
        start: 0,
        end: 3,
        partLabel: "1. Step out of your current folder",
        walkthrough:
          "Start with the two-letter command that moves your working directory, followed by a space.",
        wrongKeyHint:
          "That first part is the change-directory command (or the single space right after it).",
      },
      {
        stepNumber: 2,
        start: 3,
        end: 11,
        partLabel: "2. Walk into the system log room",
        walkthrough:
          "Type the full address from the root slash through the variable wing into the log room.",
        wrongKeyHint:
          "That part is the directory path starting with a slash — first the variable-data folder, then a slash, then the log folder.",
      },
    ],
  },
  "coach-sb-tar-create": {
    whereToLook:
      "Before touching live configuration binders, pack a compressed copy of the whole configuration cabinet into a labeled backup crate in your current folder.",
    steps: [
      {
        stepNumber: 1,
        start: 0,
        end: 4,
        partLabel: "1. Call the archive packer",
        walkthrough:
          "Start with the archiving tool that bundles whole directories into one file, followed by a space.",
        wrongKeyHint:
          "That first part is the three-letter archiver command (or the space right after it).",
      },
      {
        stepNumber: 2,
        start: 4,
        end: 9,
        partLabel: "2. Create + gzip + name the output file",
        walkthrough:
          "Bundle the three archive switches: create a new archive, compress it with gzip, and write to the filename given next.",
        wrongKeyHint:
          "That part is the dash and three bundled archive switches — create, gzip, and output-file — followed by a space.",
      },
      {
        stepNumber: 3,
        start: 9,
        end: 20,
        partLabel: "3. Label the new backup archive",
        walkthrough:
          "Type the exact compressed archive filename to create in your folder, followed by a space.",
        wrongKeyHint:
          "That part is the backup archive's filename with both extensions (or the space right after it).",
      },
      {
        stepNumber: 4,
        start: 20,
        end: 24,
        partLabel: "4. Name the cabinet to pack",
        walkthrough:
          "Finish with the configuration directory you want copied into that backup archive.",
        wrongKeyHint:
          "That last part is the root-slash path to the configuration directory being backed up.",
      },
    ],
  },
  "coach-sb-ss-listen": {
    whereToLook:
      "Think of network ports like numbered service windows in a post office: you want a clean roster of open TCP windows, with raw window numbers and the clerk sitting behind each one.",
    steps: [
      {
        stepNumber: 1,
        start: 0,
        end: 3,
        partLabel: "1. Open the modern socket roster",
        walkthrough:
          "Start with the modern two-letter socket inspection tool and a space.",
        wrongKeyHint:
          "That first part is the modern two-letter socket command (or the space right after it).",
      },
      {
        stepNumber: 2,
        start: 3,
        end: 8,
        partLabel: "2. TCP + listening + numeric + process",
        walkthrough:
          "Bundle all four switches behind one dash: TCP sockets, listening only, numeric port numbers, and the owning program.",
        wrongKeyHint:
          "That part is the dash and four bundled switches: TCP, listening, numeric numbers, and owning process.",
      },
    ],
  },
  "coach-sb-cat-fstab": {
    whereToLook:
      "Inside the configuration cabinet sits a static roster listing every drive that must be mounted when the machine boots up. Lay that roster out on screen.",
    steps: [
      {
        stepNumber: 1,
        start: 0,
        end: 4,
        partLabel: "1. Use the page reader",
        walkthrough:
          "Start with the short command that prints a whole text file straight to your terminal, followed by a space.",
        wrongKeyHint:
          "That first part is the file-printing command at the beginning of the line (or the space after it).",
      },
      {
        stepNumber: 2,
        start: 4,
        end: 14,
        partLabel: "2. Point to the boot mount table",
        walkthrough:
          "Type the path inside the configuration cabinet to the static filesystem table read at startup.",
        wrongKeyHint:
          "That part is the path from the root slash into the configuration folder for the boot filesystem table.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Phase 1 multi-stage shadow chains (#10, #18, #19, #20, #21, #22, #23)
  // ---------------------------------------------------------------------------

  "coach-restore-backup": {
    whereToLook:
      "Think of a backup crate like packed library shelves: check the empty room first, read the packing slip on the crate so you see how the paths are labeled, then unpack into the right parent hallway.",
    stages: [
      {
        target: "ls -la /opt/storefront",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Open the folder-listing tool",
            walkthrough: "Start with the directory-listing command and a space to inspect the wiped app room.",
            wrongKeyHint: "That first part is the short directory-listing command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 7,
            partLabel: "2. Ask for full details and hidden entries",
            walkthrough: "Bundle the long-format and hidden-entries switches behind one dash, followed by a space.",
            wrongKeyHint: "That part is the dash and two view switches for long details plus hidden files (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 7,
            end: 22,
            partLabel: "3. Point at the wiped storefront folder",
            walkthrough: "Type the path to the storefront folder inside the optional-apps directory, then press Enter.",
            wrongKeyHint: "That part is the full slash path through the optional-software directory into the storefront folder.",
          },
        ],
      },
      {
        target: "tar -tf /backups/storefront.tar",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 4,
            partLabel: "1. Call the archive tool",
            walkthrough: "Begin with the three-letter archiver command and a space before peeking inside the crate.",
            wrongKeyHint: "That first part is the three-letter archive program name (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 4,
            end: 8,
            partLabel: "2. Read the table of contents",
            walkthrough: "Bundle the table-of-contents switch and the archive-file switch so it lists paths without unpacking yet.",
            wrongKeyHint: "That part is the dash plus the list-contents and file switches, followed by a space.",
          },
          {
            stepNumber: 3,
            start: 8,
            end: 31,
            partLabel: "3. Name the backup archive crate",
            walkthrough: "Type the path to the storefront archive inside the backups directory, then press Enter to read its stored paths.",
            wrongKeyHint: "That part is the full path to the archive file inside the backups directory.",
          },
        ],
      },
      {
        target: "tar -xvf /backups/storefront.tar -C /opt/",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 4,
            partLabel: "1. Call the archive tool",
            walkthrough: "Start with the archive program and a space now that you know every entry starts with the app folder name.",
            wrongKeyHint: "That first part is the three-letter archive command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 4,
            end: 9,
            partLabel: "2. Extract verbosely from an archive file",
            walkthrough: "Bundle extract, verbose item printout, and archive-file switches behind one dash, followed by a space.",
            wrongKeyHint: "That part is the dash and three switches — extract, verbose list, and archive file — plus a space.",
          },
          {
            stepNumber: 3,
            start: 9,
            end: 33,
            partLabel: "3. Give the backup crate path",
            walkthrough: "Point to the storefront archive inside the backups folder, followed by a space.",
            wrongKeyHint: "That part is the path to the storefront backup file (or the space right after it).",
          },
          {
            stepNumber: 4,
            start: 33,
            end: 36,
            partLabel: "4. Add the target-directory switch",
            walkthrough: "Add the capital-letter switch that tells the archiver which folder to step into before unpacking.",
            wrongKeyHint: "That part is the dash and capital target-directory switch (or the space after it).",
          },
          {
            stepNumber: 5,
            start: 36,
            end: 41,
            partLabel: "5. Unpack into the parent optional-apps hallway",
            walkthrough: "Finish with the parent optional-apps folder so the archive's storefront folder lands cleanly inside it.",
            wrongKeyHint: "That final part is the parent optional-software directory path with its slashes.",
          },
        ],
      },
    ],
  },

  "coach-permission-denied": {
    whereToLook:
      "Picture a team binder locked inside a shared cabinet: check the binder's owner-and-group label first, check which team badge your teammate carries, then match the binder's group label to that team.",
    stages: [
      {
        target: "ls -l /srv/shared/release-plan.md",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Open the directory reader",
            walkthrough: "Start with the listing command and a space so you can inspect the binder's label.",
            wrongKeyHint: "That first part is the two-letter listing command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 6,
            partLabel: "2. Request the long ownership ledger",
            walkthrough: "Add the long-format switch and a space so permissions, owner, and group are shown.",
            wrongKeyHint: "That part is the dash, the long-listing switch, and the space after it.",
          },
          {
            stepNumber: 3,
            start: 6,
            end: 33,
            partLabel: "3. Point to the shared release plan",
            walkthrough: "Type the full path to the release plan document inside the shared service folder, then press Enter.",
            wrongKeyHint: "That part is the path through the service and shared folders to the release-plan markdown file.",
          },
        ],
      },
      {
        target: "id alice",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Ask for an identity badge check",
            walkthrough: "Start with the short identity command and a space to see which groups a user belongs to.",
            wrongKeyHint: "That first part is the two-letter account-identity command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 8,
            partLabel: "2. Name the locked-out teammate",
            walkthrough: "Type your teammate's username and press Enter to read her group memberships.",
            wrongKeyHint: "That second part is the five-letter username of the teammate who hit Permission denied.",
          },
        ],
      },
      {
        target: "chgrp developers /srv/shared/release-plan.md",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 6,
            partLabel: "1. Pick up the group-ownership tool",
            walkthrough: "Start with the command that changes a file's group label without opening world access, followed by a space.",
            wrongKeyHint: "That first part is the change-group command word (or the space right after it).",
          },
          {
            stepNumber: 2,
            start: 6,
            end: 17,
            partLabel: "2. Name the team group",
            walkthrough: "Type the engineering group badge your teammate belongs to, followed by a space.",
            wrongKeyHint: "That part is the team group name you saw on her account badge (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 17,
            end: 44,
            partLabel: "3. Point at the release plan file",
            walkthrough: "Finish with the path to the shared release plan and press Enter so her team group can read and write it.",
            wrongKeyHint: "That final part is the full path to the release-plan document inside the shared folder.",
          },
        ],
      },
    ],
  },

  "coach-cron-down": {
    whereToLook:
      "Think of scheduled jobs like a wall timetable paired with a night watchman: first check that the 2 AM line is still written on the timetable, then check whether the watchman service itself is asleep.",
    stages: [
      {
        target: "crontab -l",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 8,
            partLabel: "1. Open the schedule table tool",
            walkthrough: "Start with the user schedule-table command and a space to inspect the saved nightly entries.",
            wrongKeyHint: "That first part is the cron-table command name (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 8,
            end: 10,
            partLabel: "2. List the current entries",
            walkthrough: "Add the single-letter list flag and press Enter to verify the 2 AM backup line is intact.",
            wrongKeyHint: "That part is the dash and single-letter list switch.",
          },
        ],
      },
      {
        target: "systemctl status cron",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 10,
            partLabel: "1. Open the service switchboard",
            walkthrough: "Now open the background-service manager followed by a space to check the scheduler daemon itself.",
            wrongKeyHint: "That first part is the system service manager command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 10,
            end: 17,
            partLabel: "2. Ask for its live health report",
            walkthrough: "Type the status-inspection action word and a space.",
            wrongKeyHint: "That part is the action word that prints whether a service is active and enabled (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 17,
            end: 21,
            partLabel: "3. Name the scheduler daemon",
            walkthrough: "Finish with the four-letter scheduler service name and press Enter.",
            wrongKeyHint: "That last part is the four-letter name of the background task-scheduler service.",
          },
        ],
      },
      {
        target: "systemctl enable --now cron",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 10,
            partLabel: "1. Open the service switchboard",
            walkthrough: "Start with the service manager and a space to wake the scheduler up permanently.",
            wrongKeyHint: "That first part is the service switchboard command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 10,
            end: 17,
            partLabel: "2. Put it on the boot startup list",
            walkthrough: "Add the boot-enable action word and a space so reboots never leave the scheduler off again.",
            wrongKeyHint: "That part is the action word that registers a service for startup at boot (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 17,
            end: 23,
            partLabel: "3. Start it right now too",
            walkthrough: "Add the two-dash immediate-start flag and a space so the daemon starts running tonight.",
            wrongKeyHint: "That part is the two-dash flag that starts an enabled service immediately (or the space after it).",
          },
          {
            stepNumber: 4,
            start: 23,
            end: 27,
            partLabel: "4. Name the scheduler daemon",
            walkthrough: "Finish with the scheduler service name and press Enter to make it both active and enabled.",
            wrongKeyHint: "That final part is the four-letter scheduler service name.",
          },
        ],
      },
    ],
  },

  "coach-runaway-cpu": {
    whereToLook:
      "Picture a noisy workshop where one jammed machine is drowning out everyone else: rank every running worker from loudest CPU user down, ask that worker politely to stop, check if it ignored you, then pull its power plug.",
    stages: [
      {
        target: "ps aux --sort=-%cpu",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Open the process snapshot tool",
            walkthrough: "Start with the two-letter process-status command and a space.",
            wrongKeyHint: "That first part is the two-letter process-list command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 7,
            partLabel: "2. Show all users' processes in full detail",
            walkthrough: "Add the classic three-letter bundle showing every user, background daemons, and CPU columns, plus a space.",
            wrongKeyHint: "That part is the three-letter all-users detail bundle (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 7,
            end: 19,
            partLabel: "3. Sort highest CPU percentage first",
            walkthrough: "Add the sort option with a minus sign before the CPU column so the hung process rises to line one.",
            wrongKeyHint: "Check the two-dash sort flag, equals sign, minus sign for descending order, percent sign, and CPU column name.",
          },
        ],
      },
      {
        target: "kill 4412",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 5,
            partLabel: "1. Send a polite stop signal first",
            walkthrough: "Start with the signal-sending command and a space — with no extra flag, it asks the process politely to clean up and exit.",
            wrongKeyHint: "That first part is the signal-sending command word (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 5,
            end: 9,
            partLabel: "2. Target the runaway worker's PID",
            walkthrough: "Type the four-digit process ID you just spotted at the top of the CPU list, then press Enter.",
            wrongKeyHint: "That part is the four-digit numeric process ID of the runaway worker from the top row.",
          },
        ],
      },
      {
        target: "ps aux --sort=-%cpu",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Re-check the process table",
            walkthrough: "Never assume a polite signal worked — run the process snapshot command again.",
            wrongKeyHint: "That first part is the two-letter process-list command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 7,
            partLabel: "2. Include every process and CPU column",
            walkthrough: "Type the same three-letter full-view bundle and a space.",
            wrongKeyHint: "That part is the three-letter all-processes detail bundle (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 7,
            end: 19,
            partLabel: "3. Sort highest CPU first to verify",
            walkthrough: "Finish the descending CPU sort flag and press Enter — watch whether the stuck worker is still spinning.",
            wrongKeyHint: "Check the two-dash sort option with the minus sign and percent-CPU key.",
          },
        ],
      },
      {
        target: "kill -9 4412",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 5,
            partLabel: "1. Call the signal sender again",
            walkthrough: "The hung worker ignored the polite stop, so start with the signal command and a space.",
            wrongKeyHint: "That first part is the signal-sending command word (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 5,
            end: 8,
            partLabel: "2. Escalate to the uncatchable kernel stop",
            walkthrough: "Add the dash-and-digit flag for immediate kernel termination, followed by a space.",
            wrongKeyHint: "That part is the dash, the single-digit force-stop signal number, and a space.",
          },
          {
            stepNumber: 3,
            start: 8,
            end: 12,
            partLabel: "3. Name the stuck worker's PID",
            walkthrough: "Finish with the runaway worker's four-digit PID and press Enter to end it for good.",
            wrongKeyHint: "That final part is the four-digit PID of the stuck worker process.",
          },
        ],
      },
    ],
  },

  "coach-disk-full": {
    whereToLook:
      "Treat a full drive like an overflowing storage closet: check the closet gauge first to see which drive hit 100%, weigh each box inside the log room, then throw out only the bloated old dump while keeping live journals safe.",
    stages: [
      {
        target: "df -h",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Open the filesystem space gauge",
            walkthrough: "Start with the two-letter disk-free command and a space to check mounted partitions.",
            wrongKeyHint: "That first part is the two-letter disk-free command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 5,
            partLabel: "2. Show human-readable sizes",
            walkthrough: "Add the human-readable unit flag and press Enter so gigabytes and percentages are easy to read.",
            wrongKeyHint: "That part is the dash and single-letter human-readable size switch.",
          },
        ],
      },
      {
        target: "du -sh /var/log/*",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Pick up the folder-weighing scale",
            walkthrough: "Start with the two-letter disk-usage command and a space to measure individual items.",
            wrongKeyHint: "That first part is the two-letter disk-usage scale command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 7,
            partLabel: "2. Summarize each item in human units",
            walkthrough: "Bundle the summary and human-readable switches behind one dash, followed by a space.",
            wrongKeyHint: "That part is the dash plus summary and human-readable switches (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 7,
            end: 17,
            partLabel: "3. Weigh every file inside the log room",
            walkthrough: "Point at every entry inside the system log folder using the wildcard star, then press Enter.",
            wrongKeyHint: "That part is the path to the system log directory ending with a slash and wildcard star.",
          },
        ],
      },
      {
        target: "rm /var/log/app-debug.log.old",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Call the file remover",
            walkthrough: "Start with the two-letter remove command and a space — target only the single rotated dump.",
            wrongKeyHint: "That first part is the two-letter file-removal command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 29,
            partLabel: "2. Name only the bloated old debug log",
            walkthrough: "Type the exact path to the 22-gigabyte old debug dump inside the log folder and press Enter, leaving live logs untouched.",
            wrongKeyHint: "That part is the full path in the log folder to the old rotated debug file — check the hyphen and dots.",
          },
        ],
      },
    ],
  },

  "coach-port-in-use": {
    whereToLook:
      "Think of port 80 like Window 80 at city hall: Apache cannot open Window 80 because a leftover preview clerk is still sitting in the chair. Check who holds the window, dismiss that clerk, then open Apache.",
    stages: [
      {
        target: "ss -tlnp",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Open the socket roster",
            walkthrough: "Start with the modern two-letter socket tool and a space to see who holds Window 80.",
            wrongKeyHint: "That first part is the two-letter socket inspection command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 8,
            partLabel: "2. TCP + listening + numeric + owning process",
            walkthrough: "Bundle the four socket switches behind one dash and press Enter to read the PID bound to port 80.",
            wrongKeyHint: "That part is the dash and four switches: TCP, listening, numeric ports, and owning process.",
          },
        ],
      },
      {
        target: "kill 2847",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 5,
            partLabel: "1. Send a stop signal to clear port 80",
            walkthrough: "Start with the signal-sending command and a space so the leftover preview server vacates port 80.",
            wrongKeyHint: "That first part is the signal-sending command word (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 5,
            end: 9,
            partLabel: "2. Give the rogue listener's PID",
            walkthrough: "Type the four-digit PID that was holding port 80 and press Enter.",
            wrongKeyHint: "That part is the four-digit numeric PID of the leftover preview process on port 80.",
          },
        ],
      },
      {
        target: "systemctl start httpd",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 10,
            partLabel: "1. Open the service switchboard",
            walkthrough: "Now that port 80 is free, open the background service manager followed by a space.",
            wrongKeyHint: "That first part is the system service manager command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 10,
            end: 16,
            partLabel: "2. Tell it to start the service",
            walkthrough: "Type the action word that launches a stopped service right now, followed by a space.",
            wrongKeyHint: "That part is the five-letter start action word (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 16,
            end: 21,
            partLabel: "3. Name the Apache web server unit",
            walkthrough: "Finish with the five-letter Apache HTTP daemon unit name and press Enter to bring port 80 live.",
            wrongKeyHint: "That final part is the five-letter unit name for the Apache HTTP daemon.",
          },
        ],
      },
    ],
  },

  "coach-inodes-gone": {
    whereToLook:
      "Think of a filesystem like a coat check with plenty of empty floor space, yet zero numbered coat tags left: check floor space first, check the coat-tag counter second, count where the tags went, then clear out the pile of tiny scraps.",
    stages: [
      {
        target: "df -h",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Check byte space first",
            walkthrough: "Start with the disk-free command and a space to see whether ordinary storage bytes ran out.",
            wrongKeyHint: "That first part is the two-letter disk-free command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 5,
            partLabel: "2. Ask for human-readable units",
            walkthrough: "Add the human-readable flag and press Enter — notice gigabytes of space are still free.",
            wrongKeyHint: "That part is the dash and single-letter human-readable size switch.",
          },
        ],
      },
      {
        target: "df -i",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Open the disk-free gauge again",
            walkthrough: "Run the disk-free tool a second time, followed by a space, to inspect file-index slots instead of bytes.",
            wrongKeyHint: "That first part is the two-letter disk-free command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 5,
            partLabel: "2. Switch to the inode counter",
            walkthrough: "Add the single-letter inode flag and press Enter — watch the root filesystem show 100% of inodes used.",
            wrongKeyHint: "That part is the dash and single-letter inode-table switch.",
          },
        ],
      },
      {
        target: "find /var/spool -type f | wc -l",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 5,
            partLabel: "1. Walk the tree with the search tool",
            walkthrough: "Start with the directory-walking search command and a space to locate where thousands of tiny files piled up.",
            wrongKeyHint: "That first part is the four-letter file-finding command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 5,
            end: 16,
            partLabel: "2. Point to the spool directory",
            walkthrough: "Type the path to the variable spool directory where queued drop files collect, followed by a space.",
            wrongKeyHint: "That part is the slash path into the variable spool directory (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 16,
            end: 24,
            partLabel: "3. Filter for regular files only",
            walkthrough: "Add the regular-file type filter and a trailing space before piping the list to a line counter.",
            wrongKeyHint: "That part is the item-type flag, space, regular-file letter, and space.",
          },
          {
            stepNumber: 4,
            start: 24,
            end: 31,
            partLabel: "4. Pipe into the line counter",
            walkthrough: "Add a pipe bar and the line-counting command so you see the exact file count instead of a wall of filenames.",
            wrongKeyHint: "That final part is the pipe bar, space, word-count tool, space, and line-count switch.",
          },
        ],
      },
      {
        target: "rm -f /var/spool/maildrop/*",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Call the file remover",
            walkthrough: "Start with the remove command and a space to clear out the orphan spool files.",
            wrongKeyHint: "That first part is the two-letter remove command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 6,
            partLabel: "2. Suppress per-file prompts",
            walkthrough: "Add the non-interactive force flag and a space so clearing 1,500 temp files runs cleanly in one pass.",
            wrongKeyHint: "That part is the dash, single-letter force switch, and space.",
          },
          {
            stepNumber: 3,
            start: 6,
            end: 27,
            partLabel: "3. Clear only the files inside maildrop",
            walkthrough: "Type the maildrop directory path ending with a slash and wildcard star so the orphan files vanish while the folder stays.",
            wrongKeyHint: "That final part is the path to the maildrop spool folder ending with a slash and wildcard star.",
          },
        ],
      },
    ],
  },

  "coach-ssh-key-server1": {
    whereToLook:
      "Move the loose key ~/admin into ~/.ssh/, lock ~/.ssh/admin down to owner read/write only (0600), hand ownership to $USER, and write the Host server1 section (HostName server1, Port 2222, User admin, IdentityFile ~/.ssh/admin) into ~/.ssh/config.",
    steps: [],
    stages: [
      {
        target: "mv ~/admin ~/.ssh/",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Call the file mover",
            walkthrough: "Start with the two-letter move command and a space so the loose key leaves your home folder.",
            wrongKeyHint: "That first part is the two-letter move command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 11,
            partLabel: "2. Point to the loose key in your home folder",
            walkthrough: "Type the tilde-slash path to the admin key file sitting in your home folder, followed by a space.",
            wrongKeyHint: "That part is the home-directory path to the admin key file (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 11,
            end: 18,
            partLabel: "3. Move it into your hidden SSH folder",
            walkthrough: "Finish with your hidden SSH directory path and press Enter to move the key into place.",
            wrongKeyHint: "That final part is the tilde-slash path to your hidden SSH directory.",
          },
        ],
      },
      {
        target: "chmod 0600 ~/.ssh/admin",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 6,
            partLabel: "1. Call the permission changer",
            walkthrough: "Start with the permission-changing command and a space so SSH accepts the private key.",
            wrongKeyHint: "That first part is the five-letter permission tool (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 6,
            end: 11,
            partLabel: "2. Lock permissions to owner read/write only",
            walkthrough: "Type the four-digit octal mode for owner read-and-write with zero group or world access, followed by a space.",
            wrongKeyHint: "That part is the four-digit owner-only octal mode (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 11,
            end: 23,
            partLabel: "3. Target the private key inside ~/.ssh",
            walkthrough: "Finish with the path to the admin key inside your hidden SSH folder and press Enter.",
            wrongKeyHint: "That final part is the path to the admin key inside your hidden SSH folder.",
          },
        ],
      },
      {
        target: "chown $USER ~/.ssh/admin",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 6,
            partLabel: "1. Call the ownership changer",
            walkthrough: "Start with the file-owner command and a space so your user account owns the private key.",
            wrongKeyHint: "That first part is the five-letter ownership command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 6,
            end: 12,
            partLabel: "2. Use your current user variable",
            walkthrough: "Type the shell variable for the current logged-in user, followed by a space.",
            wrongKeyHint: "That part is the dollar-sign current-user environment variable (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 12,
            end: 24,
            partLabel: "3. Target the private key inside ~/.ssh",
            walkthrough: "Finish with the path to the admin key inside your hidden SSH directory and press Enter.",
            wrongKeyHint: "That final part is the path to the admin key inside your hidden SSH directory.",
          },
        ],
      },
      {
        target:
          'printf "Host server1\\n  HostName server1\\n  Port 2222\\n  User admin\\n  IdentityFile ~/.ssh/admin\\n" > ~/.ssh/config',
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 7,
            partLabel: "1. Call the formatted print command",
            walkthrough: "Start with the formatted print command and a space to write multi-line SSH config directives.",
            wrongKeyHint: "That first part is the six-letter formatted print command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 7,
            end: 100,
            partLabel: "2. Write the Host server1 configuration block",
            walkthrough: "Type the quoted five-line Host server1 block specifying HostName, Port 2222, User admin, and IdentityFile, followed by a space.",
            wrongKeyHint: "That middle part is the quoted Host server1 configuration block with newline escapes.",
          },
          {
            stepNumber: 3,
            start: 100,
            end: 102,
            partLabel: "3. Redirect output to a file",
            walkthrough: "Type the output redirect operator and a space to send those lines into your SSH config file.",
            wrongKeyHint: "That part is the single output redirect symbol and a space.",
          },
          {
            stepNumber: 4,
            start: 102,
            end: 115,
            partLabel: "4. Target ~/.ssh/config",
            walkthrough: "Finish with the path to your SSH client configuration file and press Enter.",
            wrongKeyHint: "That final part is the path to your personal SSH client config file.",
          },
        ],
      },
    ],
  },

  "coach-install-httpd": {
    whereToLook:
      "On Red Hat systems the Apache package and service are named httpd: install the package with the Red Hat package manager, start the service now, and enable it so it starts automatically on boot.",
    steps: [],
    stages: [
      {
        target: "yum install httpd",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 4,
            partLabel: "1. Open the Red Hat package manager",
            walkthrough: "Start with the three-letter Red Hat package tool and a space.",
            wrongKeyHint: "That first part is the three-letter Red Hat package manager (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 4,
            end: 12,
            partLabel: "2. Ask it to install a package",
            walkthrough: "Type the package installation action word and a space.",
            wrongKeyHint: "That second part is the seven-letter install subcommand (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 12,
            end: 17,
            partLabel: "3. Name the Red Hat Apache package",
            walkthrough: "Finish with the Red Hat Apache daemon package name and press Enter to install it.",
            wrongKeyHint: "That final part is the five-letter Red Hat Apache package name.",
          },
        ],
      },
      {
        target: "systemctl start httpd",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 10,
            partLabel: "1. Call the service manager",
            walkthrough: "Start with the system service manager command and a space.",
            wrongKeyHint: "That first part is the nine-letter service manager command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 10,
            end: 16,
            partLabel: "2. Launch the service right now",
            walkthrough: "Type the action word that starts a stopped daemon immediately, followed by a space.",
            wrongKeyHint: "That second part is the five-letter start verb (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 16,
            end: 21,
            partLabel: "3. Name the Apache service unit",
            walkthrough: "Finish with the Apache service name and press Enter so it begins listening on port 80.",
            wrongKeyHint: "That final part is the five-letter Apache service unit name.",
          },
        ],
      },
      {
        target: "systemctl enable httpd",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 10,
            partLabel: "1. Call the service manager again",
            walkthrough: "Start with the system service manager command and a space to configure boot startup.",
            wrongKeyHint: "That first part is the nine-letter service manager command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 10,
            end: 17,
            partLabel: "2. Register the service for boot",
            walkthrough: "Type the action word that enables the service to start automatically at boot, followed by a space.",
            wrongKeyHint: "That second part is the six-letter boot-enable verb (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 17,
            end: 22,
            partLabel: "3. Name the Apache service unit",
            walkthrough: "Finish with the Apache service name and press Enter so the web server stays up across reboots.",
            wrongKeyHint: "That final part is the five-letter Apache service unit name.",
          },
        ],
      },
    ],
  },

  "coach-deleted-open-file": {
    whereToLook:
      "Check mounted disk usage first, then list open files filtered for deleted entries to see which running service still holds the unlinked 22 GB log file open, and restart that service to release the space.",
    steps: [],
    stages: [
      {
        target: "df -h",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 3,
            partLabel: "1. Open the disk-free gauge",
            walkthrough: "Start with the disk-free command and a space to check whether deleting the log freed space on /.",
            wrongKeyHint: "That first part is the two-letter disk-free command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 3,
            end: 5,
            partLabel: "2. Ask for human-readable units",
            walkthrough: "Add the human-readable flag and press Enter — notice / is still at 100% used.",
            wrongKeyHint: "That part is the dash and single-letter human-readable switch.",
          },
        ],
      },
      {
        target: "lsof | grep deleted",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 5,
            partLabel: "1. List open file handles across the system",
            walkthrough: "Start with the list-open-files command and a space to inspect every open file descriptor.",
            wrongKeyHint: "That first part is the four-letter list-open-files command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 5,
            end: 12,
            partLabel: "2. Pipe into the line filter",
            walkthrough: "Add a pipe bar, space, and the text-search tool followed by a space to narrow the open-file list.",
            wrongKeyHint: "That middle part is the pipe bar, space, four-letter search tool, and space.",
          },
          {
            stepNumber: 3,
            start: 12,
            end: 19,
            partLabel: "3. Filter for unlinked open files",
            walkthrough: "Finish with the word marking unlinked open descriptors and press Enter to spot the holding daemon.",
            wrongKeyHint: "That final part is the seven-letter word marking deleted open files.",
          },
        ],
      },
      {
        target: "systemctl restart httpd",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 10,
            partLabel: "1. Call the service manager",
            walkthrough: "Start with the system service manager command and a space.",
            wrongKeyHint: "That first part is the nine-letter service manager command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 10,
            end: 18,
            partLabel: "2. Restart the holding daemon",
            walkthrough: "Type the restart verb and a space so the daemon closes its open file descriptors and comes right back up.",
            wrongKeyHint: "That second part is the seven-letter restart verb (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 18,
            end: 23,
            partLabel: "3. Target the Apache service holding the log",
            walkthrough: "Finish with the Apache service name and press Enter to release the 22 GB deleted log file.",
            wrongKeyHint: "That final part is the five-letter Apache service unit name.",
          },
        ],
      },
    ],
  },
  "coach-deleted-user-files": {
    whereToLook:
      "When an account is removed without reassigning its files, those files remain stamped with a raw numeric UID. Search the tree for files with no valid user, then hand the folder to alice.",
    stages: [
      {
        target: "find / -nouser",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 5,
            partLabel: "1. Start the file search tool",
            walkthrough: "Start with the directory search command and a space.",
            wrongKeyHint: "That first part is the four-letter file search command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 5,
            end: 7,
            partLabel: "2. Search from the root of the filesystem",
            walkthrough: "Add the root slash and a space so the search covers the entire machine.",
            wrongKeyHint: "That second part is the root slash and the space after it.",
          },
          {
            stepNumber: 3,
            start: 7,
            end: 14,
            partLabel: "3. Filter for files with no valid user owner",
            walkthrough: "Finish with the seven-character predicate for unowned files and press Enter.",
            wrongKeyHint: "That final part is the dash predicate that matches files whose numeric UID has no user.",
          },
        ],
      },
      {
        target: "chown -R alice /srv/projects",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 6,
            partLabel: "1. Call the ownership tool",
            walkthrough: "Start with the ownership-change command and a space.",
            wrongKeyHint: "That first part is the five-letter ownership command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 6,
            end: 9,
            partLabel: "2. Apply recursively inside the folder",
            walkthrough: "Type the uppercase recursive flag and a space so every file inside is updated too.",
            wrongKeyHint: "That second part is the dash-uppercase-R flag (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 9,
            end: 15,
            partLabel: "3. Name the new owner",
            walkthrough: "Type the teammate's username and a space.",
            wrongKeyHint: "That third part is the five-letter teammate username (or the space after it).",
          },
          {
            stepNumber: 4,
            start: 15,
            end: 28,
            partLabel: "4. Point at the orphaned project directory",
            walkthrough: "Finish with the project directory path under /srv and press Enter.",
            wrongKeyHint: "That final part is the /srv/projects directory path.",
          },
        ],
      },
    ],
  },
  "coach-service-journal": {
    whereToLook:
      "When a service says failed to start, the systemd journal holds the exact step that failed. Read the journal for the unit, restore the binary's execute bit, and restart the service.",
    stages: [
      {
        target: "journalctl -u nginx",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 11,
            partLabel: "1. Open the systemd journal reader",
            walkthrough: "Start with the ten-letter systemd journal viewer command and a space.",
            wrongKeyHint: "That first part is the systemd journal viewer command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 11,
            end: 14,
            partLabel: "2. Filter by service unit",
            walkthrough: "Add the unit filter flag and a space so you only see entries for one service.",
            wrongKeyHint: "That second part is the dash-u unit flag (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 14,
            end: 19,
            partLabel: "3. Name the failing web service",
            walkthrough: "Finish with the web server unit name and press Enter to see why it failed.",
            wrongKeyHint: "That final part is the five-letter web server service name.",
          },
        ],
      },
      {
        target: "chmod +x /usr/sbin/nginx",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 6,
            partLabel: "1. Call the permission tool",
            walkthrough: "Start with the five-letter permission command and a space.",
            wrongKeyHint: "That first part is the five-letter permission command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 6,
            end: 9,
            partLabel: "2. Restore execute permission",
            walkthrough: "Type the plus-execute symbol and a space so the binary can be launched.",
            wrongKeyHint: "That second part is the two-character plus-execute flag (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 9,
            end: 24,
            partLabel: "3. Point at the service binary",
            walkthrough: "Finish with the full path to the nginx binary under /usr/sbin and press Enter.",
            wrongKeyHint: "That final part is the /usr/sbin/nginx binary path.",
          },
        ],
      },
      {
        target: "systemctl restart nginx",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 10,
            partLabel: "1. Call the service manager",
            walkthrough: "Start with the nine-letter service manager command and a space.",
            wrongKeyHint: "That first part is the nine-letter service manager command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 10,
            end: 18,
            partLabel: "2. Restart the service",
            walkthrough: "Type the restart verb and a space.",
            wrongKeyHint: "That second part is the seven-letter restart verb (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 18,
            end: 23,
            partLabel: "3. Name the web server unit",
            walkthrough: "Finish with the web server service name and press Enter.",
            wrongKeyHint: "That final part is the five-letter web server service name.",
          },
        ],
      },
    ],
  },
  "coach-script-not-found": {
    whereToLook:
      "A script in your current directory needs two things to run directly: the execute permission bit on the file, and a ./ prefix so the shell looks in the current directory instead of $PATH.",
    stages: [
      {
        target: "chmod +x script.sh",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 6,
            partLabel: "1. Call the permission tool",
            walkthrough: "Start with the five-letter permission command and a space.",
            wrongKeyHint: "That first part is the five-letter permission command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 6,
            end: 9,
            partLabel: "2. Grant execute permission",
            walkthrough: "Type the plus-execute flag and a space.",
            wrongKeyHint: "That second part is the plus-x flag (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 9,
            end: 18,
            partLabel: "3. Name the script file",
            walkthrough: "Finish with the script filename in your home directory and press Enter.",
            wrongKeyHint: "That final part is the nine-character script filename.",
          },
        ],
      },
      {
        target: "./script.sh",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 2,
            partLabel: "1. Point at the current directory",
            walkthrough: "Start with dot-slash so the shell executes the file in the current folder.",
            wrongKeyHint: "That first part is the two-character current-directory prefix (dot and slash).",
          },
          {
            stepNumber: 2,
            start: 2,
            end: 11,
            partLabel: "2. Name the script to execute",
            walkthrough: "Finish with the script filename and press Enter to run it.",
            wrongKeyHint: "That final part is the nine-character script filename.",
          },
        ],
      },
    ],
  },
  "coach-verify-checksum": {
    whereToLook:
      "Before installing any downloaded archive, ask the SHA-256 checksum tool to verify the companion .sha256 file and confirm the digest matches.",
    steps: [
      {
        stepNumber: 1,
        start: 0,
        end: 10,
        partLabel: "1. Call the SHA-256 checksum tool",
        walkthrough: "Start with the nine-character SHA-256 digest command and a space.",
        wrongKeyHint: "That first part is the nine-character SHA-256 checksum command (or the space after it).",
      },
      {
        stepNumber: 2,
        start: 10,
        end: 13,
        partLabel: "2. Use check mode",
        walkthrough: "Add the check flag and a space so the tool reads the published hash and verifies the archive.",
        wrongKeyHint: "That second part is the dash-c check flag (or the space after it).",
      },
      {
        stepNumber: 3,
        start: 13,
        end: 47,
        partLabel: "3. Point at the published checksum file",
        walkthrough: "Finish with the full path to the .sha256 file in /tmp/downloads and press Enter.",
        wrongKeyHint: "That final part is the /tmp/downloads/agent.tar.gz.sha256 file path.",
      },
    ],
  },
  "coach-too-many-open-files": {
    whereToLook:
      "The app worker has hit the 1,024 open-file descriptor ceiling. Use the shell resource-limit command with the open-files flag to raise the limit to 4096.",
    steps: [
      {
        stepNumber: 1,
        start: 0,
        end: 7,
        partLabel: "1. Call the resource limit tool",
        walkthrough: "Start with the six-letter shell resource-limit command and a space.",
        wrongKeyHint: "That first part is the six-letter resource-limit command (or the space after it).",
      },
      {
        stepNumber: 2,
        start: 7,
        end: 10,
        partLabel: "2. Select the open-file descriptor limit",
        walkthrough: "Add the open-files flag and a space.",
        wrongKeyHint: "That second part is the dash-n flag (or the space after it).",
      },
      {
        stepNumber: 3,
        start: 10,
        end: 14,
        partLabel: "3. Set the new ceiling to 4096",
        walkthrough: "Finish with the four-digit limit 4096 and press Enter.",
        wrongKeyHint: "That final part is the number 4096.",
      },
    ],
  },
  "coach-clock-wrong": {
    whereToLook:
      "The system clock is four days slow and NTP is turned off. First enable NTP synchronization with the systemd time tool, then command chrony to step the clock immediately.",
    steps: [],
    stages: [
      {
        target: "timedatectl set-ntp true",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 12,
            partLabel: "1. Call the systemd time and date tool",
            walkthrough: "Start with the eleven-letter time-and-date control command and a space.",
            wrongKeyHint: "That first part is the eleven-letter time-and-date command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 12,
            end: 20,
            partLabel: "2. Use the NTP toggle subcommand",
            walkthrough: "Type the hyphenated subcommand that enables or disables NTP, followed by a space.",
            wrongKeyHint: "That second part is the set-ntp subcommand (or the space after it).",
          },
          {
            stepNumber: 3,
            start: 20,
            end: 24,
            partLabel: "3. Turn NTP synchronization on",
            walkthrough: "Finish with true and press Enter to enable network time synchronization.",
            wrongKeyHint: "That final part is the boolean word true.",
          },
        ],
      },
      {
        target: "chronyc makestep",
        steps: [
          {
            stepNumber: 1,
            start: 0,
            end: 8,
            partLabel: "1. Call the chrony command-line client",
            walkthrough: "Start with the seven-letter chrony client command and a space.",
            wrongKeyHint: "That first part is the seven-letter chrony client command (or the space after it).",
          },
          {
            stepNumber: 2,
            start: 8,
            end: 16,
            partLabel: "2. Step the system clock immediately",
            walkthrough: "Finish with the eight-letter subcommand that forces an immediate clock step, then press Enter.",
            wrongKeyHint: "That final part is the makestep subcommand.",
          },
        ],
      },
    ],
  },
  "coach-zombie-processes": {
    whereToLook:
      "You cannot kill a zombie process directly because it is already dead. Restart the parent service worker-mgr so its defunct worker-task children are reaped from the process table.",
    steps: [
      {
        stepNumber: 1,
        start: 0,
        end: 10,
        partLabel: "1. Call the systemd service controller",
        walkthrough: "Start with the nine-letter service manager command and a space.",
        wrongKeyHint: "That first part is the nine-letter service manager command (or the space after it).",
      },
      {
        stepNumber: 2,
        start: 10,
        end: 18,
        partLabel: "2. Restart the parent service",
        walkthrough: "Type the seven-letter action that stops and starts the service, followed by a space.",
        wrongKeyHint: "That second part is the restart verb (or the space after it).",
      },
      {
        stepNumber: 3,
        start: 18,
        end: 28,
        partLabel: "3. Name the parent daemon",
        walkthrough: "Finish with the hyphenated parent service name worker-mgr and press Enter.",
        wrongKeyHint: "That final part is the ten-character service name worker-mgr.",
      },
    ],
  },
};

export const MEDIUM_PLANS: Record<string, MediumJobPlan> = Object.fromEntries(
  COACH_JOBS.map((job) => {
    const plan = PLANS_BY_ID[job.id];
    if (!plan) {
      throw new Error(`Missing Medium coaching plan for job ${job.id}`);
    }
    const stages: MediumStage[] = plan.stages ?? [{ target: job.solution, steps: plan.steps }];
    return [
      job.id,
      {
        jobId: job.id,
        target: stages[0].target,
        whereToLook: plan.whereToLook,
        steps: stages[0].steps,
        stages,
      },
    ];
  }),
);
