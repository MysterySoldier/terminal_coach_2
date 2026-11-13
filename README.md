# Terminal Coach — Over Your Shoulder

Standalone Linux Terminal Coach (`https://coach.mysterylabs.dev`).

- **Truthful shell engine**: real filesystem permissions (`chmod`/`chown`), text processing & archives (`awk`/`sort`/`uniq`, `gzip`/`tar`), process table, DNS, disks/LVM, firewall, pipes, globs, and reboot persistence.
- **50 sysadmin jobs** across **4 modes** (`Easy`, `Medium`, `Hard`, `Extreme`) with separate progress tracking (`coachEasyProgress`, `coachMediumProgress`, `coachProgress`, `coachExtremeProgress`).
- **300 real sysadmin jobs collection**: 300 jobs are being added in batches, with 50 live so far.
- **Optional Google sign-in & cloud sync**: progress syncs across devices via Cloudflare D1, while guest mode remains 100% functional with no login required.
- **Kokoro `af_heart` voice**: 867 pre-baked offline MP3 clips (`web/public/audio/`).

## Commands

```bash
cd web
npm install
npm run test
npm run test:browser
npm run build
```
