// Generated from linux-commands-master-list.md (388 commands across 8 categories)
// Incorporates LinuxDeck flashcard descriptions from MysterySoldier/LinuxDeck.

export interface CommandReferenceEntry {
  id: string;
  name: string;
  standsFor: string;
  categoryId: string;
  categoryNumber: number;
  categoryName: string;
  group: string;
  description: string;
  example: string;
  linuxDeckPrompt?: string;
  keywords: string[];
}

export interface CommandReferenceCategory {
  id: string;
  number: number;
  name: string;
  groups: string[];
  commandCount: number;
}

export const TOTAL_REFERENCE_COMMANDS = 388;

export const commandImages: Record<string, string> = {
  "7z": "/images/commands/7z.jpg",
  anacron: "/images/commands/anacron.jpg",
  apt: "/images/commands/apt.jpg",
  arch: "/images/commands/arch.jpg",
  at: "/images/commands/at.jpg",
  atop: "/images/commands/atop.jpg",
  atq: "/images/commands/atq.jpg",
  atrm: "/images/commands/atrm.jpg",
  awk: "/images/commands/awk.jpg",
  base64: "/images/commands/base64.jpg",
  basename: "/images/commands/basename.jpg",
  batch: "/images/commands/batch.jpg",
  bg: "/images/commands/bg.jpg",
  bzip2: "/images/commands/bzip2.jpg",
  cat: "/images/commands/cat.jpg",
  cd: "/images/commands/cd.jpg",
  chage: "/images/commands/chage.jpg",
  chattr: "/images/commands/chattr.jpg",
  chfn: "/images/commands/chfn.jpg",
  chgrp: "/images/commands/chgrp.jpg",
  chmod: "/images/commands/chmod.jpg",
  chown: "/images/commands/chown.jpg",
  chpasswd: "/images/commands/chpasswd.jpg",
  chsh: "/images/commands/chsh.jpg",
  cksum: "/images/commands/cksum.jpg",
  cmp: "/images/commands/cmp.jpg",
  column: "/images/commands/column.jpg",
  comm: "/images/commands/comm.jpg",
  cp: "/images/commands/cp.jpg",
  cpio: "/images/commands/cpio.jpg",
  cpupower: "/images/commands/cpupower.jpg",
  crontab: "/images/commands/crontab.jpg",
  cut: "/images/commands/cut.jpg",
  dd: "/images/commands/dd.jpg",
  depmod: "/images/commands/depmod.jpg",
  df: "/images/commands/df.jpg",
  diff: "/images/commands/diff.jpg",
  dir: "/images/commands/dir.jpg",
  dirname: "/images/commands/dirname.jpg",
  disown: "/images/commands/disown.jpg",
  dmesg: "/images/commands/dmesg.jpg",
  dmidecode: "/images/commands/dmidecode.jpg",
  dracut: "/images/commands/dracut.jpg",
  dstat: "/images/commands/dstat.jpg",
  efibootmgr: "/images/commands/efibootmgr.jpg",
  egrep: "/images/commands/egrep.jpg",
  ethtool: "/images/commands/ethtool.jpg",
  fallocate: "/images/commands/fallocate.jpg",
  fg: "/images/commands/fg.jpg",
  fgrep: "/images/commands/fgrep.jpg",
  file: "/images/commands/file.jpg",
  find: "/images/commands/find.jpg",
  finger: "/images/commands/finger.jpg",
  free: "/images/commands/free.jpg",
  fuser: "/images/commands/fuser.jpg",
  fwupdmgr: "/images/commands/fwupdmgr.jpg",
  getcap: "/images/commands/getcap.jpg",
  getconf: "/images/commands/getconf.jpg",
  getfacl: "/images/commands/getfacl.jpg",
  gpasswd: "/images/commands/gpasswd.jpg",
  grep: "/images/commands/grep.jpg",
  groupadd: "/images/commands/groupadd.jpg",
  groupdel: "/images/commands/groupdel.jpg",
  groupmod: "/images/commands/groupmod.jpg",
  groups: "/images/commands/groups.jpg",
  grpck: "/images/commands/grpck.jpg",
  "grub2-mkconfig": "/images/commands/grub2-mkconfig.jpg",
  gunzip: "/images/commands/gunzip.jpg",
  gzip: "/images/commands/gzip.jpg",
  halt: "/images/commands/halt.jpg",
  hdparm: "/images/commands/hdparm.jpg",
  head: "/images/commands/head.jpg",
  hexdump: "/images/commands/hexdump.jpg",
  hostnamectl: "/images/commands/hostnamectl.jpg",
  htop: "/images/commands/htop.jpg",
  id: "/images/commands/id.jpg",
  init: "/images/commands/init.jpg",
  insmod: "/images/commands/insmod.jpg",
  install: "/images/commands/install.jpg",
  ionice: "/images/commands/ionice.jpg",
  iostat: "/images/commands/iostat.jpg",
  iotop: "/images/commands/iotop.jpg",
  jobs: "/images/commands/jobs.jpg",
  join: "/images/commands/join.jpg",
  journalctl: "/images/commands/journalctl.jpg",
  kill: "/images/commands/kill.jpg",
  killall: "/images/commands/killall.jpg",
  last: "/images/commands/last.jpg",
  lastlog: "/images/commands/lastlog.jpg",
  less: "/images/commands/less.jpg",
  ln: "/images/commands/ln.jpg",
  localectl: "/images/commands/localectl.jpg",
  locate: "/images/commands/locate.jpg",
  loginctl: "/images/commands/loginctl.jpg",
  ls: "/images/commands/ls.jpg",
  lsattr: "/images/commands/lsattr.jpg",
  lscpu: "/images/commands/lscpu.jpg",
  lshw: "/images/commands/lshw.jpg",
  lsmem: "/images/commands/lsmem.jpg",
  lsmod: "/images/commands/lsmod.jpg",
  lsof: "/images/commands/lsof.jpg",
  lspci: "/images/commands/lspci.jpg",
  lsusb: "/images/commands/lsusb.jpg",
  ltrace: "/images/commands/ltrace.jpg",
  man: "/images/commands/man.jpg",
  md5sum: "/images/commands/md5sum.jpg",
  mkdir: "/images/commands/mkdir.jpg",
  mknod: "/images/commands/mknod.jpg",
  mktemp: "/images/commands/mktemp.jpg",
  modinfo: "/images/commands/modinfo.jpg",
  modprobe: "/images/commands/modprobe.jpg",
  more: "/images/commands/more.jpg",
  mpstat: "/images/commands/mpstat.jpg",
  mv: "/images/commands/mv.jpg",
  newgrp: "/images/commands/newgrp.jpg",
  newusers: "/images/commands/newusers.jpg",
  nice: "/images/commands/nice.jpg",
  nl: "/images/commands/nl.jpg",
  nohup: "/images/commands/nohup.jpg",
  nproc: "/images/commands/nproc.jpg",
  numactl: "/images/commands/numactl.jpg",
  od: "/images/commands/od.jpg",
  passwd: "/images/commands/passwd.jpg",
  paste: "/images/commands/paste.jpg",
  patch: "/images/commands/patch.jpg",
  perf: "/images/commands/perf.jpg",
  pgrep: "/images/commands/pgrep.jpg",
  pidof: "/images/commands/pidof.jpg",
  pidstat: "/images/commands/pidstat.jpg",
  pinky: "/images/commands/pinky.jpg",
  pkill: "/images/commands/pkill.jpg",
  poweroff: "/images/commands/poweroff.jpg",
  prlimit: "/images/commands/prlimit.jpg",
  ps: "/images/commands/ps.jpg",
  pstree: "/images/commands/pstree.jpg",
  pwck: "/images/commands/pwck.jpg",
  pwd: "/images/commands/pwd.jpg",
  readlink: "/images/commands/readlink.jpg",
  realpath: "/images/commands/realpath.jpg",
  reboot: "/images/commands/reboot.jpg",
  rename: "/images/commands/rename.jpg",
  renice: "/images/commands/renice.jpg",
  rm: "/images/commands/rm.jpg",
  rmdir: "/images/commands/rmdir.jpg",
  rmmod: "/images/commands/rmmod.jpg",
  rsync: "/images/commands/rsync.jpg",
  runuser: "/images/commands/runuser.jpg",
  sar: "/images/commands/sar.jpg",
  screen: "/images/commands/screen.jpg",
  sed: "/images/commands/sed.jpg",
  sensors: "/images/commands/sensors.jpg",
  service: "/images/commands/service.jpg",
  setcap: "/images/commands/setcap.jpg",
  setfacl: "/images/commands/setfacl.jpg",
  sha256sum: "/images/commands/sha256sum.jpg",
  shred: "/images/commands/shred.jpg",
  shutdown: "/images/commands/shutdown.jpg",
  sleep: "/images/commands/sleep.jpg",
  smartctl: "/images/commands/smartctl.jpg",
  sort: "/images/commands/sort.jpg",
  split: "/images/commands/split.jpg",
  stat: "/images/commands/stat.jpg",
  strings: "/images/commands/strings.jpg",
  su: "/images/commands/su.jpg",
  sudo: "/images/commands/sudo.jpg",
  sudoedit: "/images/commands/sudoedit.jpg",
  sync: "/images/commands/sync.jpg",
  sysctl: "/images/commands/sysctl.jpg",
  systemctl: "/images/commands/systemctl.jpg",
  "systemd-analyze": "/images/commands/systemd-analyze.jpg",
  "systemd-run": "/images/commands/systemd-run.jpg",
  tac: "/images/commands/tac.jpg",
  tail: "/images/commands/tail.jpg",
  tar: "/images/commands/tar.jpg",
  taskset: "/images/commands/taskset.jpg",
  tee: "/images/commands/tee.jpg",
  time: "/images/commands/time.jpg",
  timedatectl: "/images/commands/timedatectl.jpg",
  timeout: "/images/commands/timeout.jpg",
  tmux: "/images/commands/tmux.jpg",
  top: "/images/commands/top.jpg",
  touch: "/images/commands/touch.jpg",
  tr: "/images/commands/tr.jpg",
  tree: "/images/commands/tree.jpg",
  truncate: "/images/commands/truncate.jpg",
  type: "/images/commands/type.jpg",
  ulimit: "/images/commands/ulimit.jpg",
  umask: "/images/commands/umask.jpg",
  uname: "/images/commands/uname.jpg",
  uniq: "/images/commands/uniq.jpg",
  unzip: "/images/commands/unzip.jpg",
  "update-grub": "/images/commands/update-grub.jpg",
  updatedb: "/images/commands/updatedb.jpg",
  uptime: "/images/commands/uptime.jpg",
  useradd: "/images/commands/useradd.jpg",
  userdel: "/images/commands/userdel.jpg",
  usermod: "/images/commands/usermod.jpg",
  users: "/images/commands/users.jpg",
  vdir: "/images/commands/vdir.jpg",
  vigr: "/images/commands/vigr.jpg",
  vipw: "/images/commands/vipw.jpg",
  visudo: "/images/commands/visudo.jpg",
  vmstat: "/images/commands/vmstat.jpg",
  wall: "/images/commands/wall.jpg",
  watch: "/images/commands/watch.jpg",
  whereis: "/images/commands/whereis.jpg",
  which: "/images/commands/which.jpg",
  who: "/images/commands/who.jpg",
  whoami: "/images/commands/whoami.jpg",
  xargs: "/images/commands/xargs.jpg",
  xxd: "/images/commands/xxd.jpg",
  zip: "/images/commands/zip.jpg",
  zstd: "/images/commands/zstd.jpg",
};

export const COMMAND_CATEGORIES: CommandReferenceCategory[] = [
  {
    id: "cat-1",
    number: 1,
    name: "File, Directory, and Text Manipulation",
    groups: ["Navigation & File Ops", "Viewing & Paging", "Text Processing & Filtering", "Searching", "Archiving & Compression", "File creation & wiping"],
    commandCount: 81,
  },
  {
    id: "cat-2",
    number: 2,
    name: "User, Group, and Permission Management",
    groups: ["Users & Groups", "Permissions & Ownership", "Privilege & Session Auditing", "Account file checks"],
    commandCount: 44,
  },
  {
    id: "cat-3",
    number: 3,
    name: "Process, Service, and Job Control",
    groups: ["Process Monitoring", "Process Control", "Systemd & Services", "Scheduling"],
    commandCount: 45,
  },
  {
    id: "cat-4",
    number: 4,
    name: "System Performance, Hardware, and Kernel",
    groups: ["CPU, Memory & I/O", "Hardware Discovery", "Kernel & Boot", "Tracing & debugging"],
    commandCount: 47,
  },
  {
    id: "cat-5",
    number: 5,
    name: "Storage, Disk, and Filesystem Management",
    groups: ["Disk & Partitioning", "Filesystems & Mounting", "LVM & RAID", "Encryption, quotas & sharing"],
    commandCount: 50,
  },
  {
    id: "cat-6",
    number: 6,
    name: "Networking, Security, and Diagnostics",
    groups: ["Interface & Routing", "Connections & Diagnostics", "DNS & Web Transfers", "Firewalls & SELinux/AppArmor", "Crypto, VPN & certs"],
    commandCount: 63,
  },
  {
    id: "cat-7",
    number: 7,
    name: "Package and Container Management",
    groups: ["Debian/Ubuntu", "RHEL/Rocky/Fedora", "Other distros", "Universal & Containers", "VMs & system containers"],
    commandCount: 31,
  },
  {
    id: "cat-8",
    number: 8,
    name: "Shell, Help, and Everyday Tools",
    groups: ["Help", "Shell", "Everyday", "Editors & building"],
    commandCount: 27,
  },
];

