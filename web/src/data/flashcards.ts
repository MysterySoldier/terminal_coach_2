// Generated from MysterySoldier/LinuxDeck (187 flashcards mapped to the 8 Reference categories)

export interface FlashcardEntry {
  id: string;
  command: string;
  description: string;
  categoryId: string;
  categoryNumber: number;
  categoryName: string;
  deckCategory: string;
  frontClipUrl: string;
  backClipUrl: string;
}

export type FlashcardDirection = "cmd-desc" | "desc-cmd" | "mix";

export const FLASHCARD_DIRECTION_OPTIONS: ReadonlyArray<{
  readonly value: FlashcardDirection;
  readonly label: string;
  readonly description: string;
}> = [
  {
    value: "cmd-desc",
    label: "Cmd → Desc",
    description: "Command on front, flip to plain-words description",
  },
  {
    value: "desc-cmd",
    label: "Desc → Cmd",
    description: "Plain-words description on front, flip to command",
  },
  {
    value: "mix",
    label: "Mix it up",
    description: "Random direction per card",
  },
];

export const TOTAL_FLASHCARDS = 187;

export const FLASHCARDS: FlashcardEntry[] = [
  {
    "id": "files-0",
    "command": "ls",
    "description": "List directory contents",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-0--front.mp3",
    "backClipUrl": "/audio/files-0--back.mp3"
  },
  {
    "id": "files-1",
    "command": "cd [directory]",
    "description": "Change directory",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-1--front.mp3",
    "backClipUrl": "/audio/files-1--back.mp3"
  },
  {
    "id": "files-2",
    "command": "pwd",
    "description": "Display current path",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-2--front.mp3",
    "backClipUrl": "/audio/files-2--back.mp3"
  },
  {
    "id": "files-3",
    "command": "mkdir [directory]",
    "description": "Create directory",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-3--front.mp3",
    "backClipUrl": "/audio/files-3--back.mp3"
  },
  {
    "id": "files-4",
    "command": "rmdir [directory]",
    "description": "Remove empty directory",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-4--front.mp3",
    "backClipUrl": "/audio/files-4--back.mp3"
  },
  {
    "id": "files-5",
    "command": "rm [file]",
    "description": "Delete files or directories",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-5--front.mp3",
    "backClipUrl": "/audio/files-5--back.mp3"
  },
  {
    "id": "files-6",
    "command": "cp [src] [dst]",
    "description": "Copy files or directories",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-6--front.mp3",
    "backClipUrl": "/audio/files-6--back.mp3"
  },
  {
    "id": "files-7",
    "command": "mv [src] [dst]",
    "description": "Move or rename files",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-7--front.mp3",
    "backClipUrl": "/audio/files-7--back.mp3"
  },
  {
    "id": "files-8",
    "command": "find [path] -name [file]",
    "description": "Search for files or directories",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-8--front.mp3",
    "backClipUrl": "/audio/files-8--back.mp3"
  },
  {
    "id": "files-9",
    "command": "locate [file]",
    "description": "Quickly locate files",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-9--front.mp3",
    "backClipUrl": "/audio/files-9--back.mp3"
  },
  {
    "id": "files-10",
    "command": "touch [file]",
    "description": "Create empty file",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-10--front.mp3",
    "backClipUrl": "/audio/files-10--back.mp3"
  },
  {
    "id": "files-11",
    "command": "stat [file]",
    "description": "Display detailed file info",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-11--front.mp3",
    "backClipUrl": "/audio/files-11--back.mp3"
  },
  {
    "id": "files-12",
    "command": "tree",
    "description": "Show directory tree",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-12--front.mp3",
    "backClipUrl": "/audio/files-12--back.mp3"
  },
  {
    "id": "files-13",
    "command": "du [directory]",
    "description": "Show directory size",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-13--front.mp3",
    "backClipUrl": "/audio/files-13--back.mp3"
  },
  {
    "id": "files-14",
    "command": "df",
    "description": "Display disk space usage",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-14--front.mp3",
    "backClipUrl": "/audio/files-14--back.mp3"
  },
  {
    "id": "files-15",
    "command": "ln [source] [link]",
    "description": "Create hard or symbolic links",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-15--front.mp3",
    "backClipUrl": "/audio/files-15--back.mp3"
  },
  {
    "id": "files-16",
    "command": "basename [path]",
    "description": "Display file name from path",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-16--front.mp3",
    "backClipUrl": "/audio/files-16--back.mp3"
  },
  {
    "id": "files-17",
    "command": "dirname [path]",
    "description": "Display dir name from path",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-17--front.mp3",
    "backClipUrl": "/audio/files-17--back.mp3"
  },
  {
    "id": "files-18",
    "command": "lsattr [file]",
    "description": "View file attributes",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-18--front.mp3",
    "backClipUrl": "/audio/files-18--back.mp3"
  },
  {
    "id": "files-19",
    "command": "chattr [op] [file]",
    "description": "Modify file attributes",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "File & Dir Management",
    "frontClipUrl": "/audio/files-19--front.mp3",
    "backClipUrl": "/audio/files-19--back.mp3"
  },
  {
    "id": "security-0",
    "command": "nftables",
    "description": "Configure firewall rules",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Firewall & Security",
    "frontClipUrl": "/audio/security-0--front.mp3",
    "backClipUrl": "/audio/security-0--back.mp3"
  },
  {
    "id": "security-1",
    "command": "nmap",
    "description": "Network scanning tool",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Firewall & Security",
    "frontClipUrl": "/audio/security-1--front.mp3",
    "backClipUrl": "/audio/security-1--back.mp3"
  },
  {
    "id": "security-2",
    "command": "fail2ban",
    "description": "Prevent brute force attacks",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Firewall & Security",
    "frontClipUrl": "/audio/security-2--front.mp3",
    "backClipUrl": "/audio/security-2--back.mp3"
  },
  {
    "id": "security-3",
    "command": "gpg",
    "description": "Encrypt and decrypt files",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Firewall & Security",
    "frontClipUrl": "/audio/security-3--front.mp3",
    "backClipUrl": "/audio/security-3--back.mp3"
  },
  {
    "id": "security-4",
    "command": "firewalld",
    "description": "Dynamic firewall management",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Firewall & Security",
    "frontClipUrl": "/audio/security-4--front.mp3",
    "backClipUrl": "/audio/security-4--back.mp3"
  },
  {
    "id": "security-5",
    "command": "ssh-keygen",
    "description": "Generate SSH key pair",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Firewall & Security",
    "frontClipUrl": "/audio/security-5--front.mp3",
    "backClipUrl": "/audio/security-5--back.mp3"
  },
  {
    "id": "security-6",
    "command": "certbot",
    "description": "Generate SSL certificates",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Firewall & Security",
    "frontClipUrl": "/audio/security-6--front.mp3",
    "backClipUrl": "/audio/security-6--back.mp3"
  },
  {
    "id": "security-7",
    "command": "openvpn",
    "description": "Start OpenVPN service",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Firewall & Security",
    "frontClipUrl": "/audio/security-7--front.mp3",
    "backClipUrl": "/audio/security-7--back.mp3"
  },
  {
    "id": "security-8",
    "command": "tcpdump -i [interface]",
    "description": "Capture network traffic",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Firewall & Security",
    "frontClipUrl": "/audio/security-8--front.mp3",
    "backClipUrl": "/audio/security-8--back.mp3"
  },
  {
    "id": "security-9",
    "command": "firewall-cmd",
    "description": "Configure firewalld rules",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Firewall & Security",
    "frontClipUrl": "/audio/security-9--front.mp3",
    "backClipUrl": "/audio/security-9--back.mp3"
  },
  {
    "id": "proc-0",
    "command": "ps",
    "description": "Show current processes",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Process Management",
    "frontClipUrl": "/audio/proc-0--front.mp3",
    "backClipUrl": "/audio/proc-0--back.mp3"
  },
  {
    "id": "proc-1",
    "command": "top",
    "description": "Real-time display of system processes",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Process Management",
    "frontClipUrl": "/audio/proc-1--front.mp3",
    "backClipUrl": "/audio/proc-1--back.mp3"
  },
  {
    "id": "proc-2",
    "command": "htop",
    "description": "Interactive process monitoring tool",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Process Management",
    "frontClipUrl": "/audio/proc-2--front.mp3",
    "backClipUrl": "/audio/proc-2--back.mp3"
  },
  {
    "id": "proc-3",
    "command": "kill [PID]",
    "description": "Terminate process by PID",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Process Management",
    "frontClipUrl": "/audio/proc-3--front.mp3",
    "backClipUrl": "/audio/proc-3--back.mp3"
  },
  {
    "id": "proc-4",
    "command": "killall [name]",
    "description": "Kill all processes by name",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Process Management",
    "frontClipUrl": "/audio/proc-4--front.mp3",
    "backClipUrl": "/audio/proc-4--back.mp3"
  },
  {
    "id": "proc-5",
    "command": "nice [command]",
    "description": "Start process with priority",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Process Management",
    "frontClipUrl": "/audio/proc-5--front.mp3",
    "backClipUrl": "/audio/proc-5--back.mp3"
  },
  {
    "id": "proc-6",
    "command": "renice [PID] [priority]",
    "description": "Change priority of running process",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Process Management",
    "frontClipUrl": "/audio/proc-6--front.mp3",
    "backClipUrl": "/audio/proc-6--back.mp3"
  },
  {
    "id": "proc-7",
    "command": "jobs",
    "description": "View background tasks",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Process Management",
    "frontClipUrl": "/audio/proc-7--front.mp3",
    "backClipUrl": "/audio/proc-7--back.mp3"
  },
  {
    "id": "proc-8",
    "command": "fg [job_id]",
    "description": "Bring background task to foreground",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Process Management",
    "frontClipUrl": "/audio/proc-8--front.mp3",
    "backClipUrl": "/audio/proc-8--back.mp3"
  },
  {
    "id": "proc-9",
    "command": "nohup [command]",
    "description": "Run process immune to hangups",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Process Management",
    "frontClipUrl": "/audio/proc-9--front.mp3",
    "backClipUrl": "/audio/proc-9--back.mp3"
  },
  {
    "id": "proc-10",
    "command": "disown",
    "description": "Detach process from terminal",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Process Management",
    "frontClipUrl": "/audio/proc-10--front.mp3",
    "backClipUrl": "/audio/proc-10--back.mp3"
  },
  {
    "id": "proc-11",
    "command": "watch [command]",
    "description": "Execute command periodically",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "Process Management",
    "frontClipUrl": "/audio/proc-11--front.mp3",
    "backClipUrl": "/audio/proc-11--back.mp3"
  },
  {
    "id": "pkg-0",
    "command": "apt update",
    "description": "Update software sources",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Package Management",
    "frontClipUrl": "/audio/pkg-0--front.mp3",
    "backClipUrl": "/audio/pkg-0--back.mp3"
  },
  {
    "id": "pkg-1",
    "command": "apt upgrade",
    "description": "Upgrade system packages",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Package Management",
    "frontClipUrl": "/audio/pkg-1--front.mp3",
    "backClipUrl": "/audio/pkg-1--back.mp3"
  },
  {
    "id": "pkg-2",
    "command": "dnf install [package]",
    "description": "Install software package (DNF)",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Package Management",
    "frontClipUrl": "/audio/pkg-2--front.mp3",
    "backClipUrl": "/audio/pkg-2--back.mp3"
  },
  {
    "id": "pkg-3",
    "command": "yum remove [package]",
    "description": "Uninstall software package (YUM)",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Package Management",
    "frontClipUrl": "/audio/pkg-3--front.mp3",
    "backClipUrl": "/audio/pkg-3--back.mp3"
  },
  {
    "id": "pkg-4",
    "command": "snap install [package]",
    "description": "Install snap software",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Package Management",
    "frontClipUrl": "/audio/pkg-4--front.mp3",
    "backClipUrl": "/audio/pkg-4--back.mp3"
  },
  {
    "id": "pkg-5",
    "command": "apt-cache search [package]",
    "description": "Search for software packages",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Package Management",
    "frontClipUrl": "/audio/pkg-5--front.mp3",
    "backClipUrl": "/audio/pkg-5--back.mp3"
  },
  {
    "id": "pkg-6",
    "command": "apt show [package]",
    "description": "Show package details",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Package Management",
    "frontClipUrl": "/audio/pkg-6--front.mp3",
    "backClipUrl": "/audio/pkg-6--back.mp3"
  },
  {
    "id": "pkg-7",
    "command": "dpkg -i [package]",
    "description": "Manually install deb package",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Package Management",
    "frontClipUrl": "/audio/pkg-7--front.mp3",
    "backClipUrl": "/audio/pkg-7--back.mp3"
  },
  {
    "id": "pkg-8",
    "command": "rpm -ivh [package]",
    "description": "Install rpm package",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Package Management",
    "frontClipUrl": "/audio/pkg-8--front.mp3",
    "backClipUrl": "/audio/pkg-8--back.mp3"
  },
  {
    "id": "pkg-9",
    "command": "dnf list installed",
    "description": "List installed packages",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Package Management",
    "frontClipUrl": "/audio/pkg-9--front.mp3",
    "backClipUrl": "/audio/pkg-9--back.mp3"
  },
  {
    "id": "pkg-10",
    "command": "yum update",
    "description": "Update system packages (YUM)",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Package Management",
    "frontClipUrl": "/audio/pkg-10--front.mp3",
    "backClipUrl": "/audio/pkg-10--back.mp3"
  },
  {
    "id": "pkg-11",
    "command": "flatpak install [pkg]",
    "description": "Install flatpak application",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Package Management",
    "frontClipUrl": "/audio/pkg-11--front.mp3",
    "backClipUrl": "/audio/pkg-11--back.mp3"
  },
  {
    "id": "pkg-12",
    "command": "brew install [package]",
    "description": "Install with Homebrew",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Package Management",
    "frontClipUrl": "/audio/pkg-12--front.mp3",
    "backClipUrl": "/audio/pkg-12--back.mp3"
  },
  {
    "id": "net-0",
    "command": "ping [host]",
    "description": "Test network connectivity",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-0--front.mp3",
    "backClipUrl": "/audio/net-0--back.mp3"
  },
  {
    "id": "net-1",
    "command": "traceroute [host]",
    "description": "Trace route to a network host",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-1--front.mp3",
    "backClipUrl": "/audio/net-1--back.mp3"
  },
  {
    "id": "net-2",
    "command": "ss",
    "description": "Display socket information",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-2--front.mp3",
    "backClipUrl": "/audio/net-2--back.mp3"
  },
  {
    "id": "net-3",
    "command": "curl [url]",
    "description": "Download or request URL",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-3--front.mp3",
    "backClipUrl": "/audio/net-3--back.mp3"
  },
  {
    "id": "net-4",
    "command": "wget [url]",
    "description": "Download files via HTTP/FTP",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-4--front.mp3",
    "backClipUrl": "/audio/net-4--back.mp3"
  },
  {
    "id": "net-5",
    "command": "scp [src] [dst]",
    "description": "Securely copy remote files",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-5--front.mp3",
    "backClipUrl": "/audio/net-5--back.mp3"
  },
  {
    "id": "net-6",
    "command": "ip a",
    "description": "Configure network interfaces",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-6--front.mp3",
    "backClipUrl": "/audio/net-6--back.mp3"
  },
  {
    "id": "net-7",
    "command": "ip [address]",
    "description": "Manage network interfaces",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-7--front.mp3",
    "backClipUrl": "/audio/net-7--back.mp3"
  },
  {
    "id": "net-8",
    "command": "hostname",
    "description": "Show system hostname",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-8--front.mp3",
    "backClipUrl": "/audio/net-8--back.mp3"
  },
  {
    "id": "net-9",
    "command": "nmcli",
    "description": "Network CLI Tool",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-9--front.mp3",
    "backClipUrl": "/audio/net-9--back.mp3"
  },
  {
    "id": "net-10",
    "command": "dig [domain]",
    "description": "DNS lookup tool",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-10--front.mp3",
    "backClipUrl": "/audio/net-10--back.mp3"
  },
  {
    "id": "net-11",
    "command": "nslookup [domain]",
    "description": "Domain name resolution tool",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-11--front.mp3",
    "backClipUrl": "/audio/net-11--back.mp3"
  },
  {
    "id": "net-12",
    "command": "ufw",
    "description": "Firewall Manager",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-12--front.mp3",
    "backClipUrl": "/audio/net-12--back.mp3"
  },
  {
    "id": "net-13",
    "command": "tcpdump",
    "description": "Network packet capture tool",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Network Management",
    "frontClipUrl": "/audio/net-13--front.mp3",
    "backClipUrl": "/audio/net-13--back.mp3"
  },
  {
    "id": "remote-0",
    "command": "ssh [user@host]",
    "description": "Remote connection shell",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Remote & Automation",
    "frontClipUrl": "/audio/remote-0--front.mp3",
    "backClipUrl": "/audio/remote-0--back.mp3"
  },
  {
    "id": "remote-1",
    "command": "ansible [command]",
    "description": "Automation tool",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Remote & Automation",
    "frontClipUrl": "/audio/remote-1--front.mp3",
    "backClipUrl": "/audio/remote-1--back.mp3"
  },
  {
    "id": "remote-2",
    "command": "terraform",
    "description": "Infrastructure as code tool",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Remote & Automation",
    "frontClipUrl": "/audio/remote-2--front.mp3",
    "backClipUrl": "/audio/remote-2--back.mp3"
  },
  {
    "id": "remote-3",
    "command": "cmake",
    "description": "Generate build files",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Remote & Automation",
    "frontClipUrl": "/audio/remote-3--front.mp3",
    "backClipUrl": "/audio/remote-3--back.mp3"
  },
  {
    "id": "remote-4",
    "command": "ninja",
    "description": "High-speed build tool",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Remote & Automation",
    "frontClipUrl": "/audio/remote-4--front.mp3",
    "backClipUrl": "/audio/remote-4--back.mp3"
  },
  {
    "id": "remote-5",
    "command": "ld",
    "description": "Binary linker",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Remote & Automation",
    "frontClipUrl": "/audio/remote-5--front.mp3",
    "backClipUrl": "/audio/remote-5--back.mp3"
  },
  {
    "id": "remote-6",
    "command": "strip",
    "description": "Strip binary debug info",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Remote & Automation",
    "frontClipUrl": "/audio/remote-6--front.mp3",
    "backClipUrl": "/audio/remote-6--back.mp3"
  },
  {
    "id": "remote-7",
    "command": "openssl",
    "description": "Encryption and SSL toolkit",
    "categoryId": "cat-6",
    "categoryNumber": 6,
    "categoryName": "Networking, Security, and Diagnostics",
    "deckCategory": "Remote & Automation",
    "frontClipUrl": "/audio/remote-7--front.mp3",
    "backClipUrl": "/audio/remote-7--back.mp3"
  },
  {
    "id": "users-0",
    "command": "who",
    "description": "Show currently logged-in users",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-0--front.mp3",
    "backClipUrl": "/audio/users-0--back.mp3"
  },
  {
    "id": "users-1",
    "command": "w",
    "description": "Display user activity information",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-1--front.mp3",
    "backClipUrl": "/audio/users-1--back.mp3"
  },
  {
    "id": "users-2",
    "command": "whoami",
    "description": "Show current user identity",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-2--front.mp3",
    "backClipUrl": "/audio/users-2--back.mp3"
  },
  {
    "id": "users-3",
    "command": "id [username]",
    "description": "Display user and group IDs",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-3--front.mp3",
    "backClipUrl": "/audio/users-3--back.mp3"
  },
  {
    "id": "users-4",
    "command": "su [username]",
    "description": "Switch user",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-4--front.mp3",
    "backClipUrl": "/audio/users-4--back.mp3"
  },
  {
    "id": "users-5",
    "command": "sudo [command]",
    "description": "Execute command as superuser",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-5--front.mp3",
    "backClipUrl": "/audio/users-5--back.mp3"
  },
  {
    "id": "users-6",
    "command": "useradd [username]",
    "description": "Add new user",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-6--front.mp3",
    "backClipUrl": "/audio/users-6--back.mp3"
  },
  {
    "id": "users-7",
    "command": "usermod [options] [user]",
    "description": "Modify user information",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-7--front.mp3",
    "backClipUrl": "/audio/users-7--back.mp3"
  },
  {
    "id": "users-8",
    "command": "passwd [username]",
    "description": "Change user password",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-8--front.mp3",
    "backClipUrl": "/audio/users-8--back.mp3"
  },
  {
    "id": "users-9",
    "command": "groupadd [groupname]",
    "description": "Create user group",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-9--front.mp3",
    "backClipUrl": "/audio/users-9--back.mp3"
  },
  {
    "id": "users-10",
    "command": "groups [username]",
    "description": "Show user groups",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-10--front.mp3",
    "backClipUrl": "/audio/users-10--back.mp3"
  },
  {
    "id": "users-11",
    "command": "chown [owner] [file]",
    "description": "Change file owner",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-11--front.mp3",
    "backClipUrl": "/audio/users-11--back.mp3"
  },
  {
    "id": "users-12",
    "command": "chmod [perm] [file]",
    "description": "Change file permissions",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-12--front.mp3",
    "backClipUrl": "/audio/users-12--back.mp3"
  },
  {
    "id": "users-13",
    "command": "umask [mask]",
    "description": "Set default file permissions",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-13--front.mp3",
    "backClipUrl": "/audio/users-13--back.mp3"
  },
  {
    "id": "users-14",
    "command": "last",
    "description": "Show recent login records",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-14--front.mp3",
    "backClipUrl": "/audio/users-14--back.mp3"
  },
  {
    "id": "users-15",
    "command": "finger [username]",
    "description": "Display user information",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "User & Permission Mgmt",
    "frontClipUrl": "/audio/users-15--front.mp3",
    "backClipUrl": "/audio/users-15--back.mp3"
  },
  {
    "id": "dev-0",
    "command": "git clone [repo]",
    "description": "Clone code repository",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Dev & Build Tools",
    "frontClipUrl": "/audio/dev-0--front.mp3",
    "backClipUrl": "/audio/dev-0--back.mp3"
  },
  {
    "id": "dev-1",
    "command": "git pull",
    "description": "Pull latest code updates",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Dev & Build Tools",
    "frontClipUrl": "/audio/dev-1--front.mp3",
    "backClipUrl": "/audio/dev-1--back.mp3"
  },
  {
    "id": "dev-2",
    "command": "git commit",
    "description": "Commit staged changes",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Dev & Build Tools",
    "frontClipUrl": "/audio/dev-2--front.mp3",
    "backClipUrl": "/audio/dev-2--back.mp3"
  },
  {
    "id": "dev-3",
    "command": "git push",
    "description": "Push code to remote",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Dev & Build Tools",
    "frontClipUrl": "/audio/dev-3--front.mp3",
    "backClipUrl": "/audio/dev-3--back.mp3"
  },
  {
    "id": "dev-4",
    "command": "make",
    "description": "Build software project",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Dev & Build Tools",
    "frontClipUrl": "/audio/dev-4--front.mp3",
    "backClipUrl": "/audio/dev-4--back.mp3"
  },
  {
    "id": "dev-5",
    "command": "gcc",
    "description": "C compiler",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Dev & Build Tools",
    "frontClipUrl": "/audio/dev-5--front.mp3",
    "backClipUrl": "/audio/dev-5--back.mp3"
  },
  {
    "id": "dev-6",
    "command": "g++",
    "description": "C++ compiler",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Dev & Build Tools",
    "frontClipUrl": "/audio/dev-6--front.mp3",
    "backClipUrl": "/audio/dev-6--back.mp3"
  },
  {
    "id": "dev-7",
    "command": "python3 [script]",
    "description": "Run Python script",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Dev & Build Tools",
    "frontClipUrl": "/audio/dev-7--front.mp3",
    "backClipUrl": "/audio/dev-7--back.mp3"
  },
  {
    "id": "dev-8",
    "command": "pip3 install [pkg]",
    "description": "Install Python library",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Dev & Build Tools",
    "frontClipUrl": "/audio/dev-8--front.mp3",
    "backClipUrl": "/audio/dev-8--back.mp3"
  },
  {
    "id": "dev-9",
    "command": "node [script]",
    "description": "Run Node.js script",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Dev & Build Tools",
    "frontClipUrl": "/audio/dev-9--front.mp3",
    "backClipUrl": "/audio/dev-9--back.mp3"
  },
  {
    "id": "dev-10",
    "command": "npm install",
    "description": "Install Node.js dependencies",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Dev & Build Tools",
    "frontClipUrl": "/audio/dev-10--front.mp3",
    "backClipUrl": "/audio/dev-10--back.mp3"
  },
  {
    "id": "dev-11",
    "command": "javac [file]",
    "description": "Compile Java code",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Dev & Build Tools",
    "frontClipUrl": "/audio/dev-11--front.mp3",
    "backClipUrl": "/audio/dev-11--back.mp3"
  },
  {
    "id": "dev-12",
    "command": "java [file]",
    "description": "Run Java program",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Dev & Build Tools",
    "frontClipUrl": "/audio/dev-12--front.mp3",
    "backClipUrl": "/audio/dev-12--back.mp3"
  },
  {
    "id": "archive-0",
    "command": "gzip [file]",
    "description": "Compress files using gzip",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "Compression & Archiving",
    "frontClipUrl": "/audio/archive-0--front.mp3",
    "backClipUrl": "/audio/archive-0--back.mp3"
  },
  {
    "id": "archive-1",
    "command": "ffmpeg [options]",
    "description": "Video processing tool",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "Compression & Archiving",
    "frontClipUrl": "/audio/archive-1--front.mp3",
    "backClipUrl": "/audio/archive-1--back.mp3"
  },
  {
    "id": "archive-2",
    "command": "sox [options]",
    "description": "Audio processing tool",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "Compression & Archiving",
    "frontClipUrl": "/audio/archive-2--front.mp3",
    "backClipUrl": "/audio/archive-2--back.mp3"
  },
  {
    "id": "archive-3",
    "command": "zip [file]",
    "description": "Compress files into zip",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "Compression & Archiving",
    "frontClipUrl": "/audio/archive-3--front.mp3",
    "backClipUrl": "/audio/archive-3--back.mp3"
  },
  {
    "id": "archive-4",
    "command": "unzip [file]",
    "description": "Extract zip files",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "Compression & Archiving",
    "frontClipUrl": "/audio/archive-4--front.mp3",
    "backClipUrl": "/audio/archive-4--back.mp3"
  },
  {
    "id": "archive-5",
    "command": "tar -xvf [file]",
    "description": "Extract tar archive",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "Compression & Archiving",
    "frontClipUrl": "/audio/archive-5--front.mp3",
    "backClipUrl": "/audio/archive-5--back.mp3"
  },
  {
    "id": "archive-6",
    "command": "tar -czvf [archive] [file]",
    "description": "Create tar.gz archive",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "Compression & Archiving",
    "frontClipUrl": "/audio/archive-6--front.mp3",
    "backClipUrl": "/audio/archive-6--back.mp3"
  },
  {
    "id": "monitor-0",
    "command": "uptime",
    "description": "Show system uptime",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-0--front.mp3",
    "backClipUrl": "/audio/monitor-0--back.mp3"
  },
  {
    "id": "monitor-1",
    "command": "vmstat",
    "description": "Show system performance stats",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-1--front.mp3",
    "backClipUrl": "/audio/monitor-1--back.mp3"
  },
  {
    "id": "monitor-2",
    "command": "iostat",
    "description": "Display CPU and disk performance",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-2--front.mp3",
    "backClipUrl": "/audio/monitor-2--back.mp3"
  },
  {
    "id": "monitor-3",
    "command": "sar",
    "description": "Collect system performance data",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-3--front.mp3",
    "backClipUrl": "/audio/monitor-3--back.mp3"
  },
  {
    "id": "monitor-4",
    "command": "free",
    "description": "Show memory usage",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-4--front.mp3",
    "backClipUrl": "/audio/monitor-4--back.mp3"
  },
  {
    "id": "monitor-5",
    "command": "mpstat",
    "description": "Display CPU usage breakdown",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-5--front.mp3",
    "backClipUrl": "/audio/monitor-5--back.mp3"
  },
  {
    "id": "monitor-6",
    "command": "shutdown",
    "description": "Power off system",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-6--front.mp3",
    "backClipUrl": "/audio/monitor-6--back.mp3"
  },
  {
    "id": "monitor-7",
    "command": "reboot",
    "description": "Restart system",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-7--front.mp3",
    "backClipUrl": "/audio/monitor-7--back.mp3"
  },
  {
    "id": "monitor-8",
    "command": "sysctl [param]",
    "description": "Modify kernel parameters",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-8--front.mp3",
    "backClipUrl": "/audio/monitor-8--back.mp3"
  },
  {
    "id": "monitor-9",
    "command": "tuned",
    "description": "Auto-tune system performance",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-9--front.mp3",
    "backClipUrl": "/audio/monitor-9--back.mp3"
  },
  {
    "id": "monitor-10",
    "command": "sar -u 1",
    "description": "Monitor CPU in real-time",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-10--front.mp3",
    "backClipUrl": "/audio/monitor-10--back.mp3"
  },
  {
    "id": "monitor-11",
    "command": "iotop",
    "description": "Monitor disk I/O in real-time",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-11--front.mp3",
    "backClipUrl": "/audio/monitor-11--back.mp3"
  },
  {
    "id": "monitor-12",
    "command": "mpstat -P ALL",
    "description": "Display multi-core CPU load",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-12--front.mp3",
    "backClipUrl": "/audio/monitor-12--back.mp3"
  },
  {
    "id": "monitor-13",
    "command": "dstat",
    "description": "Versatile resource monitoring tool",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-13--front.mp3",
    "backClipUrl": "/audio/monitor-13--back.mp3"
  },
  {
    "id": "monitor-14",
    "command": "fsck",
    "description": "Filesystem check and repair",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-14--front.mp3",
    "backClipUrl": "/audio/monitor-14--back.mp3"
  },
  {
    "id": "monitor-15",
    "command": "rescue",
    "description": "Boot into rescue mode",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-15--front.mp3",
    "backClipUrl": "/audio/monitor-15--back.mp3"
  },
  {
    "id": "monitor-16",
    "command": "grub-install",
    "description": "Reinstall GRUB bootloader",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-16--front.mp3",
    "backClipUrl": "/audio/monitor-16--back.mp3"
  },
  {
    "id": "monitor-17",
    "command": "chroot",
    "description": "Enter rescue environment",
    "categoryId": "cat-2",
    "categoryNumber": 2,
    "categoryName": "User, Group, and Permission Management",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-17--front.mp3",
    "backClipUrl": "/audio/monitor-17--back.mp3"
  },
  {
    "id": "monitor-18",
    "command": "dd",
    "description": "Disk backup and restore utility",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-18--front.mp3",
    "backClipUrl": "/audio/monitor-18--back.mp3"
  },
  {
    "id": "monitor-19",
    "command": "rsync",
    "description": "Remote sync backup tool",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "System Monitoring",
    "frontClipUrl": "/audio/monitor-19--front.mp3",
    "backClipUrl": "/audio/monitor-19--back.mp3"
  },
  {
    "id": "logs-0",
    "command": "journalctl",
    "description": "View system logs (systemd)",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Log Management",
    "frontClipUrl": "/audio/logs-0--front.mp3",
    "backClipUrl": "/audio/logs-0--back.mp3"
  },
  {
    "id": "logs-1",
    "command": "dmesg",
    "description": "View kernel ring buffer logs",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "Log Management",
    "frontClipUrl": "/audio/logs-1--front.mp3",
    "backClipUrl": "/audio/logs-1--back.mp3"
  },
  {
    "id": "logs-2",
    "command": "tail -f [file]",
    "description": "Real-time log viewing (tail)",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "Log Management",
    "frontClipUrl": "/audio/logs-2--front.mp3",
    "backClipUrl": "/audio/logs-2--back.mp3"
  },
  {
    "id": "logs-3",
    "command": "logrotate",
    "description": "Manage log rotation",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Log Management",
    "frontClipUrl": "/audio/logs-3--front.mp3",
    "backClipUrl": "/audio/logs-3--back.mp3"
  },
  {
    "id": "logs-4",
    "command": "systemd-analyze",
    "description": "Analyze system boot time",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "Log Management",
    "frontClipUrl": "/audio/logs-4--front.mp3",
    "backClipUrl": "/audio/logs-4--back.mp3"
  },
  {
    "id": "db-0",
    "command": "mysql",
    "description": "Connect to MySQL",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Database Management",
    "frontClipUrl": "/audio/db-0--front.mp3",
    "backClipUrl": "/audio/db-0--back.mp3"
  },
  {
    "id": "db-1",
    "command": "psql",
    "description": "Connect to PostgreSQL",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Database Management",
    "frontClipUrl": "/audio/db-1--front.mp3",
    "backClipUrl": "/audio/db-1--back.mp3"
  },
  {
    "id": "db-2",
    "command": "mongod",
    "description": "Start MongoDB service",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Database Management",
    "frontClipUrl": "/audio/db-2--front.mp3",
    "backClipUrl": "/audio/db-2--back.mp3"
  },
  {
    "id": "db-3",
    "command": "redis-cli",
    "description": "Connect to Redis",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Database Management",
    "frontClipUrl": "/audio/db-3--front.mp3",
    "backClipUrl": "/audio/db-3--back.mp3"
  },
  {
    "id": "db-4",
    "command": "mysqldump",
    "description": "Backup MySQL database",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Database Management",
    "frontClipUrl": "/audio/db-4--front.mp3",
    "backClipUrl": "/audio/db-4--back.mp3"
  },
  {
    "id": "db-5",
    "command": "pg_dump",
    "description": "Backup PostgreSQL database",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Database Management",
    "frontClipUrl": "/audio/db-5--front.mp3",
    "backClipUrl": "/audio/db-5--back.mp3"
  },
  {
    "id": "db-6",
    "command": "sqlite3",
    "description": "Connect to SQLite",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Database Management",
    "frontClipUrl": "/audio/db-6--front.mp3",
    "backClipUrl": "/audio/db-6--back.mp3"
  },
  {
    "id": "db-7",
    "command": "mysqladmin",
    "description": "Manage MySQL server",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "Database Management",
    "frontClipUrl": "/audio/db-7--front.mp3",
    "backClipUrl": "/audio/db-7--back.mp3"
  },
  {
    "id": "fs-0",
    "command": "mount [dev] [dir]",
    "description": "Mount filesystem",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-0--front.mp3",
    "backClipUrl": "/audio/fs-0--back.mp3"
  },
  {
    "id": "fs-1",
    "command": "umount [dev]",
    "description": "Unmount filesystem",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-1--front.mp3",
    "backClipUrl": "/audio/fs-1--back.mp3"
  },
  {
    "id": "fs-2",
    "command": "mkfs [type] [dev]",
    "description": "Format partition",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-2--front.mp3",
    "backClipUrl": "/audio/fs-2--back.mp3"
  },
  {
    "id": "fs-3",
    "command": "blkid",
    "description": "Show device UUID",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-3--front.mp3",
    "backClipUrl": "/audio/fs-3--back.mp3"
  },
  {
    "id": "fs-4",
    "command": "lsblk",
    "description": "List block devices",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-4--front.mp3",
    "backClipUrl": "/audio/fs-4--back.mp3"
  },
  {
    "id": "fs-5",
    "command": "parted",
    "description": "Partitioning tool",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-5--front.mp3",
    "backClipUrl": "/audio/fs-5--back.mp3"
  },
  {
    "id": "fs-6",
    "command": "fdisk [device]",
    "description": "Disk partitioning tool",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-6--front.mp3",
    "backClipUrl": "/audio/fs-6--back.mp3"
  },
  {
    "id": "fs-7",
    "command": "df -h",
    "description": "Show disk space (human-readable)",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-7--front.mp3",
    "backClipUrl": "/audio/fs-7--back.mp3"
  },
  {
    "id": "fs-8",
    "command": "tune2fs [opts] [dev]",
    "description": "Modify ext filesystem parameters",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-8--front.mp3",
    "backClipUrl": "/audio/fs-8--back.mp3"
  },
  {
    "id": "fs-9",
    "command": "mkfs.ext4 [device]",
    "description": "Create ext4 filesystem",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-9--front.mp3",
    "backClipUrl": "/audio/fs-9--back.mp3"
  },
  {
    "id": "fs-10",
    "command": "mount -t nfs [srv]:[pt] [mnt]",
    "description": "Mount NFS share",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-10--front.mp3",
    "backClipUrl": "/audio/fs-10--back.mp3"
  },
  {
    "id": "fs-11",
    "command": "vgcreate [vg] [dev]",
    "description": "Create volume group (LVM)",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-11--front.mp3",
    "backClipUrl": "/audio/fs-11--back.mp3"
  },
  {
    "id": "fs-12",
    "command": "lvcreate [vg] [size]",
    "description": "Create logical volume",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-12--front.mp3",
    "backClipUrl": "/audio/fs-12--back.mp3"
  },
  {
    "id": "fs-13",
    "command": "pvcreate [device]",
    "description": "Create physical volume",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "File System Management",
    "frontClipUrl": "/audio/fs-13--front.mp3",
    "backClipUrl": "/audio/fs-13--back.mp3"
  },
  {
    "id": "virt-0",
    "command": "docker run [image]",
    "description": "Run Docker container",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Virtualization Management",
    "frontClipUrl": "/audio/virt-0--front.mp3",
    "backClipUrl": "/audio/virt-0--back.mp3"
  },
  {
    "id": "virt-1",
    "command": "docker ps",
    "description": "List running containers",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Virtualization Management",
    "frontClipUrl": "/audio/virt-1--front.mp3",
    "backClipUrl": "/audio/virt-1--back.mp3"
  },
  {
    "id": "virt-2",
    "command": "docker images",
    "description": "List Docker images",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Virtualization Management",
    "frontClipUrl": "/audio/virt-2--front.mp3",
    "backClipUrl": "/audio/virt-2--back.mp3"
  },
  {
    "id": "virt-3",
    "command": "docker exec [ctr] [cmd]",
    "description": "Execute command in container",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Virtualization Management",
    "frontClipUrl": "/audio/virt-3--front.mp3",
    "backClipUrl": "/audio/virt-3--back.mp3"
  },
  {
    "id": "virt-4",
    "command": "docker-compose up",
    "description": "Start Docker Compose services",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Virtualization Management",
    "frontClipUrl": "/audio/virt-4--front.mp3",
    "backClipUrl": "/audio/virt-4--back.mp3"
  },
  {
    "id": "virt-5",
    "command": "kubectl get pods",
    "description": "View Kubernetes pod status",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Virtualization Management",
    "frontClipUrl": "/audio/virt-5--front.mp3",
    "backClipUrl": "/audio/virt-5--back.mp3"
  },
  {
    "id": "virt-6",
    "command": "kubectl apply -f [file]",
    "description": "Deploy Kubernetes resources",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Virtualization Management",
    "frontClipUrl": "/audio/virt-6--front.mp3",
    "backClipUrl": "/audio/virt-6--back.mp3"
  },
  {
    "id": "virt-7",
    "command": "virsh list",
    "description": "List virtual machines",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Virtualization Management",
    "frontClipUrl": "/audio/virt-7--front.mp3",
    "backClipUrl": "/audio/virt-7--back.mp3"
  },
  {
    "id": "virt-8",
    "command": "vagrant up",
    "description": "Start Vagrant virtual machine",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Virtualization Management",
    "frontClipUrl": "/audio/virt-8--front.mp3",
    "backClipUrl": "/audio/virt-8--back.mp3"
  },
  {
    "id": "virt-9",
    "command": "kubectl get nodes",
    "description": "View Kubernetes nodes",
    "categoryId": "cat-7",
    "categoryNumber": 7,
    "categoryName": "Package and Container Management",
    "deckCategory": "Virtualization Management",
    "frontClipUrl": "/audio/virt-9--front.mp3",
    "backClipUrl": "/audio/virt-9--back.mp3"
  },
  {
    "id": "sysinfo-0",
    "command": "uname -r",
    "description": "View kernel version",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-0--front.mp3",
    "backClipUrl": "/audio/sysinfo-0--back.mp3"
  },
  {
    "id": "sysinfo-1",
    "command": "lsmod",
    "description": "List loaded kernel modules",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-1--front.mp3",
    "backClipUrl": "/audio/sysinfo-1--back.mp3"
  },
  {
    "id": "sysinfo-2",
    "command": "modprobe [module]",
    "description": "Load kernel module",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-2--front.mp3",
    "backClipUrl": "/audio/sysinfo-2--back.mp3"
  },
  {
    "id": "sysinfo-3",
    "command": "depmod",
    "description": "Generate module dependency file",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-3--front.mp3",
    "backClipUrl": "/audio/sysinfo-3--back.mp3"
  },
  {
    "id": "sysinfo-4",
    "command": "make menuconfig",
    "description": "Kernel configuration interface",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-4--front.mp3",
    "backClipUrl": "/audio/sysinfo-4--back.mp3"
  },
  {
    "id": "sysinfo-5",
    "command": "make bzImage",
    "description": "Compile kernel",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-5--front.mp3",
    "backClipUrl": "/audio/sysinfo-5--back.mp3"
  },
  {
    "id": "sysinfo-6",
    "command": "make modules_install",
    "description": "Install kernel modules",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-6--front.mp3",
    "backClipUrl": "/audio/sysinfo-6--back.mp3"
  },
  {
    "id": "sysinfo-7",
    "command": "grub2-mkconfig",
    "description": "Generate GRUB configuration file",
    "categoryId": "cat-4",
    "categoryNumber": 4,
    "categoryName": "System Performance, Hardware, and Kernel",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-7--front.mp3",
    "backClipUrl": "/audio/sysinfo-7--back.mp3"
  },
  {
    "id": "sysinfo-8",
    "command": "dd if=/dev/sda of=bk.img",
    "description": "Backup raw disk image",
    "categoryId": "cat-1",
    "categoryNumber": 1,
    "categoryName": "File, Directory, and Text Manipulation",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-8--front.mp3",
    "backClipUrl": "/audio/sysinfo-8--back.mp3"
  },
  {
    "id": "sysinfo-9",
    "command": "mkisofs",
    "description": "Create ISO image",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-9--front.mp3",
    "backClipUrl": "/audio/sysinfo-9--back.mp3"
  },
  {
    "id": "sysinfo-10",
    "command": "mount -o loop [iso]",
    "description": "Mount ISO file",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-10--front.mp3",
    "backClipUrl": "/audio/sysinfo-10--back.mp3"
  },
  {
    "id": "sysinfo-11",
    "command": "genisoimage",
    "description": "Generate ISO image",
    "categoryId": "cat-5",
    "categoryNumber": 5,
    "categoryName": "Storage, Disk, and Filesystem Management",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-11--front.mp3",
    "backClipUrl": "/audio/sysinfo-11--back.mp3"
  },
  {
    "id": "sysinfo-12",
    "command": "alias [name]='[cmd]'",
    "description": "Set command alias",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-12--front.mp3",
    "backClipUrl": "/audio/sysinfo-12--back.mp3"
  },
  {
    "id": "sysinfo-13",
    "command": "history",
    "description": "Show command history",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-13--front.mp3",
    "backClipUrl": "/audio/sysinfo-13--back.mp3"
  },
  {
    "id": "sysinfo-14",
    "command": "date",
    "description": "Show date and time",
    "categoryId": "cat-8",
    "categoryNumber": 8,
    "categoryName": "Shell, Help, and Everyday Tools",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-14--front.mp3",
    "backClipUrl": "/audio/sysinfo-14--back.mp3"
  },
  {
    "id": "sysinfo-15",
    "command": "timedatectl",
    "description": "Set system time",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-15--front.mp3",
    "backClipUrl": "/audio/sysinfo-15--back.mp3"
  },
  {
    "id": "sysinfo-16",
    "command": "hwclock",
    "description": "Sync hardware clock",
    "categoryId": "cat-3",
    "categoryNumber": 3,
    "categoryName": "Process, Service, and Job Control",
    "deckCategory": "System Information",
    "frontClipUrl": "/audio/sysinfo-16--front.mp3",
    "backClipUrl": "/audio/sysinfo-16--back.mp3"
  }
];

