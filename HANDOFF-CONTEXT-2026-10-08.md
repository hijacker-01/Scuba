# Continue Suba-Diving on another laptop — 8 October 2026

This is a current source snapshot from C:\Suba-Diving, prepared for the project owner to continue development. It includes current source, dependency lockfile, media, reference video, tests, and handover documentation. It has no Git history.

## Start on the new laptop
1. Download Suba-Diving-2026-10-08.zip and extract it to a normal local folder outside active Drive synchronization. Open its Suba-Diving folder in your editor/Codex.
2. Install Node.js 22 with npm available in your terminal.
3. Windows PowerShell: run `$env:MONGOMS_DISABLE_POSTINSTALL='1'`, then `npm ci`, then `Remove-Item Env:MONGOMS_DISABLE_POSTINSTALL`. macOS/Linux: `MONGOMS_DISABLE_POSTINSTALL=1 npm ci`.
4. Copy .env.example to .env.local. Use fresh random SESSION_SECRET and CRON_SECRET. Add your own service credentials for features you need.
5. Run `npm run dev` and visit http://localhost:3000.
6. Check the setup with `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Browser tests require Chrome; run `npm run test:e2e` after installing it.

Use npm directly on the other laptop. Start-Project.ps1 currently expects a Codex-managed Windows runtime at a machine-specific location; it will need that runtime installed or its path adapted.

## Optional fresh local database and owner account
The old laptop uses a persistent local MongoDB replica set. Its database and owner password are excluded from this source transfer.
- After installing dependencies and copying .env.example to .env.local, run `node scripts/start-local-db.mjs` in a separate terminal and leave it running. The first run downloads a MongoDB binary.
- Once it reports ready, run `node scripts/setup-local-owner.mjs` in another terminal. It configures the local database settings and saves a NEW owner password privately in .codex/local/owner-login.txt. Set APP_URL=http://localhost:3000 in .env.local.
- Start the site and sign in at /admin/login. This is a fresh database: old content, settings and bookings are not migrated. Import the brochure drafts through owner tools and configure products/departures as needed.
- For an existing remote database, use its credentials and authorized network access instead; do not run the local-owner helper against that setup.

## Current project context
Havelock Dive Club booking website with owner/staff tools, activity/course editing, website settings, Razorpay checkout, refunds/reconciliation, queued email, customer booking recovery, and India-time departure handling. The homepage includes KK Tours and Travels car-hire/logistics enquiries. The hero already has an underwater video and canvas ripple overlay; the old transfer guide saying this is unimplemented is stale.

Read README.md and docs/handover/README.md first, then docs/handover/IMPLEMENTATION-STATUS.md, CLUB-REQUIREMENTS.md and LAUNCH-CHECKLIST.md. The implementation status dated 6 October records completed owner and reliability work and earlier validation: 32 unit/database tests, eight browser tests, build, typecheck, lint and local backup restoration. These are historical recorded results, not rerun during this upload.

Production acceptance is still pending: verify club prices/details/policies and schedules, configure club-owned database/payment/email/hosting accounts, worker schedules and alerts, and complete staging/live acceptance and backup rehearsal. Gateway and SMTP tests described in the implementation notes used simulations. No real payment or email acceptance is claimed.

## Context for the next Codex chat
Open the extracted folder and paste:
"Continue the Havelock Dive Club project from this source snapshot. Read HANDOFF-CONTEXT-2026-10-08.md, AGENTS.md, README.md and docs/handover/IMPLEMENTATION-STATUS.md first. Preserve the current hero, page sections, booking reliability and owner tools. Help me set up this laptop, then continue the club handover/launch checklist. Read the installed Next.js guides before changing code. Do not assume production services or the old laptop database are present."

No chat transcript was available in this session; this handoff captures context evidenced by current files and the request to continue on another laptop.

## Package integrity and exclusions
SOURCE-MANIFEST-2026-10-08.json lists every packaged source file and its SHA-256 hash. All archive source entries were read back and compared with these hashes. The original TRANSFER-MANIFEST.json, CHECKSUMS.sha256 and TRANSFER-VALIDATION.md describe the September transfer and are retained only as historical records; use the dated new manifest for this snapshot.

Excluded: .env.local and other private environment files, .codex/local (including owner credentials, live database and backups), node_modules, .next, test results, editor/cache files and Git metadata. Keep credentials in your password manager. Database data requires a separate intentional migration; this package only transfers source and context.
