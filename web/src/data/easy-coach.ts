import { COACH_JOBS } from "./coach-jobs";

/**
 * Over Your Shoulder — Easy mode word blocks & plain-words coaching.
 *
 * Learn the words first, with NO typing at all. Every coach job is built from
 * Scratch-style word blocks that the learner taps or drags into a command tray,
 * then runs in the real truthful shell underneath. Single-command jobs have
 * 1 stage; multi-step repair jobs (#20, #22) walk through 2 word-block stages.
 */

export interface EasyBlock {
  /** Stable identifier within the stage (e.g. "chmod", "750", "deploy-sh"). */
  id: string;
  /** Exact shell token(s) placed into the command when this block is used. */
  token: string;
  /** Plain-words meaning shown and spoken whenever the block is tapped. */
  meaning: string;
  /** Optional phonetic prefix so numbers or flags read naturally aloud. */
  spokenToken?: string;
  /** Present on distractor blocks: plain-words coaching explaining why this block is wrong for the job. */
  wrongWhy?: string;
}

export interface EasySlot {
  /** 1-based position in the command tray. */
  slotNumber: number;
  /** Short plain-words role label shown on the slot (e.g. "1. Action word"). */
  label: string;
  /** Block id that belongs in this slot. */
  expectedBlockId: string;
  /** Plain-words coaching spoken and shown when Run is pressed with this slot empty. */
  emptySlotHint: string;
  /**
   * Plain-words coaching keyed by another target block's `id` when that block
   * is placed into this slot out of order — explains what part is wrong and why.
   */
  wrongOrderByBlockId: Record<string, string>;
}

export interface EasyStagePlan {
  /** Full target command produced when target blocks sit in order for this stage. */
  target: string;
  /** Short plain-words invitation shown above the blocks. */
  intro: string;
  /** Spoken & shown when the built command runs for this stage. */
  passMessage: string;
  /** Optional read-only shell command run when the stage starts to show "before" machine state. */
  beforeCommand?: string;
  /** Optional sequence of read-only shell commands run when the stage starts. */
  beforeCommands?: string[];
  /** Optional read-only shell command run right after running this stage to show "after" machine state. */
  afterCommand?: string;
  /** Optional sequence of read-only shell commands run right after running this stage. */
  afterCommands?: string[];
  /** All blocks in the bank (target blocks + distractors). */
  blocks: EasyBlock[];
  /** Deterministic scrambled presentation order of block ids in the word bank. */
  bankOrder: string[];
  /** Ordered slots in the command tray. */
  slots: EasySlot[];
}

export interface EasyJobPlan extends EasyStagePlan {
  jobId: string;
  /** Ordered word-block stages (1 stage on single-command jobs, 2 stages on two-step repairs). */
  stages: EasyStagePlan[];
}

/** Exact text passed to `speak()` and `record-clips.ts` when a block is tapped. */
export function easyBlockSpeech(block: EasyBlock): string {
  return `${block.spokenToken ?? block.token} means ${block.meaning}.`;
}

type SingleStageSpec = Omit<EasyStagePlan, "target"> & { stages?: undefined };
type MultiStageSpec = { stages: EasyStagePlan[] };
type PlanSpec = SingleStageSpec | MultiStageSpec;