const VALID_FLASHCARD_IDS = new Set<string>(FLASHCARDS.map((card) => card.id));

export function isValidFlashcardId(id: string): boolean {
  const cleaned = id.startsWith("fc:") ? id.slice(3) : id;
  return VALID_FLASHCARD_IDS.has(cleaned);
}

export function toFlashcardProgressKey(id: string): string {
  const cleaned = id.startsWith("fc:") ? id.slice(3) : id;
  return `fc:${cleaned}`;
}

export function getFlashcardById(id: string): FlashcardEntry | undefined {
  const cleaned = id.startsWith("fc:") ? id.slice(3) : id;
  return FLASHCARDS.find((card) => card.id === cleaned);
}

export function getFlashcardsByCategory(categoryId: string = "all"): FlashcardEntry[] {
  if (!categoryId || categoryId === "all") return FLASHCARDS;
  return FLASHCARDS.filter((card) => card.categoryId === categoryId);
}

/** Fisher-Yates shuffle: every item appears exactly once in random order with no repeats. */
export function fisherYatesShuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

export interface DeckCardItem {
  readonly card: FlashcardEntry;
  /** True when this card starts with its description side showing first (Desc -> Cmd). */
  readonly backFirst: boolean;
}

export function applyDirectionToDeck(
  currentDeck: readonly DeckCardItem[],
  direction: FlashcardDirection,
  rng: () => number = Math.random,
): DeckCardItem[] {
  return currentDeck.map((item) => ({
    card: item.card,
    backFirst:
      direction === "desc-cmd"
        ? true
        : direction === "cmd-desc"
          ? false
          : rng() < 0.5,
  }));
}

