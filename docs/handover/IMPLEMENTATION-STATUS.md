# Owner tools and booking reliability — 6 October 2026

The application now has a working local owner account and persistent laptop database. This is development setup, not production acceptance. The earlier launch audit is historical; this document records the subsequent work.

## Local access

- Login: `http://localhost:3000/admin/login`; the footer includes Owner / staff login.
- Local account: `owner@havelock.local`. The generated password is in `.codex/local/owner-login.txt`, excluded from source delivery.
- Run `./Start-Project.ps1 dev` to start the website and, when needed, its persistent local MongoDB service. The database is bound to `127.0.0.1:27019`; its files live in `.codex/local/database`.
- Never upload `.env.local`, `.codex/local`, local backup files, or this laptop database as part of the website source package. Use club-owned production services and a separately provisioned owner account at handover.

## What has been built

| Area | Implemented behaviour |
| --- | --- |
| Owner controls | Owner-only editing of activities/course names, descriptions, duration, inclusions, eligibility, meeting point, terms, prices and publication; website contact details, Instagram, homepage headline/introduction, founding year, about/travel/car-hire/logistics text and policies; team account management. Staff cannot use owner-only APIs. |
| Brochure prices | Discover Scuba and Boat Dive default to ₹2,999 per person. Other prices remain unset. Import creates missing drafts and preserves owner edits. The illustrated seasonal discount is not activated. Published activity defaults feed the website; each departure has its own explicit checkout price. |
| Publication | Publishing requires a price and complete booking details/terms. Unpublishing stops new availability and reservations. Existing bookings keep their accepted terms and price. |
| Payments/refunds | Unique refund ledger, cumulative processed amounts, duplicate protection, seat release once on full refund, partial refunds preserving confirmed seats, late cancelled captures becoming refund due. Refund events are checked against gateway evidence. |
| Payment review | Staff can check gateway/refunds, cancel for refund handling, or assign an available same-activity/same-price departure against verified unrefunded captured payment. Resolution is audited. Refund money is still issued by authorised staff in Razorpay. |
| Interrupted checkout | Browser stores a non-PII request fingerprint and retry key before reservation; a lost response reuses the same request. Saved reservations can resume after reload. Customer status pages offer resume for pending bookings. |
| Background recovery | Fair leased payment checks with retry scheduling/backoff, including cancelled orders and refund synchronisation; batches no longer remain stuck on the oldest records. |
| Checkout terms | Selected activity terms are displayed; acceptance is mandatory. Server checks the exact terms hash and stores the text, hash and acceptance time. Changed terms require refresh/review. |
| Dashboard | Booking search/status filters, pagination for bookings/enquiries/departures, upcoming departures by default, customer phone, participant/payment/refund details, accepted terms and audit history. |
| Account security | Disabled or version-revoked accounts cannot reuse sessions. Owner password/role/active changes and provisioning revoke sessions. An owner cannot disable/demote their own account through the dashboard. |
| Dates | Entry, editing and display explicitly use India time, independently of the computer timezone. Departures with held seats must be rescheduled booking by booking rather than moved silently. |
| Email | Automatic enquiry acknowledgements, cancellations and rescheduling, plus existing booking confirmations. Queued retries, failed-message visibility and authorised retry controls. Real delivery requires configured SMTP and scheduled worker calls. |
| Customer recovery | Booking-reference/email request sends a single-use, 20-minute recovery link; tokens are hashed in storage and redeem through POST. Responses do not reveal whether details matched. Staff-assisted fallback remains available. |
| Operations hooks | Private error-type logging without raw customer/credential data; worker health records; authenticated health endpoint reports stale workers, failed mail and review/refund counts. Hosting must supply actual alerts and schedules. |
| Local backup | `scripts/backup-verify.mjs` creates a BSON-preserving compressed snapshot, restores documents/indexes into a disposable database and checks record hashes. Local restore verified. Production backup policy/storage/restore rehearsal remains separate. |

## Remaining before accepting real bookings

1. Club approval: prices beyond the two brochure offers; duration, inclusions, eligibility/medical rules, meeting point, capacity and actual schedules; privacy/cancellation/refund wording; course providers, contacts and media rights. All 11 local activities are drafts; no sample schedule or invented policy has been published.
2. Real services: club-owned hosting/domain/HTTPS, MongoDB replica set, Razorpay test/live accounts and signed webhooks, SMTP sender, notification inbox and owner/staff accounts. Set `APP_URL` to the canonical HTTPS domain for recovery email links.
3. Scheduled POST jobs: notifications every minute, reconcile every five minutes, authenticated with CRON_SECRET. Health polling and alerts must be configured with the selected host.
4. Production operations: restricted/offsite backup storage, retention and alerts; production-sized restore test; log monitoring; rate-limit verification behind the host's trusted proxy. The local snapshot is not a production disaster-recovery service.
5. Acceptance: real staging booking/payment/full and partial refund/email/recovery flows, owner-approved low-value live booking/refund, staff demonstration and signed account/support handover.

The Razorpay integration uses documented processed-refund IDs/amounts and verifies gateway records. Reference: [Razorpay refund event payloads](https://github.com/razorpay/markdown-docs/blob/master/webhooks/refunds.md).

## Verification scope

32 unit/database tests passed, including terms changes, concurrent seats, refund accumulation and duplication, refund before capture, late capture after cancellation, reviewed payment resolution, owner access/revocation, pagination beyond old limits, >30-order worker backlog, notifications/retry and single-use recovery. Eight desktop/mobile browser tests passed, including required checkout terms, lost-response retry keys and reload/resume without another reservation. Actual local owner login, draft import, edit persistence, website-settings save and logout were checked on desktop and Pixel 7, and the final local backup restored and matched 13 collections. Production build, TypeScript and lint passed. Gateway/SMTP calls in database tests are simulated; no real charge, refund or email was sent.

Browser verification also exposed image-load refresh interrupting native smooth navigation. ScrollTrigger refresh now defers until scrolling is idle and uses its safe refresh mode. Reference: [GSAP refresh documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.refresh()/).


Dependency check: compatible fixes were applied, the test runner was upgraded using its official migration guide, and build-only Tailwind was moved to development dependencies. The production dependency audit reports zero vulnerabilities. Nine advisories remain in development/build/lint tooling, so builds must use trusted project files and that toolchain review remains a release-maintenance item. Reference: https://vitest.dev/guide/migration/.