const PLANS_BY_ID: Record<string, PlanSpec> = {
  "coach-website-down": {
    intro: "Tap each word block to hear what it means, arrange the four parts in the tray, then tap Run to bring the website up for good.",
    passMessage:
      "Nice work — systemctl enabled nginx for boot and started it right now, and the website is answering visitors again.",
    beforeCommand: "curl localhost",
    afterCommand: "curl localhost",
    blocks: [
      {
        id: "systemctl",
        token: "systemctl",
        meaning: "control background services on the machine",
      },
      {
        id: "enable",
        token: "enable",
        meaning: "start this service automatically every time the machine boots",
      },
      {
        id: "now",
        token: "--now",
        meaning: "also start it running right this second, not just at next boot",
      },
      {
        id: "nginx",
        token: "nginx",
        meaning: "the web server program that serves the website",
      },
      {
        id: "disable",
        token: "disable",
        meaning: "stop a service from starting at boot",
        wrongWhy:
          "You picked disable, which turns nginx off at boot instead of keeping the website up after a restart. Swap in enable so it starts at boot.",
      },
      {
        id: "sshd",
        token: "sshd",
        meaning: "the remote SSH login service, not the website server",
        wrongWhy:
          "You picked sshd, which handles remote terminal logins on port 22, not the website on port 80. Swap in nginx for the web server.",
      },
    ],
    bankOrder: ["nginx", "enable", "disable", "systemctl", "now", "sshd"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Service tool",
        expectedBlockId: "systemctl",
        emptySlotHint: "Slot 1 is empty — start with the tool that controls background services.",
        wrongOrderByBlockId: {
          enable:
            "Order mix-up in slot 1: enable tells the service tool what action to take, so systemctl has to come first in slot 1.",
          now:
            "Order mix-up in slot 1: --now is an extra switch, not a command on its own. Put systemctl first in slot 1.",
          nginx:
            "Order mix-up in slot 1: nginx is the name of the web server, not the tool that controls it. Put systemctl first in slot 1 and nginx at the end.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Boot action",
        expectedBlockId: "enable",
        emptySlotHint: "Slot 2 is empty — pick the action word that turns boot startup on.",
        wrongOrderByBlockId: {
          systemctl:
            "Order mix-up in slot 2: systemctl is the main tool and belongs at the very start in slot 1, with enable right after it in slot 2.",
          now:
            "Order mix-up in slot 2: give the main action word enable in slot 2 first, then add --now in slot 3.",
          nginx:
            "Order mix-up in slot 2: systemctl needs its action word before the service name. Put enable in slot 2 and move nginx to slot 4.",
        },
      },
      {
        slotNumber: 3,
        label: "3. Right-now flag",
        expectedBlockId: "now",
        emptySlotHint: "Slot 3 is empty — add the switch that starts the service right this second too.",
        wrongOrderByBlockId: {
          systemctl:
            "Order mix-up in slot 3: systemctl belongs in slot 1 at the start of the command, and --now belongs here in slot 3.",
          enable:
            "Order mix-up in slot 3: enable is the main action word for slot 2, and the --now flag goes after it in slot 3.",
          nginx:
            "Order mix-up in slot 3: put the --now flag before the service name so nginx sits cleanly at the end in slot 4.",
        },
      },
      {
        slotNumber: 4,
        label: "4. Web server",
        expectedBlockId: "nginx",
        emptySlotHint: "Slot 4 is empty — finish with the name of the web server program.",
        wrongOrderByBlockId: {
          systemctl:
            "Order mix-up in slot 4: systemctl goes in slot 1 at the beginning, while the web server name nginx goes last in slot 4.",
          enable:
            "Order mix-up in slot 4: enable belongs in slot 2 right after systemctl, and nginx belongs at the end in slot 4.",
          now:
            "Order mix-up in slot 4: put --now in slot 3 and finish with the service name nginx in slot 4.",
        },
      },
    ],
  },

  "coach-sb-ls-la": {
    intro: "Build the two-block command that lists every file in your home folder — including hidden dot-files — with full permission details.",
    passMessage:
      "There they are — ls -la listed your hidden dot-files like .bashrc alongside every file's owner and permissions.",
    blocks: [
      {
        id: "ls",
        token: "ls",
        meaning: "list what is inside a folder",
      },
      {
        id: "la",
        token: "-la",
        meaning: "long details (permissions and owner) plus hidden dot-files",
      },
      {
        id: "l-only",
        token: "-l",
        meaning: "long details only — still hides files starting with a dot",
        wrongWhy:
          "You picked -l by itself, which shows permissions but still hides dot-files like .bashrc. Swap in -la so hidden files show up too.",
      },
      {
        id: "pwd",
        token: "pwd",
        meaning: "print which folder you are standing in, without listing its files",
        wrongWhy:
          "You picked pwd, which only prints your current folder's name without listing any files inside it. Swap in ls to list the folder.",
      },
    ],
    bankOrder: ["la", "pwd", "ls", "l-only"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Command",
        expectedBlockId: "ls",
        emptySlotHint: "Slot 1 is empty — start with the command that lists files in a folder.",
        wrongOrderByBlockId: {
          la:
            "Order mix-up in slot 1: -la is a flag that changes how listing looks, not a command by itself. Put ls first in slot 1 and -la in slot 2.",
        },
      },
      {
        slotNumber: 2,
        label: "2. View flags",
        expectedBlockId: "la",
        emptySlotHint: "Slot 2 is empty — add the flag block for long format plus hidden dot-files.",
        wrongOrderByBlockId: {
          ls:
            "Order mix-up in slot 2: ls is the command word and must go first in slot 1, with the -la flags after it in slot 2.",
        },
      },
    ],
  },

  "coach-sb-find-large": {
    intro: "Assemble the search command that walks through /var and reports every regular file larger than 100 megabytes.",
    passMessage:
      "Search complete — find walked through /var and filtered for regular files strictly larger than 100 megabytes.",
    blocks: [
      {
        id: "find",
        token: "find",
        meaning: "search through a folder and every sub-folder inside it",
      },
      {
        id: "var",
        token: "/var",
        meaning: "start searching in the /var variable-data folder",
      },
      {
        id: "type-f",
        token: "-type f",
        spokenToken: "dash type F",
        meaning: "match regular files only, skip directories",
      },
      {
        id: "size-plus-100m",
        token: "-size +100M",
        spokenToken: "dash size plus 100 megabytes",
        meaning: "larger than 100 megabytes (the plus sign means more than)",
      },
      {
        id: "size-exact-100m",
        token: "-size 100M",
        spokenToken: "dash size 100 megabytes",
        meaning: "files that are exactly 100 megabytes, not larger",
        wrongWhy:
          "Without a plus sign, -size 100M only matches files that are EXACTLY 100 megabytes. Swap in -size +100M so you find everything larger than 100 megabytes.",
      },
      {
        id: "type-d",
        token: "-type d",
        spokenToken: "dash type D",
        meaning: "match directories (folders) only, skip regular files",
        wrongWhy:
          "You picked -type d, which looks for directories instead of regular files. Swap in -type f so only regular files are matched.",
      },
    ],
    bankOrder: ["size-plus-100m", "var", "type-d", "find", "size-exact-100m", "type-f"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Search tool",
        expectedBlockId: "find",
        emptySlotHint: "Slot 1 is empty — put the search command find at the start of the line.",
        wrongOrderByBlockId: {
          var:
            "Order mix-up in slot 1: /var is the folder path to search, not the command. Put find first in slot 1 and /var in slot 2.",
          "type-f":
            "Order mix-up in slot 1: -type f is a filter option for find, not a command on its own. Put find first in slot 1.",
          "size-plus-100m":
            "Order mix-up in slot 1: -size +100M is a size filter for find. Start with find in slot 1 and put filters after the folder path.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Where to search",
        expectedBlockId: "var",
        emptySlotHint: "Slot 2 is empty — tell find which folder to search (/var).",
        wrongOrderByBlockId: {
          find:
            "Order mix-up in slot 2: find is the command word and belongs in slot 1, with the starting folder /var right after it in slot 2.",
          "type-f":
            "Order mix-up in slot 2: find expects the starting folder /var right after the command, before filter options like -type f.",
          "size-plus-100m":
            "Order mix-up in slot 2: tell find where to search (/var) in slot 2 before giving the -size +100M filter.",
        },
      },
      {
        slotNumber: 3,
        label: "3. Item kind",
        expectedBlockId: "type-f",
        emptySlotHint: "Slot 3 is empty — add the filter that selects regular files only.",
        wrongOrderByBlockId: {
          find:
            "Order mix-up in slot 3: find goes at the very start in slot 1, while -type f goes in slot 3 after /var.",
          var:
            "Order mix-up in slot 3: the folder /var goes in slot 2 right after find, and -type f goes in slot 3.",
          "size-plus-100m":
            "Order mix-up in slot 3: check the item kind first with -type f in slot 3, then finish with the size filter -size +100M in slot 4.",
        },
      },
      {
        slotNumber: 4,
        label: "4. Size filter",
        expectedBlockId: "size-plus-100m",
        emptySlotHint: "Slot 4 is empty — finish with the filter for files larger than 100 megabytes.",
        wrongOrderByBlockId: {
          find:
            "Order mix-up in slot 4: find goes first in slot 1, and the size filter -size +100M finishes the command in slot 4.",
          var:
            "Order mix-up in slot 4: /var belongs in slot 2 right after find, while -size +100M belongs at the end in slot 4.",
          "type-f":
            "Order mix-up in slot 4: put -type f in slot 3 and -size +100M in slot 4 so you filter for regular files and then check their size.",
        },
      },
    ],
  },

  "coach-sb-chmod-750": {
    intro: "Tap each block to learn what the words and numbers mean, place them in order in the tray, then tap Run to lock down deploy.sh.",
    passMessage:
      "Locked down — chmod 750 deploy.sh changed the file's real permissions to rwxr-x---, and ls -l proves it.",
    beforeCommand: "ls -l deploy.sh",
    afterCommand: "ls -l deploy.sh",
    blocks: [
      {
        id: "chmod",
        token: "chmod",
        meaning: "change who can use this",
      },
      {
        id: "750",
        token: "750",
        spokenToken: "seven five zero",
        meaning: "owner full control, group read and run, others nothing",
      },
      {
        id: "deploy-sh",
        token: "deploy.sh",
        meaning: "the file",
      },
      {
        id: "755",
        token: "755",
        spokenToken: "seven five five",
        meaning: "owner full control, group read and run, others can also read and run",
        wrongWhy:
          "755 gives others read and run access too (that last 5). Others should get nothing at all — swap in 750 so the last digit is zero.",
      },
      {
        id: "777",
        token: "777",
        spokenToken: "seven seven seven",
        meaning: "everyone on the machine gets full read, write, and run control",
        wrongWhy:
          "777 gives everybody on the machine full read, write, and run access. Swap in 750 for owner full control, group read and run, and others nothing.",
      },
    ],
    bankOrder: ["750", "deploy-sh", "755", "chmod", "777"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Action word",
        expectedBlockId: "chmod",
        emptySlotHint: "Slot 1 is empty — start with the command word that changes permissions.",
        wrongOrderByBlockId: {
          "750":
            "Order mix-up in slot 1: 750 means owner full control, group read and run, others nothing — that is the permission code, not the command. Swap chmod into slot 1 and put 750 in slot 2.",
          "deploy-sh":
            "Order mix-up in slot 1: deploy.sh is the file you are changing, not the command word. Swap chmod into slot 1 and put deploy.sh at the end in slot 3.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Who gets what",
        expectedBlockId: "750",
        emptySlotHint: "Slot 2 is empty — pick the three-digit permission code for owner, group, and others.",
        wrongOrderByBlockId: {
          chmod:
            "Order mix-up in slot 2: chmod means change who can use this, so it has to come first in slot 1, with the permission code 750 in slot 2.",
          "deploy-sh":
            "Order mix-up in slot 2: chmod expects the permission code before the filename. Swap 750 into slot 2 and move deploy.sh to slot 3.",
        },
      },
      {
        slotNumber: 3,
        label: "3. Which file",
        expectedBlockId: "deploy-sh",
        emptySlotHint: "Slot 3 is empty — finish with the file you want to lock down.",
        wrongOrderByBlockId: {
          chmod:
            "Order mix-up in slot 3: chmod is the action word and belongs first in slot 1, while deploy.sh goes last in slot 3.",
          "750":
            "Order mix-up in slot 3: the permission code 750 goes in slot 2 before the filename, and deploy.sh goes last in slot 3.",
        },
      },
    ],
  },

  "coach-sb-grep-recursive": {
    intro: "Build the four-block search command that scans every file under /etc for the word Port and prints line numbers.",
    passMessage:
      "Found it — grep -rn Port /etc scanned the configuration tree and printed the matching file and line number.",
    blocks: [
      {
        id: "grep",
        token: "grep",
        meaning: "search inside files for matching text",
      },
      {
        id: "rn",
        token: "-rn",
        meaning: "search every sub-folder (-r) and show line numbers (-n)",
      },
      {
        id: "port",
        token: "Port",
        meaning: "the exact word to search for inside each file",
      },
      {
        id: "etc",
        token: "/etc",
        meaning: "the system configuration folder to scan",
      },
      {
        id: "r-only",
        token: "-r",
        meaning: "search sub-folders, but leave out the line numbers",
        wrongWhy:
          "You picked -r without n, which searches sub-folders but leaves out the line numbers. Swap in -rn so every match shows its line number.",
      },
      {
        id: "var",
        token: "/var",
        meaning: "the logs and variable-data folder, not system config",
        wrongWhy:
          "You picked /var, which holds logs rather than system settings. Swap in /etc to search the configuration directory.",
      },
    ],
    bankOrder: ["port", "rn", "var", "grep", "etc", "r-only"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Text scanner",
        expectedBlockId: "grep",
        emptySlotHint: "Slot 1 is empty — start with grep, the tool that searches inside files.",
        wrongOrderByBlockId: {
          rn:
            "Order mix-up in slot 1: -rn is a flag bundle for grep, not a command on its own. Put grep first in slot 1.",
          port:
            "Order mix-up in slot 1: Port is the word you are searching for, not the command. Put grep first in slot 1.",
          etc:
            "Order mix-up in slot 1: /etc is the folder to search, not the command. Put grep first in slot 1 and /etc last in slot 4.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Search flags",
        expectedBlockId: "rn",
        emptySlotHint: "Slot 2 is empty — add the flags for sub-folders and line numbers.",
        wrongOrderByBlockId: {
          grep:
            "Order mix-up in slot 2: grep goes at the start in slot 1, and the -rn flags go right after it in slot 2.",
          port:
            "Order mix-up in slot 2: put the -rn flags in slot 2 first, then the search word Port in slot 3.",
          etc:
            "Order mix-up in slot 2: /etc goes at the end in slot 4 after the search word. Put -rn in slot 2.",
        },
      },
      {
        slotNumber: 3,
        label: "3. Search word",
        expectedBlockId: "port",
        emptySlotHint: "Slot 3 is empty — pick the word Port that grep should look for.",
        wrongOrderByBlockId: {
          grep:
            "Order mix-up in slot 3: grep belongs in slot 1 at the start, and the search word Port belongs here in slot 3.",
          rn:
            "Order mix-up in slot 3: put the -rn flags in slot 2 before the search word Port in slot 3.",
          etc:
            "Order mix-up in slot 3: grep takes the word to find BEFORE the folder path — put Port in slot 3 and /etc in slot 4.",
        },
      },
      {
        slotNumber: 4,
        label: "4. Folder to scan",
        expectedBlockId: "etc",
        emptySlotHint: "Slot 4 is empty — finish with /etc so grep knows where to search.",
        wrongOrderByBlockId: {
          grep:
            "Order mix-up in slot 4: grep goes first in slot 1, and the folder /etc goes last in slot 4.",
          rn:
            "Order mix-up in slot 4: put the -rn flags in slot 2 and finish with the folder /etc in slot 4.",
          port:
            "Order mix-up in slot 4: grep expects the search word Port in slot 3 and the folder /etc last in slot 4. Swap slots 3 and 4.",
        },
      },
    ],
  },

  "coach-sb-cd-logs": {
    intro: "Pick the two blocks that step out of your home folder and into the system log directory at /var/log.",
    passMessage:
      "You are in — cd /var/log moved your working folder into /var/log, and pwd confirms your new location.",
    beforeCommand: "pwd",
    afterCommand: "pwd",
    blocks: [
      {
        id: "cd",
        token: "cd",
        meaning: "move into a different folder",
      },
      {
        id: "var-log",
        token: "/var/log",
        meaning: "the system log folder where error records live",
      },
      {
        id: "var-only",
        token: "/var",
        meaning: "stops one folder too high, outside the log directory",
        wrongWhy:
          "You picked /var, which stops one level above the logs. Swap in /var/log so you move all the way into the log folder.",
      },
      {
        id: "ls",
        token: "ls",
        meaning: "list files in a folder without moving into it",
        wrongWhy:
          "You picked ls, which only looks inside a folder while keeping you where you are. Swap in cd to actually move into /var/log.",
      },
    ],
    bankOrder: ["var-log", "ls", "var-only", "cd"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Move command",
        expectedBlockId: "cd",
        emptySlotHint: "Slot 1 is empty — start with the command that changes your current folder.",
        wrongOrderByBlockId: {
          "var-log":
            "Order mix-up in slot 1: /var/log is the destination folder, not the command. Put cd first in slot 1 and /var/log in slot 2.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Destination folder",
        expectedBlockId: "var-log",
        emptySlotHint: "Slot 2 is empty — pick the log folder path /var/log.",
        wrongOrderByBlockId: {
          cd:
            "Order mix-up in slot 2: cd is the command word and goes first in slot 1, followed by /var/log in slot 2.",
        },
      },
    ],
  },

  "coach-sb-tar-create": {
    intro: "Build the backup command that packs /etc into a compressed archive file named etc.tar.gz.",
    passMessage:
      "Backup packed — tar -czf etc.tar.gz /etc created the real compressed archive file in your folder.",
    afterCommand: "ls -l etc.tar.gz",
    blocks: [
      {
        id: "tar",
        token: "tar",
        meaning: "pack many files and folders together into one archive",
      },
      {
        id: "czf",
        token: "-czf",
        meaning: "create a new archive (-c), compress with gzip (-z), into this file (-f)",
      },
      {
        id: "etc-tar-gz",
        token: "etc.tar.gz",
        meaning: "the name of the new compressed backup file to create",
      },
      {
        id: "etc",
        token: "/etc",
        meaning: "the settings folder being copied into the backup",
      },
      {
        id: "xzf",
        token: "-xzf",
        meaning: "extract an existing archive instead of creating a new one",
        wrongWhy:
          "You picked -xzf, where x means extract an existing archive. You are making a new backup — swap in -czf so c creates the archive.",
      },
      {
        id: "cf",
        token: "-cf",
        meaning: "create an archive without gzip compression",
        wrongWhy:
          "You picked -cf, which packs an uncompressed tar file without gzip. Swap in -czf so z compresses it into a .tar.gz archive.",
      },
    ],
    bankOrder: ["etc", "czf", "xzf", "etc-tar-gz", "tar", "cf"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Archive tool",
        expectedBlockId: "tar",
        emptySlotHint: "Slot 1 is empty — start with tar, the archiving tool.",
        wrongOrderByBlockId: {
          czf:
            "Order mix-up in slot 1: -czf is the set of switches for tar, not a standalone command. Put tar first in slot 1.",
          "etc-tar-gz":
            "Order mix-up in slot 1: etc.tar.gz is the backup filename, not the command. Put tar first in slot 1.",
          etc:
            "Order mix-up in slot 1: /etc is the folder to pack, not the command. Put tar first in slot 1 and /etc at the end in slot 4.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Pack switches",
        expectedBlockId: "czf",
        emptySlotHint: "Slot 2 is empty — add the -czf switches for create, gzip, and output file.",
        wrongOrderByBlockId: {
          tar:
            "Order mix-up in slot 2: tar goes first in slot 1, and -czf goes right after it in slot 2.",
          "etc-tar-gz":
            "Order mix-up in slot 2: tell tar what to do with -czf in slot 2 first, then name etc.tar.gz right after f in slot 3.",
          etc:
            "Order mix-up in slot 2: put -czf in slot 2 first; the source folder /etc goes last in slot 4.",
        },
      },
      {
        slotNumber: 3,
        label: "3. New archive name",
        expectedBlockId: "etc-tar-gz",
        emptySlotHint: "Slot 3 is empty — right after -czf, give the new archive filename etc.tar.gz.",
        wrongOrderByBlockId: {
          tar:
            "Order mix-up in slot 3: tar belongs at the start in slot 1, and etc.tar.gz belongs here in slot 3.",
          czf:
            "Order mix-up in slot 3: put -czf in slot 2 so etc.tar.gz can follow right after the f flag in slot 3.",
          etc:
            "Order mix-up in slot 3: the f in -czf expects the new archive filename NEXT — put etc.tar.gz in slot 3 and the folder /etc in slot 4.",
        },
      },
      {
        slotNumber: 4,
        label: "4. Folder to pack",
        expectedBlockId: "etc",
        emptySlotHint: "Slot 4 is empty — finish with /etc, the folder you want packed into the backup.",
        wrongOrderByBlockId: {
          tar:
            "Order mix-up in slot 4: tar goes first in slot 1, while /etc goes last in slot 4.",
          czf:
            "Order mix-up in slot 4: -czf goes in slot 2, and the source folder /etc goes last in slot 4.",
          "etc-tar-gz":
            "Order mix-up in slot 4: tar -czf needs the archive name etc.tar.gz in slot 3 BEFORE the source folder /etc in slot 4. Swap slots 3 and 4.",
        },
      },
    ],
  },

  "coach-sb-ss-listen": {
    intro: "Build the two-block network check that lists listening TCP ports using numbers and shows which program owns each one.",
    passMessage:
      "Clear roster — ss -tlnp listed every open listening TCP port by number along with the program running behind it.",
    blocks: [
      {
        id: "ss",
        token: "ss",
        meaning: "show network sockets and open ports",
      },
      {
        id: "tlnp",
        token: "-tlnp",
        meaning: "TCP only (-t), listening (-l), port numbers (-n), owning program (-p)",
      },
      {
        id: "netstat",
        token: "netstat",
        meaning: "old retired network tool replaced by ss",
        wrongWhy:
          "You picked netstat, which is the old deprecated tool. Swap in ss, the modern socket tool used on current Linux systems.",
      },
      {
        id: "tln",
        token: "-tln",
        meaning: "TCP, listening, and port numbers — but hides which program owns each port",
        wrongWhy:
          "You picked -tln without p, so the listing hides which process owns each port. Swap in -tlnp so p shows the program name.",
      },
    ],
    bankOrder: ["tlnp", "netstat", "ss", "tln"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Socket tool",
        expectedBlockId: "ss",
        emptySlotHint: "Slot 1 is empty — start with ss, the modern socket inspection command.",
        wrongOrderByBlockId: {
          tlnp:
            "Order mix-up in slot 1: -tlnp is a bundle of flags, not a command on its own. Put ss first in slot 1 and -tlnp in slot 2.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Filter flags",
        expectedBlockId: "tlnp",
        emptySlotHint: "Slot 2 is empty — add -tlnp for TCP, listening, numeric ports, and owning process.",
        wrongOrderByBlockId: {
          ss:
            "Order mix-up in slot 2: ss is the command word and belongs first in slot 1, with -tlnp after it in slot 2.",
        },
      },
    ],
  },

  "coach-sb-cat-fstab": {
    intro: "Assemble the two-block command that prints the boot filesystem table onto your screen.",
    passMessage:
      "There is the boot mount table — cat /etc/fstab printed the drives and mount points read when the system starts.",
    blocks: [
      {
        id: "cat",
        token: "cat",
        meaning: "print the contents of a file onto the screen",
      },
      {
        id: "etc-fstab",
        token: "/etc/fstab",
        meaning: "the boot mount table listing drives to attach at startup",
      },
      {
        id: "etc-mtab",
        token: "/etc/mtab",
        meaning: "shows drives mounted right now, not what is configured for boot",
        wrongWhy:
          "You picked /etc/mtab, which shows what happens to be mounted right now rather than the boot checklist. Swap in /etc/fstab.",
      },
      {
        id: "cd",
        token: "cd",
        meaning: "move into a folder — cannot print a text file",
        wrongWhy:
          "You picked cd, which walks into directories and cannot read a file. Swap in cat to print the file on screen.",
      },
    ],
    bankOrder: ["etc-fstab", "cd", "etc-mtab", "cat"],
    slots: [
      {
        slotNumber: 1,
        label: "1. File reader",
        expectedBlockId: "cat",
        emptySlotHint: "Slot 1 is empty — start with cat, the command that prints a file on screen.",
        wrongOrderByBlockId: {
          "etc-fstab":
            "Order mix-up in slot 1: /etc/fstab is the file path to read, not the command. Put cat first in slot 1 and /etc/fstab in slot 2.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Boot table file",
        expectedBlockId: "etc-fstab",
        emptySlotHint: "Slot 2 is empty — pick /etc/fstab, the filesystem table read at boot.",
        wrongOrderByBlockId: {
          cat:
            "Order mix-up in slot 2: cat is the command word and goes first in slot 1, followed by /etc/fstab in slot 2.",
        },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Phase 1 Easy plans (#10, #18, #19, #20 [2 stages], #21, #22 [2 stages], #23)
  // ---------------------------------------------------------------------------

  "coach-restore-backup": {
    intro:
      "Look at the terminal below: /opt/storefront is empty, and every entry inside /backups/storefront.tar starts with storefront/. Arrange the five blocks to unpack the backup cleanly into /opt/.",
    passMessage:
      "Restored cleanly — tar unpacked storefront/ into /opt/, putting server.js, config/storefront.conf, and public/index.html right back in place.",
    beforeCommands: ["ls -la /opt/storefront", "tar -tf /backups/storefront.tar"],
    afterCommands: ["ls -la /opt/storefront"],
    blocks: [
      {
        id: "tar",
        token: "tar",
        meaning: "pack or unpack archive files",
      },
      {
        id: "xvf",
        token: "-xvf",
        spokenToken: "dash X V F",
        meaning: "extract files (-x), print each file unpacked (-v), from this archive (-f)",
      },
      {
        id: "backup-tar",
        token: "/backups/storefront.tar",
        meaning: "the known-good backup archive file",
      },
      {
        id: "dash-c",
        token: "-C",
        spokenToken: "dash capital C",
        meaning: "step into this target directory before unpacking",
      },
      {
        id: "opt",
        token: "/opt/",
        meaning: "the parent folder so storefront/ lands cleanly at /opt/storefront/",
      },
      {
        id: "cvf",
        token: "-cvf",
        spokenToken: "dash C V F",
        meaning: "create and overwrite an archive instead of extracting it",
        wrongWhy:
          "You picked -cvf, where c creates a new archive and can overwrite your good backup! Swap in -xvf so x extracts the backup instead.",
      },
      {
        id: "opt-storefront",
        token: "/opt/storefront",
        meaning: "unpacks inside storefront, creating a nested /opt/storefront/storefront folder",
        wrongWhy:
          "Every path in the archive already begins with storefront/. Unpacking into /opt/storefront creates /opt/storefront/storefront — swap in /opt/ so it lands in the right place.",
      },
    ],
    bankOrder: ["opt", "xvf", "cvf", "backup-tar", "tar", "opt-storefront", "dash-c"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Archive tool",
        expectedBlockId: "tar",
        emptySlotHint: "Slot 1 is empty — start with tar, the archive tool.",
        wrongOrderByBlockId: {
          xvf: "Order mix-up in slot 1: -xvf is the flag bundle for tar, not a standalone command. Put tar first in slot 1.",
          "backup-tar": "Order mix-up in slot 1: /backups/storefront.tar is the archive file path. Put tar first in slot 1.",
          "dash-c": "Order mix-up in slot 1: -C is the target-folder switch, not the command. Put tar first in slot 1.",
          opt: "Order mix-up in slot 1: /opt/ is the destination parent folder. Put tar first in slot 1 and /opt/ at the end in slot 5.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Extract flags",
        expectedBlockId: "xvf",
        emptySlotHint: "Slot 2 is empty — add -xvf to extract verbosely from an archive file.",
        wrongOrderByBlockId: {
          tar: "Order mix-up in slot 2: tar belongs at the start in slot 1, and -xvf goes right after it in slot 2.",
          "backup-tar": "Order mix-up in slot 2: give the -xvf flags in slot 2 first so f knows the archive filename comes next in slot 3.",
          "dash-c": "Order mix-up in slot 2: tell tar to extract with -xvf in slot 2 before setting the -C target folder in slot 4.",
          opt: "Order mix-up in slot 2: /opt/ belongs at the very end after -C. Put -xvf in slot 2.",
        },
      },
      {
        slotNumber: 3,
        label: "3. Backup file",
        expectedBlockId: "backup-tar",
        emptySlotHint: "Slot 3 is empty — right after -xvf, place /backups/storefront.tar.",
        wrongOrderByBlockId: {
          tar: "Order mix-up in slot 3: tar goes in slot 1, and /backups/storefront.tar goes here right after -xvf.",
          xvf: "Order mix-up in slot 3: put -xvf in slot 2 so /backups/storefront.tar follows the f flag in slot 3.",
          "dash-c": "Order mix-up in slot 3: the f at the end of -xvf expects the archive file /backups/storefront.tar immediately in slot 3, before -C.",
          opt: "Order mix-up in slot 3: /backups/storefront.tar must follow -xvf in slot 3, while /opt/ goes after -C in slot 5.",
        },
      },
      {
        slotNumber: 4,
        label: "4. Target flag",
        expectedBlockId: "dash-c",
        emptySlotHint: "Slot 4 is empty — add the -C switch that picks where to unpack.",
        wrongOrderByBlockId: {
          tar: "Order mix-up in slot 4: tar belongs in slot 1, and -C belongs here in slot 4 before /opt/.",
          xvf: "Order mix-up in slot 4: -xvf belongs in slot 2, and -C belongs in slot 4.",
          "backup-tar": "Order mix-up in slot 4: /backups/storefront.tar belongs in slot 3 right after -xvf, and -C goes in slot 4.",
          opt: "Order mix-up in slot 4: put the -C switch in slot 4 BEFORE the folder /opt/ in slot 5.",
        },
      },
      {
        slotNumber: 5,
        label: "5. Parent folder",
        expectedBlockId: "opt",
        emptySlotHint: "Slot 5 is empty — finish with /opt/ so storefront/ unpacks cleanly inside it.",
        wrongOrderByBlockId: {
          tar: "Order mix-up in slot 5: tar goes first in slot 1, and /opt/ goes last in slot 5.",
          xvf: "Order mix-up in slot 5: -xvf goes in slot 2, and /opt/ goes last in slot 5.",
          "backup-tar": "Order mix-up in slot 5: /backups/storefront.tar belongs in slot 3, while /opt/ goes after -C in slot 5.",
          "dash-c": "Order mix-up in slot 5: -C goes in slot 4 right before /opt/ in slot 5. Swap slots 4 and 5.",
        },
      },
    ],
  },

  "coach-permission-denied": {
    intro:
      "Look at the terminal below: release-plan.md has mode rw-rw---- owned by root:root, while alice is in the developers group. Build the command that hands group ownership to developers without opening the file to everyone.",
    passMessage:
      "Root cause fixed — chgrp developers gave the engineering group read and write access while keeping world permissions closed.",
    beforeCommands: ["ls -l /srv/shared/release-plan.md", "id alice"],
    afterCommands: ["ls -l /srv/shared/release-plan.md"],
    blocks: [
      {
        id: "chgrp",
        token: "chgrp",
        spokenToken: "change group",
        meaning: "change which group owns a file",
      },
      {
        id: "developers",
        token: "developers",
        meaning: "the engineering team group that alice belongs to",
      },
      {
        id: "release-plan",
        token: "/srv/shared/release-plan.md",
        meaning: "the shared release plan file alice needs to read and update",
      },
      {
        id: "chmod-777",
        token: "chmod 777",
        spokenToken: "chmod seven seven seven",
        meaning: "give every user on the whole machine full read, write, and run control",
        wrongWhy:
          "chmod 777 opens an internal team document to everybody on the machine instead of fixing the group mismatch. Swap in chgrp and developers so least privilege holds.",
      },
      {
        id: "root",
        token: "root",
        meaning: "the administrator group that currently locks alice out",
        wrongWhy:
          "The file is already in the root group, which is why alice gets Permission denied. Swap in developers so her team group owns the file.",
      },
    ],
    bankOrder: ["developers", "chmod-777", "release-plan", "chgrp", "root"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Group tool",
        expectedBlockId: "chgrp",
        emptySlotHint: "Slot 1 is empty — start with chgrp, the command that changes a file's group.",
        wrongOrderByBlockId: {
          developers:
            "Order mix-up in slot 1: developers is the team group name, not the command. Put chgrp first in slot 1 and developers in slot 2.",
          "release-plan":
            "Order mix-up in slot 1: /srv/shared/release-plan.md is the file path. Put chgrp first in slot 1 and the file path last in slot 3.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Team group",
        expectedBlockId: "developers",
        emptySlotHint: "Slot 2 is empty — pick developers, the group alice belongs to.",
        wrongOrderByBlockId: {
          chgrp:
            "Order mix-up in slot 2: chgrp goes first in slot 1, followed by the group name developers in slot 2.",
          "release-plan":
            "Order mix-up in slot 2: chgrp expects the new group name developers BEFORE the file path. Swap developers into slot 2.",
        },
      },
      {
        slotNumber: 3,
        label: "3. Shared file",
        expectedBlockId: "release-plan",
        emptySlotHint: "Slot 3 is empty — finish with /srv/shared/release-plan.md.",
        wrongOrderByBlockId: {
          chgrp:
            "Order mix-up in slot 3: chgrp belongs at the start in slot 1, and /srv/shared/release-plan.md belongs at the end in slot 3.",
          developers:
            "Order mix-up in slot 3: put the group name developers in slot 2 and the file /srv/shared/release-plan.md last in slot 3.",
        },
      },
    ],
  },

  "coach-cron-down": {
    intro:
      "Look at the terminal below: the 2 AM backup line in crontab is valid, yet cron.service is inactive and disabled. Build the command that enables cron for boot and starts it right now.",
    passMessage:
      "Scheduler restored — systemctl enabled cron for boot and started the daemon right now, keeping the 2 AM backup job intact.",
    beforeCommands: ["crontab -l", "systemctl status cron"],
    afterCommands: ["systemctl status cron"],
    blocks: [
      {
        id: "systemctl",
        token: "systemctl",
        meaning: "control background services on the machine",
      },
      {
        id: "enable",
        token: "enable",
        meaning: "make this service start automatically on every boot",
      },
      {
        id: "now",
        token: "--now",
        meaning: "also start the service running right this second",
      },
      {
        id: "cron",
        token: "cron",
        meaning: "the background scheduler daemon that runs crontab jobs",
      },
      {
        id: "status",
        token: "status",
        meaning: "only read whether a service is running without starting it",
        wrongWhy:
          "You picked status, which only inspects cron without turning it back on. Swap in enable alongside --now so cron starts now and on every boot.",
      },
      {
        id: "nginx",
        token: "nginx",
        meaning: "the web server program, not the scheduled-task daemon",
        wrongWhy:
          "You picked nginx, which is the web server rather than the task scheduler. Swap in cron to wake up the scheduled-backup daemon.",
      },
    ],
    bankOrder: ["cron", "status", "enable", "systemctl", "nginx", "now"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Service tool",
        expectedBlockId: "systemctl",
        emptySlotHint: "Slot 1 is empty — start with systemctl to control background services.",
        wrongOrderByBlockId: {
          enable: "Order mix-up in slot 1: enable is the action word for systemctl. Put systemctl first in slot 1.",
          now: "Order mix-up in slot 1: --now is a flag for systemctl enable, not a command on its own. Put systemctl in slot 1.",
          cron: "Order mix-up in slot 1: cron is the service name and belongs at the end in slot 4. Put systemctl in slot 1.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Boot action",
        expectedBlockId: "enable",
        emptySlotHint: "Slot 2 is empty — pick enable so cron comes back after a reboot.",
        wrongOrderByBlockId: {
          systemctl: "Order mix-up in slot 2: systemctl goes first in slot 1, with enable right after it in slot 2.",
          now: "Order mix-up in slot 2: put the action word enable in slot 2 first, then add --now in slot 3.",
          cron: "Order mix-up in slot 2: put enable in slot 2 before naming the cron service at the end.",
        },
      },
      {
        slotNumber: 3,
        label: "3. Right-now flag",
        expectedBlockId: "now",
        emptySlotHint: "Slot 3 is empty — add --now so cron starts running tonight as well.",
        wrongOrderByBlockId: {
          systemctl: "Order mix-up in slot 3: systemctl belongs in slot 1, and --now belongs here in slot 3.",
          enable: "Order mix-up in slot 3: enable goes in slot 2, followed by --now in slot 3.",
          cron: "Order mix-up in slot 3: place --now in slot 3 and finish with the service name cron in slot 4.",
        },
      },
      {
        slotNumber: 4,
        label: "4. Scheduler unit",
        expectedBlockId: "cron",
        emptySlotHint: "Slot 4 is empty — finish with cron, the scheduler service.",
        wrongOrderByBlockId: {
          systemctl: "Order mix-up in slot 4: systemctl goes first in slot 1, and cron goes last in slot 4.",
          enable: "Order mix-up in slot 4: enable belongs in slot 2, and cron belongs at the end in slot 4.",
          now: "Order mix-up in slot 4: put --now in slot 3 and cron last in slot 4.",
        },
      },
    ],
  },

  "coach-runaway-cpu": {
    stages: [
      {
        target: "kill 4412",
        intro:
          "Step 1 of 2 — Look at ps below: thumb-worker (PID 4412) is pegging 98.7% CPU. Always try a polite stop first: build kill 4412 and tap Run to see whether it exits cleanly.",
        passMessage:
          "Good habit — you tried a polite stop first. Look at ps below: PID 4412 ignored the polite signal and is still spinning at 98.7% CPU. Now build the force-stop command in Step 2.",
        beforeCommands: ["ps aux --sort=-%cpu"],
        afterCommands: ["ps aux --sort=-%cpu"],
        blocks: [
          {
            id: "kill",
            token: "kill",
            meaning: "send a polite stop signal (SIGTERM) asking a process to exit cleanly",
          },
          {
            id: "4412",
            token: "4412",
            spokenToken: "forty-four twelve",
            meaning: "the process ID (PID) of the runaway thumb-worker eating 98.7% CPU",
          },
          {
            id: "1180",
            token: "1180",
            spokenToken: "eleven eighty",
            meaning: "the process ID of sshd, the remote login service",
            wrongWhy:
              "PID 1180 is sshd, which keeps remote logins alive and uses 0.0% CPU. Swap in 4412 so you target the runaway thumb-worker.",
          },
          {
            id: "ps",
            token: "ps",
            meaning: "list running processes without sending a stop signal",
            wrongWhy:
              "You picked ps, which only lists processes without stopping any of them. Swap in kill to send the stop signal to PID 4412.",
          },
        ],
        bankOrder: ["4412", "1180", "kill", "ps"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Signal tool",
            expectedBlockId: "kill",
            emptySlotHint: "Slot 1 is empty — start with kill to send a polite termination signal.",
            wrongOrderByBlockId: {
              "4412": "Order mix-up in slot 1: 4412 is the process ID number, not the command. Put kill in slot 1 and 4412 in slot 2.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Runaway PID",
            expectedBlockId: "4412",
            emptySlotHint: "Slot 2 is empty — pick 4412, the PID at the top of the CPU list.",
            wrongOrderByBlockId: {
              kill: "Order mix-up in slot 2: kill is the command word and belongs first in slot 1, followed by 4412 in slot 2.",
            },
          },
        ],
      },
      {
        target: "kill -9 4412",
        intro:
          "Step 2 of 2 — PID 4412 trapped the polite stop and kept spinning. Now build the three-block force-stop command so the kernel ends PID 4412 immediately.",
        passMessage:
          "Runaway stopped — kill -9 4412 forced the kernel to end the stuck worker immediately, CPU load dropped, and sshd and postgres stayed up.",
        afterCommands: ["ps aux --sort=-%cpu"],
        blocks: [
          {
            id: "kill",
            token: "kill",
            meaning: "send a signal to a running process by its PID",
          },
          {
            id: "sig-9",
            token: "-9",
            spokenToken: "dash nine",
            meaning: "signal 9 (SIGKILL) — force the kernel to stop a hung process immediately",
          },
          {
            id: "4412",
            token: "4412",
            spokenToken: "forty-four twelve",
            meaning: "the PID of the hung thumb-worker process",
          },
          {
            id: "sig-15",
            token: "-15",
            spokenToken: "dash fifteen",
            meaning: "the polite SIGTERM signal that PID 4412 just ignored",
            wrongWhy:
              "-15 is the same polite signal PID 4412 already ignored in Step 1. Swap in -9 so the kernel terminates the stuck process immediately.",
          },
          {
            id: "1344",
            token: "1344",
            spokenToken: "thirteen forty-four",
            meaning: "the PID of the live PostgreSQL database server",
            wrongWhy:
              "PID 1344 is the PostgreSQL database server, not the runaway worker! Swap in 4412 so you leave the database untouched.",
          },
        ],
        bankOrder: ["4412", "sig-15", "sig-9", "1344", "kill"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Signal tool",
            expectedBlockId: "kill",
            emptySlotHint: "Slot 1 is empty — start with kill.",
            wrongOrderByBlockId: {
              "sig-9": "Order mix-up in slot 1: -9 is the signal flag, not the command. Put kill first in slot 1.",
              "4412": "Order mix-up in slot 1: 4412 is the PID to stop. Put kill first in slot 1 and 4412 last in slot 3.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Force signal",
            expectedBlockId: "sig-9",
            emptySlotHint: "Slot 2 is empty — add -9 for the uncatchable kernel stop.",
            wrongOrderByBlockId: {
              kill: "Order mix-up in slot 2: kill goes first in slot 1, and -9 goes right after it in slot 2.",
              "4412": "Order mix-up in slot 2: place the -9 signal flag in slot 2 BEFORE the PID 4412 in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Stuck PID",
            expectedBlockId: "4412",
            emptySlotHint: "Slot 3 is empty — finish with 4412, the stuck worker's PID.",
            wrongOrderByBlockId: {
              kill: "Order mix-up in slot 3: kill goes in slot 1, while 4412 goes at the end in slot 3.",
              "sig-9": "Order mix-up in slot 3: put -9 in slot 2 and the PID 4412 last in slot 3.",
            },
          },
        ],
      },
    ],
  },

  "coach-disk-full": {
    intro:
      "Look at the terminal below: / is 100% full because /var/log/app-debug.log.old is 22 gigabytes. Build the two-block command that removes ONLY that bloated old file while leaving live logs safe.",
    passMessage:
      "Space recovered — rm /var/log/app-debug.log.old freed 22 gigabytes, root disk usage dropped well under 90%, and every live log stayed intact.",
    beforeCommands: ["df -h", "du -sh /var/log/*"],
    afterCommands: ["df -h"],
    blocks: [
      {
        id: "rm",
        token: "rm",
        meaning: "delete a file so the disk space it holds is freed",
      },
      {
        id: "old-debug",
        token: "/var/log/app-debug.log.old",
        meaning: "the bloated 22-gigabyte old debug dump filling the root disk",
      },
      {
        id: "syslog",
        token: "/var/log/syslog",
        meaning: "an active system log file that is only a few kilobytes",
        wrongWhy:
          "/var/log/syslog is a live system journal and tiny in size — never delete active logs! Swap in /var/log/app-debug.log.old.",
      },
      {
        id: "du",
        token: "du",
        meaning: "measure file sizes without deleting anything",
        wrongWhy:
          "You picked du, which only reports how big files are without freeing space. Swap in rm to remove the 22-gigabyte old dump.",
      },
    ],
    bankOrder: ["old-debug", "syslog", "du", "rm"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Remove tool",
        expectedBlockId: "rm",
        emptySlotHint: "Slot 1 is empty — start with rm, the file-removal command.",
        wrongOrderByBlockId: {
          "old-debug":
            "Order mix-up in slot 1: /var/log/app-debug.log.old is the file path to delete, not the command. Put rm first in slot 1.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Bloated old file",
        expectedBlockId: "old-debug",
        emptySlotHint: "Slot 2 is empty — pick /var/log/app-debug.log.old so only the old dump is removed.",
        wrongOrderByBlockId: {
          rm: "Order mix-up in slot 2: rm goes first in slot 1, followed by /var/log/app-debug.log.old in slot 2.",
        },
      },
    ],
  },

  "coach-port-in-use": {
    stages: [
      {
        target: "kill 2847",
        intro:
          "Step 1 of 2 — Look at ss -tlnp below: dev-preview (PID 2847) is squatting on port 80, blocking Apache httpd. Build the two-block command to stop PID 2847 and free port 80.",
        passMessage:
          "Port 80 freed — kill 2847 cleared dev-preview off port 80 while leaving sshd and postgres untouched. Now start httpd in Step 2.",
        beforeCommands: ["ss -tlnp"],
        afterCommands: ["ss -tlnp"],
        blocks: [
          {
            id: "kill",
            token: "kill",
            meaning: "send a termination signal to stop a process by its PID",
          },
          {
            id: "2847",
            token: "2847",
            spokenToken: "twenty-eight forty-seven",
            meaning: "the PID of the leftover dev-preview process holding port 80",
          },
          {
            id: "1180",
            token: "1180",
            spokenToken: "eleven eighty",
            meaning: "the PID of sshd listening on port 22",
            wrongWhy:
              "PID 1180 is sshd on port 22 — stopping it kills SSH access and leaves port 80 blocked! Swap in 2847 to clear port 80.",
          },
          {
            id: "ss",
            token: "ss",
            meaning: "list open network sockets without stopping any process",
            wrongWhy:
              "You picked ss, which inspects sockets rather than stopping a process. Swap in kill to end PID 2847.",
          },
        ],
        bankOrder: ["2847", "ss", "1180", "kill"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Signal tool",
            expectedBlockId: "kill",
            emptySlotHint: "Slot 1 is empty — start with kill to stop the rogue listener.",
            wrongOrderByBlockId: {
              "2847": "Order mix-up in slot 1: 2847 is the PID, not the command. Put kill first in slot 1 and 2847 in slot 2.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Port-80 PID",
            expectedBlockId: "2847",
            emptySlotHint: "Slot 2 is empty — pick 2847, the PID holding port 80.",
            wrongOrderByBlockId: {
              kill: "Order mix-up in slot 2: kill goes first in slot 1, followed by 2847 in slot 2.",
            },
          },
        ],
      },
      {
        target: "systemctl start httpd",
        intro:
          "Step 2 of 2 — Port 80 is clear now. Build the three-block command that starts the Apache web server (httpd) so it binds port 80 and answers visitors.",
        passMessage:
          "Apache is up — systemctl start httpd claimed port 80 cleanly, and curl localhost returned the live web page.",
        afterCommands: ["ss -tlnp", "curl localhost"],
        blocks: [
          {
            id: "systemctl",
            token: "systemctl",
            meaning: "control background services on the machine",
          },
          {
            id: "start",
            token: "start",
            meaning: "launch a stopped service right now",
          },
          {
            id: "httpd",
            token: "httpd",
            spokenToken: "H T T P D",
            meaning: "the Apache HTTP web server unit",
          },
          {
            id: "stop",
            token: "stop",
            meaning: "shut down a running service",
            wrongWhy:
              "You picked stop, which shuts a service down instead of launching it. Swap in start to bring httpd online.",
          },
          {
            id: "sshd",
            token: "sshd",
            meaning: "the remote SSH login daemon, already running on port 22",
            wrongWhy:
              "sshd is already running on port 22. Swap in httpd so Apache starts listening on port 80.",
          },
        ],
        bankOrder: ["httpd", "stop", "systemctl", "sshd", "start"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Service tool",
            expectedBlockId: "systemctl",
            emptySlotHint: "Slot 1 is empty — start with systemctl.",
            wrongOrderByBlockId: {
              start: "Order mix-up in slot 1: start is the action word for systemctl. Put systemctl first in slot 1.",
              httpd: "Order mix-up in slot 1: httpd is the service name and goes last in slot 3. Put systemctl first in slot 1.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Action word",
            expectedBlockId: "start",
            emptySlotHint: "Slot 2 is empty — pick start to launch the service.",
            wrongOrderByBlockId: {
              systemctl: "Order mix-up in slot 2: systemctl goes first in slot 1, with start in slot 2.",
              httpd: "Order mix-up in slot 2: systemctl needs the action word start in slot 2 before the unit name httpd in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Apache unit",
            expectedBlockId: "httpd",
            emptySlotHint: "Slot 3 is empty — finish with httpd, the Apache web server.",
            wrongOrderByBlockId: {
              systemctl: "Order mix-up in slot 3: systemctl belongs in slot 1, and httpd belongs at the end in slot 3.",
              start: "Order mix-up in slot 3: put start in slot 2 and httpd at the end in slot 3.",
            },
          },
        ],
      },
    ],
  },

  "coach-inodes-gone": {
    intro:
      "Look at df -h and df -i below: 22 gigabytes are free, yet 100% of inodes on / are used up by 1,500 tiny orphan files inside /var/spool/maildrop. Build the three-block cleanup command.",
    passMessage:
      "Inodes restored — rm -f /var/spool/maildrop/* cleared all 1,500 orphan files, freed 1,500 inodes on /, and kept /var/spool intact.",
    beforeCommands: ["df -h", "df -i"],
    afterCommands: ["df -i"],
    blocks: [
      {
        id: "rm",
        token: "rm",
        meaning: "delete files so their inodes return to the free pool",
      },
      {
        id: "dash-f",
        token: "-f",
        spokenToken: "dash F",
        meaning: "force removal quietly without prompting 1,500 separate times",
      },
      {
        id: "maildrop-glob",
        token: "/var/spool/maildrop/*",
        spokenToken: "/var/spool/maildrop star",
        meaning: "every tiny orphan file inside maildrop, keeping the folder itself",
      },
      {
        id: "var-spool",
        token: "/var/spool",
        meaning: "the entire system spool directory holding cron tables and queues",
        wrongWhy:
          "Targeting /var/spool threatens the whole spool hierarchy including cron tables. Swap in /var/spool/maildrop/* so only the orphan files inside maildrop are removed.",
      },
      {
        id: "df",
        token: "df",
        meaning: "report disk or inode usage without deleting any files",
        wrongWhy:
          "You picked df, which only checks usage without freeing inodes. Swap in rm to remove the pile of orphan files.",
      },
    ],
    bankOrder: ["maildrop-glob", "df", "dash-f", "var-spool", "rm"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Remove tool",
        expectedBlockId: "rm",
        emptySlotHint: "Slot 1 is empty — start with rm to delete the orphan files.",
        wrongOrderByBlockId: {
          "dash-f": "Order mix-up in slot 1: -f is a flag for rm, not a command on its own. Put rm first in slot 1.",
          "maildrop-glob": "Order mix-up in slot 1: /var/spool/maildrop/* is the target path. Put rm first in slot 1.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Quiet force flag",
        expectedBlockId: "dash-f",
        emptySlotHint: "Slot 2 is empty — add -f so rm clears the batch cleanly without prompts.",
        wrongOrderByBlockId: {
          rm: "Order mix-up in slot 2: rm goes first in slot 1, and -f goes right after it in slot 2.",
          "maildrop-glob": "Order mix-up in slot 2: put the -f flag in slot 2 BEFORE the path /var/spool/maildrop/* in slot 3.",
        },
      },
      {
        slotNumber: 3,
        label: "3. Orphan files",
        expectedBlockId: "maildrop-glob",
        emptySlotHint: "Slot 3 is empty — finish with /var/spool/maildrop/* to clear the files inside maildrop.",
        wrongOrderByBlockId: {
          rm: "Order mix-up in slot 3: rm belongs in slot 1, and /var/spool/maildrop/* goes last in slot 3.",
          "dash-f": "Order mix-up in slot 3: put -f in slot 2 and finish with /var/spool/maildrop/* in slot 3.",
        },
      },
    ],
  },

  "coach-ssh-key-server1": {
    intro:
      "Step 1 of 4: Look at ls -la ~ below — the private key file admin is sitting in your home folder instead of ~/.ssh/. Build the three-block command to move ~/admin into ~/.ssh/.",
    passMessage:
      "Step 1 done — ~/admin moved into ~/.ssh/admin. Now lock down its file permissions in Step 2.",
    blocks: [],
    bankOrder: [],
    slots: [],
    stages: [
      {
        target: "mv ~/admin ~/.ssh/",
        intro:
          "Step 1 of 4: Look at ls -la ~ below — the private key file admin is sitting in your home folder instead of ~/.ssh/. Build the three-block command to move ~/admin into ~/.ssh/.",
        passMessage:
          "Step 1 done — ~/admin moved into ~/.ssh/admin. Now lock down its file permissions in Step 2.",
        beforeCommands: ["ls -la ~"],
        afterCommands: ["ls -la ~/.ssh"],
        blocks: [
          {
            id: "mv",
            token: "mv",
            meaning: "move or rename a file so it leaves the old path and lands in the new one",
          },
          {
            id: "tilde-admin",
            token: "~/admin",
            spokenToken: "tilde slash admin",
            meaning: "the loose private key file currently sitting in your home directory",
          },
          {
            id: "tilde-ssh",
            token: "~/.ssh/",
            spokenToken: "tilde slash dot S S H slash",
            meaning: "your hidden SSH directory where SSH looks for keys and config",
          },
          {
            id: "cp",
            token: "cp",
            meaning: "copy a file while leaving the original behind",
            wrongWhy:
              "You picked cp, which leaves a stray copy of ~/admin in your home folder. Swap in mv so ~/admin is moved cleanly into ~/.ssh/.",
          },
          {
            id: "etc-ssh",
            token: "/etc/ssh/",
            meaning: "the system-wide SSH daemon directory owned by root",
            wrongWhy:
              "Your personal client key belongs in ~/.ssh/, not in the system-wide /etc/ssh/ directory. Swap in ~/.ssh/.",
          },
        ],
        bankOrder: ["tilde-ssh", "cp", "tilde-admin", "etc-ssh", "mv"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Move tool",
            expectedBlockId: "mv",
            emptySlotHint: "Slot 1 is empty — start with mv to move the private key file.",
            wrongOrderByBlockId: {
              "tilde-admin": "Order mix-up in slot 1: ~/admin is the file being moved. Put mv first in slot 1.",
              "tilde-ssh": "Order mix-up in slot 1: ~/.ssh/ is the destination folder. Put mv first in slot 1.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Source key",
            expectedBlockId: "tilde-admin",
            emptySlotHint: "Slot 2 is empty — pick ~/admin as the source file to move.",
            wrongOrderByBlockId: {
              mv: "Order mix-up in slot 2: mv goes in slot 1, and ~/admin goes in slot 2.",
              "tilde-ssh": "Order mix-up in slot 2: put the source file ~/admin in slot 2 BEFORE the destination ~/.ssh/ in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Destination folder",
            expectedBlockId: "tilde-ssh",
            emptySlotHint: "Slot 3 is empty — finish with ~/.ssh/ as the destination folder.",
            wrongOrderByBlockId: {
              mv: "Order mix-up in slot 3: mv belongs in slot 1, and ~/.ssh/ goes at the end in slot 3.",
              "tilde-admin": "Order mix-up in slot 3: put ~/admin in slot 2 and ~/.ssh/ in slot 3.",
            },
          },
        ],
      },
      {
        target: "chmod 0600 ~/.ssh/admin",
        intro:
          "Step 2 of 4: SSH refuses any private key that group or other users can read. Build the three-block command to lock ~/.ssh/admin down to mode 0600 (owner read/write only).",
        passMessage:
          "Step 2 done — ~/.ssh/admin is locked down to 0600. Now hand ownership to your user account in Step 3.",
        afterCommands: ["ls -l ~/.ssh/admin"],
        blocks: [
          {
            id: "chmod",
            token: "chmod",
            meaning: "change file permission bits",
          },
          {
            id: "mode-0600",
            token: "0600",
            spokenToken: "zero six hundred",
            meaning: "owner read and write only; group and others get nothing",
          },
          {
            id: "ssh-admin",
            token: "~/.ssh/admin",
            spokenToken: "tilde slash dot S S H slash admin",
            meaning: "the private key inside your ~/.ssh folder",
          },
          {
            id: "mode-0644",
            token: "0644",
            spokenToken: "zero six four four",
            meaning: "owner read/write, everyone else can read",
            wrongWhy:
              "Mode 0644 leaves the private key world-readable, so SSH will reject it as unprotected. Swap in 0600.",
          },
          {
            id: "chown",
            token: "chown",
            meaning: "change file owner, not permission bits",
            wrongWhy:
              "chown changes who owns the file, not its 0600 permission code. Swap in chmod for Step 2.",
          },
        ],
        bankOrder: ["ssh-admin", "mode-0644", "mode-0600", "chown", "chmod"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Permission tool",
            expectedBlockId: "chmod",
            emptySlotHint: "Slot 1 is empty — start with chmod to lock down the key's permissions.",
            wrongOrderByBlockId: {
              "mode-0600": "Order mix-up in slot 1: 0600 is the permission mode. Put chmod first in slot 1.",
              "ssh-admin": "Order mix-up in slot 1: ~/.ssh/admin is the target file. Put chmod first in slot 1.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Owner-only mode",
            expectedBlockId: "mode-0600",
            emptySlotHint: "Slot 2 is empty — pick 0600 so only the owner can read and write the private key.",
            wrongOrderByBlockId: {
              chmod: "Order mix-up in slot 2: chmod goes in slot 1, and 0600 goes in slot 2.",
              "ssh-admin": "Order mix-up in slot 2: put the mode 0600 in slot 2 before ~/.ssh/admin in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Private key path",
            expectedBlockId: "ssh-admin",
            emptySlotHint: "Slot 3 is empty — finish with ~/.ssh/admin.",
            wrongOrderByBlockId: {
              chmod: "Order mix-up in slot 3: chmod belongs in slot 1, and ~/.ssh/admin goes last in slot 3.",
              "mode-0600": "Order mix-up in slot 3: put 0600 in slot 2 and ~/.ssh/admin in slot 3.",
            },
          },
        ],
      },
      {
        target: "chown $USER ~/.ssh/admin",
        intro:
          "Step 3 of 4: Look at ls -l ~/.ssh/admin above — the key is still owned by root. Build the three-block command to hand ownership of ~/.ssh/admin to $USER.",
        passMessage:
          "Step 3 done — ~/.ssh/admin is now owned by user with mode 0600. Now write the Host server1 block to ~/.ssh/config in Step 4.",
        afterCommands: ["ls -l ~/.ssh/admin"],
        blocks: [
          {
            id: "chown",
            token: "chown",
            meaning: "change which user account owns a file",
          },
          {
            id: "dollar-user",
            token: "$USER",
            spokenToken: "dollar USER",
            meaning: "your current logged-in username variable (expands to user)",
          },
          {
            id: "ssh-admin",
            token: "~/.ssh/admin",
            spokenToken: "tilde slash dot S S H slash admin",
            meaning: "the private key inside your ~/.ssh folder",
          },
          {
            id: "root",
            token: "root",
            meaning: "the superuser account that already owned the file",
            wrongWhy:
              "Leaving the key owned by root stops your normal user account from reading its own key. Swap in $USER.",
          },
          {
            id: "chgrp",
            token: "chgrp",
            meaning: "change only a file's group, leaving the user owner as root",
            wrongWhy:
              "chgrp only changes the group, leaving root as the file owner. Swap in chown so $USER owns the key.",
          },
        ],
        bankOrder: ["dollar-user", "root", "ssh-admin", "chgrp", "chown"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Ownership tool",
            expectedBlockId: "chown",
            emptySlotHint: "Slot 1 is empty — start with chown to change the file owner.",
            wrongOrderByBlockId: {
              "dollar-user": "Order mix-up in slot 1: $USER is the new owner name. Put chown first in slot 1.",
              "ssh-admin": "Order mix-up in slot 1: ~/.ssh/admin is the file path. Put chown first in slot 1.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Current user",
            expectedBlockId: "dollar-user",
            emptySlotHint: "Slot 2 is empty — pick $USER as the new owner.",
            wrongOrderByBlockId: {
              chown: "Order mix-up in slot 2: chown belongs in slot 1, and $USER goes in slot 2.",
              "ssh-admin": "Order mix-up in slot 2: put the owner $USER in slot 2 before the file path ~/.ssh/admin in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Private key path",
            expectedBlockId: "ssh-admin",
            emptySlotHint: "Slot 3 is empty — finish with ~/.ssh/admin.",
            wrongOrderByBlockId: {
              chown: "Order mix-up in slot 3: chown belongs in slot 1, and ~/.ssh/admin goes last in slot 3.",
              "dollar-user": "Order mix-up in slot 3: put $USER in slot 2 and ~/.ssh/admin in slot 3.",
            },
          },
        ],
      },
      {
        target:
          'printf "Host server1\\n  HostName server1\\n  Port 2222\\n  User admin\\n  IdentityFile ~/.ssh/admin\\n" > ~/.ssh/config',
        intro:
          "Step 4 of 4: Tell SSH how to reach server1 by writing the Host server1 block (HostName server1, Port 2222, User admin, IdentityFile ~/.ssh/admin) into ~/.ssh/config.",
        passMessage:
          "Key login to server1 is ready — ~/.ssh/admin is in place with mode 0600 owned by user, and ~/.ssh/config directs server1 to port 2222 as admin with that key.",
        afterCommands: ["cat ~/.ssh/config", "ssh server1"],
        blocks: [
          {
            id: "printf",
            token: "printf",
            meaning: "print formatted text with real line breaks (\\n)",
          },
          {
            id: "server1-block",
            token:
              '"Host server1\\n  HostName server1\\n  Port 2222\\n  User admin\\n  IdentityFile ~/.ssh/admin\\n"',
            spokenToken: "Host server1 config block",
            meaning: "the five-line SSH config block for server1 on port 2222 as user admin with ~/.ssh/admin",
          },
          {
            id: "redirect-out",
            token: ">",
            spokenToken: "redirect arrow",
            meaning: "write the command's output into a file",
          },
          {
            id: "ssh-config",
            token: "~/.ssh/config",
            spokenToken: "tilde slash dot S S H slash config",
            meaning: "your personal SSH client configuration file",
          },
          {
            id: "cat",
            token: "cat",
            meaning: "read an existing file instead of formatting text",
            wrongWhy:
              "cat reads files; use printf to output the formatted multi-line Host server1 block into ~/.ssh/config.",
          },
        ],
        bankOrder: ["ssh-config", "redirect-out", "server1-block", "cat", "printf"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Format tool",
            expectedBlockId: "printf",
            emptySlotHint: "Slot 1 is empty — start with printf to format the multi-line SSH config block.",
            wrongOrderByBlockId: {
              "server1-block": "Order mix-up in slot 1: the Host server1 text goes in slot 2 after printf.",
              "redirect-out": "Order mix-up in slot 1: > goes in slot 3 before the file path.",
              "ssh-config": "Order mix-up in slot 1: ~/.ssh/config goes last in slot 4.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Host server1 block",
            expectedBlockId: "server1-block",
            emptySlotHint: "Slot 2 is empty — pick the Host server1 configuration block.",
            wrongOrderByBlockId: {
              printf: "Order mix-up in slot 2: printf belongs in slot 1, and the Host server1 block goes in slot 2.",
              "redirect-out": "Order mix-up in slot 2: put the Host server1 block in slot 2 before > in slot 3.",
              "ssh-config": "Order mix-up in slot 2: ~/.ssh/config goes at the end in slot 4.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Redirect >",
            expectedBlockId: "redirect-out",
            emptySlotHint: "Slot 3 is empty — pick > to write the output into a file.",
            wrongOrderByBlockId: {
              printf: "Order mix-up in slot 3: printf goes in slot 1, and > goes in slot 3.",
              "server1-block": "Order mix-up in slot 3: the Host server1 text goes in slot 2, then > in slot 3.",
              "ssh-config": "Order mix-up in slot 3: put > in slot 3 before ~/.ssh/config in slot 4.",
            },
          },
          {
            slotNumber: 4,
            label: "4. Config path",
            expectedBlockId: "ssh-config",
            emptySlotHint: "Slot 4 is empty — finish with ~/.ssh/config.",
            wrongOrderByBlockId: {
              printf: "Order mix-up in slot 4: printf belongs in slot 1, and ~/.ssh/config goes last in slot 4.",
              "server1-block": "Order mix-up in slot 4: put the Host server1 block in slot 2 and ~/.ssh/config in slot 4.",
              "redirect-out": "Order mix-up in slot 4: put > in slot 3 and ~/.ssh/config last in slot 4.",
            },
          },
        ],
      },
    ],
  },

  "coach-install-httpd": {
    intro:
      "Step 1 of 3: Look at systemctl status httpd below — the unit does not exist yet because Apache is not installed. Build the three-block command to install the Red Hat httpd package.",
    passMessage:
      "Step 1 done — yum installed httpd onto the machine. Now start the httpd service in Step 2.",
    blocks: [],
    bankOrder: [],
    slots: [],
    stages: [
      {
        target: "yum install httpd",
        intro:
          "Step 1 of 3: Look at systemctl status httpd below — the unit does not exist yet because Apache is not installed. Build the three-block command to install the Red Hat httpd package.",
        passMessage:
          "Step 1 done — yum installed httpd onto the machine. Now start the httpd service in Step 2.",
        beforeCommands: ["systemctl status httpd"],
        blocks: [
          {
            id: "yum",
            token: "yum",
            meaning: "the Red Hat package manager used to install software packages",
          },
          {
            id: "install",
            token: "install",
            meaning: "download and install a package onto the system",
          },
          {
            id: "httpd",
            token: "httpd",
            spokenToken: "H T T P D",
            meaning: "the Apache HTTP web server package on Red Hat systems",
          },
          {
            id: "apache2",
            token: "apache2",
            meaning: "the Debian/Ubuntu package name, which does not exist on Red Hat",
            wrongWhy:
              "apache2 is the Debian/Ubuntu name; on Red Hat family machines the Apache package is named httpd. Swap in httpd.",
          },
          {
            id: "systemctl",
            token: "systemctl",
            meaning: "manage services that are already installed",
            wrongWhy:
              "systemctl cannot start a service whose package is not installed yet. Swap in yum to install httpd first.",
          },
        ],
        bankOrder: ["httpd", "apache2", "install", "systemctl", "yum"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Package tool",
            expectedBlockId: "yum",
            emptySlotHint: "Slot 1 is empty — start with yum, the Red Hat package manager.",
            wrongOrderByBlockId: {
              install: "Order mix-up in slot 1: install is the action for yum. Put yum first in slot 1.",
              httpd: "Order mix-up in slot 1: httpd is the package name. Put yum first in slot 1.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Action",
            expectedBlockId: "install",
            emptySlotHint: "Slot 2 is empty — pick install to put the package onto the machine.",
            wrongOrderByBlockId: {
              yum: "Order mix-up in slot 2: yum goes in slot 1, and install goes in slot 2.",
              httpd: "Order mix-up in slot 2: put install in slot 2 before the package name httpd in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Package name",
            expectedBlockId: "httpd",
            emptySlotHint: "Slot 3 is empty — finish with httpd, the Red Hat Apache package.",
            wrongOrderByBlockId: {
              yum: "Order mix-up in slot 3: yum belongs in slot 1, and httpd goes last in slot 3.",
              install: "Order mix-up in slot 3: put install in slot 2 and httpd in slot 3.",
            },
          },
        ],
      },
      {
        target: "systemctl start httpd",
        intro:
          "Step 2 of 3: On Red Hat systems, installing a package does not start the daemon automatically. Build the three-block command to start httpd right now.",
        passMessage:
          "Step 2 done — httpd is now running and answering on port 80. Now enable it for boot in Step 3.",
        blocks: [
          {
            id: "systemctl",
            token: "systemctl",
            meaning: "the systemd service controller",
          },
          {
            id: "start",
            token: "start",
            meaning: "launch the service right now",
          },
          {
            id: "httpd",
            token: "httpd",
            spokenToken: "H T T P D",
            meaning: "the Apache web server service unit",
          },
          {
            id: "stop",
            token: "stop",
            meaning: "shut a running service down",
            wrongWhy:
              "You picked stop, which shuts a service down. Swap in start to bring httpd up.",
          },
          {
            id: "status",
            token: "status",
            meaning: "inspect a service without starting it",
            wrongWhy:
              "status only checks whether httpd is running without starting it. Swap in start.",
          },
        ],
        bankOrder: ["httpd", "stop", "start", "status", "systemctl"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Service tool",
            expectedBlockId: "systemctl",
            emptySlotHint: "Slot 1 is empty — start with systemctl.",
            wrongOrderByBlockId: {
              start: "Order mix-up in slot 1: start is the action for systemctl. Put systemctl first in slot 1.",
              httpd: "Order mix-up in slot 1: httpd is the unit name. Put systemctl first in slot 1.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Start action",
            expectedBlockId: "start",
            emptySlotHint: "Slot 2 is empty — pick start to launch httpd now.",
            wrongOrderByBlockId: {
              systemctl: "Order mix-up in slot 2: systemctl goes in slot 1, and start goes in slot 2.",
              httpd: "Order mix-up in slot 2: put start in slot 2 before httpd in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Service unit",
            expectedBlockId: "httpd",
            emptySlotHint: "Slot 3 is empty — finish with httpd.",
            wrongOrderByBlockId: {
              systemctl: "Order mix-up in slot 3: systemctl belongs in slot 1, and httpd goes last in slot 3.",
              start: "Order mix-up in slot 3: put start in slot 2 and httpd in slot 3.",
            },
          },
        ],
      },
      {
        target: "systemctl enable httpd",
        intro:
          "Step 3 of 3: Make sure Apache comes back on its own after a reboot. Build the three-block command to enable httpd at boot.",
        passMessage:
          "Apache is installed, active, and enabled for boot — systemctl status httpd and curl localhost confirm the web server is up and persistent.",
        afterCommands: ["systemctl status httpd", "curl localhost"],
        blocks: [
          {
            id: "systemctl",
            token: "systemctl",
            meaning: "the systemd service controller",
          },
          {
            id: "enable",
            token: "enable",
            meaning: "register the service to start automatically at every boot",
          },
          {
            id: "httpd",
            token: "httpd",
            spokenToken: "H T T P D",
            meaning: "the Apache web server service unit",
          },
          {
            id: "disable",
            token: "disable",
            meaning: "prevent the service from starting at boot",
            wrongWhy:
              "You picked disable, which stops httpd from starting at boot. Swap in enable.",
          },
          {
            id: "status",
            token: "status",
            meaning: "read service status without enabling it for boot",
            wrongWhy:
              "status only checks the service; swap in enable so httpd starts automatically after a reboot.",
          },
        ],
        bankOrder: ["httpd", "disable", "enable", "status", "systemctl"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Service tool",
            expectedBlockId: "systemctl",
            emptySlotHint: "Slot 1 is empty — start with systemctl.",
            wrongOrderByBlockId: {
              enable: "Order mix-up in slot 1: enable is the action word. Put systemctl first in slot 1.",
              httpd: "Order mix-up in slot 1: httpd is the unit name. Put systemctl first in slot 1.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Boot action",
            expectedBlockId: "enable",
            emptySlotHint: "Slot 2 is empty — pick enable so httpd starts automatically on boot.",
            wrongOrderByBlockId: {
              systemctl: "Order mix-up in slot 2: systemctl goes in slot 1, and enable goes in slot 2.",
              httpd: "Order mix-up in slot 2: put enable in slot 2 before httpd in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Service unit",
            expectedBlockId: "httpd",
            emptySlotHint: "Slot 3 is empty — finish with httpd.",
            wrongOrderByBlockId: {
              systemctl: "Order mix-up in slot 3: systemctl belongs in slot 1, and httpd goes last in slot 3.",
              enable: "Order mix-up in slot 3: put enable in slot 2 and httpd in slot 3.",
            },
          },
        ],
      },
    ],
  },

  "coach-deleted-open-file": {
    intro:
      "Look at df -h and lsof | grep deleted below: / is 100% full because httpd (PID 3120) is still holding a deleted 22 GB access_log open. Build the three-block command to restart httpd so it closes the deleted file handle and frees the disk.",
    passMessage:
      "Disk space restored — systemctl restart httpd made Apache close the deleted 22 GB log handle, and df -h shows / back down to 45% used.",
    beforeCommands: ["df -h", "lsof | grep deleted"],
    afterCommands: ["df -h"],
    blocks: [
      {
        id: "systemctl",
        token: "systemctl",
        meaning: "the systemd service controller",
      },
      {
        id: "restart",
        token: "restart",
        meaning: "stop and immediately start the service so open deleted file handles close",
      },
      {
        id: "httpd",
        token: "httpd",
        spokenToken: "H T T P D",
        meaning: "the Apache web server holding /var/log/httpd/access_log (deleted) open",
      },
      {
        id: "sshd",
        token: "sshd",
        spokenToken: "S S H D",
        meaning: "the SSH login daemon, which is not holding the deleted log file",
        wrongWhy:
          "sshd is not holding the deleted log open — lsof showed httpd (PID 3120) holding /var/log/httpd/access_log (deleted). Swap in httpd.",
      },
      {
        id: "status",
        token: "status",
        meaning: "check a service without restarting it",
        wrongWhy:
          "status only reads the service state without closing the open file descriptor. Swap in restart.",
      },
    ],
    bankOrder: ["httpd", "sshd", "restart", "status", "systemctl"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Service tool",
        expectedBlockId: "systemctl",
        emptySlotHint: "Slot 1 is empty — start with systemctl.",
        wrongOrderByBlockId: {
          restart: "Order mix-up in slot 1: restart is the action for systemctl. Put systemctl first in slot 1.",
          httpd: "Order mix-up in slot 1: httpd is the service unit. Put systemctl first in slot 1.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Restart action",
        expectedBlockId: "restart",
        emptySlotHint: "Slot 2 is empty — pick restart so the daemon closes the deleted log file handle and stays up.",
        wrongOrderByBlockId: {
          systemctl: "Order mix-up in slot 2: systemctl goes in slot 1, and restart goes in slot 2.",
          httpd: "Order mix-up in slot 2: put restart in slot 2 before the unit name httpd in slot 3.",
        },
      },
      {
        slotNumber: 3,
        label: "3. Holding service",
        expectedBlockId: "httpd",
        emptySlotHint: "Slot 3 is empty — finish with httpd, the service holding the deleted log open.",
        wrongOrderByBlockId: {
          systemctl: "Order mix-up in slot 3: systemctl belongs in slot 1, and httpd goes last in slot 3.",
          restart: "Order mix-up in slot 3: put restart in slot 2 and httpd in slot 3.",
        },
      },
    ],
  },
  "coach-deleted-user-files": {
    intro:
      "Notice find / -nouser above revealed every file under /srv/projects still owned by deleted numeric UID 1042. Pick the four blocks to hand ownership of /srv/projects and everything inside it to alice.",
    passMessage:
      "Ownership restored — chown -R alice /srv/projects handed the orphaned project files over to alice, and find / -nouser now comes back empty.",
    beforeCommands: ["find / -nouser", "ls -la /srv/projects"],
    afterCommands: ["find / -nouser", "ls -la /srv/projects"],
    blocks: [
      {
        id: "chown",
        token: "chown",
        meaning: "change the user owner of files or directories",
      },
      {
        id: "flag-r",
        token: "-R",
        spokenToken: "dash capital R",
        meaning: "apply the ownership change recursively to the directory and every file inside it",
      },
      {
        id: "alice",
        token: "alice",
        meaning: "the teammate taking ownership of the orphaned files",
      },
      {
        id: "srv-projects",
        token: "/srv/projects",
        meaning: "the folder containing the deleted user's files",
      },
      {
        id: "chmod",
        token: "chmod",
        meaning: "change permission bits instead of the owner",
        wrongWhy:
          "chmod changes read/write/execute bits, not who owns the file. Swap in chown to replace deleted UID 1042.",
      },
      {
        id: "root",
        token: "root",
        meaning: "the superuser account",
        wrongWhy: "The job asks to hand these project files to alice, not root. Swap in alice.",
      },
    ],
    bankOrder: ["srv-projects", "chmod", "alice", "flag-r", "root", "chown"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Ownership tool",
        expectedBlockId: "chown",
        emptySlotHint: "Slot 1 is empty — start with chown to change file ownership.",
        wrongOrderByBlockId: {
          "flag-r": "Order mix-up in slot 1: -R is a flag for chown. Put chown first in slot 1.",
          alice: "Order mix-up in slot 1: alice is the new owner. Put chown first in slot 1.",
          "srv-projects": "Order mix-up in slot 1: /srv/projects is the folder path and goes last in slot 4.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Recursive flag",
        expectedBlockId: "flag-r",
        emptySlotHint: "Slot 2 is empty — pick -R so every file inside /srv/projects gets updated too.",
        wrongOrderByBlockId: {
          chown: "Order mix-up in slot 2: chown belongs in slot 1, and -R goes in slot 2.",
          alice: "Order mix-up in slot 2: put -R in slot 2 before the new owner alice in slot 3.",
          "srv-projects": "Order mix-up in slot 2: /srv/projects goes last in slot 4. Put -R in slot 2.",
        },
      },
      {
        slotNumber: 3,
        label: "3. New owner",
        expectedBlockId: "alice",
        emptySlotHint: "Slot 3 is empty — pick alice as the new owner.",
        wrongOrderByBlockId: {
          chown: "Order mix-up in slot 3: chown belongs in slot 1, and alice goes in slot 3.",
          "flag-r": "Order mix-up in slot 3: -R belongs in slot 2, and alice goes in slot 3.",
          "srv-projects": "Order mix-up in slot 3: put the new owner alice in slot 3 before /srv/projects in slot 4.",
        },
      },
      {
        slotNumber: 4,
        label: "4. Target directory",
        expectedBlockId: "srv-projects",
        emptySlotHint: "Slot 4 is empty — finish with /srv/projects.",
        wrongOrderByBlockId: {
          chown: "Order mix-up in slot 4: chown goes first in slot 1, and /srv/projects goes last in slot 4.",
          "flag-r": "Order mix-up in slot 4: -R goes in slot 2, and /srv/projects goes in slot 4.",
          alice: "Order mix-up in slot 4: alice goes in slot 3, and /srv/projects goes in slot 4.",
        },
      },
    ],
  },
  "coach-service-journal": {
    stages: [
      {
        target: "chmod +x /usr/sbin/nginx",
        intro:
          "Step 1 of 2 — The journal output above shows nginx failed at step EXEC because /usr/sbin/nginx lost its execute permission. Pick the three blocks to restore the execute bit.",
        passMessage:
          "Step 1 done — /usr/sbin/nginx has execute permission again. Now step 2: restart nginx so the service comes back online.",
        beforeCommands: ["systemctl status nginx", "journalctl -u nginx", "ls -l /usr/sbin/nginx"],
        afterCommands: ["ls -l /usr/sbin/nginx"],
        blocks: [
          {
            id: "chmod",
            token: "chmod",
            meaning: "change file permission bits",
          },
          {
            id: "plus-x",
            token: "+x",
            spokenToken: "plus x",
            meaning: "grant execute permission so the binary can run",
          },
          {
            id: "nginx-bin",
            token: "/usr/sbin/nginx",
            meaning: "the web server binary that failed to execute",
          },
          {
            id: "minus-x",
            token: "-x",
            spokenToken: "minus x",
            meaning: "remove execute permission",
            wrongWhy: "-x removes the execute bit instead of adding it. Swap in +x.",
          },
          {
            id: "chown",
            token: "chown",
            meaning: "change file owner",
            wrongWhy: "The binary is already owned by root; it is missing its execute bit. Swap in chmod.",
          },
        ],
        bankOrder: ["nginx-bin", "minus-x", "plus-x", "chown", "chmod"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Permission tool",
            expectedBlockId: "chmod",
            emptySlotHint: "Slot 1 is empty — start with chmod.",
            wrongOrderByBlockId: {
              "plus-x": "Order mix-up in slot 1: +x is the permission change. Put chmod first in slot 1.",
              "nginx-bin": "Order mix-up in slot 1: /usr/sbin/nginx goes last in slot 3.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Add execute bit",
            expectedBlockId: "plus-x",
            emptySlotHint: "Slot 2 is empty — pick +x to restore execute permission.",
            wrongOrderByBlockId: {
              chmod: "Order mix-up in slot 2: chmod goes in slot 1, and +x goes in slot 2.",
              "nginx-bin": "Order mix-up in slot 2: put +x in slot 2 before /usr/sbin/nginx in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Service binary",
            expectedBlockId: "nginx-bin",
            emptySlotHint: "Slot 3 is empty — finish with /usr/sbin/nginx.",
            wrongOrderByBlockId: {
              chmod: "Order mix-up in slot 3: chmod belongs in slot 1, and /usr/sbin/nginx goes in slot 3.",
              "plus-x": "Order mix-up in slot 3: +x belongs in slot 2, and /usr/sbin/nginx goes in slot 3.",
            },
          },
        ],
      },
      {
        target: "systemctl restart nginx",
        intro: "Step 2 of 2 — Now restart the nginx service so systemd launches the fixed binary.",
        passMessage:
          "Service recovered — systemctl restart nginx launched /usr/sbin/nginx cleanly, and the journal logs a clean start.",
        afterCommands: ["systemctl status nginx", "journalctl -u nginx"],
        blocks: [
          {
            id: "systemctl",
            token: "systemctl",
            meaning: "control systemd services",
          },
          {
            id: "restart",
            token: "restart",
            meaning: "restart the service now",
          },
          {
            id: "nginx",
            token: "nginx",
            meaning: "the web server unit",
          },
          {
            id: "stop",
            token: "stop",
            meaning: "stop a running service",
            wrongWhy: "stop leaves nginx offline. Swap in restart to bring it up.",
          },
          {
            id: "sshd",
            token: "sshd",
            meaning: "the SSH daemon",
            wrongWhy: "sshd is already running; nginx is the service that failed. Swap in nginx.",
          },
        ],
        bankOrder: ["nginx", "stop", "restart", "sshd", "systemctl"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Service tool",
            expectedBlockId: "systemctl",
            emptySlotHint: "Slot 1 is empty — start with systemctl.",
            wrongOrderByBlockId: {
              restart: "Order mix-up in slot 1: restart goes in slot 2 after systemctl.",
              nginx: "Order mix-up in slot 1: nginx goes in slot 3.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Action word",
            expectedBlockId: "restart",
            emptySlotHint: "Slot 2 is empty — pick restart.",
            wrongOrderByBlockId: {
              systemctl: "Order mix-up in slot 2: systemctl goes in slot 1, and restart goes in slot 2.",
              nginx: "Order mix-up in slot 2: put restart in slot 2 before nginx in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Service name",
            expectedBlockId: "nginx",
            emptySlotHint: "Slot 3 is empty — finish with nginx.",
            wrongOrderByBlockId: {
              systemctl: "Order mix-up in slot 3: systemctl belongs in slot 1, and nginx goes in slot 3.",
              restart: "Order mix-up in slot 3: restart belongs in slot 2, and nginx goes in slot 3.",
            },
          },
        ],
      },
    ],
  },
  "coach-script-not-found": {
    stages: [
      {
        target: "chmod +x script.sh",
        intro:
          "Step 1 of 2 — Look at ls -l script.sh above: the script is mode rw-r--r-- with no execute bit. Pick the three blocks to make script.sh executable.",
        passMessage:
          "Step 1 done — script.sh now has execute permission. Now step 2: run it from the current folder using ./script.sh.",
        beforeCommands: ["ls -l script.sh", "echo $PATH"],
        afterCommands: ["ls -l script.sh"],
        blocks: [
          {
            id: "chmod",
            token: "chmod",
            meaning: "change file permissions",
          },
          {
            id: "plus-x",
            token: "+x",
            spokenToken: "plus x",
            meaning: "add execute permission so the file can run as a script",
          },
          {
            id: "script-sh",
            token: "script.sh",
            meaning: "the script in your home directory",
          },
          {
            id: "minus-x",
            token: "-x",
            spokenToken: "minus x",
            meaning: "remove execute permission",
            wrongWhy: "-x strips execute permission. Swap in +x.",
          },
          {
            id: "cat",
            token: "cat",
            meaning: "print file text without changing permissions",
            wrongWhy: "cat only reads the file text. Swap in chmod.",
          },
        ],
        bankOrder: ["script-sh", "minus-x", "plus-x", "cat", "chmod"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Permission tool",
            expectedBlockId: "chmod",
            emptySlotHint: "Slot 1 is empty — start with chmod.",
            wrongOrderByBlockId: {
              "plus-x": "Order mix-up in slot 1: +x goes in slot 2 after chmod.",
              "script-sh": "Order mix-up in slot 1: script.sh goes in slot 3.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Execute flag",
            expectedBlockId: "plus-x",
            emptySlotHint: "Slot 2 is empty — pick +x.",
            wrongOrderByBlockId: {
              chmod: "Order mix-up in slot 2: chmod goes in slot 1, and +x goes in slot 2.",
              "script-sh": "Order mix-up in slot 2: put +x in slot 2 before script.sh in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Script file",
            expectedBlockId: "script-sh",
            emptySlotHint: "Slot 3 is empty — finish with script.sh.",
            wrongOrderByBlockId: {
              chmod: "Order mix-up in slot 3: chmod belongs in slot 1, and script.sh goes in slot 3.",
              "plus-x": "Order mix-up in slot 3: +x belongs in slot 2, and script.sh goes in slot 3.",
            },
          },
        ],
      },
      {
        target: "./script.sh",
        intro:
          "Step 2 of 2 — Since the current directory (.) is not in $PATH, run the script explicitly from this folder.",
        passMessage:
          "Script executed — ./script.sh ran your local script and printed HEALTH_CHECK_OK.",
        blocks: [
          {
            id: "dot-slash-script",
            token: "./script.sh",
            spokenToken: "dot slash script dot s h",
            meaning: "run script.sh from the current working directory",
          },
          {
            id: "bare-script",
            token: "script.sh",
            meaning: "search $PATH for script.sh (fails because . is not in $PATH)",
            wrongWhy:
              "A bare command name only searches directories in $PATH. Prefix with ./ so the shell runs the file in your current folder.",
          },
          {
            id: "ls-script",
            token: "ls",
            meaning: "list files without running the script",
            wrongWhy: "ls only lists the file name instead of executing the script. Swap in ./script.sh.",
          },
        ],
        bankOrder: ["bare-script", "dot-slash-script", "ls-script"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Run local script",
            expectedBlockId: "dot-slash-script",
            emptySlotHint: "Slot 1 is empty — pick ./script.sh to run the script in your current directory.",
            wrongOrderByBlockId: {},
          },
        ],
      },
    ],
  },
  "coach-verify-checksum": {
    intro:
      "Look at /tmp/downloads above: agent.tar.gz arrived alongside agent.tar.gz.sha256. Pick the three blocks to verify the archive against its published SHA-256 checksum file.",
    passMessage:
      "Verified — sha256sum -c computed the real SHA-256 hash of agent.tar.gz, matched it against the published digest, and reported OK.",
    beforeCommands: ["ls -la /tmp/downloads", "cat /tmp/downloads/agent.tar.gz.sha256"],
    blocks: [
      {
        id: "sha256sum",
        token: "sha256sum",
        meaning: "compute or verify SHA-256 cryptographic file digests",
      },
      {
        id: "flag-c",
        token: "-c",
        spokenToken: "dash c",
        meaning: "read digests from the checksum file and verify each listed file",
      },
      {
        id: "checksum-file",
        token: "/tmp/downloads/agent.tar.gz.sha256",
        meaning: "the published SHA-256 checksum file to verify against",
      },
      {
        id: "cat",
        token: "cat",
        meaning: "print text without computing or verifying the hash",
        wrongWhy: "cat only prints the text of the checksum file without hashing agent.tar.gz. Swap in sha256sum.",
      },
      {
        id: "ls",
        token: "ls",
        meaning: "list files without checking integrity",
        wrongWhy: "ls only lists filenames. Swap in sha256sum.",
      },
    ],
    bankOrder: ["checksum-file", "cat", "flag-c", "ls", "sha256sum"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Checksum tool",
        expectedBlockId: "sha256sum",
        emptySlotHint: "Slot 1 is empty — start with sha256sum.",
        wrongOrderByBlockId: {
          "flag-c": "Order mix-up in slot 1: -c is the check flag for sha256sum. Put sha256sum first in slot 1.",
          "checksum-file": "Order mix-up in slot 1: the .sha256 file path goes last in slot 3.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Check flag",
        expectedBlockId: "flag-c",
        emptySlotHint: "Slot 2 is empty — pick -c so sha256sum verifies the digest listed in the file.",
        wrongOrderByBlockId: {
          sha256sum: "Order mix-up in slot 2: sha256sum belongs in slot 1, and -c goes in slot 2.",
          "checksum-file": "Order mix-up in slot 2: put -c in slot 2 before the checksum file path in slot 3.",
        },
      },
      {
        slotNumber: 3,
        label: "3. Checksum file",
        expectedBlockId: "checksum-file",
        emptySlotHint: "Slot 3 is empty — finish with /tmp/downloads/agent.tar.gz.sha256.",
        wrongOrderByBlockId: {
          sha256sum: "Order mix-up in slot 3: sha256sum goes in slot 1, and the checksum file path goes in slot 3.",
          "flag-c": "Order mix-up in slot 3: -c goes in slot 2, and the checksum file path goes in slot 3.",
        },
      },
    ],
  },

  "coach-too-many-open-files": {
    intro:
      "Look at the terminal below: ulimit -n sits at 1024 while lsof | wc -l shows app-worker already holding 1,024 file descriptors open. Build the command that raises the open-file limit to 4096.",
    passMessage:
      "Ceiling raised — ulimit -n 4096 lifted the open-file descriptor limit well above the active handles so the app can open files again.",
    beforeCommands: ["ulimit -n", "lsof | wc -l"],
    afterCommands: ["ulimit -n"],
    blocks: [
      {
        id: "ulimit",
        token: "ulimit",
        meaning: "inspect or set per-process resource limits",
      },
      {
        id: "flag-n",
        token: "-n",
        spokenToken: "dash n",
        meaning: "select the maximum number of open file descriptors",
      },
      {
        id: "4096",
        token: "4096",
        meaning: "the new open-file descriptor limit (4,096 files)",
      },
      {
        id: "flag-a",
        token: "-a",
        spokenToken: "dash a",
        meaning: "list all current limits without changing them",
        wrongWhy: "-a only prints current limits without raising the open-file ceiling. Swap in -n.",
      },
      {
        id: "lsof",
        token: "lsof",
        meaning: "list open files without changing the limit",
        wrongWhy: "lsof only lists open files. Swap in ulimit to raise the open-file limit.",
      },
    ],
    bankOrder: ["4096", "lsof", "flag-n", "flag-a", "ulimit"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Resource limit tool",
        expectedBlockId: "ulimit",
        emptySlotHint: "Slot 1 is empty — start with ulimit.",
        wrongOrderByBlockId: {
          "flag-n": "Order mix-up in slot 1: -n is the open-files flag for ulimit. Put ulimit in slot 1.",
          "4096": "Order mix-up in slot 1: 4096 is the new limit value and goes last in slot 3.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Open-files flag",
        expectedBlockId: "flag-n",
        emptySlotHint: "Slot 2 is empty — pick -n to target the open-file descriptor limit.",
        wrongOrderByBlockId: {
          ulimit: "Order mix-up in slot 2: ulimit goes in slot 1, and -n goes in slot 2.",
          "4096": "Order mix-up in slot 2: put -n in slot 2 before the number 4096 in slot 3.",
        },
      },
      {
        slotNumber: 3,
        label: "3. New limit",
        expectedBlockId: "4096",
        emptySlotHint: "Slot 3 is empty — finish with 4096 to raise the open-file ceiling.",
        wrongOrderByBlockId: {
          ulimit: "Order mix-up in slot 3: ulimit goes in slot 1, and 4096 goes in slot 3.",
          "flag-n": "Order mix-up in slot 3: -n goes in slot 2, and 4096 goes in slot 3.",
        },
      },
    ],
  },

  "coach-clock-wrong": {
    intro:
      "The system clock is four days slow and NTP sync is disabled, breaking TLS certificates. In two steps: (1) enable NTP time synchronization with timedatectl, then (2) command chronyc to step the clock immediately.",
    passMessage: "",
    blocks: [],
    bankOrder: [],
    slots: [],
    stages: [
      {
        target: "timedatectl set-ntp true",
        intro:
          "Step 1 of 2 — Look at the terminal below: timedatectl status shows the clock is 4 days behind and NTP service is inactive. Build the command that turns NTP synchronization on.",
        passMessage:
          "Step 1 done — timedatectl set-ntp true enabled network time synchronization. Now step 2: command chronyc to step the clock immediately.",
        beforeCommands: ["date", "timedatectl status"],
        afterCommands: ["timedatectl status"],
        blocks: [
          {
            id: "timedatectl",
            token: "timedatectl",
            meaning: "query and change the system clock and NTP synchronization settings",
          },
          {
            id: "set-ntp",
            token: "set-ntp",
            meaning: "subcommand that enables or disables network time synchronization",
          },
          {
            id: "true",
            token: "true",
            meaning: "turn NTP synchronization on",
          },
          {
            id: "status",
            token: "status",
            meaning: "show current time settings without changing them",
            wrongWhy: "status only reads the clock state without enabling NTP. Swap in set-ntp.",
          },
          {
            id: "false",
            token: "false",
            meaning: "turn NTP synchronization off",
            wrongWhy: "false keeps NTP disabled. Swap in true to enable network time sync.",
          },
        ],
        bankOrder: ["true", "status", "set-ntp", "false", "timedatectl"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Time control tool",
            expectedBlockId: "timedatectl",
            emptySlotHint: "Slot 1 is empty — start with timedatectl.",
            wrongOrderByBlockId: {
              "set-ntp": "Order mix-up in slot 1: set-ntp is a subcommand for timedatectl. Put timedatectl first in slot 1.",
              true: "Order mix-up in slot 1: true goes at the end in slot 3.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Subcommand",
            expectedBlockId: "set-ntp",
            emptySlotHint: "Slot 2 is empty — pick set-ntp to control network time sync.",
            wrongOrderByBlockId: {
              timedatectl: "Order mix-up in slot 2: timedatectl belongs in slot 1, and set-ntp goes in slot 2.",
              true: "Order mix-up in slot 2: put set-ntp in slot 2 before true in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Enable value",
            expectedBlockId: "true",
            emptySlotHint: "Slot 3 is empty — finish with true to turn NTP synchronization on.",
            wrongOrderByBlockId: {
              timedatectl: "Order mix-up in slot 3: timedatectl goes in slot 1, and true goes in slot 3.",
              "set-ntp": "Order mix-up in slot 3: set-ntp goes in slot 2, and true goes in slot 3.",
            },
          },
        ],
      },
      {
        target: "chronyc makestep",
        intro:
          "Step 2 of 2 — Now force chrony to step the system clock immediately instead of slewing gradually so certificates validate right now.",
        passMessage:
          "Clock synced — chronyc makestep stepped the system clock to true UTC time and NTP is synchronized.",
        beforeCommands: ["chronyc tracking"],
        afterCommands: ["chronyc tracking", "date"],
        blocks: [
          {
            id: "chronyc",
            token: "chronyc",
            meaning: "command-line client for the chronyd NTP daemon",
          },
          {
            id: "makestep",
            token: "makestep",
            meaning: "immediately step the system clock to correct any large offset",
          },
          {
            id: "tracking",
            token: "tracking",
            meaning: "display clock offset parameters without stepping the clock",
            wrongWhy: "tracking only displays current drift statistics. Swap in makestep to step the clock now.",
          },
          {
            id: "date",
            token: "date",
            meaning: "print the current date and time",
            wrongWhy: "date only prints the clock. Swap in chronyc to command the NTP daemon.",
          },
        ],
        bankOrder: ["makestep", "tracking", "chronyc", "date"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Chrony client",
            expectedBlockId: "chronyc",
            emptySlotHint: "Slot 1 is empty — start with chronyc.",
            wrongOrderByBlockId: {
              makestep: "Order mix-up in slot 1: makestep is the subcommand for chronyc. Put chronyc first in slot 1.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Step action",
            expectedBlockId: "makestep",
            emptySlotHint: "Slot 2 is empty — finish with makestep so chrony steps the clock immediately.",
            wrongOrderByBlockId: {
              chronyc: "Order mix-up in slot 2: chronyc goes in slot 1, and makestep goes in slot 2.",
            },
          },
        ],
      },
    ],
  },

  "coach-zombie-processes": {
    intro:
      "Look at the terminal below: three worker-task processes are stuck in Z (<defunct>) state under parent PID 3410 (worker-mgr). Build the command that restarts worker-mgr so all defunct zombie children are reaped.",
    passMessage:
      "Zombies reaped — restarting worker-mgr cleared all three defunct child entries from the process table.",
    beforeCommands: ["ps -ef"],
    afterCommands: ["ps -ef"],
    blocks: [
      {
        id: "systemctl",
        token: "systemctl",
        meaning: "control systemd services",
      },
      {
        id: "restart",
        token: "restart",
        meaning: "stop and start the parent service so its defunct children are reaped",
      },
      {
        id: "worker-mgr",
        token: "worker-mgr",
        meaning: "the parent daemon that spawned and failed to reap the zombie tasks",
      },
      {
        id: "status",
        token: "status",
        meaning: "inspect service state without restarting it",
        wrongWhy: "status only reads the service status without reaping the zombie children. Swap in restart.",
      },
      {
        id: "ps",
        token: "ps",
        meaning: "list processes without restarting the parent",
        wrongWhy: "ps only lists processes. Swap in systemctl to restart the parent service.",
      },
    ],
    bankOrder: ["worker-mgr", "status", "restart", "ps", "systemctl"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Service tool",
        expectedBlockId: "systemctl",
        emptySlotHint: "Slot 1 is empty — start with systemctl.",
        wrongOrderByBlockId: {
          restart: "Order mix-up in slot 1: restart is the action for systemctl. Put systemctl in slot 1.",
          "worker-mgr": "Order mix-up in slot 1: worker-mgr is the service name and goes last in slot 3.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Action",
        expectedBlockId: "restart",
        emptySlotHint: "Slot 2 is empty — pick restart so the parent daemon reaps its defunct children.",
        wrongOrderByBlockId: {
          systemctl: "Order mix-up in slot 2: systemctl goes in slot 1, and restart goes in slot 2.",
          "worker-mgr": "Order mix-up in slot 2: put restart in slot 2 before worker-mgr in slot 3.",
        },
      },
      {
        slotNumber: 3,
        label: "3. Parent service",
        expectedBlockId: "worker-mgr",
        emptySlotHint: "Slot 3 is empty — finish with worker-mgr.",
        wrongOrderByBlockId: {
          systemctl: "Order mix-up in slot 3: systemctl goes in slot 1, and worker-mgr goes in slot 3.",
          restart: "Order mix-up in slot 3: restart goes in slot 2, and worker-mgr goes in slot 3.",
        },
      },
    ],
  },

  "coach-who-logged-in": {
    intro:
      "Look at the terminal below: ~/lastlog has 25 login lines with repeated usernames. Build the pipeline that pulls the first column with awk, sorts A to Z, removes repeats with uniq, and saves the list to users.txt.",
    passMessage:
      "Clean user list saved — awk extracted column 1, sort ordered the names A to Z, uniq dropped repeats, and > saved users.txt.",
    beforeCommands: ["head -n 6 lastlog"],
    afterCommands: ["cat users.txt"],
    blocks: [
      {
        id: "awk",
        token: "awk",
        meaning: "scan lines and extract specific columns",
      },
      {
        id: "print-col1",
        token: "'{ print $1 }'",
        spokenToken: "print column one",
        meaning: "awk rule that prints the first column (username) of each line",
      },
      {
        id: "lastlog",
        token: "lastlog",
        meaning: "the input login log file in your home folder",
      },
      {
        id: "pipe1",
        token: "|",
        spokenToken: "pipe",
        meaning: "send the output of awk into sort",
      },
      {
        id: "sort",
        token: "sort",
        meaning: "order lines alphabetically from A to Z",
      },
      {
        id: "pipe2",
        token: "|",
        spokenToken: "pipe",
        meaning: "send the sorted lines into uniq",
      },
      {
        id: "uniq",
        token: "uniq",
        spokenToken: "unique",
        meaning: "drop adjacent duplicate lines so each name appears once",
      },
      {
        id: "redirect",
        token: ">",
        spokenToken: "redirect to",
        meaning: "save the pipeline output into a file",
      },
      {
        id: "users-txt",
        token: "users.txt",
        meaning: "the output file for the clean username list",
      },
      {
        id: "wc",
        token: "wc",
        meaning: "count lines instead of removing duplicates",
        wrongWhy: "wc counts lines instead of keeping the sorted unique usernames. Swap in uniq.",
      },
    ],
    bankOrder: ["users-txt", "sort", "print-col1", "pipe1", "uniq", "lastlog", "redirect", "awk", "pipe2", "wc"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Column tool",
        expectedBlockId: "awk",
        emptySlotHint: "Slot 1 is empty — start with awk.",
        wrongOrderByBlockId: {
          "print-col1": "Order mix-up in slot 1: '{ print $1 }' is the program for awk. Put awk first in slot 1.",
          lastlog: "Order mix-up in slot 1: lastlog is the input file for awk in slot 3.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Column rule",
        expectedBlockId: "print-col1",
        emptySlotHint: "Slot 2 is empty — pick '{ print $1 }' to pull column 1.",
        wrongOrderByBlockId: {
          awk: "Order mix-up in slot 2: awk goes in slot 1, and '{ print $1 }' goes in slot 2.",
          lastlog: "Order mix-up in slot 2: put '{ print $1 }' in slot 2 before lastlog in slot 3.",
        },
      },
      {
        slotNumber: 3,
        label: "3. Log file",
        expectedBlockId: "lastlog",
        emptySlotHint: "Slot 3 is empty — pick lastlog.",
        wrongOrderByBlockId: {
          awk: "Order mix-up in slot 3: awk goes in slot 1, and lastlog goes in slot 3.",
          "print-col1": "Order mix-up in slot 3: '{ print $1 }' goes in slot 2, and lastlog goes in slot 3.",
        },
      },
      {
        slotNumber: 4,
        label: "4. First pipe",
        expectedBlockId: "pipe1",
        emptySlotHint: "Slot 4 is empty — add | to pipe the names into sort.",
        wrongOrderByBlockId: {
          sort: "Order mix-up in slot 4: put | in slot 4 before sort in slot 5.",
        },
      },
      {
        slotNumber: 5,
        label: "5. Sort A-Z",
        expectedBlockId: "sort",
        emptySlotHint: "Slot 5 is empty — pick sort so duplicate names sit next to each other.",
        wrongOrderByBlockId: {
          uniq: "Order mix-up in slot 5: sort must run in slot 5 before uniq in slot 7 because uniq only removes adjacent duplicates.",
        },
      },
      {
        slotNumber: 6,
        label: "6. Second pipe",
        expectedBlockId: "pipe2",
        emptySlotHint: "Slot 6 is empty — add | to pipe sorted names into uniq.",
        wrongOrderByBlockId: {
          uniq: "Order mix-up in slot 6: put | in slot 6 before uniq in slot 7.",
        },
      },
      {
        slotNumber: 7,
        label: "7. Drop repeats",
        expectedBlockId: "uniq",
        emptySlotHint: "Slot 7 is empty — pick uniq to remove duplicate usernames.",
        wrongOrderByBlockId: {
          sort: "Order mix-up in slot 7: sort goes in slot 5, and uniq goes in slot 7.",
        },
      },
      {
        slotNumber: 8,
        label: "8. Redirect",
        expectedBlockId: "redirect",
        emptySlotHint: "Slot 8 is empty — pick > to write the result to a file.",
        wrongOrderByBlockId: {
          "users-txt": "Order mix-up in slot 8: put > in slot 8 before users.txt in slot 9.",
        },
      },
      {
        slotNumber: 9,
        label: "9. Output file",
        expectedBlockId: "users-txt",
        emptySlotHint: "Slot 9 is empty — finish with users.txt.",
        wrongOrderByBlockId: {
          redirect: "Order mix-up in slot 9: > goes in slot 8, and users.txt goes last in slot 9.",
        },
      },
    ],
  },

  "coach-squeeze-old-logs": {
    intro:
      "The numbered logs app.log.1 through app.log.6 in ~/logs/ need to be compressed by an executable script ~/script.sh while app.log stays untouched. Do it in three steps: (1) write script.sh, (2) chmod +x script.sh, (3) run ./script.sh.",
    passMessage: "",
    blocks: [],
    bankOrder: [],
    slots: [],
    stages: [
      {
        target: 'printf "#!/bin/bash\\nfor f in ~/logs/app.log.[1-6]; do gzip $f; done\\n" > script.sh',
        intro:
          "Step 1 of 3 — Look at the terminal below: ~/logs/ has app.log and app.log.1 through app.log.6. Build the command that writes ~/script.sh with #!/bin/bash and a loop that runs gzip on ~/logs/app.log.[1-6].",
        passMessage:
          "Step 1 done — script.sh is written with #!/bin/bash and the gzip loop. Now step 2: make script.sh executable.",
        beforeCommands: ["ls -1 ~/logs"],
        afterCommands: ["cat script.sh"],
        blocks: [
          {
            id: "printf",
            token: "printf",
            meaning: "format and print text with newline escapes",
          },
          {
            id: "script-body",
            token: '"#!/bin/bash\\nfor f in ~/logs/app.log.[1-6]; do gzip $f; done\\n"',
            spokenToken: "shebang and for loop gzipping numbered logs",
            meaning: "the bash script that loops over app.log.1 through app.log.6 and compresses each with gzip",
          },
          {
            id: "redirect",
            token: ">",
            spokenToken: "redirect to",
            meaning: "write the output into script.sh",
          },
          {
            id: "script-sh",
            token: "script.sh",
            meaning: "the script file to create in your home folder",
          },
          {
            id: "cat",
            token: "cat",
            meaning: "read a file instead of printing formatted lines",
            wrongWhy: "cat reads files. Swap in printf to write the two-line bash script.",
          },
        ],
        bankOrder: ["script-sh", "redirect", "script-body", "cat", "printf"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Text writer",
            expectedBlockId: "printf",
            emptySlotHint: "Slot 1 is empty — start with printf.",
            wrongOrderByBlockId: {
              "script-body": "Order mix-up in slot 1: the script text goes in slot 2 after printf.",
              redirect: "Order mix-up in slot 1: > goes in slot 3 before script.sh.",
              "script-sh": "Order mix-up in slot 1: script.sh goes last in slot 4.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Script contents",
            expectedBlockId: "script-body",
            emptySlotHint: "Slot 2 is empty — pick the #!/bin/bash loop string.",
            wrongOrderByBlockId: {
              printf: "Order mix-up in slot 2: printf goes in slot 1, and the script text goes in slot 2.",
              redirect: "Order mix-up in slot 2: put the script text in slot 2 before > in slot 3.",
              "script-sh": "Order mix-up in slot 2: script.sh goes last in slot 4.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Redirect",
            expectedBlockId: "redirect",
            emptySlotHint: "Slot 3 is empty — pick > to write the text into script.sh.",
            wrongOrderByBlockId: {
              printf: "Order mix-up in slot 3: printf goes in slot 1, and > goes in slot 3.",
              "script-body": "Order mix-up in slot 3: the script text goes in slot 2, and > goes in slot 3.",
              "script-sh": "Order mix-up in slot 3: put > in slot 3 before script.sh in slot 4.",
            },
          },
          {
            slotNumber: 4,
            label: "4. Target script",
            expectedBlockId: "script-sh",
            emptySlotHint: "Slot 4 is empty — finish with script.sh.",
            wrongOrderByBlockId: {
              printf: "Order mix-up in slot 4: printf goes in slot 1, and script.sh goes in slot 4.",
              "script-body": "Order mix-up in slot 4: the script text goes in slot 2, and script.sh goes in slot 4.",
              redirect: "Order mix-up in slot 4: > goes in slot 3, and script.sh goes in slot 4.",
            },
          },
        ],
      },
      {
        target: "chmod +x script.sh",
        intro:
          "Step 2 of 3 — Now add execute permission to script.sh so the kernel allows it to run.",
        passMessage:
          "Step 2 done — script.sh is now executable. Now step 3: run ./script.sh.",
        beforeCommands: ["ls -l script.sh"],
        afterCommands: ["ls -l script.sh"],
        blocks: [
          {
            id: "chmod",
            token: "chmod",
            spokenToken: "change mode",
            meaning: "change file permissions",
          },
          {
            id: "plus-x",
            token: "+x",
            spokenToken: "plus x",
            meaning: "add execute permission",
          },
          {
            id: "script-sh",
            token: "script.sh",
            meaning: "the log-compression script in your home folder",
          },
          {
            id: "minus-x",
            token: "-x",
            spokenToken: "minus x",
            meaning: "remove execute permission",
            wrongWhy: "-x removes execute permission. Swap in +x.",
          },
        ],
        bankOrder: ["script-sh", "plus-x", "minus-x", "chmod"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Permission tool",
            expectedBlockId: "chmod",
            emptySlotHint: "Slot 1 is empty — start with chmod.",
            wrongOrderByBlockId: {
              "plus-x": "Order mix-up in slot 1: +x goes in slot 2 after chmod.",
              "script-sh": "Order mix-up in slot 1: script.sh goes last in slot 3.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Execute bit",
            expectedBlockId: "plus-x",
            emptySlotHint: "Slot 2 is empty — pick +x.",
            wrongOrderByBlockId: {
              chmod: "Order mix-up in slot 2: chmod goes in slot 1, and +x goes in slot 2.",
              "script-sh": "Order mix-up in slot 2: put +x in slot 2 before script.sh in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Script file",
            expectedBlockId: "script-sh",
            emptySlotHint: "Slot 3 is empty — finish with script.sh.",
            wrongOrderByBlockId: {
              chmod: "Order mix-up in slot 3: chmod goes in slot 1, and script.sh goes in slot 3.",
              "plus-x": "Order mix-up in slot 3: +x goes in slot 2, and script.sh goes in slot 3.",
            },
          },
        ],
      },
      {
        target: "./script.sh",
        intro:
          "Step 3 of 3 — Run ./script.sh so it compresses app.log.1 through app.log.6 into .gz files and leaves app.log untouched.",
        passMessage:
          "Logs squeezed — ./script.sh compressed app.log.1 through app.log.6 into valid .gz files and left app.log untouched.",
        beforeCommands: ["ls -1 ~/logs"],
        afterCommands: ["ls -1 ~/logs"],
        blocks: [
          {
            id: "run-script",
            token: "./script.sh",
            spokenToken: "dot slash script dot s h",
            meaning: "execute script.sh from the current directory",
          },
          {
            id: "bare-script",
            token: "script.sh",
            meaning: "bare filename without ./ (fails because . is not in $PATH)",
            wrongWhy: "Typing script.sh without ./ fails because the current directory is not in $PATH. Swap in ./script.sh.",
          },
          {
            id: "cat-script",
            token: "cat",
            meaning: "print file text without running it",
            wrongWhy: "cat only prints the script text without executing it. Swap in ./script.sh.",
          },
        ],
        bankOrder: ["bare-script", "run-script", "cat-script"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Run the script",
            expectedBlockId: "run-script",
            emptySlotHint: "Slot 1 is empty — pick ./script.sh to execute your log-compression script.",
            wrongOrderByBlockId: {},
          },
        ],
      },
    ],
  },

  "coach-new-user-login": {
    intro:
      "Teammate alex starts Monday. Set up their account in three steps: (1) create alex with a /home/alex folder, (2) set alex's password, and (3) add alex to the developers group.",
    passMessage: "",
    blocks: [],
    bankOrder: [],
    slots: [],
    stages: [
      {
        target: "useradd -m alex",
        intro:
          "Step 1 of 3 — Build the command that creates the user account alex and automatically creates their home directory /home/alex.",
        passMessage:
          "Step 1 done — useradd -m alex created the account and /home/alex. Now step 2: set a login password for alex.",
        beforeCommands: ["id alex"],
        afterCommands: ["ls -ld /home/alex"],
        blocks: [
          {
            id: "useradd",
            token: "useradd",
            meaning: "create a new user account",
          },
          {
            id: "flag-m",
            token: "-m",
            spokenToken: "dash m",
            meaning: "create the user's home directory at /home/alex",
          },
          {
            id: "alex",
            token: "alex",
            meaning: "the new teammate's username",
          },
          {
            id: "usermod",
            token: "usermod",
            meaning: "modify an existing user account",
            wrongWhy: "usermod only modifies an account that already exists. Swap in useradd to create alex first.",
          },
        ],
        bankOrder: ["alex", "flag-m", "usermod", "useradd"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Create-user tool",
            expectedBlockId: "useradd",
            emptySlotHint: "Slot 1 is empty — start with useradd.",
            wrongOrderByBlockId: {
              "flag-m": "Order mix-up in slot 1: -m is a flag for useradd. Put useradd in slot 1.",
              alex: "Order mix-up in slot 1: alex is the username and goes last in slot 3.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Home folder flag",
            expectedBlockId: "flag-m",
            emptySlotHint: "Slot 2 is empty — pick -m so /home/alex is created.",
            wrongOrderByBlockId: {
              useradd: "Order mix-up in slot 2: useradd goes in slot 1, and -m goes in slot 2.",
              alex: "Order mix-up in slot 2: put -m in slot 2 before alex in slot 3.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Username",
            expectedBlockId: "alex",
            emptySlotHint: "Slot 3 is empty — finish with alex.",
            wrongOrderByBlockId: {
              useradd: "Order mix-up in slot 3: useradd goes in slot 1, and alex goes in slot 3.",
              "flag-m": "Order mix-up in slot 3: -m goes in slot 2, and alex goes in slot 3.",
            },
          },
        ],
      },
      {
        target: "passwd alex",
        intro:
          "Step 2 of 3 — Now set a password on the alex account so alex can log in.",
        passMessage:
          "Step 2 done — passwd alex set the login password. Now step 3: add alex to the developers group.",
        beforeCommands: ["passwd -S alex"],
        afterCommands: ["passwd -S alex"],
        blocks: [
          {
            id: "passwd",
            token: "passwd",
            spokenToken: "password",
            meaning: "set or update a user's login password",
          },
          {
            id: "alex",
            token: "alex",
            meaning: "the account whose password you are setting",
          },
          {
            id: "id",
            token: "id",
            meaning: "show user and group IDs without setting a password",
            wrongWhy: "id only prints UID and GID info. Swap in passwd to set alex's password.",
          },
        ],
        bankOrder: ["alex", "id", "passwd"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Password tool",
            expectedBlockId: "passwd",
            emptySlotHint: "Slot 1 is empty — start with passwd.",
            wrongOrderByBlockId: {
              alex: "Order mix-up in slot 1: put passwd first in slot 1 and alex in slot 2.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Username",
            expectedBlockId: "alex",
            emptySlotHint: "Slot 2 is empty — finish with alex.",
            wrongOrderByBlockId: {
              passwd: "Order mix-up in slot 2: passwd goes in slot 1, and alex goes in slot 2.",
            },
          },
        ],
      },
      {
        target: "usermod -aG developers alex",
        intro:
          "Step 3 of 3 — Finally, append the developers group to alex's supplementary groups.",
        passMessage:
          "Account ready — alex has /home/alex, an active password, and membership in the developers group.",
        beforeCommands: ["id alex"],
        afterCommands: ["id alex", "tail -n 2 /etc/passwd"],
        blocks: [
          {
            id: "usermod",
            token: "usermod",
            meaning: "modify an existing user account",
          },
          {
            id: "flag-ag",
            token: "-aG",
            spokenToken: "dash a capital G",
            meaning: "append to supplementary groups without dropping existing groups",
          },
          {
            id: "developers",
            token: "developers",
            meaning: "the engineering team group to add alex to",
          },
          {
            id: "alex",
            token: "alex",
            meaning: "the username being added to the group",
          },
          {
            id: "useradd",
            token: "useradd",
            meaning: "create a brand-new user",
            wrongWhy: "alex already exists now. Swap in usermod to update alex's group membership.",
          },
        ],
        bankOrder: ["alex", "developers", "flag-ag", "useradd", "usermod"],
        slots: [
          {
            slotNumber: 1,
            label: "1. Modify-user tool",
            expectedBlockId: "usermod",
            emptySlotHint: "Slot 1 is empty — start with usermod.",
            wrongOrderByBlockId: {
              "flag-ag": "Order mix-up in slot 1: -aG goes in slot 2 after usermod.",
              developers: "Order mix-up in slot 1: developers goes in slot 3 after -aG.",
              alex: "Order mix-up in slot 1: alex goes last in slot 4.",
            },
          },
          {
            slotNumber: 2,
            label: "2. Append-group flag",
            expectedBlockId: "flag-ag",
            emptySlotHint: "Slot 2 is empty — pick -aG.",
            wrongOrderByBlockId: {
              usermod: "Order mix-up in slot 2: usermod goes in slot 1, and -aG goes in slot 2.",
              developers: "Order mix-up in slot 2: put -aG in slot 2 before the group name developers in slot 3.",
              alex: "Order mix-up in slot 2: alex goes last in slot 4.",
            },
          },
          {
            slotNumber: 3,
            label: "3. Group name",
            expectedBlockId: "developers",
            emptySlotHint: "Slot 3 is empty — pick developers right after -aG.",
            wrongOrderByBlockId: {
              usermod: "Order mix-up in slot 3: usermod goes in slot 1, and developers goes in slot 3.",
              "flag-ag": "Order mix-up in slot 3: -aG goes in slot 2, and developers goes in slot 3.",
              alex: "Order mix-up in slot 3: -aG expects the group name developers in slot 3 and the username alex last in slot 4.",
            },
          },
          {
            slotNumber: 4,
            label: "4. Username",
            expectedBlockId: "alex",
            emptySlotHint: "Slot 4 is empty — finish with alex.",
            wrongOrderByBlockId: {
              usermod: "Order mix-up in slot 4: usermod goes in slot 1, and alex goes in slot 4.",
              "flag-ag": "Order mix-up in slot 4: -aG goes in slot 2, and alex goes in slot 4.",
              developers: "Order mix-up in slot 4: developers goes in slot 3 right after -aG, and alex goes last in slot 4.",
            },
          },
        ],
      },
    ],
  },

  "coach-dns-broken": {
    intro:
      "Look at the terminal below: ping -c1 8.8.8.8 works, but dig example.com times out because /etc/resolv.conf has no active nameserver. Build the command that writes nameserver 8.8.8.8 into /etc/resolv.conf.",
    passMessage:
      "DNS restored — writing nameserver 8.8.8.8 to /etc/resolv.conf brought name resolution back online.",
    beforeCommands: ["ping -c 1 8.8.8.8", "dig example.com", "cat /etc/resolv.conf"],
    afterCommands: ["cat /etc/resolv.conf", "dig example.com"],
    blocks: [
      {
        id: "echo",
        token: "echo",
        meaning: "print a line of text",
      },
      {
        id: "ns-line",
        token: '"nameserver 8.8.8.8"',
        spokenToken: "nameserver 8 dot 8 dot 8 dot 8",
        meaning: "resolver configuration line pointing DNS lookups to 8.8.8.8",
      },
      {
        id: "redirect",
        token: ">",
        spokenToken: "redirect to",
        meaning: "write the line into /etc/resolv.conf",
      },
      {
        id: "resolv-conf",
        token: "/etc/resolv.conf",
        meaning: "the system DNS resolver configuration file",
      },
      {
        id: "cat",
        token: "cat",
        meaning: "read a file without writing a nameserver line",
        wrongWhy: "cat reads files instead of printing the nameserver line. Swap in echo.",
      },
    ],
    bankOrder: ["resolv-conf", "redirect", "ns-line", "cat", "echo"],
    slots: [
      {
        slotNumber: 1,
        label: "1. Print tool",
        expectedBlockId: "echo",
        emptySlotHint: "Slot 1 is empty — start with echo.",
        wrongOrderByBlockId: {
          "ns-line": "Order mix-up in slot 1: the nameserver line goes in slot 2 after echo.",
          redirect: "Order mix-up in slot 1: > goes in slot 3.",
          "resolv-conf": "Order mix-up in slot 1: /etc/resolv.conf goes last in slot 4.",
        },
      },
      {
        slotNumber: 2,
        label: "2. Nameserver entry",
        expectedBlockId: "ns-line",
        emptySlotHint: 'Slot 2 is empty — pick "nameserver 8.8.8.8".',
        wrongOrderByBlockId: {
          echo: 'Order mix-up in slot 2: echo goes in slot 1, and "nameserver 8.8.8.8" goes in slot 2.',
          redirect: 'Order mix-up in slot 2: put "nameserver 8.8.8.8" in slot 2 before > in slot 3.',
          "resolv-conf": "Order mix-up in slot 2: /etc/resolv.conf goes last in slot 4.",
        },
      },
      {
        slotNumber: 3,
        label: "3. Redirect",
        expectedBlockId: "redirect",
        emptySlotHint: "Slot 3 is empty — pick > to write into /etc/resolv.conf.",
        wrongOrderByBlockId: {
          echo: "Order mix-up in slot 3: echo goes in slot 1, and > goes in slot 3.",
          "ns-line": 'Order mix-up in slot 3: "nameserver 8.8.8.8" goes in slot 2, and > goes in slot 3.',
          "resolv-conf": "Order mix-up in slot 3: put > in slot 3 before /etc/resolv.conf in slot 4.",
        },
      },
      {
        slotNumber: 4,
        label: "4. Resolver file",
        expectedBlockId: "resolv-conf",
        emptySlotHint: "Slot 4 is empty — finish with /etc/resolv.conf.",
        wrongOrderByBlockId: {
          echo: "Order mix-up in slot 4: echo goes in slot 1, and /etc/resolv.conf goes in slot 4.",
          "ns-line": 'Order mix-up in slot 4: "nameserver 8.8.8.8" goes in slot 2, and /etc/resolv.conf goes in slot 4.',
          redirect: "Order mix-up in slot 4: > goes in slot 3, and /etc/resolv.conf goes in slot 4.",
        },
      },
    ],
  },

  "coach-new-drive": {
    intro:
      "Prepare the new disk /dev/sdc in three steps: (1) create a GPT label on /dev/sdc, (2) carve out a 10 GB primary partition /dev/sdc1, and (3) format /dev/sdc1 with ext4.",
    passMessage: "",
    blocks: [],
    bankOrder: [],
    slots: [],
    stages: [
      {
        target: "parted -s /dev/sdc mklabel gpt",
        intro: "Step 1 of 3 — Write a GPT partition table label onto /dev/sdc.",
        passMessage: "Step 1 done — /dev/sdc now has a GPT label. Now step 2: create the 10 GB partition.",
        beforeCommands: ["lsblk"],
        afterCommands: ["parted /dev/sdc print"],
        blocks: [
          { id: "parted", token: "parted", meaning: "partition editor tool" },
          { id: "flag-s", token: "-s", spokenToken: "dash s", meaning: "script mode (never prompt)" },
          { id: "sdc", token: "/dev/sdc", meaning: "the whole new raw disk" },
          { id: "mklabel", token: "mklabel", meaning: "create a new disk label (partition table)" },
          { id: "gpt", token: "gpt", meaning: "GUID Partition Table format" },
        ],
        bankOrder: ["gpt", "sdc", "mklabel", "flag-s", "parted"],
        slots: [
          { slotNumber: 1, label: "1. Partition tool", expectedBlockId: "parted", emptySlotHint: "Start with parted.", wrongOrderByBlockId: {} },
          { slotNumber: 2, label: "2. Script flag", expectedBlockId: "flag-s", emptySlotHint: "Pick -s.", wrongOrderByBlockId: {} },
          { slotNumber: 3, label: "3. Disk device", expectedBlockId: "sdc", emptySlotHint: "Pick /dev/sdc.", wrongOrderByBlockId: {} },
          { slotNumber: 4, label: "4. Label command", expectedBlockId: "mklabel", emptySlotHint: "Pick mklabel.", wrongOrderByBlockId: {} },
          { slotNumber: 5, label: "5. Table type", expectedBlockId: "gpt", emptySlotHint: "Finish with gpt.", wrongOrderByBlockId: {} },
        ],
      },
      {
        target: "parted -s /dev/sdc mkpart primary ext4 1 10G",
        intro: "Step 2 of 3 — Carve out a 10 GB primary partition on /dev/sdc.",
        passMessage: "Step 2 done — /dev/sdc1 exists. Now step 3: format /dev/sdc1 as ext4.",
        beforeCommands: ["parted /dev/sdc print"],
        afterCommands: ["lsblk"],
        blocks: [
          { id: "parted", token: "parted", meaning: "partition editor tool" },
          { id: "flag-s", token: "-s", spokenToken: "dash s", meaning: "script mode" },
          { id: "sdc", token: "/dev/sdc", meaning: "the disk to partition" },
          { id: "mkpart", token: "mkpart", meaning: "create a partition" },
          { id: "primary", token: "primary", meaning: "partition name/type" },
          { id: "ext4", token: "ext4", meaning: "intended filesystem type" },
          { id: "start", token: "1", meaning: "start at 1 MB" },
          { id: "end", token: "10G", meaning: "end at 10 GB" },
        ],
        bankOrder: ["end", "start", "ext4", "primary", "mkpart", "sdc", "flag-s", "parted"],
        slots: [
          { slotNumber: 1, label: "1. Tool", expectedBlockId: "parted", emptySlotHint: "Pick parted.", wrongOrderByBlockId: {} },
          { slotNumber: 2, label: "2. Flag", expectedBlockId: "flag-s", emptySlotHint: "Pick -s.", wrongOrderByBlockId: {} },
          { slotNumber: 3, label: "3. Disk", expectedBlockId: "sdc", emptySlotHint: "Pick /dev/sdc.", wrongOrderByBlockId: {} },
          { slotNumber: 4, label: "4. Action", expectedBlockId: "mkpart", emptySlotHint: "Pick mkpart.", wrongOrderByBlockId: {} },
          { slotNumber: 5, label: "5. Type", expectedBlockId: "primary", emptySlotHint: "Pick primary.", wrongOrderByBlockId: {} },
          { slotNumber: 6, label: "6. FS tag", expectedBlockId: "ext4", emptySlotHint: "Pick ext4.", wrongOrderByBlockId: {} },
          { slotNumber: 7, label: "7. Start", expectedBlockId: "start", emptySlotHint: "Pick 1.", wrongOrderByBlockId: {} },
          { slotNumber: 8, label: "8. End", expectedBlockId: "end", emptySlotHint: "Pick 10G.", wrongOrderByBlockId: {} },
        ],
      },
      {
        target: "mkfs.ext4 /dev/sdc1",
        intro: "Step 3 of 3 — Format partition /dev/sdc1 with an ext4 filesystem.",
        passMessage: "Drive ready — /dev/sdc1 is formatted ext4 and verified with blkid.",
        beforeCommands: ["lsblk"],
        afterCommands: ["blkid /dev/sdc1"],
        blocks: [
          { id: "mkfs-ext4", token: "mkfs.ext4", meaning: "build an ext4 filesystem on a partition" },
          { id: "sdc1", token: "/dev/sdc1", meaning: "partition 1 on /dev/sdc" },
          {
            id: "sdc-whole",
            token: "/dev/sdc",
            meaning: "the whole disk (formatting this would wipe the GPT table)",
            wrongWhy: "Never format the whole disk /dev/sdc — format the partition /dev/sdc1.",
          },
        ],
        bankOrder: ["sdc1", "sdc-whole", "mkfs-ext4"],
        slots: [
          { slotNumber: 1, label: "1. Format tool", expectedBlockId: "mkfs-ext4", emptySlotHint: "Pick mkfs.ext4.", wrongOrderByBlockId: {} },
          { slotNumber: 2, label: "2. Partition", expectedBlockId: "sdc1", emptySlotHint: "Pick /dev/sdc1.", wrongOrderByBlockId: {} },
        ],
      },
    ],
  },

  "coach-grow-disk": {
    intro:
      "Grow /dev/mapper/vgdata-data in four steps: (1) pvcreate /dev/sdd, (2) vgextend vgdata /dev/sdd, (3) lvextend -L +10GB /dev/mapper/vgdata-data, and (4) resize2fs /dev/mapper/vgdata-data.",
    passMessage: "",
    blocks: [],
    bankOrder: [],
    slots: [],
    stages: [
      {
        target: "pvcreate /dev/sdd",
        intro: "Step 1 of 4 — Initialize /dev/sdd as an LVM physical volume.",
        passMessage: "Step 1 done — /dev/sdd is now a physical volume.",
        beforeCommands: ["lsblk", "vgs"],
        afterCommands: ["pvs"],
        blocks: [
          { id: "pvcreate", token: "pvcreate", meaning: "initialize a disk or partition for LVM" },
          { id: "sdd", token: "/dev/sdd", meaning: "the new 10 GB disk" },
        ],
        bankOrder: ["sdd", "pvcreate"],
        slots: [
          { slotNumber: 1, label: "1. LVM PV tool", expectedBlockId: "pvcreate", emptySlotHint: "Pick pvcreate.", wrongOrderByBlockId: {} },
          { slotNumber: 2, label: "2. Disk", expectedBlockId: "sdd", emptySlotHint: "Pick /dev/sdd.", wrongOrderByBlockId: {} },
        ],
      },
      {
        target: "vgextend vgdata /dev/sdd",
        intro: "Step 2 of 4 — Add /dev/sdd into the vgdata volume group.",
        passMessage: "Step 2 done — vgdata now has 10 GB free.",
        beforeCommands: ["vgs"],
        afterCommands: ["vgs"],
        blocks: [
          { id: "vgextend", token: "vgextend", meaning: "add a physical volume to an existing volume group" },
          { id: "vgdata", token: "vgdata", meaning: "the volume group to grow" },
          { id: "sdd", token: "/dev/sdd", meaning: "the physical volume to add" },
        ],
        bankOrder: ["sdd", "vgdata", "vgextend"],
        slots: [
          { slotNumber: 1, label: "1. VG tool", expectedBlockId: "vgextend", emptySlotHint: "Pick vgextend.", wrongOrderByBlockId: {} },
          { slotNumber: 2, label: "2. Volume group", expectedBlockId: "vgdata", emptySlotHint: "Pick vgdata.", wrongOrderByBlockId: {} },
          { slotNumber: 3, label: "3. Physical volume", expectedBlockId: "sdd", emptySlotHint: "Pick /dev/sdd.", wrongOrderByBlockId: {} },
        ],
      },
      {
        target: "lvextend -L +10GB /dev/mapper/vgdata-data",
        intro: "Step 3 of 4 — Extend the logical volume /dev/mapper/vgdata-data by +10GB.",
        passMessage: "Step 3 done — logical volume grown to 30 GB. Now step 4: resize the ext4 filesystem.",
        beforeCommands: ["lvs"],
        afterCommands: ["lvs"],
        blocks: [
          { id: "lvextend", token: "lvextend", meaning: "grow a logical volume" },
          { id: "flag-l", token: "-L", spokenToken: "dash capital L", meaning: "specify size change" },
          { id: "plus-10gb", token: "+10GB", spokenToken: "plus 10 gigabytes", meaning: "add 10 GB to the current size" },
          { id: "lv-path", token: "/dev/mapper/vgdata-data", meaning: "the logical volume to grow" },
        ],
        bankOrder: ["lv-path", "plus-10gb", "flag-l", "lvextend"],
        slots: [
          { slotNumber: 1, label: "1. LV tool", expectedBlockId: "lvextend", emptySlotHint: "Pick lvextend.", wrongOrderByBlockId: {} },
          { slotNumber: 2, label: "2. Size flag", expectedBlockId: "flag-l", emptySlotHint: "Pick -L.", wrongOrderByBlockId: {} },
          { slotNumber: 3, label: "3. Size delta", expectedBlockId: "plus-10gb", emptySlotHint: "Pick +10GB.", wrongOrderByBlockId: {} },
          { slotNumber: 4, label: "4. Logical volume", expectedBlockId: "lv-path", emptySlotHint: "Pick /dev/mapper/vgdata-data.", wrongOrderByBlockId: {} },
        ],
      },
      {
        target: "resize2fs /dev/mapper/vgdata-data",
        intro: "Step 4 of 4 — Grow the ext4 filesystem on /dev/mapper/vgdata-data so the extra 10 GB is usable.",
        passMessage: "Filesystem grown — df -h now shows 30G on /data.",
        beforeCommands: ["df -h /data"],
        afterCommands: ["df -h /data"],
        blocks: [
          { id: "resize2fs", token: "resize2fs", meaning: "resize an ext2/ext3/ext4 filesystem" },
          { id: "lv-path", token: "/dev/mapper/vgdata-data", meaning: "the logical volume whose filesystem needs to grow" },
        ],
        bankOrder: ["lv-path", "resize2fs"],
        slots: [
          { slotNumber: 1, label: "1. FS resizer", expectedBlockId: "resize2fs", emptySlotHint: "Pick resize2fs.", wrongOrderByBlockId: {} },
          { slotNumber: 2, label: "2. Logical volume", expectedBlockId: "lv-path", emptySlotHint: "Pick /dev/mapper/vgdata-data.", wrongOrderByBlockId: {} },
        ],
      },
    ],
  },

  "coach-deleted-volume": {
    intro:
      "Bring back the deleted LVM volume in three steps: (1) restore vg_replays from /etc/lvm/archive/vg_replays_00041.vg, (2) activate /dev/vg_replays/lv_matches, and (3) mount -a.",
    passMessage: "",
    blocks: [],
    bankOrder: [],
    slots: [],
    stages: [
      {
        target: "vgcfgrestore -f /etc/lvm/archive/vg_replays_00041.vg vg_replays",
        intro: "Step 1 of 3 — Restore vg_replays metadata from the archive created right before lvremove.",
        passMessage: "Step 1 done — vg_replays metadata restored. Now step 2: activate lv_matches.",
        beforeCommands: ["vgcfgrestore --list vg_replays"],
        afterCommands: ["lvs"],
        blocks: [
          { id: "vgcfgrestore", token: "vgcfgrestore", meaning: "restore volume group metadata from an archive file" },
          { id: "flag-f", token: "-f", spokenToken: "dash f", meaning: "specify archive file path" },
          { id: "archive", token: "/etc/lvm/archive/vg_replays_00041.vg", meaning: "the archive from before lvremove" },
          { id: "vg", token: "vg_replays", meaning: "the volume group to restore" },
        ],
        bankOrder: ["vg", "archive", "flag-f", "vgcfgrestore"],
        slots: [
          { slotNumber: 1, label: "1. Restore tool", expectedBlockId: "vgcfgrestore", emptySlotHint: "Pick vgcfgrestore.", wrongOrderByBlockId: {} },
          { slotNumber: 2, label: "2. File flag", expectedBlockId: "flag-f", emptySlotHint: "Pick -f.", wrongOrderByBlockId: {} },
          { slotNumber: 3, label: "3. Archive file", expectedBlockId: "archive", emptySlotHint: "Pick /etc/lvm/archive/vg_replays_00041.vg.", wrongOrderByBlockId: {} },
          { slotNumber: 4, label: "4. Volume group", expectedBlockId: "vg", emptySlotHint: "Pick vg_replays.", wrongOrderByBlockId: {} },
        ],
      },
      {
        target: "lvchange -a y /dev/vg_replays/lv_matches",
        intro: "Step 2 of 3 — Activate the restored logical volume /dev/vg_replays/lv_matches.",
        passMessage: "Step 2 done — lv_matches is now active. Now step 3: mount all /etc/fstab entries.",
        beforeCommands: ["lvs"],
        afterCommands: ["lvs"],
        blocks: [
          { id: "lvchange", token: "lvchange", meaning: "change logical volume attributes" },
          { id: "flag-a", token: "-a", spokenToken: "dash a", meaning: "change activation state" },
          { id: "yes", token: "y", meaning: "yes — activate the volume" },
          { id: "lv", token: "/dev/vg_replays/lv_matches", meaning: "the restored logical volume" },
        ],
        bankOrder: ["lv", "yes", "flag-a", "lvchange"],
        slots: [
          { slotNumber: 1, label: "1. LV tool", expectedBlockId: "lvchange", emptySlotHint: "Pick lvchange.", wrongOrderByBlockId: {} },
          { slotNumber: 2, label: "2. Activate flag", expectedBlockId: "flag-a", emptySlotHint: "Pick -a.", wrongOrderByBlockId: {} },
          { slotNumber: 3, label: "3. Yes", expectedBlockId: "yes", emptySlotHint: "Pick y.", wrongOrderByBlockId: {} },
          { slotNumber: 4, label: "4. Volume path", expectedBlockId: "lv", emptySlotHint: "Pick /dev/vg_replays/lv_matches.", wrongOrderByBlockId: {} },
        ],
      },
      {
        target: "mount -a",
        intro: "Step 3 of 3 — Mount all filesystems listed in /etc/fstab so /srv/replays is online again.",
        passMessage: "Replays recovered — /srv/replays is mounted and finals-match-01.rec is readable.",
        beforeCommands: ["tail -n 2 /etc/fstab"],
        afterCommands: ["ls -l /srv/replays"],
        blocks: [
          { id: "mount", token: "mount", meaning: "mount filesystems" },
          { id: "flag-a", token: "-a", spokenToken: "dash a", meaning: "mount all filesystems listed in /etc/fstab" },
        ],
        bankOrder: ["flag-a", "mount"],
        slots: [
          { slotNumber: 1, label: "1. Mount tool", expectedBlockId: "mount", emptySlotHint: "Pick mount.", wrongOrderByBlockId: {} },
          { slotNumber: 2, label: "2. All flag", expectedBlockId: "flag-a", emptySlotHint: "Pick -a.", wrongOrderByBlockId: {} },
        ],
      },
    ],
  },

  "coach-firewall-ssh": {
    intro:
      "Look at the terminal below: ufw status shows the firewall is active with only 80/tcp allowed. Build the command that allows 22/tcp without turning the firewall off.",
    passMessage:
      "SSH opened safely — ufw allow 22/tcp added the allow rule while keeping the firewall active.",
    beforeCommands: ["ufw status"],
    afterCommands: ["ufw status"],
    blocks: [
      { id: "ufw", token: "ufw", meaning: "Uncomplicated Firewall command-line tool" },
      { id: "allow", token: "allow", meaning: "add a rule permitting traffic" },
      { id: "22-tcp", token: "22/tcp", spokenToken: "22 slash tcp", meaning: "SSH port 22 over TCP" },
      {
        id: "disable",
        token: "disable",
        meaning: "turn the entire firewall off",
        wrongWhy: "Never turn off the whole firewall — use allow to open 22/tcp only.",
      },
    ],
    bankOrder: ["22-tcp", "disable", "allow", "ufw"],
    slots: [
      { slotNumber: 1, label: "1. Firewall tool", expectedBlockId: "ufw", emptySlotHint: "Pick ufw.", wrongOrderByBlockId: {} },
      { slotNumber: 2, label: "2. Action", expectedBlockId: "allow", emptySlotHint: "Pick allow.", wrongOrderByBlockId: {} },
      { slotNumber: 3, label: "3. Port/protocol", expectedBlockId: "22-tcp", emptySlotHint: "Pick 22/tcp.", wrongOrderByBlockId: {} },
    ],
  },
};

export const EASY_PLANS: Record<string, EasyJobPlan> = Object.fromEntries(
  COACH_JOBS.map((job) => {
    const spec = PLANS_BY_ID[job.id];
    if (!spec) {
      throw new Error(`Missing Easy coaching plan for job ${job.id}`);
    }
    const stages: EasyStagePlan[] = spec.stages ?? [{ target: job.solution, ...spec }];
    const first = stages[0];
    return [
      job.id,
      {
        jobId: job.id,
        ...first,
        stages,
      },
    ];
  }),
);