function isCardIdInMastered(
  cardId: string,
  masteredIds?: ReadonlySet<string> | Record<string, boolean>,
): boolean {
  if (!masteredIds) return false;
  if (masteredIds instanceof Set) {
    return masteredIds.has(cardId) || masteredIds.has(`fc:${cardId}`);
  }
  const rec = masteredIds as Record<string, boolean>;
  return Boolean(rec[cardId] || rec[`fc:${cardId}`]);
}

/**
 * Builds a Fisher-Yates shuffled flashcard deck with no repeats until the pool is done.
 * - When `includeMastered` is false (default: keep mastered OUT of retake), excludes mastered cards.
 * - When `includeMastered` is true (leave mastered IN for retake), includes all cards in the scope.
 */
export function buildFlashcardDeck(options: {
  categoryId?: string;
  masteredIds?: ReadonlySet<string> | Record<string, boolean>;
  includeMastered?: boolean;
  direction?: FlashcardDirection;
  rng?: () => number;
} = {}): DeckCardItem[] {
  const {
    categoryId = "all",
    masteredIds,
    includeMastered = false,
    direction = "cmd-desc",
    rng = Math.random,
  } = options;
  const scopeCards = getFlashcardsByCategory(categoryId);
  const filtered = includeMastered
    ? scopeCards
    : scopeCards.filter((card) => !isCardIdInMastered(card.id, masteredIds));
  const shuffled = fisherYatesShuffle(filtered, rng);
  return applyDirectionToDeck(
    shuffled.map((card) => ({ card, backFirst: false })),
    direction,
    rng,
  );
}
