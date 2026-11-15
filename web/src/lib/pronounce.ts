/**
 * Phonetic normalization for Linux commands and Bash syntax, so a neural voice
 * says "change mod dash capital R seven five zero slash srv" instead of guessing.
 * Keep in sync with android/.../data/audio/LinuxPronunciation.kt.
 */

const COMMANDS: Record<string, string> = {
  chmod: "change mod",
  chown: "change owner",
  chgrp: "change group",
  chage: "change age",
  chcon: "change con",
  sudo: "sue doo",
  visudo: "vee sue doo",
  sudoers: "sue doers",
  systemctl: "system control",
  journalctl: "journal control",
  hostnamectl: "hostname control",
  timedatectl: "time date control",
  localectl: "locale control",
  loginctl: "login control",
  sysctl: "sys control",
  kubectl: "cube control",
  fsck: "F S check",
  egrep: "E grep",
  fgrep: "F grep",
  pgrep: "P grep",
  pkill: "P kill",
  crontab: "cron tab",
  crond: "cron D",
  iptables: "I P tables",
  ip6tables: "I P 6 tables",
  nftables: "N F tables",
  nft: "N F T",
  "firewall-cmd": "firewall command",
  ls: "L S",
  "ls's": "L S's",
  cd: "C D",
  pwd: "P W D",
  mkdir: "make dir",
  rmdir: "remove dir",
  rm: "R M",
  cp: "C P",
  mv: "M V",
  ln: "L N",
  ps: "P S",
  ss: "S S",
  df: "D F",
  du: "D U",
  nc: "net cat",
  ip: "I P",
  ssh: "S S H",
  sshd: "S S H D",
  scp: "S C P",
  sftp: "S F T P",
  lsblk: "L S block",
  blkid: "block I D",
  lsof: "L S of",
  lsmod: "L S mod",
  rmmod: "R M mod",
  insmod: "ins mod",
  modprobe: "mod probe",
  lvextend: "L V extend",
  lvcreate: "L V create",
  vgcreate: "V G create",
  pvcreate: "P V create",
  lvs: "L V S",
  vgs: "V G S",
  pvs: "P V S",
  xfs_growfs: "X F S grow F S",
  resize2fs: "resize 2 F S",
  mkfs: "make F S",
  mkswap: "make swap",
  swapon: "swap on",
  swapoff: "swap off",
  dnf: "D N F",
  dpkg: "D package",
  rpm: "R P M",
  "apt-get": "apt get",
  "grub2-mkconfig": "grub 2 make config",
  "update-grub": "update grub",
  "update-initramfs": "update init ram F S",
  initramfs: "init ram F S",
  mtr: "M T R",
  tcpdump: "T C P dump",
  iostat: "I O stat",
  vmstat: "V M stat",
  mpstat: "M P stat",
  nmcli: "N M C L I",
  useradd: "user add",
  usermod: "user mod",
  userdel: "user del",
  groupadd: "group add",
  passwd: "password",
  semanage: "S E manage",
  restorecon: "restore con",
  getenforce: "get enforce",
  setenforce: "set enforce",
  setfacl: "set F A C L",
  getfacl: "get F A C L",
  umask: "U mask",
  podman: "pod man",
  "ansible-playbook": "ansible playbook",
  "ansible-vault": "ansible vault",
  rsync: "R sync",
  xargs: "X args",
  uname: "U name",
  udevadm: "U dev admin",
  nohup: "no hup",
  htop: "H top",
  wget: "W get",
  openssl: "open S S L",
  gpg: "G P G",
  md5sum: "M D 5 sum",
  sha256sum: "shaw 256 sum",
  fstab: "F S tab",
  systemd: "system D",
  journald: "journal D",
  vim: "vim",
  vi: "vee eye",
  awk: "awk",
  sed: "sed",
  tar: "tar",
  grep: "grep",
  inode: "I node",
  inodes: "I nodes",
  vs: "versus",
  "e.g": "for example",
  "i.e": "that is",
};

