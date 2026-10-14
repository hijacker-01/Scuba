# Continue Scuba-diving on another laptop

This transfer contains the current working files of Havelock Dive Club, including uncommitted and new source files, images, the hero video, PDF brochures, tests, configuration, and the dependency lockfile. It is a source transfer, not a deployed website or a database backup.

## Quick start

1. Upload the ZIP to your Drive, download it on the other laptop, and extract it into a normal local folder. Run the project from that local folder rather than an actively synchronized Drive folder.
2. Install Node.js with npm. This project's CI uses Node.js 22; Next.js requires Node.js 20.9 or newer. Use Node.js 22 to match CI. Install Google Chrome if you want to run the browser tests.
3. Open the extracted `Scuba-diving` folder in your editor and its terminal. You should see `package.json` there.
4. Install the exact dependency versions in `package-lock.json`. In PowerShell run `$env:MONGOMS_DISABLE_POSTINSTALL='1'`, then `npm ci`, then `Remove-Item Env:MONGOMS_DISABLE_POSTINSTALL`. On macOS/Linux run `MONGOMS_DISABLE_POSTINSTALL=1 npm ci`. This matches CI and skips downloading an optional MongoDB integration-test binary during installation. Internet access is required. Do not copy node_modules from the previous machine.
5. For UI development, run `npm run dev` and open http://localhost:3000. Database-backed features require the service setup below.
6. For a production build, run `npm run build`, then `npm start`. The `.next` output and `next-env.d.ts` are regenerated locally.

## Enable booking, staff login, payments and email

Copy `.env.example` to `.env.local` and replace its placeholders. On Windows PowerShell: `Copy-Item .env.example .env.local`. On macOS/Linux: `cp .env.example .env.local`. Keep this file private.

- MongoDB: supply `MONGODB_URI` and `MONGODB_DB`. The booking flow requires transactions, so use a replica set, such as an appropriately configured Atlas database. Authorize the new laptop's network access when needed. Use a separate development database for test bookings. A local database from the old laptop is not in this ZIP; migrate it separately if needed. An existing remote database remains on its server.
- Staff: for a new database, set `STAFF_EMAIL` and `STAFF_PASSWORD` in your terminal and run `npm run provision:staff`. Password length must be at least 16 characters. Clear those terminal variables afterward. This command can reset the matching existing staff account's password; do not run it unnecessarily against production. Sign in at `/admin/login`, publish products and configure departures, capacity and prices.
- Sessions: set a strong random `SESSION_SECRET`.
- Payments: configure `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` using Razorpay test credentials first. For webhook testing, `/api/payment/webhook` must be reachable at a configured public HTTPS test URL. Razorpay cannot deliver a webhook directly to localhost. Follow README.md for capture and webhook setup.
- Email: configure the SMTP fields and `BOOKINGS_NOTIFY_EMAIL`.
- Background processing: set `CRON_SECRET`; configure authenticated POST requests to `/api/internal/notifications` every minute and `/api/internal/reconcile` every five minutes as described in README.md. These schedules are external services and are not installed by extracting this ZIP.

Actual API keys, passwords, `.env.local`, database records, hosting settings, scheduled jobs and GitHub authentication are not included. Re-enter credentials through your own secure account/password manager. Merely building the app does not verify these external services.

## Verify the laptop setup

Run `npm run build`, `npm run typecheck`, `npm run lint`, and `npm test`.

Browser checks: install Google Chrome if missing, then run `npm run test:e2e`. Alternatively, the existing CI uses `npx playwright install chrome` to obtain the browser required by the configuration.

Database integration checks use an isolated temporary replica set. In PowerShell run `$env:RUN_DB_TESTS='1'`, then `npm test`, then `Remove-Item Env:RUN_DB_TESTS`. On macOS/Linux run `RUN_DB_TESTS=1 npm test`. The first run may download a MongoDB test binary.

## Continue the hero redesign

The latest request is to improve only the Scuba-diving hero using the older underwater-video composition and a reference water-ripple effect, while retaining the newer page sections and booking flow. That redesign has not been implemented in this transfer.

`references/previous-hero-reference.mp4` is the user-provided WhatsApp recording. `public/videos/hero-video.mp4` is the existing site media. The reference URL is https://hijacker-01s-exceptional-site.webflow.io/ ; it failed DNS resolution during inspection, and the WhatsApp recording has not yet been visually verified. A working reference or playable recording is needed before claiming a visual match.

The original committed hero used a video shader. For historical comparison, the remote is https://github.com/hijacker-01/Scuba-diving.git and the source checkout's base commit is `29baa572e4e47728316244b5a448422cd1d1a609`; `components/Hero.tsx` at that commit contains the old implementation. The files in this ZIP include newer uncommitted work than that commit.

Git history is excluded. To retain project history on the new laptop, clone the remote into a separate folder and carefully apply this snapshot there, including intentional deletions recorded in `TRANSFER-MANIFEST.json`. Do not overwrite the extracted current files with an older clone. Source snapshot entries in the manifest are authoritative for which files existed at transfer time.

## Package contents and integrity

`TRANSFER-MANIFEST.json` records source-file SHA-256 hashes, file sizes, the base commit and working-tree status. `CHECKSUMS.sha256` covers the packaged files except itself. Generated builds, installed packages, test reports, editor caches, private environment files and the `.git` directory are excluded.

Check `TRANSFER-VALIDATION.md` for the validation actually performed on this transfer. Existing repository documents may describe older milestones; this guide and the current code define the transferred state.
