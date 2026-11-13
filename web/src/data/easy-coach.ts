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