export const COMMAND_REFERENCE: CommandReferenceEntry[] = [
  {
    "id": "cmd-pwd",
    "name": "pwd",
    "standsFor": "Print working directory",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Shows you where you are. It prints the full address of the folder you're in right now — like reading the sign on the shelf you're standing in front of.",
    "example": "pwd",
    "linuxDeckPrompt": "Display current path",
    "keywords": [
      "where",
      "path",
      "current",
      "folder",
      "directory"
    ]
  },
  {
    "id": "cmd-ls",
    "name": "ls",
    "standsFor": "List",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Opens the shelf and shows you everything on it — what's in this folder.",
    "example": "ls",
    "linuxDeckPrompt": "List directory contents",
    "keywords": [
      "list",
      "show",
      "files",
      "folder",
      "directory"
    ]
  },
  {
    "id": "cmd-cd",
    "name": "cd",
    "standsFor": "Change directory",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Walks you to a different shelf — the next shelf over, or a shelf in a whole other room.",
    "example": "cd [directory]",
    "linuxDeckPrompt": "Change directory",
    "keywords": [
      "change",
      "open",
      "enter",
      "folder",
      "directory"
    ]
  },
  {
    "id": "cmd-mkdir",
    "name": "mkdir",
    "standsFor": "Make directory",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Makes a brand-new empty folder, like putting up a new empty shelf.",
    "example": "mkdir [directory]",
    "linuxDeckPrompt": "Create directory",
    "keywords": [
      "make",
      "create",
      "new",
      "folder",
      "directory"
    ]
  },
  {
    "id": "cmd-rmdir",
    "name": "rmdir",
    "standsFor": "Remove directory",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Takes an empty folder away — but only if there's nothing inside it, like taking down a shelf only after you've emptied it.",
    "example": "rmdir [directory]",
    "linuxDeckPrompt": "Remove empty directory",
    "keywords": [
      "remove",
      "delete",
      "empty",
      "folder",
      "directory"
    ]
  },
  {
    "id": "cmd-touch",
    "name": "touch",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Makes a blank new file, like setting a fresh empty notebook on the shelf. If the file already exists, it just stamps it with today's date.",
    "example": "touch [file_name]",
    "linuxDeckPrompt": "Create empty file",
    "keywords": [
      "create",
      "make",
      "blank",
      "file",
      "timestamp"
    ]
  },
  {
    "id": "cmd-cp",
    "name": "cp",
    "standsFor": "Copy",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Makes a copy of a file or folder — like photocopying a book, or a whole shelf of books. The original stays right where it was.",
    "example": "cp [source] [destination]",
    "linuxDeckPrompt": "Copy files or directories",
    "keywords": [
      "copy",
      "duplicate",
      "file",
      "folder",
      "backup"
    ]
  },
  {
    "id": "cmd-mv",
    "name": "mv",
    "standsFor": "Move",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Moves a file or folder somewhere else, or gives it a new name — like picking up a book from one shelf and putting it on another shelf. A folder moves the same way, shelf and all.",
    "example": "mv [source] [destination]",
    "linuxDeckPrompt": "Move or rename files",
    "keywords": [
      "move",
      "rename",
      "file",
      "folder"
    ]
  },
  {
    "id": "cmd-rm",
    "name": "rm",
    "standsFor": "Remove",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Feeds a file into the shredder — once it goes in, it's gone, there is no way to pull it back out. Add -f (lowercase f) and it goes straight in with no 'are you sure?', and rm -rf on a folder feeds the whole shelf in, books and all. Never type sudo rm -rf /* — that bulldozes the whole library, no undo.",
    "example": "rm [file]",
    "linuxDeckPrompt": "Delete files or directories",
    "keywords": [
      "remove",
      "delete",
      "shred",
      "erase",
      "file"
    ]
  },
  {
    "id": "cmd-ln",
    "name": "ln",
    "standsFor": "Link",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Makes a shortcut that points at another file or folder — like a sign on the shelf that points to a book or a shelf somewhere else.",
    "example": "ln [source] [link]",
    "linuxDeckPrompt": "Create hard or symbolic links",
    "keywords": [
      "link",
      "shortcut",
      "symlink",
      "pointer",
      "file"
    ]
  },
  {
    "id": "cmd-stat",
    "name": "stat",
    "standsFor": "Status",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Shows a file's catalogue card: how big it is, who owns it, and when it was last touched.",
    "example": "stat [file_name]",
    "linuxDeckPrompt": "Display detailed file info",
    "keywords": [
      "info",
      "details",
      "size",
      "owner",
      "timestamp"
    ]
  },
  {
    "id": "cmd-file",
    "name": "file",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Peeks inside a file to tell you what it really is, instead of trusting the name on the outside — like opening a book's cover to see what's really inside.",
    "example": "file [file]",
    "keywords": [
      "type",
      "identify",
      "format",
      "inspect",
      "file"
    ]
  },
  {
    "id": "cmd-basename",
    "name": "basename",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Strips the address off and leaves just the file's name, like reading only the title on a book's spine.",
    "example": "basename [path]",
    "linuxDeckPrompt": "Display file name from path",
    "keywords": [
      "filename",
      "strip",
      "name",
      "path"
    ]
  },
  {
    "id": "cmd-dirname",
    "name": "dirname",
    "standsFor": "Directory name",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Strips the file's name off and leaves just the folder it lives in — the aisle-and-shelf address without the book's title.",
    "example": "dirname [path]",
    "linuxDeckPrompt": "Display dir name from path",
    "keywords": [
      "folder",
      "parent",
      "path",
      "directory"
    ]
  },
  {
    "id": "cmd-tree",
    "name": "tree",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Draws a map of a folder and everything tucked inside it, shelves and all — like a diagram of one shelf and all its smaller shelves.",
    "example": "tree",
    "linuxDeckPrompt": "Show directory tree",
    "keywords": [
      "tree",
      "map",
      "folders",
      "structure",
      "list"
    ]
  },
  {
    "id": "cmd-rename",
    "name": "rename",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Renames a whole bunch of files at once using find-and-replace, like relabeling every book on a shelf in one go.",
    "example": "rename [expression] [file]",
    "keywords": [
      "rename",
      "batch",
      "multiple",
      "files",
      "replace"
    ]
  },
  {
    "id": "cmd-readlink",
    "name": "readlink",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Follows a shortcut to see where it really points, like following the sign to find which shelf the book actually sits on.",
    "example": "readlink [link]",
    "keywords": [
      "target",
      "shortcut",
      "symlink",
      "follow",
      "link"
    ]
  },
  {
    "id": "cmd-realpath",
    "name": "realpath",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Turns a shortcut address into the full real address, starting from the front door of the library.",
    "example": "realpath [path]",
    "keywords": [
      "full",
      "path",
      "absolute",
      "address",
      "resolve"
    ]
  },
  {
    "id": "cmd-mktemp",
    "name": "mktemp",
    "standsFor": "Make temporary",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Makes a brand-new scratch file with a one-of-a-kind name, so two readers working at once never grab the same scrap paper.",
    "example": "mktemp",
    "keywords": [
      "temporary",
      "scratch",
      "file",
      "create",
      "temp"
    ]
  },
  {
    "id": "cmd-install",
    "name": "install",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Copies a file into its new home and sets who can use it, all in one move — like delivering a book to its shelf and stamping it at the same time.",
    "example": "install [source] [destination]",
    "keywords": [
      "copy",
      "install",
      "permissions",
      "deploy",
      "file"
    ]
  },
  {
    "id": "cmd-dir",
    "name": "dir",
    "standsFor": "Directory",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Lists what's in a folder, in neat columns — ls's cousin that lines everything up in rows.",
    "example": "dir",
    "keywords": [
      "list",
      "columns",
      "files",
      "folder",
      "directory"
    ]
  },
  {
    "id": "cmd-vdir",
    "name": "vdir",
    "standsFor": "Verbose directory",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Lists what's in a folder with the full details next to each item — size, who owns it, and date — like a catalogue card for every book.",
    "example": "vdir",
    "keywords": [
      "list",
      "details",
      "files",
      "folder",
      "size"
    ]
  },
  {
    "id": "cmd-cat",
    "name": "cat",
    "standsFor": "Concatenate",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Prints a whole file on the screen, top to bottom, like reading a book out loud.",
    "example": "cat [file]",
    "keywords": [
      "read",
      "print",
      "show",
      "view",
      "contents"
    ]
  },
  {
    "id": "cmd-tac",
    "name": "tac",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Prints a file backwards, last line first — like reading a book from the last page back to the first.",
    "example": "tac [file]",
    "keywords": [
      "reverse",
      "backwards",
      "print",
      "read",
      "file"
    ]
  },
  {
    "id": "cmd-less",
    "name": "less",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Opens a file in a reader you can scroll through page by page, and search inside with / — like a book you can flip through without opening the whole thing at once.",
    "example": "less [file]",
    "keywords": [
      "read",
      "scroll",
      "page",
      "view",
      "pager"
    ]
  },
  {
    "id": "cmd-more",
    "name": "more",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Shows a long file one screenful at a time — press the spacebar for the next page, like turning pages in a book.",
    "example": "more [file]",
    "keywords": [
      "read",
      "page",
      "view",
      "scroll",
      "file"
    ]
  },
  {
    "id": "cmd-head",
    "name": "head",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Shows just the first few lines of a file — like peeking at the top of the first page.",
    "example": "head [file]",
    "keywords": [
      "first",
      "top",
      "beginning",
      "lines",
      "preview"
    ]
  },
  {
    "id": "cmd-tail",
    "name": "tail",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Shows just the last few lines of a file — like reading the last page of a book. Add -f and it keeps watching, printing new lines as they show up.",
    "example": "tail [file]",
    "linuxDeckPrompt": "Real-time log viewing (tail)",
    "keywords": [
      "last",
      "bottom",
      "end",
      "lines",
      "logs"
    ]
  },
  {
    "id": "cmd-watch",
    "name": "watch",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Runs a command over and over every few seconds and refreshes the screen, so you can watch a number change live — like a notice board that rewrites itself every few seconds.",
    "example": "watch [command]",
    "linuxDeckPrompt": "Execute command periodically",
    "keywords": [
      "repeat",
      "refresh",
      "monitor",
      "live",
      "interval"
    ]
  },
  {
    "id": "cmd-nl",
    "name": "nl",
    "standsFor": "Number lines",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Prints a file with a number next to every line, like line numbers printed in the margin of a page.",
    "example": "nl [file]",
    "keywords": [
      "number",
      "lines",
      "count",
      "print",
      "file"
    ]
  },
  {
    "id": "cmd-od",
    "name": "od",
    "standsFor": "Octal dump",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Shows the raw bytes inside a file — the tiny pieces it's really made of — so you can spot hidden characters you can't see normally.",
    "example": "od -c [file]",
    "keywords": [
      "bytes",
      "octal",
      "raw",
      "binary",
      "inspect"
    ]
  },
  {
    "id": "cmd-hexdump",
    "name": "hexdump",
    "standsFor": "Hexadecimal dump",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Shows a file's insides as rows of numbers and letters, so you can read exactly what's in there.",
    "example": "hexdump -C [file]",
    "keywords": [
      "hex",
      "bytes",
      "binary",
      "inspect",
      "dump"
    ]
  },
  {
    "id": "cmd-strings",
    "name": "strings",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Pulls out any readable words hiding inside a file that looks like gibberish — like finding real words buried in a page of scrambled letters.",
    "example": "strings [file]",
    "keywords": [
      "text",
      "readable",
      "words",
      "binary",
      "extract"
    ]
  },
  {
    "id": "cmd-xxd",
    "name": "xxd",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Turns a file into a page of code numbers (and can turn it back), like writing a secret message in code.",
    "example": "xxd [file]",
    "keywords": [
      "hex",
      "dump",
      "binary",
      "convert",
      "bytes"
    ]
  },
  {
    "id": "cmd-base64",
    "name": "base64",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Turns any file into plain letters and numbers so it can travel safely inside an email or a message, and turns it back with -d.",
    "example": "base64 [file]",
    "keywords": [
      "encode",
      "decode",
      "text",
      "convert",
      "safe"
    ]
  },
  {
    "id": "cmd-grep",
    "name": "grep",
    "standsFor": "Global regular expression print",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Searches through a file and shows you only the lines that contain the word you're looking for — like flipping through a book and marking every line with that word in it.",
    "example": "grep [pattern] [file]",
    "keywords": [
      "search",
      "find",
      "match",
      "text",
      "filter"
    ]
  },
  {
    "id": "cmd-egrep",
    "name": "egrep",
    "standsFor": "Extended grep",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Searches like grep, but lets you look for two things at once — 'this OR that' — without extra fiddling.",
    "example": "egrep [pattern] [file]",
    "keywords": [
      "search",
      "regex",
      "pattern",
      "match",
      "text"
    ]
  },
  {
    "id": "cmd-fgrep",
    "name": "fgrep",
    "standsFor": "Fixed-string grep",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Searches for the exact letters you typed, no wildcards, no tricks — what you type is exactly what it looks for.",
    "example": "fgrep [pattern] [file]",
    "keywords": [
      "search",
      "exact",
      "literal",
      "text",
      "find"
    ]
  },
  {
    "id": "cmd-sed",
    "name": "sed",
    "standsFor": "Stream editor",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Finds a word in a file and swaps it for another word, on the fly — like find-and-replace across the pages of a book.",
    "example": "sed [expression] [file]",
    "keywords": [
      "replace",
      "substitute",
      "edit",
      "swap",
      "text"
    ]
  },
  {
    "id": "cmd-awk",
    "name": "awk",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Reads a file line by line and pulls out just the column you want, like copying one column out of a library ledger.",
    "example": "awk [program] [file]",
    "keywords": [
      "columns",
      "fields",
      "extract",
      "text",
      "filter"
    ]
  },
  {
    "id": "cmd-cut",
    "name": "cut",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Slices one column out of every line of a file, like cutting the titles column off a shelf list.",
    "example": "cut -f [field] [file]",
    "keywords": [
      "slice",
      "column",
      "split",
      "field",
      "text"
    ]
  },
  {
    "id": "cmd-sort",
    "name": "sort",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Puts lines in order — A to Z, or smallest to biggest — like alphabetizing a stack of books on a shelf.",
    "example": "sort [file]",
    "keywords": [
      "sort",
      "order",
      "alphabetize",
      "lines",
      "arrange"
    ]
  },
  {
    "id": "cmd-uniq",
    "name": "uniq",
    "standsFor": "Unique",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Squashes lines that repeat right next to each other down to one copy, like pulling duplicate books off a shelf and keeping just one.",
    "example": "uniq [file]",
    "keywords": [
      "deduplicate",
      "unique",
      "duplicates",
      "remove",
      "lines"
    ]
  },
  {
    "id": "cmd-wc",
    "name": "wc",
    "standsFor": "Word count",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Counts a file for you — how many lines, words, and letters it has.",
    "example": "wc [file]",
    "keywords": [
      "count",
      "lines",
      "words",
      "characters",
      "length"
    ]
  },
  {
    "id": "cmd-tr",
    "name": "tr",
    "standsFor": "Translate",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Swaps one letter for another all through a file, or deletes letters — like changing every lowercase letter to uppercase in one go.",
    "example": "tr [characters] [replacement]",
    "keywords": [
      "translate",
      "swap",
      "characters",
      "letters",
      "replace"
    ]
  },
  {
    "id": "cmd-paste",
    "name": "paste",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Glues two files together side by side, line by line, like binding two lists together down the middle.",
    "example": "paste [file] [file]",
    "keywords": [
      "merge",
      "combine",
      "side",
      "columns",
      "files"
    ]
  },
  {
    "id": "cmd-join",
    "name": "join",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Combines two files that share a matching column, like matching the titles on a shelf list to their authors on another list.",
    "example": "join [file] [file]",
    "keywords": [
      "join",
      "merge",
      "match",
      "column",
      "files"
    ]
  },
  {
    "id": "cmd-comm",
    "name": "comm",
    "standsFor": "Common",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Compares two sorted files and shows you what's only in the first, only in the second, and in both — like comparing two shelf lists.",
    "example": "comm [file] [file]",
    "keywords": [
      "compare",
      "common",
      "shared",
      "sorted",
      "files"
    ]
  },
  {
    "id": "cmd-diff",
    "name": "diff",
    "standsFor": "Difference",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Shows you exactly what changed between two files, line by line — like a librarian marking up two drafts of a book.",
    "example": "diff [file] [file]",
    "keywords": [
      "compare",
      "differences",
      "changes",
      "lines",
      "files"
    ]
  },
  {
    "id": "cmd-patch",
    "name": "patch",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Takes a list of changes and applies it to a file, like pasting the librarian's corrections straight into the book.",
    "example": "patch [file] [patch]",
    "keywords": [
      "apply",
      "changes",
      "fix",
      "update",
      "diff"
    ]
  },
  {
    "id": "cmd-tee",
    "name": "tee",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Splits what a command prints into two places at once: on your screen AND into a file — like a photocopier that hands you a copy and shelves one away.",
    "example": "tee [file]",
    "keywords": [
      "split",
      "save",
      "output",
      "screen",
      "file"
    ]
  },
  {
    "id": "cmd-xargs",
    "name": "xargs",
    "standsFor": "Extended arguments",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Takes a list of things and hands them to another command one by one, like handing books from a pile to a librarian to shelve.",
    "example": "xargs [command]",
    "keywords": [
      "pipe",
      "pass",
      "arguments",
      "batch",
      "run"
    ]
  },
  {
    "id": "cmd-split",
    "name": "split",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Chops one giant file into smaller numbered pieces, like splitting a huge book into smaller books you can carry.",
    "example": "split [file]",
    "keywords": [
      "chop",
      "divide",
      "pieces",
      "chunks",
      "file"
    ]
  },
  {
    "id": "cmd-column",
    "name": "column",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Straightens messy text into neat lined-up columns, like a librarian straightening a crooked shelf list.",
    "example": "column [file]",
    "keywords": [
      "table",
      "align",
      "format",
      "columns",
      "neat"
    ]
  },
  {
    "id": "cmd-cksum",
    "name": "cksum",
    "standsFor": "Checksum",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Counts a file's pages into one number, so you can tell if it got damaged on its way to you — if the number changes, something changed.",
    "example": "cksum [file]",
    "keywords": [
      "checksum",
      "fingerprint",
      "verify",
      "crc",
      "file"
    ]
  },
  {
    "id": "cmd-md5sum",
    "name": "md5sum",
    "standsFor": "Message Digest 5 checksum",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Counts a file's pages into one number, so you can check two copies are exactly the same, bit for bit.",
    "example": "md5sum [file]",
    "keywords": [
      "hash",
      "fingerprint",
      "verify",
      "checksum",
      "md5"
    ]
  },
  {
    "id": "cmd-sha256sum",
    "name": "sha256sum",
    "standsFor": "Secure Hash Algorithm 256 checksum",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Makes a stronger page-count for a file, used to prove a download wasn't tampered with on the way.",
    "example": "sha256sum [file]",
    "keywords": [
      "hash",
      "fingerprint",
      "verify",
      "checksum",
      "sha256"
    ]
  },
  {
    "id": "cmd-cmp",
    "name": "cmp",
    "standsFor": "Compare",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Compares two files and points at the exact spot where they first differ, like laying two copies of a book side by side to find where they first stop matching.",
    "example": "cmp [file] [file]",
    "keywords": [
      "compare",
      "bytes",
      "binary",
      "identical",
      "files"
    ]
  },
  {
    "id": "cmd-find",
    "name": "find",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Searching",
    "description": "Hunts through folders for files by name, size, or age — like walking every aisle to find one book.",
    "example": "find [path] -name [filename]",
    "linuxDeckPrompt": "Search for files or directories",
    "keywords": [
      "search",
      "hunt",
      "find",
      "files",
      "folders"
    ]
  },
  {
    "id": "cmd-locate",
    "name": "locate",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Searching",
    "description": "Finds a file in a flash by looking it up in an index, instead of searching every shelf by hand — like using the library catalog instead of walking the shelves.",
    "example": "locate [filename]",
    "linuxDeckPrompt": "Quickly locate files",
    "keywords": [
      "find",
      "search",
      "quick",
      "index",
      "path"
    ]
  },
  {
    "id": "cmd-updatedb",
    "name": "updatedb",
    "standsFor": "Update database",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Searching",
    "description": "Rebuilds the index that locate uses, so brand-new files show up when you search for them.",
    "example": "updatedb",
    "keywords": [
      "refresh",
      "update",
      "search",
      "index",
      "database"
    ]
  },
  {
    "id": "cmd-which",
    "name": "which",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Searching",
    "description": "Shows you the full address of the command that runs when you type its name — which copy it finds first.",
    "example": "which [command]",
    "keywords": [
      "locate",
      "command",
      "path",
      "program",
      "where"
    ]
  },
  {
    "id": "cmd-whereis",
    "name": "whereis",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Searching",
    "description": "Finds where a command lives, plus its help pages — like asking the librarian where a book is shelved.",
    "example": "whereis [command]",
    "keywords": [
      "find",
      "binary",
      "manual",
      "command",
      "location"
    ]
  },
  {
    "id": "cmd-type",
    "name": "type",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Searching",
    "description": "Tells you what kind of command a word is — a built-in shortcut, a nickname, or a real program on the disk.",
    "example": "type [command]",
    "keywords": [
      "explain",
      "builtin",
      "alias",
      "command",
      "kind"
    ]
  },
  {
    "id": "cmd-tar",
    "name": "tar",
    "standsFor": "Tape archive",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Bundles a whole folder of files into one single package file, like packing a shelf of books into one big box — and can unpack it again.",
    "example": "tar -czf [archive] [directory]",
    "linuxDeckPrompt": "Extract tar archive / Create tar.gz archive",
    "keywords": [
      "archive",
      "bundle",
      "extract",
      "unpack",
      "package"
    ]
  },
  {
    "id": "cmd-gzip",
    "name": "gzip",
    "standsFor": "GNU zip",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Squishes a file down smaller so it takes up less shelf space, like pressing a thick book flat.",
    "example": "gzip [file]",
    "linuxDeckPrompt": "Compress files using gzip",
    "keywords": [
      "compress",
      "shrink",
      "squish",
      "zip",
      "gz"
    ]
  },
  {
    "id": "cmd-gunzip",
    "name": "gunzip",
    "standsFor": "GNU unzip",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Un-squishes a .gz file back to its normal size.",
    "example": "gunzip [file]",
    "keywords": [
      "decompress",
      "unpack",
      "extract",
      "expand",
      "gz"
    ]
  },
  {
    "id": "cmd-bzip2",
    "name": "bzip2",
    "standsFor": "Burrows-Wheeler zip 2",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Squishes a file even smaller than gzip, but takes a bit longer doing it.",
    "example": "bzip2 [file]",
    "keywords": [
      "compress",
      "shrink",
      "squish",
      "bz2",
      "file"
    ]
  },
  {
    "id": "cmd-xz",
    "name": "xz",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Squishes a file down really small — the tightest squeeze of the bunch.",
    "example": "xz [file]",
    "keywords": [
      "compress",
      "shrink",
      "smallest",
      "squish",
      "file"
    ]
  },
  {
    "id": "cmd-zip",
    "name": "zip",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Packs files and folders into one .zip package that opens anywhere — Windows, Mac, or Linux.",
    "example": "zip [archive] [file]",
    "linuxDeckPrompt": "Compress files into zip",
    "keywords": [
      "compress",
      "pack",
      "archive",
      "zip",
      "bundle"
    ]
  },
  {
    "id": "cmd-unzip",
    "name": "unzip",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Unpacks a .zip package back into its files and folders.",
    "example": "unzip [archive]",
    "linuxDeckPrompt": "Extract zip files",
    "keywords": [
      "extract",
      "unpack",
      "open",
      "unzip",
      "archive"
    ]
  },
  {
    "id": "cmd-rsync",
    "name": "rsync",
    "standsFor": "Remote sync",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Copies files to another place, but only sends the parts that actually changed — like handing over just the new pages instead of the whole book.",
    "example": "rsync [source] [destination]",
    "linuxDeckPrompt": "Remote sync backup tool",
    "keywords": [
      "sync",
      "backup",
      "copy",
      "transfer",
      "mirror"
    ]
  },
  {
    "id": "cmd-dd",
    "name": "dd",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Copies a disk bit by bit, exactly as it is — like writing a bootable installer onto a USB stick, or making a perfect photocopy of a whole drive. It does exactly what you tell it, so double-check before you run it.",
    "example": "dd if=[source] of=[destination]",
    "linuxDeckPrompt": "Disk backup and restore utility / Backup raw disk image",
    "keywords": [
      "clone",
      "image",
      "disk",
      "usb",
      "backup"
    ]
  },
  {
    "id": "cmd-zstd",
    "name": "zstd",
    "standsFor": "Zstandard",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Squishes files fast and small — the new kid that's quick at packing and unpacking.",
    "example": "zstd [file]",
    "keywords": [
      "compress",
      "fast",
      "pack",
      "unpack",
      "shrink"
    ]
  },
  {
    "id": "cmd-7z",
    "name": "7z",
    "standsFor": "7-Zip",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Packs and unpacks .7z packages and lots of other formats, and can lock them with a password.",
    "example": "7z a [archive] [file]",
    "keywords": [
      "archive",
      "compress",
      "extract",
      "password",
      "pack"
    ]
  },
  {
    "id": "cmd-cpio",
    "name": "cpio",
    "standsFor": "Copy in and out",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Packs files into a stream one after another, like shelving books in a line, one right after the next.",
    "example": "cpio -o > [archive]",
    "keywords": [
      "archive",
      "stream",
      "pack",
      "unpack",
      "files"
    ]
  },
  {
    "id": "cmd-shred",
    "name": "shred",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "File creation & wiping",
    "description": "Overwrites a file over and over before deleting it, so nobody can dig the old words back up — the real shredder.",
    "example": "shred [file]",
    "keywords": [
      "wipe",
      "erase",
      "destroy",
      "delete",
      "remove"
    ]
  },
  {
    "id": "cmd-truncate",
    "name": "truncate",
    "standsFor": "",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "File creation & wiping",
    "description": "Shrinks a file down to an exact size — or empties it out completely — without deleting the file itself, like emptying a notebook but keeping the cover.",
    "example": "truncate -s [size] [file]",
    "keywords": [
      "empty",
      "clear",
      "shrink",
      "zero",
      "size"
    ]
  },
  {
    "id": "cmd-fallocate",
    "name": "fallocate",
    "standsFor": "File allocate",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "File creation & wiping",
    "description": "Reserves a chunk of shelf space for a file right now, without filling it yet — like saving a spot on the shelf for a book that hasn't arrived yet.",
    "example": "fallocate -l [size] [file]",
    "keywords": [
      "reserve",
      "allocate",
      "space",
      "disk",
      "file"
    ]
  },
  {
    "id": "cmd-mknod",
    "name": "mknod",
    "standsFor": "Make node",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "File creation & wiping",
    "description": "Makes a special file that stands in for a piece of hardware, or a named pipe that lets two programs hand things to each other, like passing a book down a line.",
    "example": "mknod [file] [type]",
    "keywords": [
      "device",
      "special",
      "pipe",
      "create",
      "node"
    ]
  },
  {
    "id": "cmd-sync",
    "name": "sync",
    "standsFor": "Synchronize",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "File creation & wiping",
    "description": "Pushes everything held in memory out onto the disk right now, so nothing gets lost if the power goes out.",
    "example": "sync",
    "keywords": [
      "flush",
      "save",
      "write",
      "disk",
      "memory"
    ]
  },
  {
    "id": "cmd-useradd",
    "name": "useradd",
    "standsFor": "",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Makes a brand-new login account — like issuing a library card to a brand-new reader, with their own shelf.",
    "example": "useradd [user]",
    "linuxDeckPrompt": "Add new user",
    "keywords": [
      "create",
      "add",
      "new",
      "user",
      "account"
    ]
  },
  {
    "id": "cmd-usermod",
    "name": "usermod",
    "standsFor": "User modify",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Changes an existing account — like updating a reader's library card, moving them into a different reading group or changing what's on their card.",
    "example": "usermod -aG [group] [user]",
    "linuxDeckPrompt": "Modify user information",
    "keywords": [
      "change",
      "edit",
      "modify",
      "user",
      "account"
    ]
  },
  {
    "id": "cmd-userdel",
    "name": "userdel",
    "standsFor": "User delete",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Removes a login account — like cancelling a reader's library card.",
    "example": "userdel [user]",
    "keywords": [
      "remove",
      "delete",
      "erase",
      "user",
      "account"
    ]
  },
  {
    "id": "cmd-groupadd",
    "name": "groupadd",
    "standsFor": "",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Makes a new reading group — everyone in the group shares the same permissions for the shelves.",
    "example": "groupadd [group]",
    "linuxDeckPrompt": "Create user group",
    "keywords": [
      "create",
      "add",
      "new",
      "group",
      "team"
    ]
  },
  {
    "id": "cmd-groupmod",
    "name": "groupmod",
    "standsFor": "Group modify",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Renames a reading group or changes its number.",
    "example": "groupmod -n [new_name] [group]",
    "keywords": [
      "change",
      "rename",
      "modify",
      "group"
    ]
  },
  {
    "id": "cmd-groupdel",
    "name": "groupdel",
    "standsFor": "Group delete",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Deletes a reading group that isn't needed anymore.",
    "example": "groupdel [group]",
    "keywords": [
      "remove",
      "delete",
      "group"
    ]
  },
  {
    "id": "cmd-passwd",
    "name": "passwd",
    "standsFor": "Password",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Sets or changes a password for an account — your own, or someone else's if you're the owner.",
    "example": "passwd",
    "linuxDeckPrompt": "Change user password",
    "keywords": [
      "password",
      "change",
      "reset",
      "login",
      "secret"
    ]
  },
  {
    "id": "cmd-chage",
    "name": "chage",
    "standsFor": "Change age",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Sets the rules for a password — like how often a card holder has to change it, or when it stops working.",
    "example": "chage -l [user]",
    "keywords": [
      "expire",
      "password",
      "age",
      "policy",
      "account"
    ]
  },
  {
    "id": "cmd-gpasswd",
    "name": "gpasswd",
    "standsFor": "Group password",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Adds or removes people from a reading group, like updating the group's sign-up sheet.",
    "example": "gpasswd -a [user] [group]",
    "keywords": [
      "members",
      "group",
      "add",
      "remove",
      "roster"
    ]
  },
  {
    "id": "cmd-id",
    "name": "id",
    "standsFor": "Identity",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Shows an account's ID card: its number, its main reading group, and every group it belongs to.",
    "example": "id",
    "linuxDeckPrompt": "Display user and group IDs",
    "keywords": [
      "uid",
      "gid",
      "identity",
      "user",
      "groups"
    ]
  },
  {
    "id": "cmd-groups",
    "name": "groups",
    "standsFor": "",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Lists all the reading groups someone belongs to — all the groups on their card.",
    "example": "groups",
    "linuxDeckPrompt": "Show user groups",
    "keywords": [
      "list",
      "memberships",
      "clubs",
      "user",
      "groups"
    ]
  },
  {
    "id": "cmd-whoami",
    "name": "whoami",
    "standsFor": "",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Prints the name of the account you're signed in as right now.",
    "example": "whoami",
    "linuxDeckPrompt": "Show current user identity",
    "keywords": [
      "current",
      "user",
      "logged",
      "username",
      "me"
    ]
  },
  {
    "id": "cmd-chsh",
    "name": "chsh",
    "standsFor": "Change shell",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Changes which shell you get when you sign in — the shell is the program that takes your typed commands, like the librarian at the counter who listens to what you ask for.",
    "example": "chsh -s [shell]",
    "keywords": [
      "change",
      "login",
      "shell",
      "bash",
      "default"
    ]
  },
  {
    "id": "cmd-chfn",
    "name": "chfn",
    "standsFor": "Change finger information",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Updates the real name and contact info attached to an account, like filling in the name on a reader's library card.",
    "example": "chfn [user]",
    "keywords": [
      "profile",
      "name",
      "contact",
      "info",
      "user"
    ]
  },
  {
    "id": "cmd-newgrp",
    "name": "newgrp",
    "standsFor": "New group",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Switches which reading group you're acting as right now, so new files you make belong to that group.",
    "example": "newgrp [group]",
    "keywords": [
      "switch",
      "active",
      "group",
      "session"
    ]
  },
  {
    "id": "cmd-newusers",
    "name": "newusers",
    "standsFor": "",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Creates a whole list of accounts at once from a file, like signing up a whole reading group from a roster.",
    "example": "newusers [file]",
    "keywords": [
      "batch",
      "create",
      "multiple",
      "users",
      "accounts"
    ]
  },
  {
    "id": "cmd-chpasswd",
    "name": "chpasswd",
    "standsFor": "Change password",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Sets passwords for a bunch of accounts at once, from a list of names and passwords — like handing out new card PINs to a whole group at once.",
    "example": "chpasswd",
    "keywords": [
      "batch",
      "passwords",
      "bulk",
      "update",
      "accounts"
    ]
  },
  {
    "id": "cmd-users",
    "name": "users",
    "standsFor": "",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Shows who's signed in right now, all on one line — like a quick headcount of readers in the library.",
    "example": "users",
    "keywords": [
      "logged",
      "online",
      "active",
      "who",
      "list"
    ]
  },
  {
    "id": "cmd-pinky",
    "name": "pinky",
    "standsFor": "",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Looks up who's signed in and shows a little more about each person — their real name and how long they've been idle.",
    "example": "pinky",
    "keywords": [
      "logged",
      "lookup",
      "details",
      "users",
      "online"
    ]
  },
  {
    "id": "cmd-chmod",
    "name": "chmod",
    "standsFor": "Change mode",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Sets who can open, change, or run a file — like writing the sign-out list for that book. The numbers are the combination: 7 lets someone read, change, and run it; 5 lets them read and run it; 0 locks them out.",
    "example": "chmod [mode] [file]",
    "linuxDeckPrompt": "Change file permissions",
    "keywords": [
      "permissions",
      "access",
      "lock",
      "executable",
      "mode"
    ]
  },
  {
    "id": "cmd-chown",
    "name": "chown",
    "standsFor": "Change owner",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Hands a file or shelf to someone else to own, like giving a book to a different reader.",
    "example": "chown [user] [file]",
    "linuxDeckPrompt": "Change file owner",
    "keywords": [
      "owner",
      "ownership",
      "transfer",
      "assign",
      "file"
    ]
  },
  {
    "id": "cmd-chgrp",
    "name": "chgrp",
    "standsFor": "Change group",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Changes which reading group owns a file, without changing the person who owns it.",
    "example": "chgrp [group] [file]",
    "keywords": [
      "group",
      "owner",
      "ownership",
      "change",
      "file"
    ]
  },
  {
    "id": "cmd-umask",
    "name": "umask",
    "standsFor": "User file-creation mask",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Sets the default sign-out list for every new book you add to a shelf from now on — the permissions that go on automatically before you touch them.",
    "example": "umask",
    "linuxDeckPrompt": "Set default file permissions",
    "keywords": [
      "default",
      "permissions",
      "mask",
      "new",
      "files"
    ]
  },
  {
    "id": "cmd-getfacl",
    "name": "getfacl",
    "standsFor": "Get file access control list",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Shows the full permission list on a file, including the extra fine-grained rules — like reading the whole sign-out list for that book.",
    "example": "getfacl [file]",
    "keywords": [
      "acl",
      "permissions",
      "view",
      "list",
      "access"
    ]
  },
  {
    "id": "cmd-setfacl",
    "name": "setfacl",
    "standsFor": "Set file access control list",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Adds a special permission for one person or group on a file, without changing who owns it — like adding one name to the book's sign-out list.",
    "example": "setfacl -m [permission] [file]",
    "keywords": [
      "acl",
      "permissions",
      "grant",
      "share",
      "access"
    ]
  },
  {
    "id": "cmd-chattr",
    "name": "chattr",
    "standsFor": "Change attributes",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Sets a special flag on a file, like +i which locks it so nobody — not even the owner — can change or delete it until the flag comes off.",
    "example": "chattr [operation] [file]",
    "linuxDeckPrompt": "Modify file attributes",
    "keywords": [
      "immutable",
      "lock",
      "protect",
      "attributes",
      "flags"
    ]
  },
  {
    "id": "cmd-lsattr",
    "name": "lsattr",
    "standsFor": "List attributes",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Shows the special flags set on a file, like checking whether a book is locked against changes.",
    "example": "lsattr [file]",
    "linuxDeckPrompt": "View file attributes",
    "keywords": [
      "attributes",
      "flags",
      "immutable",
      "view",
      "check"
    ]
  },
  {
    "id": "cmd-getcap",
    "name": "getcap",
    "standsFor": "Get capabilities",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Shows the special powers given to a program file — little permissions that let it do one grown-up job without being the owner. The example checks ping, a program kept on the library's shared program shelf.",
    "example": "getcap [file]",
    "keywords": [
      "capabilities",
      "privileges",
      "permissions",
      "check",
      "program"
    ]
  },
  {
    "id": "cmd-setcap",
    "name": "setcap",
    "standsFor": "Set capabilities",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Gives a program one special power, so it can do its one grown-up job without being the owner.",
    "example": "setcap [capability] [file]",
    "keywords": [
      "capabilities",
      "privileges",
      "grant",
      "superpower",
      "program"
    ]
  },
  {
    "id": "cmd-sudo",
    "name": "sudo",
    "standsFor": "Superuser do",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Runs one command with the owner's keys — like borrowing the owner's keys to open one locked door, just this once.",
    "example": "sudo [command]",
    "linuxDeckPrompt": "Execute command as superuser",
    "keywords": [
      "admin",
      "root",
      "superuser",
      "privilege",
      "run"
    ]
  },
  {
    "id": "cmd-su",
    "name": "su",
    "standsFor": "Substitute user",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Switches you to a different account — the owner's, unless you name someone else.",
    "example": "su [user]",
    "linuxDeckPrompt": "Switch user",
    "keywords": [
      "switch",
      "user",
      "root",
      "admin",
      "login"
    ]
  },
  {
    "id": "cmd-visudo",
    "name": "visudo",
    "standsFor": "Visual sudo",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Opens the owner's permissions file in a safe editor that checks your spelling before saving, so a typo can't lock everyone out.",
    "example": "visudo",
    "keywords": [
      "edit",
      "sudoers",
      "admin",
      "permissions",
      "safe"
    ]
  },
  {
    "id": "cmd-who",
    "name": "who",
    "standsFor": "",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Shows who's signed in right now, and which reading table each reader is sitting at.",
    "example": "who",
    "linuxDeckPrompt": "Show currently logged-in users",
    "keywords": [
      "logged",
      "sessions",
      "online",
      "users",
      "terminals"
    ]
  },
  {
    "id": "cmd-w",
    "name": "w",
    "standsFor": "",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Shows who's signed in, what each person is running, and how busy the library is.",
    "example": "w",
    "linuxDeckPrompt": "Display user activity information",
    "keywords": [
      "logged",
      "activity",
      "online",
      "users",
      "running"
    ]
  },
  {
    "id": "cmd-last",
    "name": "last",
    "standsFor": "",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Shows the sign-in book of recent visits — who signed in, when, and when they left.",
    "example": "last",
    "linuxDeckPrompt": "Show recent login records",
    "keywords": [
      "history",
      "logins",
      "recent",
      "sessions",
      "audit"
    ]
  },
  {
    "id": "cmd-lastlog",
    "name": "lastlog",
    "standsFor": "",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Shows the last time every account signed in, so you can spot cards nobody has used in ages.",
    "example": "lastlog",
    "keywords": [
      "recent",
      "login",
      "inactive",
      "accounts",
      "check"
    ]
  },
  {
    "id": "cmd-finger",
    "name": "finger",
    "standsFor": "",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Shows what the library knows about a person — their real name, their own shelf, and when they last signed in.",
    "example": "finger",
    "linuxDeckPrompt": "Display user information",
    "keywords": [
      "profile",
      "info",
      "user",
      "details",
      "lookup"
    ]
  },
  {
    "id": "cmd-wall",
    "name": "wall",
    "standsFor": "Write all",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Sends a message to every person signed in right now — it pops up on all their screens at once, like an announcement over the library loudspeaker.",
    "example": "wall [message]",
    "keywords": [
      "broadcast",
      "message",
      "announce",
      "everyone",
      "all"
    ]
  },
  {
    "id": "cmd-sudoedit",
    "name": "sudoedit",
    "standsFor": "Superuser do edit",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Lets you safely edit a file that belongs to the system — like the address book that maps website names to numbers — using your own editor.",
    "example": "sudoedit [file]",
    "keywords": [
      "edit",
      "system",
      "admin",
      "file",
      "safe"
    ]
  },
  {
    "id": "cmd-runuser",
    "name": "runuser",
    "standsFor": "",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Runs a command as a different user, from a script or a service — like asking someone else to do one job for you.",
    "example": "runuser -u [user] [command]",
    "keywords": [
      "run",
      "as",
      "user",
      "account",
      "script"
    ]
  },
  {
    "id": "cmd-pwck",
    "name": "pwck",
    "standsFor": "Password check",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Account file checks",
    "description": "Checks the library's list of accounts for mistakes — broken lines, duplicate numbers, or missing home shelves.",
    "example": "pwck",
    "keywords": [
      "verify",
      "check",
      "passwd",
      "accounts",
      "errors"
    ]
  },
  {
    "id": "cmd-grpck",
    "name": "grpck",
    "standsFor": "Group check",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Account file checks",
    "description": "Checks the library's list of reading groups for mistakes, the same way pwck checks the accounts.",
    "example": "grpck",
    "keywords": [
      "verify",
      "check",
      "groups",
      "errors"
    ]
  },
  {
    "id": "cmd-vipw",
    "name": "vipw",
    "standsFor": "Visual password",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Account file checks",
    "description": "Opens the accounts list in a safe editor that locks it while you work, so two people with the owner's keys can't break it at the same time.",
    "example": "vipw",
    "keywords": [
      "edit",
      "passwd",
      "accounts",
      "safe",
      "lock"
    ]
  },
  {
    "id": "cmd-vigr",
    "name": "vigr",
    "standsFor": "Visual group",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Account file checks",
    "description": "Opens the reading-groups list in a safe editor that locks it while you work.",
    "example": "vigr",
    "keywords": [
      "edit",
      "groups",
      "safe",
      "lock"
    ]
  },
  {
    "id": "cmd-ps",
    "name": "ps",
    "standsFor": "Process status",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Shows a snapshot of every program running right now — like a headcount of every reader at work in the library.",
    "example": "ps",
    "linuxDeckPrompt": "Show current processes",
    "keywords": [
      "processes",
      "running",
      "programs",
      "list",
      "snapshot"
    ]
  },
  {
    "id": "cmd-top",
    "name": "top",
    "standsFor": "Table of processes",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Shows a live table of what's running, updating every second, with the busiest programs on top — like a notice board that keeps rewriting itself.",
    "example": "top",
    "linuxDeckPrompt": "Real-time display of system processes",
    "keywords": [
      "processes",
      "live",
      "cpu",
      "memory",
      "monitor"
    ]
  },
  {
    "id": "cmd-htop",
    "name": "htop",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "A prettier, color version of top — same live notice board, easier to read, and you can scroll through it.",
    "example": "htop",
    "linuxDeckPrompt": "Interactive process monitoring tool",
    "keywords": [
      "processes",
      "interactive",
      "monitor",
      "cpu",
      "memory"
    ]
  },
  {
    "id": "cmd-atop",
    "name": "atop",
    "standsFor": "Advanced top",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "A monitor that watches the library over time and lets you rewind to see what was busy an hour ago.",
    "example": "atop",
    "keywords": [
      "history",
      "performance",
      "rewind",
      "monitor",
      "processes"
    ]
  },
  {
    "id": "cmd-pgrep",
    "name": "pgrep",
    "standsFor": "Process grep",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Finds a running program by name and prints its number (its PID) — like looking up a reader by name to get their card number.",
    "example": "pgrep [process_name]",
    "keywords": [
      "find",
      "process",
      "pid",
      "search",
      "running"
    ]
  },
  {
    "id": "cmd-pidof",
    "name": "pidof",
    "standsFor": "Process ID of",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Prints the ID number of a running program — same job as pgrep, just the number, nothing else.",
    "example": "pidof [process_name]",
    "keywords": [
      "pid",
      "number",
      "process",
      "running",
      "program"
    ]
  },
  {
    "id": "cmd-pstree",
    "name": "pstree",
    "standsFor": "Process tree",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Draws running programs as a family tree, so you can see which program started which — parents and children.",
    "example": "pstree",
    "keywords": [
      "tree",
      "processes",
      "parent",
      "children",
      "hierarchy"
    ]
  },
  {
    "id": "cmd-lsof",
    "name": "lsof",
    "standsFor": "List open files",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Lists every file and network connection a program has open right now — like checking which books a reader has checked out.",
    "example": "lsof [file]",
    "keywords": [
      "open",
      "files",
      "ports",
      "process",
      "using"
    ]
  },
  {
    "id": "cmd-fuser",
    "name": "fuser",
    "standsFor": "File user",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Shows which program is using a file or a disk right now — like finding out who has the library's only copy of a book checked out.",
    "example": "fuser [file]",
    "keywords": [
      "using",
      "busy",
      "locked",
      "file",
      "process"
    ]
  },
  {
    "id": "cmd-pidstat",
    "name": "pidstat",
    "standsFor": "Process ID statistics",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Reports how much work one program is doing — how hard it's pushing the CPU and the disk — over a few seconds.",
    "example": "pidstat",
    "keywords": [
      "stats",
      "cpu",
      "process",
      "usage",
      "monitor"
    ]
  },
  {
    "id": "cmd-kill",
    "name": "kill",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Stops a running program by its ID number — like calling a reader by number and asking them to leave.",
    "example": "kill [PID]",
    "linuxDeckPrompt": "Terminate process by PID",
    "keywords": [
      "stop",
      "terminate",
      "kill",
      "process",
      "pid"
    ]
  },
  {
    "id": "cmd-killall",
    "name": "killall",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Stops every running copy of a program by name — like asking every reader with the same name to leave at once.",
    "example": "killall [process_name]",
    "linuxDeckPrompt": "Kill all processes by name",
    "keywords": [
      "stop",
      "kill",
      "name",
      "all",
      "program"
    ]
  },
  {
    "id": "cmd-pkill",
    "name": "pkill",
    "standsFor": "Process kill",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Stops every running program whose name matches a pattern you give it — like asking all readers matching a name to leave.",
    "example": "pkill [process_name]",
    "keywords": [
      "stop",
      "kill",
      "pattern",
      "name",
      "process"
    ]
  },
  {
    "id": "cmd-nice",
    "name": "nice",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Starts a program politely, asking it to take a smaller share of the library's attention so other work doesn't slow down.",
    "example": "nice [command]",
    "linuxDeckPrompt": "Start process with priority",
    "keywords": [
      "priority",
      "polite",
      "cpu",
      "start",
      "slow"
    ]
  },
  {
    "id": "cmd-renice",
    "name": "renice",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Changes how much attention a program that's already running gets — turns its share up or down.",
    "example": "renice [priority] -p [PID]",
    "linuxDeckPrompt": "Change priority of running process",
    "keywords": [
      "priority",
      "change",
      "running",
      "cpu",
      "process"
    ]
  },
  {
    "id": "cmd-nohup",
    "name": "nohup",
    "standsFor": "No hangup",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Starts a long job that keeps running even after you close your terminal — like leaving a request at the counter and walking away while the librarians still work on it.",
    "example": "nohup [command]",
    "linuxDeckPrompt": "Run process immune to hangups",
    "keywords": [
      "background",
      "keep",
      "running",
      "disconnect",
      "hangup"
    ]
  },
  {
    "id": "cmd-bg",
    "name": "bg",
    "standsFor": "Background",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Sends a paused job to the back to keep running while you do other things — like letting the librarians work behind the counter while you browse.",
    "example": "bg [job_id]",
    "keywords": [
      "background",
      "resume",
      "job",
      "continue"
    ]
  },
  {
    "id": "cmd-fg",
    "name": "fg",
    "standsFor": "Foreground",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Brings a job running in the back up to the front, so you can see it and talk to it again.",
    "example": "fg [job_id]",
    "linuxDeckPrompt": "Bring background task to foreground",
    "keywords": [
      "foreground",
      "bring",
      "front",
      "job",
      "resume"
    ]
  },
  {
    "id": "cmd-jobs",
    "name": "jobs",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Lists the jobs you've got running or paused in this terminal — your own little list of work in progress.",
    "example": "jobs",
    "linuxDeckPrompt": "View background tasks",
    "keywords": [
      "list",
      "background",
      "paused",
      "tasks",
      "running"
    ]
  },
  {
    "id": "cmd-screen",
    "name": "screen",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Opens a terminal session that keeps running even if your connection drops — like leaving your reading table exactly as it was and coming back to it later.",
    "example": "screen",
    "keywords": [
      "session",
      "detach",
      "keep",
      "running",
      "terminal"
    ]
  },
  {
    "id": "cmd-tmux",
    "name": "tmux",
    "standsFor": "Terminal multiplexer",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Splits one terminal into panes and tabs, and lets you leave and come back to a session later — like having several reading tables side by side.",
    "example": "tmux",
    "keywords": [
      "split",
      "panes",
      "tabs",
      "session",
      "terminal"
    ]
  },
  {
    "id": "cmd-timeout",
    "name": "timeout",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Runs a command with a stopwatch — if it takes longer than you said, it gets stopped automatically.",
    "example": "timeout [time] [command]",
    "keywords": [
      "limit",
      "time",
      "stop",
      "timer",
      "command"
    ]
  },
  {
    "id": "cmd-ionice",
    "name": "ionice",
    "standsFor": "Input/output nice",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Sets how politely a program uses the disk, so a big backup doesn't hog the wing and slow everything else down.",
    "example": "ionice [command]",
    "keywords": [
      "disk",
      "priority",
      "polite",
      "io",
      "speed"
    ]
  },
  {
    "id": "cmd-taskset",
    "name": "taskset",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Pins a program to one or two of the library's librarians (CPU cores), so it stays out of the other programs' way.",
    "example": "taskset -c [cpu] [command]",
    "keywords": [
      "cpu",
      "cores",
      "pin",
      "affinity",
      "process"
    ]
  },
  {
    "id": "cmd-ulimit",
    "name": "ulimit",
    "standsFor": "User limit",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Sets the biggest amount of stuff a program is allowed to grab — like how many books it can have open at once.",
    "example": "ulimit",
    "keywords": [
      "limits",
      "resources",
      "max",
      "files",
      "memory"
    ]
  },
  {
    "id": "cmd-disown",
    "name": "disown",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Unties a background job from your terminal, so closing the window won't stop it.",
    "example": "disown",
    "linuxDeckPrompt": "Detach process from terminal",
    "keywords": [
      "detach",
      "untie",
      "background",
      "keep",
      "job"
    ]
  },
  {
    "id": "cmd-wait",
    "name": "wait",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Makes a script sit still until its background jobs finish — like a librarian waiting for every helper behind the counter to finish their work.",
    "example": "wait",
    "keywords": [
      "wait",
      "finish",
      "background",
      "script",
      "pause"
    ]
  },
  {
    "id": "cmd-time",
    "name": "time",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Times how long a command takes to run, like a stopwatch for your terminal.",
    "example": "time [command]",
    "keywords": [
      "measure",
      "stopwatch",
      "duration",
      "benchmark",
      "speed"
    ]
  },
  {
    "id": "cmd-prlimit",
    "name": "prlimit",
    "standsFor": "Process resource limit",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Checks or changes the limits on a program that's already running — like changing a reader's borrowing limit halfway through their visit.",
    "example": "prlimit",
    "keywords": [
      "limits",
      "running",
      "process",
      "change",
      "resources"
    ]
  },
  {
    "id": "cmd-systemctl",
    "name": "systemctl",
    "standsFor": "System control",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "How you tell the library's staff what to do — the helper programs that run all the time, like the web server. Start them, stop them, check if they're healthy.",
    "example": "systemctl",
    "keywords": [
      "service",
      "start",
      "stop",
      "restart",
      "status"
    ]
  },
  {
    "id": "cmd-service",
    "name": "service",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "The older way to tell the library's staff what to do — does the same start, stop, and check job as systemctl.",
    "example": "service [service] status",
    "keywords": [
      "service",
      "start",
      "stop",
      "restart",
      "background"
    ]
  },
  {
    "id": "cmd-journalctl",
    "name": "journalctl",
    "standsFor": "Journal control",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Reads the logbook the library keeps about its staff — what they did, and when they complained.",
    "example": "journalctl",
    "linuxDeckPrompt": "View system logs (systemd)",
    "keywords": [
      "logs",
      "systemd",
      "errors",
      "service",
      "diary"
    ]
  },
  {
    "id": "cmd-hostnamectl",
    "name": "hostnamectl",
    "standsFor": "Hostname control",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Shows or changes this library's name, the one other branches see — like the name on the sign above the front door.",
    "example": "hostnamectl",
    "keywords": [
      "hostname",
      "computer",
      "name",
      "change",
      "rename"
    ]
  },
  {
    "id": "cmd-timedatectl",
    "name": "timedatectl",
    "standsFor": "Time and date control",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Shows or changes the library's clock and time zone.",
    "example": "timedatectl",
    "linuxDeckPrompt": "Set system time",
    "keywords": [
      "clock",
      "time",
      "timezone",
      "date",
      "sync"
    ]
  },
  {
    "id": "cmd-localectl",
    "name": "localectl",
    "standsFor": "Locale control",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Shows or changes the library's language and keyboard layout.",
    "example": "localectl",
    "keywords": [
      "language",
      "keyboard",
      "locale",
      "region"
    ]
  },
  {
    "id": "cmd-loginctl",
    "name": "loginctl",
    "standsFor": "Login control",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Shows who's signed in right now, and lets the owner manage those sign-ins.",
    "example": "loginctl list-sessions",
    "keywords": [
      "sessions",
      "logged",
      "users",
      "manage",
      "login"
    ]
  },
  {
    "id": "cmd-systemd-analyze",
    "name": "systemd-analyze",
    "standsFor": "System daemon analyze",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Shows how long the library took to open up, and which member of the staff was the slowpoke.",
    "example": "systemd-analyze",
    "linuxDeckPrompt": "Analyze system boot time",
    "keywords": [
      "boot",
      "startup",
      "slow",
      "speed",
      "time"
    ]
  },
  {
    "id": "cmd-systemd-run",
    "name": "systemd-run",
    "standsFor": "System daemon run",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Runs one command as a temporary member of staff, with its own limits — like hiring a helper librarian for one job.",
    "example": "systemd-run [command]",
    "keywords": [
      "temporary",
      "service",
      "background",
      "run"
    ]
  },
  {
    "id": "cmd-crontab",
    "name": "crontab",
    "standsFor": "Cron table",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Scheduling",
    "description": "Edits your schedule of jobs that run by themselves at set times — the library's duty roster for jobs that run on their own.",
    "example": "crontab -l",
    "keywords": [
      "schedule",
      "timer",
      "recurring",
      "repeating",
      "automation"
    ]
  },
  {
    "id": "cmd-at",
    "name": "at",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Scheduling",
    "description": "Schedules a command to run once, at a time you pick — like pinning a note on the duty roster that says 'do this at 2:30.'",
    "example": "at [time]",
    "keywords": [
      "schedule",
      "once",
      "later",
      "timer",
      "run"
    ]
  },
  {
    "id": "cmd-batch",
    "name": "batch",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Scheduling",
    "description": "Queues a job to run when the library isn't busy — it waits for a quiet moment, then starts.",
    "example": "batch",
    "keywords": [
      "queue",
      "idle",
      "quiet",
      "schedule",
      "later"
    ]
  },
  {
    "id": "cmd-anacron",
    "name": "anacron",
    "standsFor": "Anachronistic cron",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Scheduling",
    "description": "Runs the daily and weekly chores on a library that isn't always open — it catches up on what it missed while it was closed.",
    "example": "anacron",
    "keywords": [
      "daily",
      "weekly",
      "schedule",
      "missed",
      "chores"
    ]
  },
  {
    "id": "cmd-sleep",
    "name": "sleep",
    "standsFor": "",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Scheduling",
    "description": "Makes the terminal wait doing nothing for a few seconds — a nap for your script.",
    "example": "sleep [seconds]",
    "keywords": [
      "pause",
      "wait",
      "delay",
      "seconds",
      "nap"
    ]
  },
  {
    "id": "cmd-atq",
    "name": "atq",
    "standsFor": "At queue",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Scheduling",
    "description": "Lists the one-time jobs waiting in line to run.",
    "example": "atq",
    "keywords": [
      "list",
      "scheduled",
      "waiting",
      "queue",
      "jobs"
    ]
  },
  {
    "id": "cmd-atrm",
    "name": "atrm",
    "standsFor": "At remove",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Scheduling",
    "description": "Cancels a waiting one-time job by its number.",
    "example": "atrm [job_id]",
    "keywords": [
      "cancel",
      "remove",
      "delete",
      "scheduled",
      "job"
    ]
  },
  {
    "id": "cmd-free",
    "name": "free",
    "standsFor": "",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows how much memory the library has, how much is in use, and how much is free — like checking how many reading tables are still open.",
    "example": "free",
    "linuxDeckPrompt": "Show memory usage",
    "keywords": [
      "memory",
      "ram",
      "used",
      "available",
      "swap"
    ]
  },
  {
    "id": "cmd-vmstat",
    "name": "vmstat",
    "standsFor": "Virtual memory statistics",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows a quick health report — how busy the librarians are, how much is swapping into the overflow basement, and how hard the wings are working.",
    "example": "vmstat",
    "linuxDeckPrompt": "Show system performance stats",
    "keywords": [
      "performance",
      "memory",
      "swap",
      "cpu",
      "health"
    ]
  },
  {
    "id": "cmd-iostat",
    "name": "iostat",
    "standsFor": "Input/output statistics",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows how hard each wing is working — how much it's being read from and written to, and how long readers wait for it.",
    "example": "iostat",
    "linuxDeckPrompt": "Display CPU and disk performance",
    "keywords": [
      "disk",
      "io",
      "read",
      "write",
      "speed"
    ]
  },
  {
    "id": "cmd-mpstat",
    "name": "mpstat",
    "standsFor": "Multiprocessor statistics",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows how busy each librarian (CPU core) is, one by one.",
    "example": "mpstat",
    "linuxDeckPrompt": "Display CPU usage breakdown / Display multi-core CPU load",
    "keywords": [
      "cpu",
      "cores",
      "processor",
      "load",
      "usage"
    ]
  },
  {
    "id": "cmd-sar",
    "name": "sar",
    "standsFor": "System activity reporter",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Reads the library's old health records, or takes a fresh sample — like looking at last week's logbook.",
    "example": "sar",
    "linuxDeckPrompt": "Collect system performance data / Monitor CPU in real-time",
    "keywords": [
      "history",
      "performance",
      "cpu",
      "stats",
      "report"
    ]
  },
  {
    "id": "cmd-uptime",
    "name": "uptime",
    "standsFor": "",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows how long the library has been open since it last closed and reopened, and how busy it is right now.",
    "example": "uptime",
    "linuxDeckPrompt": "Show system uptime",
    "keywords": [
      "awake",
      "running",
      "load",
      "restarted",
      "time"
    ]
  },
  {
    "id": "cmd-dstat",
    "name": "dstat",
    "standsFor": "Device statistics",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows a live table of everything at once — librarians, shelves, and other branches — like one big notice board with every gauge on it.",
    "example": "dstat",
    "linuxDeckPrompt": "Versatile resource monitoring tool",
    "keywords": [
      "dashboard",
      "live",
      "cpu",
      "disk",
      "network"
    ]
  },
  {
    "id": "cmd-numactl",
    "name": "numactl",
    "standsFor": "NUMA control",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows how the library's reading tables are arranged across its librarians, or ties a program to one set of librarians and their tables.",
    "example": "numactl --hardware",
    "keywords": [
      "numa",
      "memory",
      "cpu",
      "nodes",
      "pin"
    ]
  },
  {
    "id": "cmd-nproc",
    "name": "nproc",
    "standsFor": "Number of processors",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Prints how many librarians (CPU cores) the library has.",
    "example": "nproc",
    "keywords": [
      "cores",
      "cpu",
      "count",
      "processors",
      "number"
    ]
  },
  {
    "id": "cmd-iotop",
    "name": "iotop",
    "standsFor": "Input/output top",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows which readers are pulling books off the shelves and putting them back the hardest right now, live — like a notice board showing who's using the shelves hardest.",
    "example": "iotop",
    "linuxDeckPrompt": "Monitor disk I/O in real-time",
    "keywords": [
      "disk",
      "io",
      "live",
      "reading",
      "writing"
    ]
  },
  {
    "id": "cmd-perf",
    "name": "perf",
    "standsFor": "Performance",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Watches the librarians at a deep level to find out what's making the library slow — like listening in close to find the hold-up.",
    "example": "perf top",
    "keywords": [
      "profile",
      "slow",
      "cpu",
      "performance",
      "analyze"
    ]
  },
  {
    "id": "cmd-cpupower",
    "name": "cpupower",
    "standsFor": "CPU power",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows how fast the librarians are working, and switches them between saving power and going full speed.",
    "example": "cpupower frequency-info",
    "keywords": [
      "frequency",
      "speed",
      "power",
      "battery",
      "cpu"
    ]
  },
  {
    "id": "cmd-lscpu",
    "name": "lscpu",
    "standsFor": "List CPU",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Prints a fact sheet about the library's librarians: what kind they are, how many there are, and how fast they work.",
    "example": "lscpu",
    "keywords": [
      "cpu",
      "processor",
      "cores",
      "model",
      "hardware"
    ]
  },
  {
    "id": "cmd-lsmem",
    "name": "lsmem",
    "standsFor": "List memory",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Lists the blocks of reading tables (RAM) in the library and whether each one is switched on.",
    "example": "lsmem",
    "keywords": [
      "memory",
      "ram",
      "blocks",
      "hardware",
      "list"
    ]
  },
  {
    "id": "cmd-lspci",
    "name": "lspci",
    "standsFor": "List PCI",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Lists the parts fitted inside the library — graphics card, network card, and the rest — like reading the equipment list.",
    "example": "lspci",
    "keywords": [
      "pci",
      "graphics",
      "network",
      "cards",
      "hardware"
    ]
  },
  {
    "id": "cmd-lsusb",
    "name": "lsusb",
    "standsFor": "List USB",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Lists everything plugged into the USB ports right now.",
    "example": "lsusb",
    "keywords": [
      "usb",
      "plugged",
      "devices",
      "ports",
      "list"
    ]
  },
  {
    "id": "cmd-lshw",
    "name": "lshw",
    "standsFor": "List hardware",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Prints a full inventory of the library's hardware — every part, all in one list.",
    "example": "lshw",
    "keywords": [
      "hardware",
      "inventory",
      "parts",
      "specs",
      "list"
    ]
  },
  {
    "id": "cmd-dmidecode",
    "name": "dmidecode",
    "standsFor": "Desktop Management Interface decode",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Reads the little label the maker fixed to the library — brand, model, serial number, and which memory slots are filled.",
    "example": "dmidecode",
    "keywords": [
      "bios",
      "serial",
      "model",
      "manufacturer",
      "hardware"
    ]
  },
  {
    "id": "cmd-hdparm",
    "name": "hdparm",
    "standsFor": "Hard disk parameters",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Checks a hard drive's settings and tests how fast it can read — like a speed test for the wing.",
    "example": "hdparm [device]",
    "keywords": [
      "drive",
      "speed",
      "test",
      "disk",
      "settings"
    ]
  },
  {
    "id": "cmd-smartctl",
    "name": "smartctl",
    "standsFor": "SMART control",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Reads a drive's own health logbook — the warnings it keeps about itself — so you can spot a failing wing before it gives out.",
    "example": "smartctl -a [device]",
    "keywords": [
      "health",
      "failing",
      "disk",
      "drive",
      "smart"
    ]
  },
  {
    "id": "cmd-ethtool",
    "name": "ethtool",
    "standsFor": "Ethernet tool",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Shows or changes the settings on the wired network plug — how fast it talks, and whether it can wake the library up.",
    "example": "ethtool [interface]",
    "keywords": [
      "ethernet",
      "cable",
      "link",
      "speed",
      "network"
    ]
  },
  {
    "id": "cmd-lsscsi",
    "name": "lsscsi",
    "standsFor": "List SCSI",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Lists all the disks and storage gadgets the library sees, and the names it gave them.",
    "example": "lsscsi",
    "keywords": [
      "scsi",
      "disks",
      "storage",
      "drives",
      "list"
    ]
  },
  {
    "id": "cmd-sensors",
    "name": "sensors",
    "standsFor": "",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Reads the library's thermometers — how hot the librarians are, and how fast the fans are spinning.",
    "example": "sensors",
    "keywords": [
      "temperature",
      "heat",
      "fans",
      "thermometer",
      "cooling"
    ]
  },
  {
    "id": "cmd-getconf",
    "name": "getconf",
    "standsFor": "Get configuration",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Asks the library for one of its built-in facts, like how big one block of memory is.",
    "example": "getconf [variable]",
    "keywords": [
      "system",
      "limits",
      "config",
      "page",
      "facts"
    ]
  },
  {
    "id": "cmd-arch",
    "name": "arch",
    "standsFor": "Architecture",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Prints what kind of librarians run this library — like x86_64 for most machines.",
    "example": "arch",
    "keywords": [
      "architecture",
      "cpu",
      "64bit",
      "x86",
      "type"
    ]
  },
  {
    "id": "cmd-lsb-release",
    "name": "lsb_release",
    "standsFor": "Linux Standard Base release",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Prints which flavor of Linux this is, and which version — like reading the sign by the front door.",
    "example": "lsb_release -a",
    "keywords": [
      "distro",
      "ubuntu",
      "version",
      "linux",
      "flavor"
    ]
  },
  {
    "id": "cmd-uname",
    "name": "uname",
    "standsFor": "Unix name",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Prints facts about the library's foundations and wiring (the kernel) — its version, and what kind of machine it's running on.",
    "example": "uname",
    "linuxDeckPrompt": "View kernel version",
    "keywords": [
      "kernel",
      "version",
      "system",
      "os",
      "info"
    ]
  },
  {
    "id": "cmd-dmesg",
    "name": "dmesg",
    "standsFor": "Diagnostic message",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Shows the messages the kernel wrote while the library was opening up — what hardware it found, and what it grumbled about.",
    "example": "dmesg",
    "linuxDeckPrompt": "View kernel ring buffer logs",
    "keywords": [
      "boot",
      "kernel",
      "hardware",
      "messages",
      "logs"
    ]
  },
  {
    "id": "cmd-lsmod",
    "name": "lsmod",
    "standsFor": "List modules",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Lists the drivers loaded into the kernel right now — the little helper programs that let the library talk to its hardware.",
    "example": "lsmod",
    "linuxDeckPrompt": "List loaded kernel modules",
    "keywords": [
      "drivers",
      "kernel",
      "modules",
      "loaded",
      "list"
    ]
  },
  {
    "id": "cmd-modprobe",
    "name": "modprobe",
    "standsFor": "Module probe",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Loads a driver into the library's wiring (or takes one out), bringing along anything else it needs.",
    "example": "modprobe [module]",
    "linuxDeckPrompt": "Load kernel module",
    "keywords": [
      "load",
      "unload",
      "driver",
      "kernel",
      "module"
    ]
  },
  {
    "id": "cmd-insmod",
    "name": "insmod",
    "standsFor": "Insert module",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Loads one single driver file straight into the kernel, without checking what else it needs.",
    "example": "insmod [file]",
    "keywords": [
      "insert",
      "load",
      "driver",
      "kernel",
      "module"
    ]
  },
  {
    "id": "cmd-rmmod",
    "name": "rmmod",
    "standsFor": "Remove module",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Unloads a driver from the kernel, when nothing is using it anymore.",
    "example": "rmmod [module]",
    "keywords": [
      "remove",
      "unload",
      "driver",
      "kernel",
      "module"
    ]
  },
  {
    "id": "cmd-sysctl",
    "name": "sysctl",
    "standsFor": "System control",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Reads or changes the kernel's live settings — the knobs and dials the library's core runs on.",
    "example": "sysctl [variable]",
    "linuxDeckPrompt": "Modify kernel parameters",
    "keywords": [
      "kernel",
      "settings",
      "tune",
      "parameters",
      "live"
    ]
  },
  {
    "id": "cmd-reboot",
    "name": "reboot",
    "standsFor": "",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Restarts the library cleanly — closes everything properly, then opens it up again.",
    "example": "reboot",
    "linuxDeckPrompt": "Restart system",
    "keywords": [
      "restart",
      "reboot",
      "computer",
      "reset",
      "machine"
    ]
  },
  {
    "id": "cmd-shutdown",
    "name": "shutdown",
    "standsFor": "",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Closes the library cleanly — or restarts it — right now or at a time you pick.",
    "example": "shutdown [time]",
    "linuxDeckPrompt": "Power off system",
    "keywords": [
      "poweroff",
      "turn",
      "off",
      "shutdown",
      "stop"
    ]
  },
  {
    "id": "cmd-poweroff",
    "name": "poweroff",
    "standsFor": "",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Turns the library's power off, after closing everything properly.",
    "example": "poweroff",
    "keywords": [
      "turn",
      "off",
      "power",
      "shutdown",
      "computer"
    ]
  },
  {
    "id": "cmd-init",
    "name": "init",
    "standsFor": "Initialization",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "The very first program the library starts — also used to switch the whole library between modes, like off or reboot.",
    "example": "init [runlevel]",
    "keywords": [
      "runlevel",
      "boot",
      "startup",
      "first",
      "system"
    ]
  },
  {
    "id": "cmd-modinfo",
    "name": "modinfo",
    "standsFor": "Module information",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Shows the fact sheet for a driver: what it does, who wrote it, and what settings it takes.",
    "example": "modinfo [module]",
    "keywords": [
      "driver",
      "details",
      "module",
      "info",
      "kernel"
    ]
  },
  {
    "id": "cmd-depmod",
    "name": "depmod",
    "standsFor": "Dependency modules",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Rebuilds the map that says which drivers need which other drivers, so they load in the right order.",
    "example": "depmod",
    "linuxDeckPrompt": "Generate module dependency file",
    "keywords": [
      "dependencies",
      "drivers",
      "modules",
      "map",
      "kernel"
    ]
  },
  {
    "id": "cmd-dracut",
    "name": "dracut",
    "standsFor": "",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Rebuilds the little starter pack the library uses to open up — the first files it needs before it can read the main shelves.",
    "example": "dracut",
    "keywords": [
      "initramfs",
      "boot",
      "starter",
      "image",
      "rebuild"
    ]
  },
  {
    "id": "cmd-update-grub",
    "name": "update-grub",
    "standsFor": "Update Grand Unified Bootloader",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Rebuilds the menu the library shows when it first opens — the list of systems you can start.",
    "example": "update-grub",
    "keywords": [
      "bootloader",
      "startup",
      "menu",
      "grub",
      "boot"
    ]
  },
  {
    "id": "cmd-grub2-mkconfig",
    "name": "grub2-mkconfig",
    "standsFor": "GRUB 2 make configuration",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Builds a fresh copy of that same opening menu, from the settings file.",
    "example": "grub2-mkconfig -o [file]",
    "linuxDeckPrompt": "Generate GRUB configuration file",
    "keywords": [
      "grub",
      "boot",
      "menu",
      "config",
      "generate"
    ]
  },
  {
    "id": "cmd-efibootmgr",
    "name": "efibootmgr",
    "standsFor": "EFI boot manager",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Shows or changes the boot order stored in the library's own firmware — which disk it tries to start from first.",
    "example": "efibootmgr",
    "keywords": [
      "uefi",
      "boot",
      "order",
      "firmware",
      "bios"
    ]
  },
  {
    "id": "cmd-fwupdmgr",
    "name": "fwupdmgr",
    "standsFor": "Firmware update manager",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Checks for official updates for the library's built-in software (firmware) and installs them.",
    "example": "fwupdmgr get-updates",
    "keywords": [
      "firmware",
      "bios",
      "update",
      "hardware",
      "upgrade"
    ]
  },
  {
    "id": "cmd-halt",
    "name": "halt",
    "standsFor": "",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Brings the library to a full stop — everything off, nothing running.",
    "example": "halt",
    "keywords": [
      "stop",
      "halt",
      "freeze",
      "shutdown",
      "machine"
    ]
  },
  {
    "id": "cmd-strace",
    "name": "strace",
    "standsFor": "System call trace",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Tracing & debugging",
    "description": "Watches a program and writes down every single thing it asks the kernel to do — like following a reader around with a notebook to find out where they get stuck.",
    "example": "strace [command]",
    "keywords": [
      "trace",
      "debug",
      "syscalls",
      "watch",
      "program"
    ]
  },
  {
    "id": "cmd-ltrace",
    "name": "ltrace",
    "standsFor": "Library call trace",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Tracing & debugging",
    "description": "Watches a program and writes down every helper function it calls — like strace, but for the library helpers.",
    "example": "ltrace [command]",
    "keywords": [
      "trace",
      "library",
      "calls",
      "debug",
      "program"
    ]
  },
  {
    "id": "cmd-lsblk",
    "name": "lsblk",
    "standsFor": "List block devices",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Lists every disk and partition in the library as a little tree, with sizes and where each one is attached.",
    "example": "lsblk",
    "linuxDeckPrompt": "List block devices",
    "keywords": [
      "disks",
      "partitions",
      "drives",
      "list",
      "tree"
    ]
  },
  {
    "id": "cmd-blkid",
    "name": "blkid",
    "standsFor": "Block device ID",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Shows each disk's ID number and what kind of shelving system it uses.",
    "example": "blkid",
    "linuxDeckPrompt": "Show device UUID",
    "keywords": [
      "uuid",
      "filesystem",
      "disk",
      "id",
      "label"
    ]
  },
  {
    "id": "cmd-fdisk",
    "name": "fdisk",
    "standsFor": "Fixed disk",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "The tool for slicing a disk into partitions — like marking off sections of a wing. It can erase a disk, so it asks you to be careful.",
    "example": "fdisk -l",
    "linuxDeckPrompt": "Disk partitioning tool",
    "keywords": [
      "partition",
      "slice",
      "disk",
      "divide",
      "drives"
    ]
  },
  {
    "id": "cmd-parted",
    "name": "parted",
    "standsFor": "Partition editor",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Slices and manages disk partitions, and works well with big modern disks.",
    "example": "parted [device]",
    "linuxDeckPrompt": "Partitioning tool",
    "keywords": [
      "partition",
      "slice",
      "gpt",
      "disk",
      "resize"
    ]
  },
  {
    "id": "cmd-gdisk",
    "name": "gdisk",
    "standsFor": "GPT fixed disk",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Edits the partition map on modern disks (the GPT kind) — fdisk's cousin for newer machines.",
    "example": "gdisk [device]",
    "keywords": [
      "gpt",
      "partition",
      "disk",
      "modern",
      "slice"
    ]
  },
  {
    "id": "cmd-sfdisk",
    "name": "sfdisk",
    "standsFor": "Scriptable fixed disk",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Saves a disk's partition map to a file, or copies a map onto another disk — made for scripts, not typing by hand.",
    "example": "sfdisk -l",
    "keywords": [
      "script",
      "backup",
      "partition",
      "table",
      "disk"
    ]
  },
  {
    "id": "cmd-partprobe",
    "name": "partprobe",
    "standsFor": "Partition probe",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Tells the library to re-read a disk's partition map right now, so new slices show up without a restart.",
    "example": "partprobe",
    "keywords": [
      "reload",
      "refresh",
      "partitions",
      "disk",
      "kernel"
    ]
  },
  {
    "id": "cmd-cfdisk",
    "name": "cfdisk",
    "standsFor": "Curses fixed disk",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Edits disk partitions with a menu you drive with arrow keys — the friendliest of the disk slicers.",
    "example": "cfdisk [device]",
    "keywords": [
      "menu",
      "partition",
      "arrows",
      "disk",
      "slice"
    ]
  },
  {
    "id": "cmd-sgdisk",
    "name": "sgdisk",
    "standsFor": "Scriptable GPT disk",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Edits GPT partition maps from the command line, made for scripts and backups.",
    "example": "sgdisk -p [device]",
    "keywords": [
      "gpt",
      "script",
      "partition",
      "backup",
      "disk"
    ]
  },
  {
    "id": "cmd-wipefs",
    "name": "wipefs",
    "standsFor": "Wipe file system",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Erases the labels on a disk that say what shelving system it uses, so it can be reformatted fresh — the books on it can't be read again after that.",
    "example": "wipefs [device]",
    "keywords": [
      "erase",
      "wipe",
      "signature",
      "reformat",
      "disk"
    ]
  },
  {
    "id": "cmd-losetup",
    "name": "losetup",
    "standsFor": "Loop setup",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Pretends a disk-image file is a real disk, so you can slice it and open it like one.",
    "example": "losetup",
    "keywords": [
      "loop",
      "image",
      "iso",
      "virtual",
      "disk"
    ]
  },
  {
    "id": "cmd-df",
    "name": "df",
    "standsFor": "Disk free",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Shows how much shelf space is left on each disk — like checking how full every shelf is.",
    "example": "df",
    "linuxDeckPrompt": "Display disk space usage / Show disk space (human-readable)",
    "keywords": [
      "disk",
      "space",
      "free",
      "full",
      "storage"
    ]
  },
  {
    "id": "cmd-du",
    "name": "du",
    "standsFor": "Disk usage",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Adds up how much shelf space a folder and everything inside it takes up.",
    "example": "du [directory]",
    "linuxDeckPrompt": "Show directory size",
    "keywords": [
      "folder",
      "size",
      "space",
      "usage",
      "disk"
    ]
  },
  {
    "id": "cmd-mount",
    "name": "mount",
    "standsFor": "",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Attaches a disk or a shared folder to a spot in the library, so you can open it like any other folder — like opening the doorway where a new wing joins the building.",
    "example": "mount",
    "linuxDeckPrompt": "Mount filesystem / Mount NFS share / Mount ISO file",
    "keywords": [
      "attach",
      "connect",
      "open",
      "drive",
      "disk"
    ]
  },
  {
    "id": "cmd-umount",
    "name": "umount",
    "standsFor": "Unmount",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Safely detaches a disk or shared folder, so you can unplug it without losing anything.",
    "example": "umount [device]",
    "linuxDeckPrompt": "Unmount filesystem",
    "keywords": [
      "eject",
      "unplug",
      "detach",
      "safely",
      "drive"
    ]
  },
  {
    "id": "cmd-findmnt",
    "name": "findmnt",
    "standsFor": "Find mount",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Shows everything that's attached right now, as a tree — every disk and where it hangs in the library.",
    "example": "findmnt",
    "keywords": [
      "mounted",
      "drives",
      "list",
      "tree",
      "disks"
    ]
  },
  {
    "id": "cmd-mkfs",
    "name": "mkfs",
    "standsFor": "Make file system",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Formats a disk partition fresh — wipes it clean and sets up a new shelving system on it. Everything on it gets erased, like emptying a wing of shelves for good.",
    "example": "mkfs -t [filesystem] [device]",
    "linuxDeckPrompt": "Format partition / Create ext4 filesystem",
    "keywords": [
      "format",
      "wipe",
      "filesystem",
      "ext4",
      "disk"
    ]
  },
  {
    "id": "cmd-fsck",
    "name": "fsck",
    "standsFor": "File system check",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Checks a disk for damage and fixes what's broken — like a checkup for the shelving system.",
    "example": "fsck [device]",
    "linuxDeckPrompt": "Filesystem check and repair",
    "keywords": [
      "repair",
      "fix",
      "check",
      "damaged",
      "disk"
    ]
  },
  {
    "id": "cmd-tune2fs",
    "name": "tune2fs",
    "standsFor": "Tune ext2 file system",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Changes the settings on a disk's shelving system — like how much shelf space is saved for the owner.",
    "example": "tune2fs -l [device]",
    "linuxDeckPrompt": "Modify ext filesystem parameters",
    "keywords": [
      "tune",
      "ext4",
      "filesystem",
      "reserved",
      "settings"
    ]
  },
  {
    "id": "cmd-xfs-repair",
    "name": "xfs_repair",
    "standsFor": "XFS repair",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Checks and repairs a damaged XFS disk — XFS is one kind of shelving system Linux can use.",
    "example": "xfs_repair [device]",
    "keywords": [
      "repair",
      "fix",
      "xfs",
      "damaged",
      "disk"
    ]
  },
  {
    "id": "cmd-xfs-info",
    "name": "xfs_info",
    "standsFor": "XFS information",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Prints the details of an XFS disk — how it's laid out inside.",
    "example": "xfs_info [device]",
    "keywords": [
      "details",
      "xfs",
      "filesystem",
      "info",
      "disk"
    ]
  },
  {
    "id": "cmd-swapon",
    "name": "swapon",
    "standsFor": "",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Switches on extra overflow memory (swap) — spare shelf space in the basement the library uses when its reading tables fill up.",
    "example": "swapon",
    "keywords": [
      "enable",
      "swap",
      "virtual",
      "memory",
      "overflow"
    ]
  },
  {
    "id": "cmd-swapoff",
    "name": "swapoff",
    "standsFor": "",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Switches off that overflow memory and moves everything back onto the reading tables.",
    "example": "swapoff [device]",
    "keywords": [
      "disable",
      "swap",
      "off",
      "memory",
      "overflow"
    ]
  },
  {
    "id": "cmd-mkswap",
    "name": "mkswap",
    "standsFor": "Make swap",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Prepares a file or partition to be used as overflow memory — the basement the library spills into when the tables fill up.",
    "example": "mkswap [device]",
    "keywords": [
      "create",
      "setup",
      "swap",
      "memory",
      "partition"
    ]
  },
  {
    "id": "cmd-dumpe2fs",
    "name": "dumpe2fs",
    "standsFor": "Dump ext2 file system",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Prints the deep details of an ext disk's shelving system — the fine print about how it's laid out.",
    "example": "dumpe2fs [device]",
    "keywords": [
      "ext4",
      "details",
      "blocks",
      "filesystem",
      "inspect"
    ]
  },
  {
    "id": "cmd-debugfs",
    "name": "debugfs",
    "standsFor": "Debug file system",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "A low-level repair tool for ext disks — lets an expert poke at the shelving system's insides directly.",
    "example": "debugfs [device]",
    "keywords": [
      "debug",
      "ext4",
      "filesystem",
      "recover",
      "repair"
    ]
  },
  {
    "id": "cmd-e2fsck",
    "name": "e2fsck",
    "standsFor": "Ext2 file system check",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Checks and repairs ext disks — the ext family's own version of fsck.",
    "example": "e2fsck [device]",
    "keywords": [
      "check",
      "repair",
      "fix",
      "ext4",
      "disk"
    ]
  },
  {
    "id": "cmd-xfs-db",
    "name": "xfs_db",
    "standsFor": "XFS debugger",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "A low-level repair tool for XFS disks — for poking at the shelving system's insides directly.",
    "example": "xfs_db [device]",
    "keywords": [
      "debug",
      "inspect",
      "xfs",
      "filesystem",
      "disk"
    ]
  },
  {
    "id": "cmd-udisksctl",
    "name": "udisksctl",
    "standsFor": "Udisks control",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Plugs in, unplugs, and powers off USB drives cleanly, without needing the owner's keys.",
    "example": "udisksctl status",
    "keywords": [
      "usb",
      "mount",
      "unplug",
      "eject",
      "drive"
    ]
  },
  {
    "id": "cmd-pvcreate",
    "name": "pvcreate",
    "standsFor": "Physical volume create",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Marks a raw disk as ready to join a storage pool — the first step in LVM, a system that lets you combine disks into one big flexible wing.",
    "example": "pvcreate [device]",
    "linuxDeckPrompt": "Create physical volume",
    "keywords": [
      "lvm",
      "physical",
      "volume",
      "initialize",
      "disk"
    ]
  },
  {
    "id": "cmd-pvs",
    "name": "pvs",
    "standsFor": "Physical volumes",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Shows a quick table of every disk in the storage pool and how much free shelf space each has.",
    "example": "pvs",
    "keywords": [
      "lvm",
      "physical",
      "disks",
      "pool",
      "list"
    ]
  },
  {
    "id": "cmd-vgcreate",
    "name": "vgcreate",
    "standsFor": "Volume group create",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Combines disks into one storage pool — a volume group — that you can slice up however you like.",
    "example": "vgcreate [volume_group] [device]",
    "linuxDeckPrompt": "Create volume group (LVM)",
    "keywords": [
      "lvm",
      "pool",
      "combine",
      "volume",
      "group"
    ]
  },
  {
    "id": "cmd-vgs",
    "name": "vgs",
    "standsFor": "Volume groups",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Shows a quick table of all the storage pools and how much free shelf space is left in each.",
    "example": "vgs",
    "keywords": [
      "lvm",
      "pools",
      "volume",
      "groups",
      "list"
    ]
  },
  {
    "id": "cmd-lvcreate",
    "name": "lvcreate",
    "standsFor": "Logical volume create",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Carves a flexible slice out of a storage pool — a virtual partition you can grow later.",
    "example": "lvcreate -L [size] [volume_group]",
    "linuxDeckPrompt": "Create logical volume",
    "keywords": [
      "lvm",
      "logical",
      "slice",
      "volume",
      "create"
    ]
  },
  {
    "id": "cmd-lvs",
    "name": "lvs",
    "standsFor": "Logical volumes",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Lists all the slices carved out of the storage pools, and how big each one is.",
    "example": "lvs",
    "keywords": [
      "lvm",
      "logical",
      "volumes",
      "slices",
      "list"
    ]
  },
  {
    "id": "cmd-lvextend",
    "name": "lvextend",
    "standsFor": "Logical volume extend",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Grows a slice in the storage pool, making it bigger while the library keeps running.",
    "example": "lvextend -L [size] [volume]",
    "keywords": [
      "grow",
      "expand",
      "increase",
      "lvm",
      "size"
    ]
  },
  {
    "id": "cmd-resize2fs",
    "name": "resize2fs",
    "standsFor": "Resize ext2 file system",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Grows or shrinks an ext shelving system to match the slice it sits on.",
    "example": "resize2fs [device]",
    "keywords": [
      "resize",
      "grow",
      "shrink",
      "ext4",
      "filesystem"
    ]
  },
  {
    "id": "cmd-xfs-growfs",
    "name": "xfs_growfs",
    "standsFor": "XFS grow file system",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Grows a live XFS shelving system to fill the new shelf space on its slice.",
    "example": "xfs_growfs [directory]",
    "keywords": [
      "grow",
      "expand",
      "xfs",
      "filesystem",
      "size"
    ]
  },
  {
    "id": "cmd-mdadm",
    "name": "mdadm",
    "standsFor": "Multiple device administrator",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Builds and looks after RAID arrays — groups of disks that team up so your books survive even if one disk dies.",
    "example": "mdadm --detail [device]",
    "keywords": [
      "raid",
      "mirror",
      "array",
      "redundant",
      "disks"
    ]
  },
  {
    "id": "cmd-dmsetup",
    "name": "dmsetup",
    "standsFor": "Device mapper setup",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Shows the hidden layer underneath LVM and disk encryption — the virtual disks the library builds on top of real ones.",
    "example": "dmsetup ls",
    "keywords": [
      "mapper",
      "virtual",
      "lvm",
      "encrypted",
      "disks"
    ]
  },
  {
    "id": "cmd-multipath",
    "name": "multipath",
    "standsFor": "",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Manages the backup cables to big storage boxes, so the library keeps talking to its disks even if one cable fails.",
    "example": "multipath -ll",
    "keywords": [
      "redundant",
      "paths",
      "storage",
      "cables",
      "san"
    ]
  },
  {
    "id": "cmd-iscsiadm",
    "name": "iscsiadm",
    "standsFor": "iSCSI administrator",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Connects to storage that lives at another branch across the network, and treats it like a local disk.",
    "example": "iscsiadm -m discovery -t sendtargets -p [host]",
    "keywords": [
      "iscsi",
      "remote",
      "network",
      "storage",
      "disk"
    ]
  },
  {
    "id": "cmd-cryptsetup",
    "name": "cryptsetup",
    "standsFor": "Cryptography setup",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Locks and unlocks an encrypted disk — a disk whose contents are scrambled until you give the password.",
    "example": "cryptsetup luksOpen [device] [name]",
    "keywords": [
      "encrypt",
      "luks",
      "unlock",
      "password",
      "disk"
    ]
  },
  {
    "id": "cmd-quota",
    "name": "quota",
    "standsFor": "",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Shows how much shelf space you're using, and the limit you're allowed.",
    "example": "quota",
    "keywords": [
      "limit",
      "disk",
      "usage",
      "allowance",
      "user"
    ]
  },
  {
    "id": "cmd-repquota",
    "name": "repquota",
    "standsFor": "Report quota",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Prints a report of everyone's shelf-space use and limits on one disk.",
    "example": "repquota -a",
    "keywords": [
      "report",
      "limits",
      "disk",
      "quota",
      "users"
    ]
  },
  {
    "id": "cmd-edquota",
    "name": "edquota",
    "standsFor": "Edit quota",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Opens an editor to set someone's shelf-space limit.",
    "example": "edquota [user]",
    "keywords": [
      "edit",
      "set",
      "quota",
      "limit",
      "disk"
    ]
  },
  {
    "id": "cmd-showmount",
    "name": "showmount",
    "standsFor": "",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Asks a file-sharing server which folders it's sharing, and who's using them.",
    "example": "showmount -e [host]",
    "keywords": [
      "nfs",
      "shared",
      "folders",
      "network",
      "server"
    ]
  },
  {
    "id": "cmd-exportfs",
    "name": "exportfs",
    "standsFor": "Export file system",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Shows or refreshes the list of folders this library shares with others over the network.",
    "example": "exportfs",
    "keywords": [
      "nfs",
      "share",
      "export",
      "folders",
      "network"
    ]
  },
  {
    "id": "cmd-zfs",
    "name": "zfs",
    "standsFor": "Zettabyte file system",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Manages ZFS shelving systems — a fancy kind that can take instant snapshots, freezing the shelves exactly as they are so you can step back to that moment.",
    "example": "zfs list",
    "keywords": [
      "zfs",
      "pool",
      "snapshots",
      "storage",
      "filesystem"
    ]
  },
  {
    "id": "cmd-btrfs",
    "name": "btrfs",
    "standsFor": "B-tree file system",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Manages Btrfs shelving systems — another fancy kind with instant snapshots and built-in disk teaming.",
    "example": "btrfs subvolume list [directory]",
    "keywords": [
      "btrfs",
      "snapshots",
      "subvolume",
      "filesystem",
      "disk"
    ]
  },
  {
    "id": "cmd-ip",
    "name": "ip",
    "standsFor": "Internet Protocol",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Shows and changes your branch's network settings — its street address, the roads its mail takes to other branches, and which links are switched on.",
    "example": "ip [address]",
    "linuxDeckPrompt": "Configure network interfaces / Manage network interfaces",
    "keywords": [
      "address",
      "network",
      "interface",
      "route",
      "ip"
    ]
  },
  {
    "id": "cmd-ifconfig",
    "name": "ifconfig",
    "standsFor": "Interface configuration",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "The older way to look at network links and addresses — ip is the newer tool that replaced it.",
    "example": "ifconfig",
    "keywords": [
      "network",
      "address",
      "interface",
      "ip",
      "legacy"
    ]
  },
  {
    "id": "cmd-route",
    "name": "route",
    "standsFor": "",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "The older way to look at the map of roads mail takes to other branches — ip route is the newer tool.",
    "example": "route",
    "keywords": [
      "routing",
      "gateway",
      "network",
      "traffic",
      "map"
    ]
  },
  {
    "id": "cmd-nmcli",
    "name": "nmcli",
    "standsFor": "NetworkManager command-line interface",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Controls the network from the command line — join Wi-Fi, set an address, check if a link is up.",
    "example": "nmcli",
    "linuxDeckPrompt": "Network CLI Tool",
    "keywords": [
      "wifi",
      "network",
      "connect",
      "internet",
      "address"
    ]
  },
  {
    "id": "cmd-nmtui",
    "name": "nmtui",
    "standsFor": "NetworkManager text user interface",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Opens a friendly menu for the network settings, driven with arrow keys — no typing addresses by hand.",
    "example": "nmtui",
    "keywords": [
      "wifi",
      "menu",
      "network",
      "setup",
      "connect"
    ]
  },
  {
    "id": "cmd-netplan",
    "name": "netplan",
    "standsFor": "Network plan",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Applies the network settings written in a settings file, on Ubuntu systems.",
    "example": "netplan apply",
    "keywords": [
      "ubuntu",
      "network",
      "apply",
      "config",
      "yaml"
    ]
  },
  {
    "id": "cmd-arp",
    "name": "arp",
    "standsFor": "Address Resolution Protocol",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Shows the little notebook where this branch keeps track of which neighbor's street address goes with which hardware name.",
    "example": "arp",
    "keywords": [
      "mac",
      "neighbors",
      "local",
      "network",
      "table"
    ]
  },
  {
    "id": "cmd-hostname",
    "name": "hostname",
    "standsFor": "",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Prints this branch's name on the network — or with -I, all the addresses it answers to.",
    "example": "hostname",
    "linuxDeckPrompt": "Show system hostname",
    "keywords": [
      "name",
      "computer",
      "ip",
      "address",
      "network"
    ]
  },
  {
    "id": "cmd-iw",
    "name": "iw",
    "standsFor": "Interface wireless",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Shows and changes Wi-Fi settings — signal strength, and which network you're joined to.",
    "example": "iw [command]",
    "keywords": [
      "wifi",
      "wireless",
      "signal",
      "ssid",
      "network"
    ]
  },
  {
    "id": "cmd-rfkill",
    "name": "rfkill",
    "standsFor": "Radio frequency kill",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Lists the wireless radios — Wi-Fi and Bluetooth — and lets you switch them off or back on.",
    "example": "rfkill",
    "keywords": [
      "wireless",
      "wifi",
      "bluetooth",
      "block",
      "unblock"
    ]
  },
  {
    "id": "cmd-resolvectl",
    "name": "resolvectl",
    "standsFor": "Resolve control",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Shows which phone book (DNS server) each network link uses, and lets you clear the memory of old lookups.",
    "example": "resolvectl",
    "keywords": [
      "dns",
      "nameserver",
      "cache",
      "flush",
      "lookup"
    ]
  },
  {
    "id": "cmd-dhclient",
    "name": "dhclient",
    "standsFor": "DHCP client",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Asks the network for a street address to use — like a new branch asking the main office for its address.",
    "example": "dhclient [interface]",
    "keywords": [
      "dhcp",
      "lease",
      "automatic",
      "ip",
      "address"
    ]
  },
  {
    "id": "cmd-ifup",
    "name": "ifup",
    "standsFor": "Interface up",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Switches a network link on, using the settings written down for it.",
    "example": "ifup [interface]",
    "keywords": [
      "enable",
      "bring",
      "up",
      "network",
      "interface"
    ]
  },
  {
    "id": "cmd-ifdown",
    "name": "ifdown",
    "standsFor": "Interface down",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Switches a network link off, cleanly.",
    "example": "ifdown [interface]",
    "keywords": [
      "disable",
      "shut",
      "down",
      "network",
      "interface"
    ]
  },
  {
    "id": "cmd-bridge",
    "name": "bridge",
    "standsFor": "",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Manages virtual network switches — the kind that connect containers and virtual machines to each other.",
    "example": "bridge link",
    "keywords": [
      "virtual",
      "switch",
      "bridge",
      "network",
      "containers"
    ]
  },
  {
    "id": "cmd-ss",
    "name": "ss",
    "standsFor": "Socket statistics",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Shows which numbered doors (ports) are open at this branch, and who's connected through them.",
    "example": "ss",
    "linuxDeckPrompt": "Display socket information",
    "keywords": [
      "ports",
      "open",
      "listening",
      "sockets",
      "connections"
    ]
  },
  {
    "id": "cmd-netstat",
    "name": "netstat",
    "standsFor": "Network statistics",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "The older way to list open doors and connections — ss is the newer tool that replaced it.",
    "example": "netstat",
    "keywords": [
      "ports",
      "listening",
      "open",
      "connections",
      "sockets"
    ]
  },
  {
    "id": "cmd-ping",
    "name": "ping",
    "standsFor": "",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Knocks on another branch's door to see if it's there, and times how long the answer takes.",
    "example": "ping [host]",
    "linuxDeckPrompt": "Test network connectivity",
    "keywords": [
      "reachable",
      "test",
      "connection",
      "alive",
      "latency"
    ]
  },
  {
    "id": "cmd-traceroute",
    "name": "traceroute",
    "standsFor": "",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Maps every stop a message makes on its way to another branch — like tracking a parcel through every post office on the road.",
    "example": "traceroute [host]",
    "linuxDeckPrompt": "Trace route to a network host",
    "keywords": [
      "hops",
      "path",
      "route",
      "network",
      "trace"
    ]
  },
  {
    "id": "cmd-tracepath",
    "name": "tracepath",
    "standsFor": "",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Maps the stops to another branch, and also finds the biggest parcel size the road allows — no owner's keys needed.",
    "example": "tracepath [host]",
    "keywords": [
      "hops",
      "mtu",
      "path",
      "route",
      "network"
    ]
  },
  {
    "id": "cmd-mtr",
    "name": "mtr",
    "standsFor": "My traceroute",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Ping and traceroute on one live screen — it keeps knocking and shows you which stop is dropping the messages.",
    "example": "mtr [host]",
    "keywords": [
      "live",
      "ping",
      "traceroute",
      "packet",
      "loss"
    ]
  },
  {
    "id": "cmd-nc-netcat",
    "name": "nc (netcat)",
    "standsFor": "Network concatenate",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "A pocket knife for the network — checks if a door (port) is open, or opens a quick one to listen on.",
    "example": "nc [host] [port]",
    "keywords": [
      "port",
      "check",
      "listen",
      "connect",
      "socket"
    ]
  },
  {
    "id": "cmd-telnet",
    "name": "telnet",
    "standsFor": "Teletype network",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Opens a plain, unprotected chat line to another branch's port, mostly used to test if it answers.",
    "example": "telnet [host] [port]",
    "keywords": [
      "port",
      "test",
      "connect",
      "remote",
      "plain"
    ]
  },
  {
    "id": "cmd-nmap",
    "name": "nmap",
    "standsFor": "Network Mapper",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Scans a branch or a whole network to find which doors are open and what's behind them.",
    "example": "nmap",
    "linuxDeckPrompt": "Network scanning tool",
    "keywords": [
      "scan",
      "ports",
      "open",
      "discover",
      "security"
    ]
  },
  {
    "id": "cmd-tcpdump",
    "name": "tcpdump",
    "standsFor": "Transmission Control Protocol dump",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Listens in on the network wire and shows you the messages flying past — like watching the mail sacks go by on the road between branches.",
    "example": "tcpdump -i [interface]",
    "linuxDeckPrompt": "Capture network traffic / Network packet capture tool",
    "keywords": [
      "packets",
      "capture",
      "sniff",
      "traffic",
      "wire"
    ]
  },
  {
    "id": "cmd-wireshark-tshark",
    "name": "wireshark / tshark",
    "standsFor": "Terminal Wireshark",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Reads network messages in deep detail — every layer unwrapped, like opening a sealed envelope to read the letter inside.",
    "example": "tshark -i [interface]",
    "keywords": [
      "packets",
      "inspect",
      "capture",
      "traffic",
      "analyze"
    ]
  },
  {
    "id": "cmd-arping",
    "name": "arping",
    "standsFor": "Address Resolution Protocol ping",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Knocks on the local network to check if an address is already taken, or to find a neighbor's hardware name.",
    "example": "arping [IP]",
    "keywords": [
      "ping",
      "mac",
      "local",
      "lan",
      "neighbor"
    ]
  },
  {
    "id": "cmd-fping",
    "name": "fping",
    "standsFor": "Fast ping",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Knocks on a whole street of addresses at once to see which branches are there.",
    "example": "fping [host]",
    "keywords": [
      "ping",
      "multiple",
      "sweep",
      "subnet",
      "hosts"
    ]
  },
  {
    "id": "cmd-socat",
    "name": "socat",
    "standsFor": "Socket cat",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Connects any two things together so data flows between them — like a courier route joining two branches.",
    "example": "socat [address] [address]",
    "keywords": [
      "relay",
      "forward",
      "pipe",
      "port",
      "socket"
    ]
  },
  {
    "id": "cmd-ipcalc",
    "name": "ipcalc",
    "standsFor": "IP calculator",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Does the math on a network address — works out which addresses belong to that street, and which ones you can use.",
    "example": "ipcalc [address]",
    "keywords": [
      "subnet",
      "cidr",
      "netmask",
      "calculate",
      "range"
    ]
  },
  {
    "id": "cmd-dig",
    "name": "dig",
    "standsFor": "Domain Information Groper",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Asks the phone book (DNS) what street address a branch name maps to, and shows the full answer.",
    "example": "dig [domain]",
    "linuxDeckPrompt": "DNS lookup tool",
    "keywords": [
      "dns",
      "domain",
      "lookup",
      "records",
      "ip"
    ]
  },
  {
    "id": "cmd-nslookup",
    "name": "nslookup",
    "standsFor": "Name server lookup",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Looks a name up in the phone book to find its street address — or an address to find its name.",
    "example": "nslookup [domain]",
    "linuxDeckPrompt": "Domain name resolution tool",
    "keywords": [
      "dns",
      "domain",
      "lookup",
      "resolve",
      "ip"
    ]
  },
  {
    "id": "cmd-host",
    "name": "host",
    "standsFor": "",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "A quick, simple phone-book lookup for a name — one line back with the answer.",
    "example": "host [domain]",
    "keywords": [
      "dns",
      "lookup",
      "domain",
      "ip",
      "simple"
    ]
  },
  {
    "id": "cmd-whois",
    "name": "whois",
    "standsFor": "",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Looks up who owns a website name — when it was registered, and when it runs out.",
    "example": "whois [domain]",
    "keywords": [
      "domain",
      "owner",
      "registration",
      "lookup",
      "website"
    ]
  },
  {
    "id": "cmd-curl",
    "name": "curl",
    "standsFor": "Client URL",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Asks a website for a page, right from the terminal — and can show you just the headers, or save the page to a file.",
    "example": "curl [url]",
    "linuxDeckPrompt": "Download or request URL",
    "keywords": [
      "web",
      "request",
      "url",
      "http",
      "download"
    ]
  },
  {
    "id": "cmd-wget",
    "name": "wget",
    "standsFor": "World Wide Web get",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Downloads a file from the web, and can pick up where it left off if the connection drops.",
    "example": "wget [url]",
    "linuxDeckPrompt": "Download files via HTTP/FTP",
    "keywords": [
      "download",
      "file",
      "web",
      "url",
      "http"
    ]
  },
  {
    "id": "cmd-scp",
    "name": "scp",
    "standsFor": "Secure copy",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Copies a file to or from another branch over a secure, locked connection — like a courier with a sealed envelope.",
    "example": "scp [source] [destination]",
    "linuxDeckPrompt": "Securely copy remote files",
    "keywords": [
      "copy",
      "remote",
      "transfer",
      "ssh",
      "file"
    ]
  },
  {
    "id": "cmd-sftp",
    "name": "sftp",
    "standsFor": "SSH File Transfer Protocol",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Opens a file-moving session with another branch, where you use ls, cd, get, and put to move files back and forth.",
    "example": "sftp [user@host]",
    "keywords": [
      "transfer",
      "upload",
      "download",
      "remote",
      "files"
    ]
  },
  {
    "id": "cmd-ssh",
    "name": "ssh",
    "standsFor": "Secure Shell",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Opens a locked tunnel to another branch, so you can type commands there as if you were standing right in front of its shelves.",
    "example": "ssh [user@host]",
    "linuxDeckPrompt": "Remote connection shell",
    "keywords": [
      "remote",
      "login",
      "connect",
      "server",
      "terminal"
    ]
  },
  {
    "id": "cmd-ssh-keygen",
    "name": "ssh-keygen",
    "standsFor": "Secure Shell key generator",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Makes a pair of keys for logging in without a password — a public key you hand out, and a private key you never share.",
    "example": "ssh-keygen",
    "linuxDeckPrompt": "Generate SSH key pair",
    "keywords": [
      "key",
      "generate",
      "pair",
      "passwordless",
      "ssh"
    ]
  },
  {
    "id": "cmd-ssh-copy-id",
    "name": "ssh-copy-id",
    "standsFor": "Secure Shell copy identity",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Hands your public key to another branch in one step, so it lets you in without a password next time.",
    "example": "ssh-copy-id [user@host]",
    "keywords": [
      "copy",
      "key",
      "passwordless",
      "remote",
      "login"
    ]
  },
  {
    "id": "cmd-ssh-add",
    "name": "ssh-add",
    "standsFor": "Secure Shell add",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Loads your private key into the helper that remembers it, so you don't retype your password on every connection.",
    "example": "ssh-add",
    "keywords": [
      "load",
      "private",
      "key",
      "agent",
      "passphrase"
    ]
  },
  {
    "id": "cmd-ssh-agent",
    "name": "ssh-agent",
    "standsFor": "Secure Shell agent",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "A little helper that holds your unlocked keys in memory while you're signed in.",
    "example": "ssh-agent",
    "keywords": [
      "remember",
      "keys",
      "unlocked",
      "session",
      "ssh"
    ]
  },
  {
    "id": "cmd-ssh-keyscan",
    "name": "ssh-keyscan",
    "standsFor": "Secure Shell key scan",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Fetches another branch's public fingerprint, so you can save it and know it's really them next time.",
    "example": "ssh-keyscan [host]",
    "keywords": [
      "fingerprint",
      "known",
      "hosts",
      "public",
      "key"
    ]
  },
  {
    "id": "cmd-iptables",
    "name": "iptables",
    "standsFor": "Internet Protocol tables",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "The front-door guard at this branch's doors — decides which network traffic gets in and which gets turned away.",
    "example": "iptables -L",
    "keywords": [
      "firewall",
      "block",
      "allow",
      "ports",
      "rules"
    ]
  },
  {
    "id": "cmd-nft",
    "name": "nft",
    "standsFor": "Netfilter tables",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "The newer front-door guard — same job as iptables, one tool for all the firewall rules.",
    "example": "nft list ruleset",
    "linuxDeckPrompt": "Configure firewall rules",
    "keywords": [
      "firewall",
      "nftables",
      "rules",
      "filter",
      "traffic"
    ]
  },
  {
    "id": "cmd-ufw",
    "name": "ufw",
    "standsFor": "Uncomplicated Firewall",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Ubuntu's simple firewall — lets you open or close a door with one short command.",
    "example": "ufw",
    "linuxDeckPrompt": "Firewall Manager",
    "keywords": [
      "firewall",
      "ubuntu",
      "allow",
      "block",
      "port"
    ]
  },
  {
    "id": "cmd-firewall-cmd",
    "name": "firewall-cmd",
    "standsFor": "Firewall command",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "How you work the firewall on Red Hat-style systems — opens doors and manages zones.",
    "example": "firewall-cmd",
    "linuxDeckPrompt": "Configure firewalld rules / Dynamic firewall management",
    "keywords": [
      "firewall",
      "ports",
      "zones",
      "open",
      "close"
    ]
  },
  {
    "id": "cmd-getenforce",
    "name": "getenforce",
    "standsFor": "",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Prints one word telling you whether SELinux — the strict security guard — is on, watching, or off.",
    "example": "getenforce",
    "keywords": [
      "selinux",
      "mode",
      "enforcing",
      "status",
      "security"
    ]
  },
  {
    "id": "cmd-setenforce",
    "name": "setenforce",
    "standsFor": "",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Switches that security guard between just watching and actually blocking, while you troubleshoot.",
    "example": "setenforce [mode]",
    "keywords": [
      "selinux",
      "toggle",
      "permissive",
      "enforcing",
      "security"
    ]
  },
  {
    "id": "cmd-sestatus",
    "name": "sestatus",
    "standsFor": "SELinux status",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Prints a full status report on the SELinux security guard — on or off, and which rulebook it's using.",
    "example": "sestatus",
    "keywords": [
      "selinux",
      "status",
      "policy",
      "security",
      "check"
    ]
  },
  {
    "id": "cmd-semanage",
    "name": "semanage",
    "standsFor": "SELinux manage",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Changes the security guard's rulebook — like letting a web server use a new port.",
    "example": "semanage [command]",
    "keywords": [
      "selinux",
      "policy",
      "ports",
      "rules",
      "context"
    ]
  },
  {
    "id": "cmd-restorecon",
    "name": "restorecon",
    "standsFor": "Restore SELinux context",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Fixes the security labels on files, putting them back to what the rulebook expects — often fixes a website showing 'forbidden.'",
    "example": "restorecon [path]",
    "keywords": [
      "selinux",
      "fix",
      "restore",
      "labels",
      "context"
    ]
  },
  {
    "id": "cmd-aa-status",
    "name": "aa-status",
    "standsFor": "AppArmor status",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Shows whether AppArmor — another security guard, used on Ubuntu — is on, and which programs it's watching.",
    "example": "aa-status",
    "keywords": [
      "apparmor",
      "profiles",
      "ubuntu",
      "security",
      "status"
    ]
  },
  {
    "id": "cmd-chcon",
    "name": "chcon",
    "standsFor": "Change SELinux context",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Changes one file's security label directly — a quick fix that lasts until the labels get reset.",
    "example": "chcon -t [type] [file]",
    "keywords": [
      "selinux",
      "label",
      "context",
      "change",
      "file"
    ]
  },
  {
    "id": "cmd-auditctl",
    "name": "auditctl",
    "standsFor": "Audit control",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Sets the rules for the branch's security camera — which files to watch, and what to record when someone touches them. The example watches the file where everyone's passwords are kept.",
    "example": "auditctl -w [file] -p [permissions] -k [key]",
    "keywords": [
      "audit",
      "watch",
      "security",
      "rules",
      "monitor"
    ]
  },
  {
    "id": "cmd-ausearch",
    "name": "ausearch",
    "standsFor": "Audit search",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Searches the security camera's recordings for something that happened — a failed login, or a blocked action.",
    "example": "ausearch -m [type]",
    "keywords": [
      "audit",
      "logs",
      "search",
      "security",
      "events"
    ]
  },
  {
    "id": "cmd-fail2ban-client",
    "name": "fail2ban-client",
    "standsFor": "",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Checks the guard that locks out anyone who guesses passwords wrong too many times — or unbans someone it caught.",
    "example": "fail2ban-client status [jail]",
    "linuxDeckPrompt": "Prevent brute force attacks",
    "keywords": [
      "ban",
      "unban",
      "block",
      "attackers",
      "passwords"
    ]
  },
  {
    "id": "cmd-openssl",
    "name": "openssl",
    "standsFor": "Open Secure Sockets Layer",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Crypto, VPN & certs",
    "description": "A toolkit for locks and certificates — checks a website's ID card, or makes secret codes.",
    "example": "openssl",
    "linuxDeckPrompt": "Encryption and SSL toolkit",
    "keywords": [
      "certificate",
      "ssl",
      "tls",
      "encrypt",
      "crypto"
    ]
  },
  {
    "id": "cmd-gpg",
    "name": "gpg",
    "standsFor": "GNU Privacy Guard",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Crypto, VPN & certs",
    "description": "Locks a file in a sealed envelope so only the right person can open it — and checks the wax seal to prove a file really came from who it says it did.",
    "example": "gpg",
    "linuxDeckPrompt": "Encrypt and decrypt files",
    "keywords": [
      "encrypt",
      "decrypt",
      "sign",
      "secret",
      "file"
    ]
  },
  {
    "id": "cmd-wg",
    "name": "wg",
    "standsFor": "WireGuard",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Crypto, VPN & certs",
    "description": "Shows how your WireGuard VPN tunnel is doing — which branches are connected, and how much data has flowed.",
    "example": "wg",
    "keywords": [
      "wireguard",
      "vpn",
      "tunnel",
      "status",
      "peers"
    ]
  },
  {
    "id": "cmd-openvpn",
    "name": "openvpn",
    "standsFor": "Open Virtual Private Network",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Crypto, VPN & certs",
    "description": "Connects you to a private tunnel (a VPN) so your traffic travels through it, locked and hidden.",
    "example": "openvpn",
    "linuxDeckPrompt": "Start OpenVPN service",
    "keywords": [
      "vpn",
      "tunnel",
      "connect",
      "private",
      "network"
    ]
  },
  {
    "id": "cmd-certbot",
    "name": "certbot",
    "standsFor": "Certificate bot",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Crypto, VPN & certs",
    "description": "Gets a free ID card (an HTTPS certificate) for your website, and renews it before it runs out.",
    "example": "certbot",
    "linuxDeckPrompt": "Generate SSL certificates",
    "keywords": [
      "https",
      "ssl",
      "certificate",
      "letsencrypt",
      "renew"
    ]
  },
  {
    "id": "cmd-apt",
    "name": "apt",
    "standsFor": "Advanced Package Tool",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "The order counter for Ubuntu and Debian — it fetches new books for the shelves, updates the ones you have, and pulls old ones off.",
    "example": "apt install [package]",
    "linuxDeckPrompt": "Update software sources / Upgrade system packages / Show package details",
    "keywords": [
      "install",
      "remove",
      "update",
      "programs",
      "ubuntu"
    ]
  },
  {
    "id": "cmd-apt-get",
    "name": "apt-get",
    "standsFor": "Advanced Package Tool get",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "The older, steadier version of apt — same order counter, better for scripts and automation.",
    "example": "apt-get install [package]",
    "keywords": [
      "install",
      "remove",
      "update",
      "packages",
      "debian"
    ]
  },
  {
    "id": "cmd-apt-cache",
    "name": "apt-cache",
    "standsFor": "Advanced Package Tool cache",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "Searches the publisher's catalogue to see if a book exists, and which edition you'd get.",
    "example": "apt-cache search [package]",
    "linuxDeckPrompt": "Search for software packages",
    "keywords": [
      "search",
      "find",
      "packages",
      "catalog",
      "ubuntu"
    ]
  },
  {
    "id": "cmd-dpkg",
    "name": "dpkg",
    "standsFor": "Debian package",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "Shelves a single book package by hand, or lists the books already on the shelves.",
    "example": "dpkg -i [file]",
    "linuxDeckPrompt": "Manually install deb package",
    "keywords": [
      "install",
      "deb",
      "package",
      "list",
      "remove"
    ]
  },
  {
    "id": "cmd-snap",
    "name": "snap",
    "standsFor": "",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "Installs snap apps — books that bring everything they need with them, so they open on any Linux.",
    "example": "snap install [package]",
    "linuxDeckPrompt": "Install snap software",
    "keywords": [
      "install",
      "apps",
      "packages",
      "ubuntu",
      "remove"
    ]
  },
  {
    "id": "cmd-apt-mark",
    "name": "apt-mark",
    "standsFor": "Advanced Package Tool mark",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "Pins a book at its current edition so updates skip it — like telling the order counter 'leave this one alone.'",
    "example": "apt-mark hold [package]",
    "keywords": [
      "hold",
      "pin",
      "freeze",
      "version",
      "package"
    ]
  },
  {
    "id": "cmd-dpkg-reconfigure",
    "name": "dpkg-reconfigure",
    "standsFor": "Debian package reconfigure",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "Runs a program's first-time setup questions again, so you can change your answers — like redoing its sign-up sheet.",
    "example": "dpkg-reconfigure [package]",
    "keywords": [
      "reconfigure",
      "setup",
      "settings",
      "package"
    ]
  },
  {
    "id": "cmd-add-apt-repository",
    "name": "add-apt-repository",
    "standsFor": "Add Advanced Package Tool repository",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "Adds another publisher's catalogue to the order counter — an extra place to get books from.",
    "example": "add-apt-repository [repository]",
    "keywords": [
      "ppa",
      "repository",
      "source",
      "add",
      "ubuntu"
    ]
  },
  {
    "id": "cmd-dnf",
    "name": "dnf",
    "standsFor": "Dandified YUM",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "RHEL/Rocky/Fedora",
    "description": "The order counter on Red Hat, Rocky, and Fedora systems.",
    "example": "dnf install [package]",
    "linuxDeckPrompt": "Install software package (DNF) / List installed packages",
    "keywords": [
      "install",
      "remove",
      "update",
      "packages",
      "fedora"
    ]
  },
  {
    "id": "cmd-yum",
    "name": "yum",
    "standsFor": "Yellowdog Updater, Modified",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "RHEL/Rocky/Fedora",
    "description": "The older order counter on Red Hat systems — dnf is the newer one that replaced it.",
    "example": "yum install [package]",
    "linuxDeckPrompt": "Uninstall software package (YUM) / Update system packages (YUM)",
    "keywords": [
      "install",
      "remove",
      "update",
      "packages",
      "redhat"
    ]
  },
  {
    "id": "cmd-rpm",
    "name": "rpm",
    "standsFor": "RPM Package Manager",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "RHEL/Rocky/Fedora",
    "description": "The low-level tool that shelves and checks book packages on Red Hat systems.",
    "example": "rpm -q [package]",
    "linuxDeckPrompt": "Install rpm package",
    "keywords": [
      "install",
      "query",
      "rpm",
      "package",
      "redhat"
    ]
  },
  {
    "id": "cmd-subscription-manager",
    "name": "subscription-manager",
    "standsFor": "",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "RHEL/Rocky/Fedora",
    "description": "Shows Red Hat this system's membership, so it can download official programs and updates.",
    "example": "subscription-manager status",
    "keywords": [
      "register",
      "redhat",
      "license",
      "repos",
      "updates"
    ]
  },
  {
    "id": "cmd-zypper",
    "name": "zypper",
    "standsFor": "",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Other distros",
    "description": "The order counter on SUSE and openSUSE systems.",
    "example": "zypper install [package]",
    "keywords": [
      "install",
      "remove",
      "update",
      "packages",
      "suse"
    ]
  },
  {
    "id": "cmd-apk",
    "name": "apk",
    "standsFor": "Alpine Package Keeper",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Other distros",
    "description": "The tiny, fast order counter inside Alpine Linux — the lightweight flavor used inside book boxes.",
    "example": "apk add [package]",
    "keywords": [
      "install",
      "remove",
      "alpine",
      "packages",
      "container"
    ]
  },
  {
    "id": "cmd-emerge",
    "name": "emerge",
    "standsFor": "",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Other distros",
    "description": "Gentoo's order counter — it fetches the recipe and builds each program from scratch, right here in the library.",
    "example": "emerge [package]",
    "keywords": [
      "install",
      "compile",
      "gentoo",
      "packages",
      "build"
    ]
  },
  {
    "id": "cmd-nix",
    "name": "nix",
    "standsFor": "",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Other distros",
    "description": "An order counter that shelves every program in its own sealed box, so they never fight over shared parts.",
    "example": "nix [command]",
    "keywords": [
      "install",
      "isolated",
      "reproducible",
      "packages"
    ]
  },
  {
    "id": "cmd-flatpak",
    "name": "flatpak",
    "standsFor": "",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Installs apps that run sealed off from the rest of the shelves, on any flavor of Linux.",
    "example": "flatpak install [package]",
    "linuxDeckPrompt": "Install flatpak application",
    "keywords": [
      "install",
      "desktop",
      "apps",
      "sandboxed",
      "remove"
    ]
  },
  {
    "id": "cmd-docker",
    "name": "docker",
    "standsFor": "",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Runs programs in sealed book boxes called containers — each one carries its own little shelf with it, so it runs the same everywhere.",
    "example": "docker ps",
    "linuxDeckPrompt": "Run Docker container / List running containers / List Docker images / Execute command in container",
    "keywords": [
      "containers",
      "run",
      "images",
      "start",
      "stop"
    ]
  },
  {
    "id": "cmd-podman",
    "name": "podman",
    "standsFor": "Pod Manager",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Runs book boxes like Docker, but without needing a background service running as the owner.",
    "example": "podman ps",
    "keywords": [
      "containers",
      "rootless",
      "run",
      "images",
      "pods"
    ]
  },
  {
    "id": "cmd-buildah",
    "name": "buildah",
    "standsFor": "",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Builds book-box images step by step, without needing Docker's background service running as the owner.",
    "example": "buildah [command]",
    "keywords": [
      "build",
      "container",
      "image",
      "oci"
    ]
  },
  {
    "id": "cmd-kubectl",
    "name": "kubectl",
    "standsFor": "Kubernetes control",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "How you run Kubernetes — the system that runs lots of book boxes across a whole network of branches.",
    "example": "kubectl get [resource]",
    "linuxDeckPrompt": "View Kubernetes pod status / Deploy Kubernetes resources / View Kubernetes nodes",
    "keywords": [
      "kubernetes",
      "pods",
      "cluster",
      "deploy",
      "containers"
    ]
  },
  {
    "id": "cmd-crictl",
    "name": "crictl",
    "standsFor": "Container Runtime Interface control",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Peeks at the book boxes running on one system in a Kubernetes cluster, for fixing things up close.",
    "example": "crictl ps",
    "keywords": [
      "kubernetes",
      "runtime",
      "containers",
      "inspect",
      "debug"
    ]
  },
  {
    "id": "cmd-helm",
    "name": "helm",
    "standsFor": "",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "The order counter for Kubernetes — installs ready-made apps, called charts, in one go.",
    "example": "helm list",
    "keywords": [
      "kubernetes",
      "charts",
      "install",
      "deploy",
      "apps"
    ]
  },
  {
    "id": "cmd-nerdctl",
    "name": "nerdctl",
    "standsFor": "containerd control",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "A Docker-style tool that talks straight to the book-box engine underneath.",
    "example": "nerdctl ps",
    "keywords": [
      "containerd",
      "containers",
      "run",
      "images"
    ]
  },
  {
    "id": "cmd-ctr",
    "name": "ctr",
    "standsFor": "Container",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "The low-level tool for the book-box engine — for poking at its insides when something's wrong.",
    "example": "ctr [command]",
    "keywords": [
      "containerd",
      "lowlevel",
      "containers",
      "debug"
    ]
  },
  {
    "id": "cmd-skopeo",
    "name": "skopeo",
    "standsFor": "",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Looks at or copies book-box images between registries, without downloading the whole box first.",
    "example": "skopeo inspect [image]",
    "keywords": [
      "copy",
      "inspect",
      "container",
      "images",
      "registry"
    ]
  },
  {
    "id": "cmd-docker-compose",
    "name": "docker-compose",
    "standsFor": "",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Starts a whole team of book boxes from one recipe — like a web server, a database, and a cache, all together.",
    "example": "docker-compose up",
    "linuxDeckPrompt": "Start Docker Compose services",
    "keywords": [
      "multi",
      "containers",
      "stack",
      "services",
      "up"
    ]
  },
  {
    "id": "cmd-lxc",
    "name": "lxc",
    "standsFor": "Linux Containers",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "VMs & system containers",
    "description": "Runs lightweight book boxes that act like full Linux systems.",
    "example": "lxc list",
    "keywords": [
      "system",
      "containers",
      "virtual",
      "machines",
      "run"
    ]
  },
  {
    "id": "cmd-systemd-nspawn",
    "name": "systemd-nspawn",
    "standsFor": "System daemon namespace spawn",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "VMs & system containers",
    "description": "Boots a pretend Linux system from a folder, for testing things safely away from the real shelves.",
    "example": "systemd-nspawn -D [directory]",
    "keywords": [
      "lightweight",
      "container",
      "boot",
      "chroot",
      "sandbox"
    ]
  },
  {
    "id": "cmd-virsh",
    "name": "virsh",
    "standsFor": "Virtualization shell",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "VMs & system containers",
    "description": "How you run virtual machines — start them, stop them, and check on them.",
    "example": "virsh list",
    "linuxDeckPrompt": "List virtual machines",
    "keywords": [
      "virtual",
      "machines",
      "kvm",
      "vm",
      "start"
    ]
  },
  {
    "id": "cmd-qemu-img",
    "name": "qemu-img",
    "standsFor": "Quick Emulator image",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "VMs & system containers",
    "description": "Makes and reshapes the virtual hard drives — the pretend wings — that virtual machines keep their books on.",
    "example": "qemu-img create [image] [size]",
    "keywords": [
      "virtual",
      "disk",
      "qcow2",
      "convert",
      "resize"
    ]
  },
  {
    "id": "cmd-man",
    "name": "man",
    "standsFor": "Manual",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Help",
    "description": "Opens the guidebook for any command — the library's own help book for it.",
    "example": "man [command]",
    "keywords": [
      "manual",
      "help",
      "documentation",
      "guide",
      "instructions"
    ]
  },
  {
    "id": "cmd-info",
    "name": "info",
    "standsFor": "Information",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Help",
    "description": "Opens the longer, chapter-by-chapter guidebook for a program — more detail than man, for the tools that have one.",
    "example": "info [command]",
    "keywords": [
      "help",
      "handbook",
      "documentation",
      "manual",
      "guide"
    ]
  },
  {
    "id": "cmd-apropos",
    "name": "apropos",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Help",
    "description": "Searches all the guidebooks by keyword, for when you know what you want to do but forgot the command's name.",
    "example": "apropos [keyword]",
    "keywords": [
      "search",
      "help",
      "manuals",
      "keyword",
      "forgot"
    ]
  },
  {
    "id": "cmd-whatis",
    "name": "whatis",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Help",
    "description": "Prints one line saying what a command does — the back-cover blurb.",
    "example": "whatis [command]",
    "keywords": [
      "summary",
      "one-line",
      "help",
      "explain",
      "describe"
    ]
  },
  {
    "id": "cmd-tldr",
    "name": "tldr",
    "standsFor": "Too long; didn't read",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Help",
    "description": "Shows a cheat sheet for a command — the five most common examples, no walls of flags.",
    "example": "tldr [command]",
    "keywords": [
      "examples",
      "cheatsheet",
      "quick",
      "help",
      "short"
    ]
  },
  {
    "id": "cmd-history",
    "name": "history",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Shows the borrowing log — a numbered list of the commands you've already typed, so you can find one and run it again.",
    "example": "history",
    "linuxDeckPrompt": "Show command history",
    "keywords": [
      "past",
      "previous",
      "typed",
      "commands",
      "list"
    ]
  },
  {
    "id": "cmd-alias",
    "name": "alias",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Makes a nickname for a long command — type the nickname, and the librarian runs the whole thing.",
    "example": "alias",
    "linuxDeckPrompt": "Set command alias",
    "keywords": [
      "shortcut",
      "nickname",
      "abbreviation",
      "command"
    ]
  },
  {
    "id": "cmd-env",
    "name": "env",
    "standsFor": "Environment",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Shows all the little notices pinned up about your session — or runs one command with a notice changed.",
    "example": "env",
    "keywords": [
      "environment",
      "variables",
      "session",
      "settings",
      "list"
    ]
  },
  {
    "id": "cmd-printenv",
    "name": "printenv",
    "standsFor": "Print environment",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Prints the value of one of those notices — like PATH, the list of shelves the librarian searches for commands.",
    "example": "printenv",
    "keywords": [
      "variable",
      "environment",
      "path",
      "print",
      "show"
    ]
  },
  {
    "id": "cmd-export",
    "name": "export",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Pins a notice up on the bulletin board where every program you start from this terminal can see it.",
    "example": "export",
    "keywords": [
      "set",
      "environment",
      "variable",
      "share",
      "shell"
    ]
  },
  {
    "id": "cmd-test",
    "name": "test",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Checks if something is true — like whether a book exists on the shelf — so a script can decide what to do next.",
    "example": "test -f [file]",
    "keywords": [
      "check",
      "condition",
      "exists",
      "compare",
      "script"
    ]
  },
  {
    "id": "cmd-yes",
    "name": "yes",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Prints 'y' over and over, forever — like answering 'yes' to every question a program keeps asking.",
    "example": "yes",
    "keywords": [
      "confirm",
      "auto",
      "repeat",
      "approve",
      "prompt"
    ]
  },
  {
    "id": "cmd-date",
    "name": "date",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Prints today's date and the time, straight from the library clock — or formats it the way you ask.",
    "example": "date",
    "linuxDeckPrompt": "Show date and time",
    "keywords": [
      "today",
      "time",
      "clock",
      "calendar",
      "format"
    ]
  },
  {
    "id": "cmd-cal",
    "name": "cal",
    "standsFor": "Calendar",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Prints a little calendar for this month, right in the terminal — like the one pinned by the counter.",
    "example": "cal",
    "keywords": [
      "calendar",
      "month",
      "days",
      "year",
      "schedule"
    ]
  },
  {
    "id": "cmd-bc",
    "name": "bc",
    "standsFor": "Basic calculator",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "A calculator at the counter — it does decimal math that the librarian can't do on its own.",
    "example": "bc",
    "keywords": [
      "calculator",
      "math",
      "arithmetic",
      "decimal",
      "compute"
    ]
  },
  {
    "id": "cmd-seq",
    "name": "seq",
    "standsFor": "Sequence",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Prints a run of numbers — 1, 2, 3, 4, 5 — handy for numbering things in scripts, like shelf labels.",
    "example": "seq [number]",
    "keywords": [
      "numbers",
      "sequence",
      "range",
      "count",
      "loop"
    ]
  },
  {
    "id": "cmd-printf",
    "name": "printf",
    "standsFor": "Print formatted",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Prints text with exact spacing and formatting — like printing neat shelf labels.",
    "example": "printf [format] [value]",
    "keywords": [
      "format",
      "print",
      "text",
      "output",
      "align"
    ]
  },
  {
    "id": "cmd-clear",
    "name": "clear",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Wipes the terminal screen clean — like clearing the counter — so your prompt sits fresh at the top.",
    "example": "clear",
    "keywords": [
      "wipe",
      "clean",
      "empty",
      "screen",
      "terminal"
    ]
  },
  {
    "id": "cmd-reset",
    "name": "reset",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Fixes a terminal screen that got scrambled — like wiping the counter clean and starting over.",
    "example": "reset",
    "keywords": [
      "fix",
      "unscramble",
      "restore",
      "broken",
      "terminal"
    ]
  },
  {
    "id": "cmd-script",
    "name": "script",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Records everything you type and everything the terminal prints into a file — like a scribe taking notes on your whole session.",
    "example": "script [file]",
    "keywords": [
      "record",
      "save",
      "session",
      "transcript",
      "log"
    ]
  },
  {
    "id": "cmd-logger",
    "name": "logger",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Writes a note from your script into the library's logbook (the system log), so it shows up with everything else.",
    "example": "logger [message]",
    "keywords": [
      "write",
      "syslog",
      "log",
      "message",
      "note"
    ]
  },
  {
    "id": "cmd-stty",
    "name": "stty",
    "standsFor": "Set teletype",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Shows or changes the terminal's own settings — like its size, or whether it shows what you type — the knobs behind the counter.",
    "example": "stty",
    "keywords": [
      "terminal",
      "settings",
      "tty",
      "echo",
      "size"
    ]
  },
  {
    "id": "cmd-tput",
    "name": "tput",
    "standsFor": "Terminal put",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Asks the terminal what it can do — how wide it is, how to move the cursor, how to print in color — like asking the counter what tools it has.",
    "example": "tput [capability]",
    "keywords": [
      "cursor",
      "colors",
      "terminal",
      "width",
      "screen"
    ]
  },
  {
    "id": "cmd-vim",
    "name": "vim",
    "standsFor": "vi improved",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Editors & building",
    "description": "A powerful text editor at the writing tables in the study area — press i to type, Esc then :wq to save and quit.",
    "example": "vim [file]",
    "keywords": [
      "edit",
      "editor",
      "text",
      "write",
      "file"
    ]
  },
  {
    "id": "cmd-nano",
    "name": "nano",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Editors & building",
    "description": "The friendly writing table in the study area — it shows its shortcuts at the bottom, like Ctrl+O to save and Ctrl+X to quit.",
    "example": "nano [file]",
    "keywords": [
      "edit",
      "editor",
      "text",
      "beginner",
      "file"
    ]
  },
  {
    "id": "cmd-git",
    "name": "git",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Editors & building",
    "description": "Keeps the lending history of your books — every save is a snapshot you can go back to, and it can share those snapshots with other branches.",
    "example": "git status",
    "linuxDeckPrompt": "Clone code repository / Pull latest code updates / Commit staged changes / Push code to remote",
    "keywords": [
      "version",
      "commit",
      "clone",
      "push",
      "pull"
    ]
  },
  {
    "id": "cmd-make",
    "name": "make",
    "standsFor": "",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Editors & building",
    "description": "Builds a software project by following the recipe in a Makefile — it knows which pieces to build, and in what order.",
    "example": "make",
    "linuxDeckPrompt": "Build software project / Kernel configuration interface / Compile kernel / Install kernel modules",
    "keywords": [
      "build",
      "compile",
      "project",
      "makefile",
      "source"
    ]
  }
];

