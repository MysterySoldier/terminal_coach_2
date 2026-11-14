// Generated from linux-commands-master-list.md (388 commands across 8 categories)
// Incorporates LinuxDeck flashcard descriptions from MysterySoldier/LinuxDeck.

export interface CommandReferenceEntry {
  id: string;
  name: string;
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Shows you where you are. It prints the full address of the folder you're standing in right now — like reading the sign on the door of the room you're in.",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Shows you what's sitting out in the room — the files and folders in the folder you're looking at. Add -a and it opens every drawer and looks under the bed too, showing the hidden stuff as well.",
    "example": "ls ~/Downloads",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Walks you into a different folder, like walking from one room of the house into another.",
    "example": "cd ~/Documents",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Makes a brand-new empty folder, like adding a new drawer to the filing cabinet.",
    "example": "mkdir ~/Documents/school",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Takes an empty folder away — but only if there's nothing inside it, like removing a drawer only after you've emptied it.",
    "example": "rmdir ~/Documents/empty-folder",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Makes a blank new file, like putting a fresh empty sheet of paper on the desk. If the file already exists, it just stamps it with today's date.",
    "example": "touch ~/Desktop/notes.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Makes a copy of a file or folder, like photocopying a paper — the original stays right where it was.",
    "example": "cp ~/Documents/essay.txt ~/Desktop/essay-backup.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Moves a file or folder somewhere else, or gives it a new name — like sliding a paper from one drawer into another.",
    "example": "mv ~/Downloads/photo.jpg ~/Pictures/photo.jpg",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Feeds a file into the shredder — once it goes in, it's gone, there is no trash can to pull it back out of. Add -f (lowercase f) and it goes straight in with no 'are you sure?', and rm -rf on a folder feeds the whole drawer in, papers and all. Never type sudo rm -rf /* — that bulldozes the whole house, no undo.",
    "example": "rm ~/Downloads/old-photo.jpg",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Makes a shortcut that points at another file or folder, like a sticky note on the fridge that says the good snacks are in the top drawer.",
    "example": "ln -s ~/Documents/school ~/Desktop/school-shortcut",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Shows a file's report card: how big it is, who owns it, and when it was last touched.",
    "example": "stat ~/Documents/essay.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Peeks inside a file to tell you what it really is, instead of trusting the name on the outside — like opening a mystery box to see what's in it.",
    "example": "file ~/Downloads/photo.jpg",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Strips the address off and leaves just the file's name, like reading only the name on a folder tab.",
    "example": "basename ~/Pictures/vacation/beach.jpg",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Strips the file's name off and leaves just the folder it lives in — the address without the name on the door.",
    "example": "dirname ~/Pictures/vacation/beach.jpg",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Draws a map of a folder and everything tucked inside it, branches and all, like a family tree for your files.",
    "example": "tree ~/Documents",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Renames a whole bunch of files at once using find-and-replace, like relabeling every folder in a drawer in one go.",
    "example": "rename 's/\\.htm$/.html/' ~/Documents/*.htm",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Follows a shortcut to see where it really points, like pulling a string to find where the other end is tied.",
    "example": "readlink ~/Desktop/school-shortcut",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Turns a shortcut address into the full real address, starting from the front door of the whole computer.",
    "example": "realpath ~/Documents/../Pictures",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Makes a brand-new scratch file with a one-of-a-kind name, so two people working at once never grab the same scrap paper.",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Copies a file into its new home and sets who can use it, all in one move — like delivering a book to its shelf and stamping it at the same time.",
    "example": "install -m 755 ~/Downloads/myscript.sh ~/Desktop/myscript.sh",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Lists what's in a folder, in neat columns — ls's cousin that lines everything up in rows.",
    "example": "dir ~/Downloads",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Navigation & File Ops",
    "description": "Lists what's in a folder with the full details next to each item — size, owner, and date — like a report card for every file.",
    "example": "vdir ~/Documents",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Prints a whole file on the screen, top to bottom, like reading a letter out loud.",
    "example": "cat ~/Documents/notes.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Prints a file backwards, last line first — like reading a diary from today back to January.",
    "example": "tac ~/Documents/notes.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Opens a file in a reader you can scroll through page by page, and search inside with / — like a book you can flip through without opening the whole thing at once.",
    "example": "less ~/Documents/notes.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Shows a long file one screenful at a time — press the spacebar for the next page, like turning pages in a book.",
    "example": "more ~/Documents/notes.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Shows just the first few lines of a file — like peeking at the top of the first page.",
    "example": "head ~/Documents/notes.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Shows just the last few lines of a file — like reading the last page of a diary. Add -f and it keeps watching, printing new lines as they show up.",
    "example": "tail ~/Documents/notes.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Runs a command over and over every few seconds and refreshes the screen, so you can watch a number change live — like a scoreboard.",
    "example": "watch -n 2 ls ~/Downloads",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Prints a file with a number next to every line, like the line numbers in the margin of a school worksheet.",
    "example": "nl ~/Documents/notes.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Shows the raw bytes inside a file — the tiny pieces it's really made of — so you can spot hidden characters you can't see normally.",
    "example": "od -c ~/Documents/notes.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Shows a file's insides as rows of numbers and letters, like an X-ray of the file.",
    "example": "hexdump -C ~/Documents/notes.txt | head",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Pulls out any readable words hiding inside a file that looks like gibberish — like finding real words in a bowl of alphabet soup.",
    "example": "strings ~/Pictures/photo.jpg | head",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Turns a file into a page of code numbers (and can turn it back), like writing a secret message in code.",
    "example": "xxd ~/Documents/notes.txt | head",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Viewing & Paging",
    "description": "Turns any file into plain letters and numbers so it can travel safely inside an email or a message, and turns it back with -d.",
    "example": "echo -n 'hello' | base64",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Searches through a file and shows you only the lines that contain the word you're looking for — like using find in a Word document.",
    "example": "grep 'homework' ~/Documents/notes.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Searches like grep, but lets you look for two things at once — 'this OR that' — without extra fiddling.",
    "example": "egrep 'homework|exam' ~/Documents/notes.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Searches for the exact letters you typed, no wildcards, no tricks — what you type is exactly what it looks for.",
    "example": "fgrep 'a.b*c' ~/Documents/notes.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Finds a word in a file and swaps it for another word, on the fly — like find-and-replace in a document.",
    "example": "sed 's/homework/schoolwork/' ~/Documents/notes.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Reads a file line by line and pulls out just the column you want, like cutting one column out of a spreadsheet.",
    "example": "awk '{print $1}' ~/Documents/class-list.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Slices one column out of every line of a file, like cutting the names column off a class roster.",
    "example": "cut -d, -f1 ~/Documents/class-list.csv",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Puts lines in order — A to Z, or smallest to biggest — like alphabetizing a stack of papers.",
    "example": "sort ~/Documents/names.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Squashes lines that repeat right next to each other down to one copy, like removing duplicate papers from a stack.",
    "example": "sort ~/Documents/names.txt | uniq",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Counts a file for you — how many lines, words, and letters it has.",
    "example": "wc ~/Documents/essay.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Swaps one letter for another all through a file, or deletes letters — like changing every lowercase letter to uppercase in one go.",
    "example": "echo 'hello' | tr 'a-z' 'A-Z'",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Glues two files together side by side, line by line, like stapling two lists together down the middle.",
    "example": "paste ~/Documents/names.txt ~/Documents/grades.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Combines two files that share a matching column, like matching names on a class list to grades on a grade sheet.",
    "example": "join ~/Documents/names.txt ~/Documents/grades.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Compares two sorted files and shows you what's only in the first, only in the second, and in both — like comparing two shopping lists.",
    "example": "comm ~/Documents/list1.txt ~/Documents/list2.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Shows you exactly what changed between two files, line by line — like a teacher marking up two drafts of your essay.",
    "example": "diff ~/Documents/essay-draft.txt ~/Documents/essay-final.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Takes a list of changes and applies it to a file, like pasting the teacher's corrections straight into your essay.",
    "example": "patch ~/Documents/essay.txt < ~/Downloads/fixes.patch",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Splits what a command prints into two places at once: on your screen AND into a file — like a photocopier that hands you a copy and files one away.",
    "example": "ls ~/Downloads | tee ~/Desktop/download-list.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Takes a list of things and hands them to another command one by one, like handing papers from a pile to a friend to file.",
    "example": "ls ~/Documents/*.txt | xargs wc -l",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Chops one giant file into smaller numbered pieces, like tearing a huge poster into pages you can carry.",
    "example": "split -l 1000 ~/Documents/big-list.txt part_",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Straightens messy text into neat lined-up columns, like a teacher lining up a crooked table.",
    "example": "ls ~/Downloads | column",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Gives a file a quick fingerprint number, so you can tell if it got damaged on its way to you — if the number changes, something changed.",
    "example": "cksum ~/Downloads/photo.jpg",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Makes a fingerprint for a file so you can check two copies are exactly the same, bit for bit.",
    "example": "md5sum ~/Downloads/photo.jpg",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Makes a stronger fingerprint for a file, used to prove a download wasn't tampered with on the way.",
    "example": "sha256sum ~/Downloads/photo.jpg",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Text Processing & Filtering",
    "description": "Compares two files and points at the exact spot where they first differ, like a spot-the-difference puzzle.",
    "example": "cmp ~/Documents/essay.txt ~/Desktop/essay-backup.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Searching",
    "description": "Hunts through folders for files by name, size, or age — like a bloodhound sniffing through every drawer.",
    "example": "find ~/Downloads -name '*.pdf'",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Searching",
    "description": "Finds a file in a flash by looking it up in an index, instead of searching every drawer by hand — like using the library catalog instead of walking the shelves.",
    "example": "locate essay.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Searching",
    "description": "Rebuilds the index that locate uses, so brand-new files show up when you search for them.",
    "example": "sudo updatedb",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Searching",
    "description": "Shows you exactly where the computer finds a command when you type its name — which copy of it runs.",
    "example": "which python3",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Searching",
    "description": "Finds where a command lives, plus its help pages — like asking the librarian where a book is shelved.",
    "example": "whereis python3",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Searching",
    "description": "Tells you what kind of command a word is — a built-in shortcut, a nickname, or a real program on the disk.",
    "example": "type ls",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Bundles a whole folder of files into one single package file, like stuffing papers into one big envelope — and can unpack it again.",
    "example": "tar -czvf ~/Desktop/homework-backup.tar.gz ~/Documents/school",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Squishes a file down smaller so it takes up less room, like vacuum-sealing a bag of clothes.",
    "example": "gzip ~/Documents/big-file.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Un-squishes a .gz file back to its normal size.",
    "example": "gunzip ~/Documents/big-file.txt.gz",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Squishes a file even smaller than gzip, but takes a bit longer doing it.",
    "example": "bzip2 ~/Documents/big-file.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Squishes a file down really small — the tightest squeeze of the bunch.",
    "example": "xz ~/Documents/big-file.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Packs files and folders into one .zip package that opens on any computer — Windows, Mac, or Linux.",
    "example": "zip -r ~/Desktop/photos.zip ~/Pictures/vacation",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Unpacks a .zip package back into its files and folders.",
    "example": "unzip ~/Downloads/photos.zip -d ~/Pictures",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Copies files to another place, but only sends the parts that actually changed — like handing over just the new pages instead of the whole book.",
    "example": "rsync -av ~/Documents/ ~/Desktop/backup/",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Copies a disk bit by bit, exactly as it is — like writing a bootable installer onto a USB stick, or making a perfect photocopy of a whole drive. It does exactly what you tell it, so double-check before you run it.",
    "example": "dd if=~/Downloads/ubuntu.iso of=/dev/sdb bs=4M status=progress",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Squishes files fast and small — the new kid that's quick at packing and unpacking.",
    "example": "zstd ~/Documents/big-file.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Packs and unpacks .7z packages and lots of other formats, and can lock them with a password.",
    "example": "7z a ~/Desktop/backup.7z ~/Documents/school",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "Archiving & Compression",
    "description": "Packs files into a stream one after another, like feeding papers into a scanner in a line.",
    "example": "find ~/Documents | cpio -o > ~/Desktop/archive.cpio",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "File creation & wiping",
    "description": "Overwrites a file over and over before deleting it, so nobody can dig the old words back up — the real shredder.",
    "example": "shred -u ~/Documents/secret-note.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "File creation & wiping",
    "description": "Shrinks a file down to an exact size — or empties it out completely — without deleting the file itself, like emptying a notebook but keeping the cover.",
    "example": "truncate -s 0 ~/Documents/log.txt",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "File creation & wiping",
    "description": "Reserves a chunk of disk space for a file right now, without filling it yet — like booking a table before dinner.",
    "example": "fallocate -l 1G ~/Desktop/big-space.bin",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "File creation & wiping",
    "description": "Makes a special file that stands in for a piece of hardware, or a named pipe that lets two programs pass notes to each other.",
    "example": "mknod ~/Desktop/my-pipe p",
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
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "group": "File creation & wiping",
    "description": "Pushes everything the computer was holding in its memory out onto the disk right now, so nothing gets lost if the power goes out.",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Makes a brand-new login account on the computer, like giving a new student their own desk and locker.",
    "example": "sudo useradd -m newstudent",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Changes an existing account — like moving a student into a different class or giving them a new key.",
    "example": "sudo usermod -aG students newstudent",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Removes a login account from the computer.",
    "example": "sudo userdel oldstudent",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Makes a new group, like starting a new club — everyone in the club shares the same permissions.",
    "example": "sudo groupadd study-group",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Renames a group or changes its number.",
    "example": "sudo groupmod -n homework-club study-group",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Deletes a group that isn't needed anymore.",
    "example": "sudo groupdel old-club",
    "keywords": [
      "remove",
      "delete",
      "group"
    ]
  },
  {
    "id": "cmd-passwd",
    "name": "passwd",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Sets or changes a password for an account — your own, or someone else's if you're the admin.",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Sets the rules for a password — like how often someone has to change it, or when it stops working.",
    "example": "sudo chage -l newstudent",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Adds or removes people from a group, like updating the club roster.",
    "example": "sudo gpasswd -a newstudent study-group",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Shows an account's ID card: its number, its main group, and every group it belongs to.",
    "example": "id newstudent",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Lists all the groups someone belongs to — all the clubs on their list.",
    "example": "groups newstudent",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Prints the name of the account you're logged in as right now.",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Changes which shell you get when you log in — the shell is the program that runs the black window where you type.",
    "example": "chsh -s /bin/bash",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Updates the real name and contact info attached to an account, like filling in the name tag on a locker.",
    "example": "sudo chfn -f 'Alice Smith' alice",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Switches which group you're acting as right now, so new files you make belong to that group.",
    "example": "newgrp study-group",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Creates a whole list of accounts at once from a file, like enrolling a whole class from a roster.",
    "example": "sudo newusers ~/Documents/class-roster.txt",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Sets passwords for a bunch of accounts at once from a list of names and passwords.",
    "example": "echo 'newstudent:Password123' | sudo chpasswd",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Shows who's logged in to the computer right now, all on one line.",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Users & Groups",
    "description": "Looks up who's logged in and shows a little more about each person — their real name and how long they've been idle.",
    "example": "pinky -l alice",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Sets who can open, change, or run a file — like choosing who gets a key to a locker. The numbers are the combination: 7 lets someone read, change, and run it; 5 lets them read and run it; 0 locks them out.",
    "example": "chmod 755 ~/Desktop/myscript.sh",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Hands a file or folder to a new owner, like signing a locker over to a different student.",
    "example": "sudo chown alice ~/Documents/shared-notes",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Changes which group owns a file, without changing the person who owns it.",
    "example": "chgrp study-group ~/Documents/shared-notes",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Sets the default locks for every new file you make from now on — the locks that go on automatically before you touch them.",
    "example": "umask 022",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Shows the full permission list on a file, including the extra fine-grained rules — like reading the whole guest list on the door.",
    "example": "getfacl ~/Documents/shared-notes",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Adds a special permission for one person or group on a file, without changing the main owner — like adding one name to the guest list.",
    "example": "setfacl -m u:alice:r ~/Documents/shared-notes",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Sets a special flag on a file, like +i which locks it so nobody — not even the admin — can change or delete it until the flag comes off.",
    "example": "sudo chattr +i ~/Documents/important.txt",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Shows the special flags set on a file, like checking whether a file is locked against changes.",
    "example": "lsattr ~/Documents/important.txt",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Shows the special superpowers given to a program file — little permissions that let it do one grown-up job without being the admin. The example checks ping, a program that lives in the system's program folder.",
    "example": "getcap /usr/bin/ping",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Permissions & Ownership",
    "description": "Gives a program one special superpower, so it can do its one grown-up job without being the admin.",
    "example": "sudo setcap 'cap_net_bind_service=+ep' ~/Desktop/myapp",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Runs one command as the admin — like asking the teacher to unlock the supply closet for you, just this once.",
    "example": "sudo apt update",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Switches you to a different account — the admin's, unless you name someone else.",
    "example": "su - alice",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Opens the admin-permissions file in a safe editor that checks your spelling before saving, so a typo can't lock everyone out.",
    "example": "sudo visudo",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Shows who's logged in to the computer right now, and which terminal each person is using.",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Shows who's logged in, what each person is running, and how busy the computer is.",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Shows a list of recent logins — who signed in, when, and when they left.",
    "example": "last -n 15",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Shows the last time every account signed in, so you can spot accounts nobody has used in ages.",
    "example": "lastlog -u alice",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Shows what the computer knows about a person — their real name, their home folder, and when they last signed in.",
    "example": "finger alice",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Sends a message to every person logged in right now — it pops up on all their screens at once, like a school announcement over the loudspeaker.",
    "example": "wall 'Class is starting in 5 minutes'",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Lets you safely edit a file that belongs to the system — like the little address book that maps website names to numbers — using your own editor.",
    "example": "sudoedit /etc/hosts",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Privilege & Session Auditing",
    "description": "Runs a command as a different user, from a script or a service — like asking someone else to do one job for you.",
    "example": "sudo runuser -l alice -c 'whoami'",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Account file checks",
    "description": "Checks the computer's list of accounts for mistakes — broken lines, duplicate numbers, or missing home folders.",
    "example": "sudo pwck -r",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Account file checks",
    "description": "Checks the computer's list of groups for mistakes, the same way pwck checks the accounts.",
    "example": "sudo grpck -r",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Account file checks",
    "description": "Opens the accounts list in a safe editor that locks it while you work, so two admins can't break it at the same time.",
    "example": "sudo vipw",
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
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "group": "Account file checks",
    "description": "Opens the groups list in a safe editor that locks it while you work.",
    "example": "sudo vigr",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Shows a snapshot of every program running right now — like a class photo of everything the computer is doing.",
    "example": "ps aux | grep firefox",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Shows a live table of what's running, updating every second, with the busiest programs on top — like a scoreboard for the computer.",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "A prettier, color version of top — same live scoreboard, easier to read, and you can scroll through it.",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "A monitor that watches the computer over time and lets you rewind to see what was busy an hour ago.",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Finds a running program by name and prints its number (its PID) — like looking up a student by name to get their ID number.",
    "example": "pgrep firefox",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Prints the ID number of a running program — same job as pgrep, just the number, nothing else.",
    "example": "pidof firefox",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Draws running programs as a family tree, so you can see which program started which — parents and children.",
    "example": "pstree -p",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Lists every file and network connection a program has open right now — like checking which books a student has checked out.",
    "example": "lsof ~/Documents/notes.txt",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Shows which program is using a file or a disk right now — like finding out who borrowed the classroom's only stapler.",
    "example": "fuser ~/Documents/notes.txt",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Monitoring",
    "description": "Reports how much work one program is doing — how hard it's pushing the CPU and the disk — over a few seconds.",
    "example": "pidstat -u 2 5",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Stops a running program by its ID number — like calling a student by number and telling them to sit down.",
    "example": "kill 4321",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Stops every running copy of a program by name — like telling every kid named Alex to sit down at once.",
    "example": "killall firefox",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Stops programs whose name matches a pattern you give it.",
    "example": "pkill -f 'python3 homework.py'",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Starts a program politely, asking it to take a smaller share of the computer's attention so other work doesn't slow down.",
    "example": "nice -n 15 tar -czf ~/Desktop/archive.tar.gz ~/Documents/school",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Changes how much attention a program that's already running gets — turns its volume up or down.",
    "example": "sudo renice -n 10 -p 4321",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Starts a long job that keeps running even after you close your terminal — like handing in homework and walking away while the teacher still grades it.",
    "example": "nohup ./homework.sh > ~/Desktop/homework.log 2>&1 &",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Sends a paused job to the back to keep running while you do other things — like letting the printer run while you go back to your desk.",
    "example": "bg %1",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Brings a job running in the back up to the front, so you can see it and talk to it again.",
    "example": "fg %1",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Lists the jobs you've got running or paused in this terminal — your own little to-do list.",
    "example": "jobs -l",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Opens a terminal session that keeps running on the computer even if your connection drops — like leaving your desk exactly as it was and coming back to it later.",
    "example": "screen -S homework",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Splits one terminal into panes and tabs, and lets you leave and come back to a session later — like having several desks in one room.",
    "example": "tmux new -s homework",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Runs a command with a stopwatch — if it takes longer than you said, it gets stopped automatically.",
    "example": "timeout 30s ping -c 4 example.com",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Sets how politely a program uses the disk, so a big backup doesn't hog the whole drive and slow everything else down.",
    "example": "ionice -c 3 rsync -a ~/Documents/ ~/Desktop/backup/",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Pins a program to one or two of the computer's brains (CPU cores), so it stays out of the other programs' way.",
    "example": "taskset -c 0,1 ./homework-worker",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Sets the biggest amount of stuff a program is allowed to grab — like how many files it can have open at once.",
    "example": "ulimit -n 4096",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Unties a background job from your terminal, so closing the window won't kill it.",
    "example": "disown -h %1",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Makes a script sit still until its background jobs finish — like a teacher waiting for the whole class to hand in their papers.",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Times how long a command takes to run, like a stopwatch for your terminal.",
    "example": "time ls ~/Documents",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Process Control",
    "description": "Checks or changes the limits on a program that's already running — like changing the rules for a game that's already started.",
    "example": "prlimit --pid 4321 --nofile=4096:4096",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "The remote control for the computer's background services — the helper programs that run all the time, like the web server. Start them, stop them, check if they're healthy.",
    "example": "sudo systemctl status nginx",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "The older remote control for background services — does the same start, stop, and check job as systemctl.",
    "example": "sudo service ssh status",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Reads the diary the computer keeps about its background services — what they did, and when they complained.",
    "example": "journalctl -u nginx --since '1 hour ago'",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Shows or changes the computer's name on the network — like the name tag on a locker.",
    "example": "sudo hostnamectl set-hostname my-laptop",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Shows or changes the computer's clock and time zone.",
    "example": "sudo timedatectl set-timezone America/New_York",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Shows or changes the computer's language and keyboard layout.",
    "example": "localectl status",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Shows who's signed in right now, and lets the admin manage those sign-ins.",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Shows how long the computer took to wake up, and which part was the slowpoke.",
    "example": "systemd-analyze blame | head -n 15",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Systemd & Services",
    "description": "Runs one command as a temporary background service, with its own limits — like hiring a helper for one job.",
    "example": "sudo systemd-run --unit=nightly-clean ~/Desktop/cleanup.sh",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Scheduling",
    "description": "Edits your schedule of jobs that run by themselves at set times — like setting an alarm clock for the computer.",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Scheduling",
    "description": "Schedules a command to run once, at a time you pick — like leaving a note that says 'do this at 2:30.'",
    "example": "echo 'ls ~/Downloads' | at 02:30",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Scheduling",
    "description": "Queues a job to run when the computer isn't busy — it waits for a quiet moment, then starts.",
    "example": "echo 'tar -czf ~/Desktop/home-backup.tgz ~/Documents' | batch",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Scheduling",
    "description": "Runs the daily and weekly chores on a computer that isn't always on — it catches up on what it missed while it was asleep.",
    "example": "sudo anacron -fn",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Scheduling",
    "description": "Makes the terminal wait doing nothing for a few seconds — a nap for your script.",
    "example": "sleep 5",
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
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "group": "Scheduling",
    "description": "Cancels a waiting one-time job by its number.",
    "example": "atrm 3",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows how much memory the computer has, how much is used, and how much is free — like checking how many seats are left in the classroom.",
    "example": "free -h",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows a quick health report: how busy the computer is, how much memory it's swapping, and how hard the disk is working.",
    "example": "vmstat 1 5",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows how hard each disk is working — how much it's reading and writing, and how long programs wait for it.",
    "example": "iostat -xz 1 3",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows how busy each of the computer's brains (CPU cores) is, one by one.",
    "example": "mpstat -P ALL 1 3",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Reads the computer's old health records, or takes a fresh sample — like looking at last week's report cards.",
    "example": "sar -u 1 5",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows how long the computer has been awake since it last restarted, and how busy it is right now.",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows a live table of everything at once — CPU, disk, and network — like a dashboard with all the gauges on one screen.",
    "example": "dstat -cdngy 1",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows how the computer's memory is laid out across its brains, or ties a program to one set of brains and memory.",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Prints how many brains (CPU cores) this computer has.",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows which programs are reading and writing the disk the hardest right now, live — like a leaderboard for disk use.",
    "example": "sudo iotop -o",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Watches the computer's brain at a deep level to find out what's making it slow — a doctor's stethoscope for the CPU.",
    "example": "sudo perf top",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "CPU, Memory & I/O",
    "description": "Shows how fast the computer's brains are running, and switches them between saving power and going full speed.",
    "example": "sudo cpupower frequency-info",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Prints a fact sheet about the computer's brain: what kind it is, how many cores it has, and how fast it goes.",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Lists the blocks of memory (RAM) in the computer and whether each one is switched on.",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Lists the parts plugged into the computer's insides — graphics card, network card, and the rest — like reading the parts list on the box.",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Prints a full inventory of the computer's hardware — every part, all in one list.",
    "example": "sudo lshw -short",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Reads the little label the manufacturer burned into the computer — brand, model, serial number, and which memory slots are filled.",
    "example": "sudo dmidecode -t memory",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Checks a hard drive's settings and tests how fast it can read — like a speed test for the disk.",
    "example": "sudo hdparm -Tt /dev/sda",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Reads a drive's own health diary — the warnings it keeps about itself — so you can spot a dying drive before it quits.",
    "example": "sudo smartctl -a /dev/sda",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Shows or changes the settings on the wired network plug — how fast it talks, and whether it can wake the computer up.",
    "example": "sudo ethtool eth0",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Lists all the disks and storage gadgets the computer sees, and the names it gave them.",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Reads the computer's thermometers — how hot the brains are, and how fast the fans are spinning.",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Asks the computer for one of its built-in facts, like how big a page of memory is.",
    "example": "getconf PAGESIZE",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Prints what kind of brain this computer has — like x86_64 for most PCs.",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Hardware Discovery",
    "description": "Prints which flavor of Linux this is, and which version — like reading the label on the box.",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Prints facts about the computer's engine (the kernel) — its version, and what kind of machine it's running on.",
    "example": "uname -r",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Shows the messages the computer's engine wrote while it was waking up — what hardware it found, and what it grumbled about.",
    "example": "sudo dmesg -T | tail -n 25",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Lists the drivers loaded into the engine right now — the little helper programs that let it talk to hardware.",
    "example": "lsmod | grep kvm",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Loads a driver into the engine (or takes one out), bringing along anything else it needs.",
    "example": "sudo modprobe wireguard",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Loads one single driver file straight into the engine, without checking what else it needs.",
    "example": "sudo insmod ~/Desktop/custom_driver.ko",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Unloads a driver from the engine, when nothing is using it anymore.",
    "example": "sudo rmmod custom_driver",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Reads or changes the engine's live settings — the knobs and dials the computer's core runs on.",
    "example": "sudo sysctl -w net.ipv4.ip_forward=1",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Restarts the computer cleanly — closes everything properly, then starts it up again.",
    "example": "sudo reboot",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Turns the computer off cleanly — or restarts it — right now or at a time you pick.",
    "example": "sudo shutdown -h now",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Turns the computer's power off, after closing everything properly.",
    "example": "sudo poweroff",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "The very first program the computer starts — also used to switch the whole machine between modes, like off or reboot.",
    "example": "sudo init 6",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Shows the fact sheet for a driver: what it does, who wrote it, and what settings it takes.",
    "example": "modinfo ext4",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Rebuilds the map that says which drivers need which other drivers, so they load in the right order.",
    "example": "sudo depmod -a",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Rebuilds the little starter pack the computer uses to wake up — the first files it needs before it can read the main disk.",
    "example": "sudo dracut --force",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Rebuilds the menu the computer shows when it first turns on — the list of systems you can start.",
    "example": "sudo update-grub",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Builds a fresh copy of that same startup menu, from the settings file.",
    "example": "sudo grub2-mkconfig -o /boot/grub2/grub.cfg",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Shows or changes the boot order stored in the computer's own firmware — which disk it tries to start from first.",
    "example": "sudo efibootmgr -v",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Checks for official updates for the computer's built-in software (firmware) and installs them.",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Kernel & Boot",
    "description": "Brings the computer to a full stop — everything off, nothing running.",
    "example": "sudo halt",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Tracing & debugging",
    "description": "Watches a program and writes down every single thing it asks the computer's engine to do — like following a student around with a notebook to find out where they get stuck.",
    "example": "strace -e openat ls ~/Documents",
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
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "group": "Tracing & debugging",
    "description": "Watches a program and writes down every helper function it calls — like strace, but for the library helpers.",
    "example": "ltrace ./my-program",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Lists every disk and partition in the computer as a little tree, with sizes and where each one is attached.",
    "example": "lsblk -f",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Shows each disk's ID number and what kind of filing system it uses.",
    "example": "sudo blkid",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "The tool for slicing a disk into partitions — like drawing lines on a blank notebook to make sections. It can erase a disk, so it asks you to be careful.",
    "example": "sudo fdisk -l /dev/sda",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Slices and manages disk partitions, and works well with big modern disks.",
    "example": "sudo parted /dev/sdb print",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Edits the partition map on modern disks (the GPT kind) — fdisk's cousin for newer computers.",
    "example": "sudo gdisk -l /dev/sda",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Saves a disk's partition map to a file, or copies a map onto another disk — made for scripts, not typing by hand.",
    "example": "sudo sfdisk -d /dev/sda > ~/Desktop/sda-layout.txt",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Tells the computer to re-read a disk's partition map right now, so new slices show up without a restart.",
    "example": "sudo partprobe /dev/sdb",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Edits disk partitions with a menu you drive with arrow keys — the friendliest of the disk slicers.",
    "example": "sudo cfdisk /dev/sdb",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Edits GPT partition maps from the command line, made for scripts and backups.",
    "example": "sudo sgdisk -p /dev/sda",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Erases the labels on a disk that say what filing system it uses, so it can be reformatted fresh.",
    "example": "sudo wipefs -a /dev/sdb1",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Disk & Partitioning",
    "description": "Pretends a disk-image file is a real disk, so you can slice it and open it like one.",
    "example": "sudo losetup -fP --show ~/Downloads/disk.img",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Shows how much room is left on each disk — like checking how full every drawer in the cabinet is.",
    "example": "df -h",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Adds up how much room a folder and everything inside it takes up.",
    "example": "du -sh ~/Downloads",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Attaches a disk or a shared folder to a spot in your filing cabinet, so you can open it like any other folder.",
    "example": "sudo mount /dev/sdb1 ~/Desktop/backup-disk",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Safely detaches a disk or shared folder, so you can unplug it without losing anything.",
    "example": "sudo umount ~/Desktop/backup-disk",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Shows everything that's attached right now, as a tree — every disk and where it hangs in the cabinet.",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Formats a disk partition fresh — wipes it clean and sets up a new filing system on it. Everything on it gets erased.",
    "example": "sudo mkfs.ext4 /dev/sdb1",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Checks a disk for damage and fixes what's broken — like a doctor's checkup for the filing system.",
    "example": "sudo fsck -y /dev/sdb1",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Changes the settings on a disk's filing system — like how much room is saved for the admin.",
    "example": "sudo tune2fs -m 1 /dev/sdb1",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Checks and repairs a damaged XFS disk — XFS is one kind of filing system Linux can use.",
    "example": "sudo xfs_repair /dev/sdb1",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Prints the details of an XFS disk — how it's laid out inside.",
    "example": "xfs_info ~/Desktop/backup-disk",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Switches on extra overflow memory (swap) — spare room on the disk the computer uses when its real memory fills up.",
    "example": "swapon --show",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Switches off that overflow memory and moves everything back into real memory.",
    "example": "sudo swapoff ~/Desktop/myswap",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Prepares a file or partition to be used as overflow memory.",
    "example": "sudo mkswap ~/Desktop/myswap",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Prints the deep details of an ext disk's filing system — the fine print about how it's laid out.",
    "example": "sudo dumpe2fs -h /dev/sda1",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "A low-level repair bench for ext disks — lets an expert poke at the filing system's insides directly.",
    "example": "sudo debugfs -R 'stats' /dev/sda1",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Checks and repairs ext disks — the ext family's own doctor.",
    "example": "sudo e2fsck -f /dev/sdb1",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "A low-level repair bench for XFS disks — for poking at the filing system's insides directly.",
    "example": "sudo xfs_db -r -c 'version' /dev/sdb1",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Filesystems & Mounting",
    "description": "Plugs in, unplugs, and powers off USB drives cleanly, without needing the admin password.",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Marks a raw disk as ready to join a storage pool — the first step in LVM, a system that lets you combine disks into one big flexible drawer.",
    "example": "sudo pvcreate /dev/sdb",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Shows a quick table of every disk in the storage pool and how much free room each has.",
    "example": "sudo pvs",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Combines disks into one storage pool — a volume group — that you can slice up however you like.",
    "example": "sudo vgcreate vg_data /dev/sdb",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Shows a quick table of all the storage pools and how much free room is left in each.",
    "example": "sudo vgs",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Carves a flexible slice out of a storage pool — a virtual partition you can grow later.",
    "example": "sudo lvcreate -L 50G -n lv_logs vg_data",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Lists all the slices carved out of the storage pools, and how big each one is.",
    "example": "sudo lvs",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Grows a slice in the storage pool, making it bigger while the computer keeps running.",
    "example": "sudo lvextend -r -L +20G /dev/vg_data/lv_logs",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Grows or shrinks an ext filing system to match the slice it sits on.",
    "example": "sudo resize2fs /dev/vg_data/lv_logs",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Grows a live XFS filing system to fill the new room on its slice.",
    "example": "sudo xfs_growfs ~/Desktop/backup-disk",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Builds and looks after RAID arrays — groups of disks that team up so your data survives even if one disk dies.",
    "example": "sudo mdadm --detail /dev/md0",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Shows the hidden layer underneath LVM and disk encryption — the virtual disks the system builds on top of real ones.",
    "example": "sudo dmsetup ls --tree",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Manages the backup cables to big storage boxes, so the computer keeps talking to its disks even if one cable fails.",
    "example": "sudo multipath -ll",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "LVM & RAID",
    "description": "Connects to storage that lives on another computer across the network, and treats it like a local disk.",
    "example": "sudo iscsiadm -m discovery -t sendtargets -p 10.0.0.50",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Locks and unlocks an encrypted disk — a disk whose contents are scrambled until you give the password.",
    "example": "sudo cryptsetup luksOpen /dev/sdb1 secure_vault",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Shows how much disk room you're using, and the limit you're allowed.",
    "example": "quota -vs",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Prints a report of everyone's disk use and limits on one disk.",
    "example": "sudo repquota -as",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Opens an editor to set someone's disk room limit.",
    "example": "sudo edquota -u alice",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Asks a file-sharing server which folders it's sharing, and who's using them.",
    "example": "showmount -e 10.0.0.10",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Shows or refreshes the list of folders this computer shares with others over the network.",
    "example": "sudo exportfs -rav",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Manages ZFS filing systems — a fancy kind that can take instant snapshots, like a save point in a video game.",
    "example": "sudo zfs snapshot tank/data@pre-upgrade",
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
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "group": "Encryption, quotas & sharing",
    "description": "Manages Btrfs filing systems — another fancy kind with instant snapshots and built-in disk teaming.",
    "example": "sudo btrfs subvolume list ~/Desktop/backup-disk",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Shows and changes the computer's network settings — its address, its routes, and which plugs are on.",
    "example": "ip -br addr show",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "The older way to look at network plugs and addresses — ip is the newer tool that replaced it.",
    "example": "ifconfig eth0",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "The older way to look at the map the computer uses to send network traffic — ip route is the newer tool.",
    "example": "route -n",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Controls the network from the command line — join Wi-Fi, set an address, check if a plug is up.",
    "example": "nmcli device status",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Opens a friendly menu for the network settings, driven with arrow keys — no typing addresses by hand.",
    "example": "sudo nmtui",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Applies the network settings written in a settings file, on Ubuntu computers.",
    "example": "sudo netplan try",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Shows the little notebook where the computer keeps track of which neighbor's address goes with which hardware name.",
    "example": "arp -an",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Prints the computer's name on the network — or with -I, all the addresses it answers to.",
    "example": "hostname -I",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Shows and changes Wi-Fi settings — signal strength, and which network you're joined to.",
    "example": "iw dev wlan0 link",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Lists the wireless radios — Wi-Fi and Bluetooth — and lets you switch them off or back on.",
    "example": "rfkill list",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Shows which address book (DNS server) each network plug uses, and lets you clear the computer's memory of old lookups.",
    "example": "resolvectl status",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Asks the network for an address to use — like checking in at the front desk and getting a room number.",
    "example": "sudo dhclient -v eth0",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Switches a network plug on, using the settings written down for it.",
    "example": "sudo ifup eth0",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Switches a network plug off, cleanly.",
    "example": "sudo ifdown eth0",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Interface & Routing",
    "description": "Manages virtual network switches — the kind that connect containers and virtual machines to each other.",
    "example": "bridge link show",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Shows which doors (ports) are open on this computer, and who's connected through them.",
    "example": "sudo ss -tulpn",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "The older way to list open doors and connections — ss is the newer tool that replaced it.",
    "example": "sudo netstat -tulpn",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Knocks on another computer's door to see if it's home, and times how long the answer takes.",
    "example": "ping -c 4 8.8.8.8",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Maps every stop a message makes on its way to another computer — like tracking a package through every post office.",
    "example": "traceroute example.com",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Maps the stops to another computer, and also finds the biggest package size the road allows — no admin needed.",
    "example": "tracepath example.com",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Ping and traceroute on one live screen — it keeps knocking and shows you which stop is dropping the messages.",
    "example": "mtr -rwc 10 1.1.1.1",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "A pocket knife for the network — checks if a door (port) is open, or opens a quick one to listen on.",
    "example": "nc -zv example.com 443",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Opens a plain, unprotected chat line to another computer's port, mostly used to test if it answers.",
    "example": "telnet example.com 80",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Scans a computer or a network to find which doors are open and what's behind them.",
    "example": "nmap -sV example.com",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Listens in on the network wire and shows you the messages flying past — like holding a glass to the wall.",
    "example": "sudo tcpdump -i eth0 -nn port 443 -c 20",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Reads network messages in deep detail — every layer unwrapped, like opening an envelope to read the letter inside.",
    "example": "sudo tshark -i eth0 -f 'tcp port 80' -c 10",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Knocks on the local network to check if an address is already taken, or to find a neighbor's hardware name.",
    "example": "sudo arping -I eth0 -c 3 192.168.1.1",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Knocks on a whole street of addresses at once to see which computers are home.",
    "example": "fping -a -g 192.168.1.0/24",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Connects any two things together so data flows between them — like a hose joining two taps.",
    "example": "socat TCP-LISTEN:8000,fork,reuseaddr TCP:127.0.0.1:3000",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Connections & Diagnostics",
    "description": "Does the math on a network address — works out which addresses belong to that street, and which ones you can use.",
    "example": "ipcalc 10.20.4.0/22",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Asks the internet's phone book (DNS) what number a name maps to, and shows the full answer.",
    "example": "dig +short example.com A",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Looks a name up in the internet's phone book to find its number — or a number to find its name.",
    "example": "nslookup example.com",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "A quick, simple phone-book lookup for a name — one line back with the answer.",
    "example": "host example.com",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Looks up who owns a website name — when it was registered, and when it runs out.",
    "example": "whois example.com",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Asks a website for a page, right from the terminal — and can show you just the headers, or save the page to a file.",
    "example": "curl -I https://example.com",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Downloads a file from the web, and can pick up where it left off if the connection drops.",
    "example": "wget -c https://example.com/release.tar.gz -P ~/Downloads",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Copies a file to or from another computer over a secure, locked connection — like a courier with a sealed envelope.",
    "example": "scp ~/Documents/essay.txt alice@example.com:~/Documents/",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Opens a file-moving session with another computer, where you use ls, cd, get, and put to move files back and forth.",
    "example": "sftp alice@example.com",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Opens a secure terminal on another computer, so you can type commands on it as if you were sitting in front of it.",
    "example": "ssh alice@example.com",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Makes a pair of keys for logging in without a password — a public key you hand out, and a private key you never share.",
    "example": "ssh-keygen -t ed25519",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Hands your public key to another computer in one step, so it lets you in without a password next time.",
    "example": "ssh-copy-id alice@example.com",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Loads your private key into the helper that remembers it, so you don't retype your password on every connection.",
    "example": "ssh-add ~/.ssh/id_ed25519",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "A little helper that holds your unlocked keys in memory while you're signed in.",
    "example": "eval \"$(ssh-agent -s)\"",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "DNS & Web Transfers",
    "description": "Fetches another computer's public fingerprint, so you can save it and know it's really them next time.",
    "example": "ssh-keyscan -H example.com >> ~/.ssh/known_hosts",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "The bouncer at the computer's doors — decides which network traffic gets in and which gets turned away.",
    "example": "sudo iptables -L -n -v",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "The newer bouncer — same job as iptables, one tool for all the firewall rules.",
    "example": "sudo nft list ruleset",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Ubuntu's simple firewall — lets you open or close a door with one short command.",
    "example": "sudo ufw allow 22/tcp",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "The firewall remote control on Red Hat-style computers — opens doors and manages zones.",
    "example": "sudo firewall-cmd --permanent --add-service=https",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Switches that security guard between just watching and actually blocking, while you troubleshoot.",
    "example": "sudo setenforce 0",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Changes the security guard's rulebook — like letting a web server use a new port.",
    "example": "sudo semanage port -a -t http_port_t -p tcp 8080",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Fixes the security labels on files, putting them back to what the rulebook expects — often fixes a website showing 'forbidden.'",
    "example": "sudo restorecon -Rv ~/Desktop/website",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Shows whether AppArmor — another security guard, used on Ubuntu — is on, and which programs it's watching.",
    "example": "sudo aa-status",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Changes one file's security label directly — a quick fix that lasts until the labels get reset.",
    "example": "sudo chcon -Rt httpd_sys_content_t ~/Desktop/website",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Sets the rules for the computer's security camera — which files to watch, and what to record when someone touches them. The example watches the file where the computer keeps everyone's passwords.",
    "example": "sudo auditctl -w /etc/shadow -p wa -k shadow-changes",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Searches the security camera's recordings for something that happened — a failed login, or a blocked action.",
    "example": "sudo ausearch -m avc -ts recent",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Firewalls & SELinux/AppArmor",
    "description": "Checks the bouncer that locks out anyone who guesses passwords wrong too many times — or unbans someone it caught.",
    "example": "sudo fail2ban-client status sshd",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Crypto, VPN & certs",
    "description": "A toolkit for locks and certificates — checks a website's ID card, or makes secret codes.",
    "example": "openssl s_client -connect example.com:443 -servername example.com",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Crypto, VPN & certs",
    "description": "Locks a file with a secret code so only the right person can open it — and checks that a file really came from who it says it did.",
    "example": "gpg --encrypt --recipient alice@example.com ~/Documents/secrets.txt",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Crypto, VPN & certs",
    "description": "Shows how your WireGuard VPN tunnel is doing — who's connected, and how much data has flowed.",
    "example": "sudo wg show",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Crypto, VPN & certs",
    "description": "Connects you to a private tunnel (a VPN) so your traffic travels through it, locked and hidden.",
    "example": "sudo openvpn --config ~/Documents/client.ovpn",
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
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "group": "Crypto, VPN & certs",
    "description": "Gets a free ID card (an HTTPS certificate) for your website, and renews it before it runs out.",
    "example": "sudo certbot --nginx -d example.com",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "The app store for Ubuntu and Debian — installs, updates, and removes programs.",
    "example": "sudo apt update && sudo apt install -y curl",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "The older, script-friendly version of apt — same app store, steadier for automation.",
    "example": "sudo apt-get install -y git",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "Searches the app store's catalog to see if a program exists, and which version you'd get.",
    "example": "apt-cache policy nginx",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "Installs one program package file by hand, or lists what's already installed.",
    "example": "sudo dpkg -i ~/Downloads/package.deb",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "Installs snap apps — programs that bring everything they need with them, so they run on any Linux.",
    "example": "sudo snap install vlc",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "Pins a program at its current version so updates skip it — like telling the app store 'leave this one alone.'",
    "example": "sudo apt-mark hold firefox",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "Runs a program's first-time setup questions again, so you can change your answers.",
    "example": "sudo dpkg-reconfigure tzdata",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Debian/Ubuntu",
    "description": "Adds a new shop to the app store — an extra place to get programs from.",
    "example": "sudo add-apt-repository ppa:deadsnakes/ppa",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "RHEL/Rocky/Fedora",
    "description": "The app store on Red Hat, Rocky, and Fedora computers.",
    "example": "sudo dnf install -y htop",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "RHEL/Rocky/Fedora",
    "description": "The older app store on Red Hat computers — dnf is the newer one that replaced it.",
    "example": "sudo yum update -y",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "RHEL/Rocky/Fedora",
    "description": "The low-level tool that installs and checks program packages on Red Hat computers.",
    "example": "rpm -qa | grep kernel",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "RHEL/Rocky/Fedora",
    "description": "Signs a Red Hat computer in with Red Hat, so it can download official programs and updates.",
    "example": "sudo subscription-manager status",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Other distros",
    "description": "The app store on SUSE and openSUSE computers.",
    "example": "sudo zypper install nginx",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Other distros",
    "description": "The tiny, fast app store inside Alpine Linux — the lightweight flavor used in containers.",
    "example": "apk add --no-cache bash curl",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Other distros",
    "description": "Gentoo's app store — it fetches the recipe and builds each program from scratch on your machine.",
    "example": "sudo emerge --sync",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Other distros",
    "description": "An app store that installs every program in its own sealed box, so they never fight over shared parts.",
    "example": "nix profile install nixpkgs#ripgrep",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Installs desktop apps that run sealed off from the rest of the system, on any flavor of Linux.",
    "example": "flatpak install flathub org.gimp.GIMP",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Runs programs in sealed boxes called containers — each one carries its own little world, so it runs the same everywhere.",
    "example": "docker ps -a",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Runs containers like Docker, but without needing a background boss program running as the admin.",
    "example": "podman run --rm -it alpine sh",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Builds container images step by step, without needing Docker's boss program running.",
    "example": "buildah bud -t myapp:1.0 ~/Documents/myapp",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "The remote control for Kubernetes — the system that runs lots of containers across lots of computers.",
    "example": "kubectl get pods -A",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Peeks at the containers running on one machine in a Kubernetes cluster, for fixing things up close.",
    "example": "sudo crictl ps",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "The app store for Kubernetes — installs ready-made apps, called charts, in one go.",
    "example": "helm list -A",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "A Docker-style remote control that talks straight to the container engine underneath.",
    "example": "sudo nerdctl ps",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "The low-level wrench for the container engine — for poking at its insides when something's wrong.",
    "example": "sudo ctr namespaces list",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Looks at or copies container images between registries, without downloading the whole thing first.",
    "example": "skopeo inspect docker://docker.io/library/alpine:latest",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "Universal & Containers",
    "description": "Starts a whole team of containers from one recipe file — like a web server, a database, and a cache, all together.",
    "example": "docker-compose up -d",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "VMs & system containers",
    "description": "Runs lightweight pretend-computers (containers) that act like full Linux machines.",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "VMs & system containers",
    "description": "Boots a pretend Linux machine from a folder, for testing things safely away from the real system.",
    "example": "sudo systemd-nspawn -D ~/Desktop/debian-root",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "VMs & system containers",
    "description": "The remote control for virtual machines — start them, stop them, and check on them.",
    "example": "sudo virsh list --all",
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
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "group": "VMs & system containers",
    "description": "Makes and reshapes the virtual hard drives that virtual machines live on.",
    "example": "qemu-img create -f qcow2 ~/Desktop/ubuntu-vm.qcow2 20G",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Help",
    "description": "Opens the instruction manual for any command — the built-in help book.",
    "example": "man ls",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Help",
    "description": "Opens the longer, chapter-by-chapter help book for a program — more detail than man, for the tools that have one.",
    "example": "info coreutils",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Help",
    "description": "Searches all the help books by keyword, for when you know what you want to do but forgot the command's name.",
    "example": "apropos partition",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Help",
    "description": "Prints one line saying what a command does — the back-cover blurb.",
    "example": "whatis ls",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Help",
    "description": "Shows a cheat sheet for a command — the five most common examples, no walls of flags.",
    "example": "tldr tar",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Shows a numbered list of the commands you've already typed, so you can find one and run it again.",
    "example": "history | tail -n 20",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Makes a nickname for a long command — type the nickname, and the computer runs the whole thing.",
    "example": "alias ll='ls -la'",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Shows all the little notes the computer keeps about your session — or runs one command with a note changed.",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Prints the value of one of those little notes — like PATH, the list of folders the computer searches for commands.",
    "example": "printenv PATH",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Pins a note up where every program you start from this terminal can see it.",
    "example": "export EDITOR=nano",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Checks if something is true — like whether a file exists — so a script can decide what to do next.",
    "example": "test -f ~/Documents/notes.txt && echo 'File exists'",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Shell",
    "description": "Prints 'y' over and over, forever — used to feed yes answers to a program that keeps asking.",
    "example": "yes | head -n 5",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Prints today's date and the time — or formats it the way you ask.",
    "example": "date '+%Y-%m-%d %H:%M:%S'",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Prints a little calendar for this month, right in the terminal.",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "A calculator in the terminal — it does decimal math that the shell can't do on its own.",
    "example": "echo 'scale=2; 10 / 3' | bc -l",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Prints a run of numbers — 1, 2, 3, 4, 5 — handy for making lists in scripts.",
    "example": "seq 1 5",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Prints text with exact spacing and formatting — like a label maker for your terminal.",
    "example": "printf 'Hello, %s!\\n' Alice",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Wipes the terminal screen clean, so your prompt sits fresh at the top.",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Fixes a terminal screen that got scrambled — like shaking an Etch A Sketch clean and starting over.",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Records everything you type and everything the terminal prints into a file — like a dashcam for your session.",
    "example": "script ~/Desktop/session-log.txt",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Writes a note from your script into the computer's diary (the system log), so it shows up with everything else.",
    "example": "logger -t homework 'Backup finished'",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Shows or changes the terminal's own settings — like its size, or whether it shows what you type.",
    "example": "stty size",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Everyday",
    "description": "Asks the terminal what it can do — how wide it is, how to move the cursor, how to print in color.",
    "example": "tput cols",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Editors & building",
    "description": "A powerful text editor that lives in the terminal — press i to type, Esc then :wq to save and quit.",
    "example": "vim ~/Documents/notes.txt",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Editors & building",
    "description": "The friendly terminal text editor — it shows its shortcuts at the bottom, like Ctrl+O to save and Ctrl+X to quit.",
    "example": "nano ~/Documents/notes.txt",
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
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "group": "Editors & building",
    "description": "Tracks the history of your files — every save is a snapshot you can go back to, and it can share those snapshots with others.",
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