const ACRONYMS: Record<string, string> = {
  SSH: "S S H",
  LVM: "L V M",
  RAID: "raid",
  DNS: "D N S",
  NFS: "N F S",
  GRUB: "grub",
  GRUB2: "grub 2",
  SELinux: "S E Linux",
  AppArmor: "App Armor",
  UUID: "U U I D",
  TCP: "T C P",
  UDP: "U D P",
  CPU: "C P U",
  RPM: "R P M",
  XFS: "X F S",
  GPT: "G P T",
  MBR: "M B R",
  UEFI: "U E F I",
  BIOS: "bye oss",
  ACL: "A C L",
  ACLs: "A C Ls",
  PAM: "pam",
  SUID: "S U I D",
  SGID: "S G I D",
  TLS: "T L S",
  SSL: "S S L",
  YAML: "yaml",
  JSON: "jason",
  HTTP: "H T T P",
  HTTPS: "H T T P S",
  NTP: "N T P",
  DHCP: "D H C P",
  VPN: "V P N",
  NVMe: "N V M E",
  CIDR: "cider",
  IPv4: "I P v 4",
  IPv6: "I P v 6",
  ext4: "ext 4",
  KVM: "K V M",
  LUKS: "lucks",
  SMB: "S M B",
  FTP: "F T P",
  SFTP: "S F T P",
  CLI: "C L I",
  GUI: "gooey",
  VM: "V M",
  VMs: "V Ms",
  OOM: "O O M",
  PID: "P I D",
  UID: "U I D",
  GID: "G I D",
  TTY: "T T Y",
  MAC: "mac",
  IP: "I P",
  URL: "U R L",
  API: "A P I",
  CI: "C I",
  CD: "C D",
  RHEL: "rel",
  PV: "P V",
  VG: "V G",
  LV: "L V",
  EUID: "E U I D",
  USB: "U S B",
  SATA: "sata",
  DNF: "D N F",
  // Word-style acronyms pronounced as single words — keep these BEFORE the
  // generic letter-by-letter rule so they are never spelled out.
  RADIUS: "RAY-dee-us",
  SCADA: "SKAH-dah",
  SAML: "SAM-el",
  SIEM: "seem",
  SOAR: "sore",
  CAPTCHA: "CAP-chuh",
  QUATS: "kwats",
};

const SEGMENTS: Record<string, string> = {
  etc: "et-see",
  usr: "user",
  tmp: "temp",
  sbin: "S bin",
  srv: "serv",
  mnt: "mount",
  dev: "dev",
  proc: "proc",
  sys: "sys",
  var: "var",
  opt: "opt",
  lib: "lib",
  lib64: "lib 64",
  bin: "bin",
  systemd: "system D",
  sshd_config: "S S H D config",
  ssh: "S S H",
  sa: "S A",
  sudoers: "sue doers",
  fstab: "F S tab",
  yum: "yum",
};

const EXTENSIONS: Record<string, string> = {
  gz: "G Z",
  bz2: "B Z 2",
  xz: "X Z",
  tgz: "T G Z",
  zip: "zip",
  tar: "tar",
  conf: "conf",
  cfg: "config",
  sh: "S H",
  py: "P Y",
  yml: "yaml",
  yaml: "yaml",
  json: "jason",
  pcap: "P cap",
  log: "log",
  txt: "text",
  d: "D",
  repo: "repo",
  service: "service",
  timer: "timer",
  socket: "socket",
  target: "target",
  mount: "mount",
  img: "image",
  iso: "I S O",
  pem: "pem",
  key: "key",
  crt: "cert",
};

const DIGIT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const PATH_OVERRIDES: Record<string, string> = { "/dev/null": "slash dev null" };

/** Generic unlisted acronym: 2–5 consecutive capitals, optionally pluralized (CIA, MFA, PKI, AES…). */
const PLAIN_ACRONYM = /^([A-Z]{2,5})(s?)$/;

/**
 * Force letter-by-letter speech: "CIA" → "C. I. A". The periods and spaces make
 * ElevenLabs articulate every letter distinctly instead of blending the word.
 */
function spellAcronym(word: string, plural: string): string {
  return word.split("").join(". ") + (plural ? " S" : "");
}

function spellLetters(letters: string): string {
  return letters
    .split("")
    .map((ch) => {
      if (/[0-9]/.test(ch)) return ch;
      return ch === ch.toUpperCase() && ch !== ch.toLowerCase() ? `capital ${ch}` : ch.toUpperCase();
    })
    .join(" ");
}

function spokenVariable(name: string): string {
  if (name.length <= 3 && name === name.toUpperCase()) return name.split("").join(" ");
  return name.toLowerCase().replace(/_/g, " ");
}

function speakDotted(word: string): string {
  return word
    .split(".")
    .map((part, i) => {
      if (!part) return "";
      if (i > 0 && EXTENSIONS[part]) return EXTENSIONS[part];
      return SEGMENTS[part] ?? COMMANDS[part] ?? ACRONYMS[part] ?? part.replace(/_/g, " ");
    })
    .filter(Boolean)
    .join(" dot ");
}

function speakSegment(seg: string): string {
  if (seg === "*") return "star";
  if (seg === "~") return "tilde";
  if (seg === "." ) return "dot";
  if (seg === "..") return "dot dot";
  if (SEGMENTS[seg]) return SEGMENTS[seg];
  if (seg.includes(".")) return speakDotted(seg);
  return COMMANDS[seg] ?? ACRONYMS[seg] ?? seg.replace(/_/g, " ").replace(/\*/g, " star");
}

function speakPath(path: string): string {
  if (PATH_OVERRIDES[path]) return PATH_OVERRIDES[path];
  const parts = path.split("/");
  const out: string[] = [];
  parts.forEach((seg, i) => {
    if (i > 0) out.push("slash");
    if (seg) out.push(speakSegment(seg));
  });
  return out.join(" ");
}

