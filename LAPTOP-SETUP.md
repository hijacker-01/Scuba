# Laptop setup — 1 October 2026

Restored the current transfer from the Scuba-diving folder in Google Drive into `C:\Suba-Diving`. Drive contained the extracted files; no project ZIP was found. All 94 files were restored, and all 93 entries in `CHECKSUMS.sha256` matched before local setup changes.

Node.js 22.23.3 and npm 10.9.9 are installed in the user's `.codex/runtimes/node-v22.23.3-win-x64` directory. Dependencies were installed from the transferred lockfile with the optional MongoDB postinstall download disabled.

Run from PowerShell:

```powershell
cd C:\Suba-Diving
.\Start-Project.ps1
```

The launcher selects Node.js 22 for this project. Other commands work with `-Task build`, `-Task typecheck`, `-Task lint`, `-Task test`, or `-Task test:e2e`.

## Verification

- Production build, typecheck, lint, and all 3 payment unit tests passed.
- All 7 tests passed with the isolated MongoDB replica set enabled, including 4 booking integration checks.
- All 6 desktop/mobile browser checks passed after updating the stale hero-heading expectation in `tests/e2e/navigation.spec.ts` to match the restored page.
- Production dependency audit reported zero vulnerabilities.

`.env.local` was copied from the example. Session and cron secrets were generated locally. Database, Razorpay, and SMTP settings still contain placeholders and require your own credentials. Staff provisioning, remote database migration, external schedules, real payment processing, and SMTP delivery have not been configured or verified.

The guide's hero-redesign note is stale relative to the transferred source: `components/Hero.tsx` already includes an underwater video and canvas ripple overlay. No further hero redesign was performed during laptop setup.

Git history is excluded from the transfer, as documented in `START-ON-NEW-LAPTOP.md`. The original transfer manifest and checksum file are preserved; the navigation-test correction and new laptop helper files are local changes made after integrity verification.