export const COMMAND_KEYWORDS: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  COMMAND_REFERENCE.map((entry) => [entry.id, entry.keywords]),
);

const VALID_COMMAND_IDS = new Set(COMMAND_REFERENCE.map((entry) => entry.id));
const VALID_COMMAND_NAMES = new Map(COMMAND_REFERENCE.map((entry) => [entry.name.toLowerCase(), entry]));

export function isValidReferenceCommandId(id: string): boolean {
  return VALID_COMMAND_IDS.has(id);
}

export function getCommandById(id: string): CommandReferenceEntry | undefined {
  return COMMAND_REFERENCE.find((entry) => entry.id === id);
}

export function getCommandByName(name: string): CommandReferenceEntry | undefined {
  return VALID_COMMAND_NAMES.get(name.trim().toLowerCase());
}

/**
 * Search commands across name, plain-words keywords, description, and example.
 * Case-insensitive substring matching.
 * Ranking order:
 *   1. Name matches (exact -> prefix -> substring)
 *   2. Keyword matches (exact primary keyword -> exact keyword -> substring keyword)
 *   3. Description / example matches
 */
export function searchCommands(
  query: string,
  categoryId?: string | null,
): CommandReferenceEntry[] {
  const q = query.trim().toLowerCase();
  const pool =
    categoryId && categoryId !== "all"
      ? COMMAND_REFERENCE.filter((entry) => entry.categoryId === categoryId)
      : COMMAND_REFERENCE;
  if (!q) return pool;

  const exactName: CommandReferenceEntry[] = [];
  const prefixName: CommandReferenceEntry[] = [];
  const containsName: CommandReferenceEntry[] = [];
  const primaryExactKeyword: CommandReferenceEntry[] = [];
  const exactKeyword: CommandReferenceEntry[] = [];
  const containsKeyword: CommandReferenceEntry[] = [];
  const containsDescriptionOrExample: CommandReferenceEntry[] = [];

  for (const entry of pool) {
    const lowerName = entry.name.toLowerCase();
    if (lowerName === q) {
      exactName.push(entry);
      continue;
    }
    if (lowerName.startsWith(q)) {
      prefixName.push(entry);
      continue;
    }
    if (lowerName.includes(q)) {
      containsName.push(entry);
      continue;
    }

    const kws = entry.keywords.map((k) => k.toLowerCase());
    if (kws[0] === q) {
      primaryExactKeyword.push(entry);
      continue;
    }
    if (kws.includes(q)) {
      exactKeyword.push(entry);
      continue;
    }
    if (kws.some((k) => k.includes(q))) {
      containsKeyword.push(entry);
      continue;
    }

    const lowerDesc = entry.description.toLowerCase();
    const lowerExample = entry.example.toLowerCase();
    const lowerPrompt = (entry.linuxDeckPrompt ?? "").toLowerCase();
    if (lowerDesc.includes(q) || lowerExample.includes(q) || lowerPrompt.includes(q)) {
      containsDescriptionOrExample.push(entry);
    }
  }

  return [
    ...exactName,
    ...prefixName,
    ...containsName,
    ...primaryExactKeyword,
    ...exactKeyword,
    ...containsKeyword,
    ...containsDescriptionOrExample,
  ];
}

export function formatReferenceClipText(
  entry: Pick<CommandReferenceEntry, "name" | "standsFor" | "description">,
): string {
  const expansion = entry.standsFor.trim();
  if (expansion) {
    return `${entry.name}. ${expansion}. What it does: ${entry.description}`;
  }
  return `${entry.name}. What it does: ${entry.description}`;
}