const SYMBOLIC_MODE = /^[ugoa]*[+=-][rwxXst]*(,[ugoa]*[+=-][rwxXst]*)*$/;

function speakSymbolicMode(mode: string): string {
  return mode
    .split(",")
    .map((part) => {
      const match = /^([ugoa]*)([+=-])([rwxXst]*)$/.exec(part);
      if (!match) return part;
      const [, who, op, perms] = match;
      const opWord = op === "+" ? "plus" : op === "-" ? "minus" : "equals";
      return [who ? spellLetters(who) : "", opWord, perms ? spellLetters(perms.toLowerCase()) : "nothing"]
        .filter(Boolean)
        .join(" ");
    })
    .join(", ");
}

function speakCore(core: string, prev: string): string {
  if (!core) return core;
  if (/^\*+$/.test(core)) return core.split("").map(() => "star").join(" ");

  const variable = /^\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?$/.exec(core);
  if (variable) return `dollar ${spokenVariable(variable[1])}`;
  if (/^\$\d$/.test(core)) return `dollar ${core[1]}`;
  if (core === "$?") return "dollar question mark";
  if (core === "$$") return "dollar dollar";

  if (/^--[A-Za-z]/.test(core)) {
    const [name, value] = core.slice(2).split(/=(.*)/s);
    const spokenName = `dash dash ${name.replace(/[-_]/g, " ")}`;
    return value ? `${spokenName} equals ${speakCore(value, "")}` : spokenName;
  }
  if (/^-[A-Za-z]+$/.test(core)) return `dash ${spellLetters(core.slice(1))}`;
  if (/^-\d+$/.test(core)) return `minus ${core.slice(1)}`;

  const sizeDelta = /^([+-])(\d+)([KMGT])$/.exec(core);
  if (sizeDelta) {
    const units: Record<string, string> = { K: "K", M: "meg", G: "gig", T: "terabyte" };
    return `${sizeDelta[1] === "+" ? "plus" : "minus"} ${sizeDelta[2]} ${units[sizeDelta[3]]}`;
  }

  if ((prev === "chmod" || prev === "umask") && /^[0-7]{3,4}$/.test(core)) {
    return core.split("").map((d) => DIGIT_WORDS[Number(d)]).join(" ");
  }
  if (prev === "chmod" && SYMBOLIC_MODE.test(core)) return speakSymbolicMode(core);

  if (COMMANDS[core]) return COMMANDS[core];
  if (ACRONYMS[core]) return ACRONYMS[core];

  // Hyphenated compounds like "MFA-enabled" or "PKI-based": speak each part.
  if (core.includes("-") && !core.startsWith("-")) {
    const parts = core.split("-").map((part) => speakCore(part, prev));
    return parts.reduce((acc, part, i) => {
      if (i === 0) return part;
      // "AES-256": digits follow a pause, not a spoken hyphen.
      return `${acc}${/^\d+$/.test(core.split("-")[i]) ? " " : "-"}${part}`;
    }, "");
  }

  const plain = PLAIN_ACRONYM.exec(core);
  if (plain) return spellAcronym(plain[1], plain[2]);

  const ipv4 = /^(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?$/.exec(core);
  if (ipv4) return ipv4[1].split(".").join(" dot ") + (ipv4[2] ? ` slash ${ipv4[2]}` : "");

  if (core.includes("/") && !/^https?:/i.test(core) && !/^[A-Za-z]+\/[A-Za-z]+$/.test(core)) {
    return speakPath(core);
  }
  if (/^[\w-]+(\.[\w-]+)+$/.test(core)) {
    const last = core.split(".").pop() ?? "";
    if (EXTENSIONS[last]) return speakDotted(core);
  }
  if (/^[a-z0-9]+_[a-z0-9_]+$/.test(core)) return core.replace(/_/g, " ");
  return core;
}

/** Rewrite Linux/Bash syntax in [text] into words a neural voice pronounces correctly. */
export function normalizeForSpeech(text: string): string {
  const prepared = ` ${text} `
    .replace(/\s*→\s*/g, ", then ")
    .replace(/\s&&\s/g, " and then ")
    .replace(/\s\|\|\s/g, " or else ")
    .replace(/2>&1/g, " two redirect to one ")
    .replace(/\s\|\s/g, " pipe ")
    .replace(/\s>>\s?/g, " append to ")
    .replace(/\s>\s?/g, " redirect to ")
    .replace(/\s<\s?/g, " read from ");

  let prevCore = "";
  return prepared
    .split(/(\s+)/)
    .map((token) => {
      if (!token || /^\s+$/.test(token)) return token;
      const match = /^([("'`[]*)(.*?)([)"'`\],.;:!?]*)$/s.exec(token);
      if (!match) return token;
      const [, lead, core, trail] = match;
      const spoken = speakCore(core, prevCore);
      prevCore = core;
      return `${lead}${spoken}${trail}`;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}
