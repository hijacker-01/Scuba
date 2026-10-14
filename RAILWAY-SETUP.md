# Havelock Dive Club: Railway setup
Prepared 14 October 2026 against the 8 October source snapshot.

This is a deployment overlay, not an already deployed site. Extract the Suba-Diving folder over the matching source snapshot, review the changes, then push the combined source to the authorised GitHub repository. Keep existing source and a rollback copy. No credentials or database records are included.

## Decisions already made
Domain: havelockdiveclub.in, managed by GoDaddy.
Club account and notification inbox: havelockdiveclub8@gmail.com.
Hosting: Railway Trial initially, Hobby before public launch. Usage is billed across web, database, worker and storage; $5 is not a fixed total bill.
Email: HTTPS Resend API implementation supplied. The club must create/approve its sending account and verify a domain sender. Gmail receives staff notifications and customer replies; it is not used as the API sender.

Correction: Railway blocks outbound SMTP on Trial and Hobby. Earlier SMTP/Gmail-app-password instructions do not apply to this deployment.

## 1. Repository and account
Owner signs in to the club Railway account and authorises the chosen GitHub repository through screen sharing. Hobby does not provide the team access previously discussed for Pro. Never send the owner password or OTP.
If the account remains a Limited Trial, restricted networking may block required integrations. Upgrade earlier if that restriction prevents testing.

## 2. MongoDB on Railway
Deploy an authenticated MongoDB replica-set service with a persistent volume. Do not use an unconfigured standalone MongoDB template: the booking transaction code requires a replica set.
For staging a single-member replica set supports transactions but has no failover. For production, approve that availability tradeoff or deploy a multi-member replica set with separate persistent volumes. Extra members increase usage costs.
Use the service's actual private hostname, port, replica-set name and application credentials; do not guess these values. Encode username/password correctly in its URI. Restrict access to private networking where possible. Keep admin/root credentials separate from application credentials.
Set MONGODB_URI on the web service and MONGODB_DB=havelock_dive_club_staging. Verify authenticated access, transaction commits and persistence after service restart before continuing. Configure scheduled backups, an offsite copy and a restore rehearsal. A volume alone is not a backup.
Do not deploy scripts/start-local-db.mjs or setup-local-owner.mjs as a hosted database: they are laptop helpers.

## 3. Web service
Create a GitHub-backed service with the combined project folder as its root. Use railway.json for its config path. Node version is pinned to 22 through .node-version.
Build: npm run build. Start: npm run start -- --hostname 0.0.0.0. Railway provides PORT; leave its value intact.
Copy variable names from railway.env.example into Railway Variables and replace every placeholder there. Do not commit a real environment file.
Generate two different secrets locally with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))". Use one for SESSION_SECRET and one for CRON_SECRET. Do not paste them into chat.
Initially generate a Railway public HTTPS domain and set APP_URL to its exact URL. Redeploy after changing variables. NEXT_PUBLIC_RAZORPAY_KEY_ID is embedded at build time: rebuild when switching payment mode.
The /api/activities deployment check verifies an HTTP response only: this endpoint falls back to an enquiry-only catalogue when the database fails. Verify database-dependent owner workflows separately; this healthcheck does not certify bookings.
Keep all unapproved products unpublished.

## 4. Email API
Create a club-owned Resend account, add the sending domain and copy the exact verification DNS records it supplies into GoDaddy. Preserve existing records, especially MX/TXT records; do not overwrite an existing SPF record blindly.
Set EMAIL_PROVIDER=resend, RESEND_API_KEY, EMAIL_FROM to a verified sender, EMAIL_REPLY_TO=havelockdiveclub8@gmail.com and BOOKINGS_NOTIFY_EMAIL=havelockdiveclub8@gmail.com on the web service.
The supplied adapter preserves queue retries and uses a stable provider idempotency key. Provider deduplication lasts 24 hours; delivery is not guaranteed exactly once beyond that window.
Verify delivery to actual test inboxes and replies. Do not claim customer email works until sender verification and real delivery pass.

## 5. Background worker
Create a second service from the same repository. Set its config path to railway.worker.json, not railway.json. It is a persistent worker, with no public domain, cron schedule or HTTP healthcheck.
Set WORKER_APP_URL to http://<actual-web-private-hostname>:<actual-web-PORT> and CRON_SECRET to the same value used by the web service. The worker only needs these two variables. For initial diagnostics the public HTTPS application URL can be used instead.
It calls notifications every minute and reconciliation every five minutes, does not overlap the same task within one process, times out requests and shuts down on SIGTERM. Deploy exactly one worker replica. Multiple replicas would make duplicate scheduling possible.
Watch worker logs for HTTP 200. Monitor the authenticated POST /api/internal/health separately; it reports stale workers, failed mail and payment/refund review counts. Configure real alerts with an external monitor. Railway deployment healthchecks are not ongoing monitoring.

## 6. Razorpay test mode
Owner supplies test-mode key ID and secret through the Railway dashboard. Create a distinct webhook secret and configure /api/payment/webhook on the actual HTTPS domain. Enable payment.captured and refund.processed events and automatic capture.
Run successful booking, expired reservation, interrupted checkout, concurrent last-seat requests, duplicate/late webhook, partial/full refund and recovery-link scenarios. Use a staging database and test customers. Authorised staff issue refunds through Razorpay; the site tracks and reconciles them.

## 7. Owner account
Use scripts/provision-staff.mjs against the intended hosted staging database with STAFF_EMAIL, STAFF_PASSWORD and STAFF_ROLE=owner in a private shell environment. Read the script first and confirm the database target. Clear password variables afterward. Never put staff passwords in the repo or deployment example file.
Import brochure drafts through owner tools. Configure only approved business content, prices, terms and real departure capacity. Confirm walk-in seats cannot cause online overselling.

## 8. Domain and production
Once staging passes, activate Hobby, provision a separate production database and secrets, and configure authorised live Razorpay credentials. No purchases or live payments have been made by this package.
Add havelockdiveclub.in and www.havelockdiveclub.in to Railway. Use the exact records Railway displays. GoDaddy's existing @ parking entry will need replacement through a supported root-domain setup; do not invent an IP address or change nameservers. If GoDaddy cannot enter the record Railway requests, resolve that specific provider limitation before changing DNS.
Verify both hostnames and HTTPS, choose a canonical hostname, set APP_URL accordingly, and update payment webhooks. Confirm redirect behaviour. Preserve any email DNS records. Rebuild after changing payment key ID.
Complete a club-authorised controlled live booking/refund, real mail, backups/restore, staff training and acceptance before promoting paid bookings.

## Validation and remaining work
TypeScript, lint, unit tests and production build results are recorded in VALIDATION.txt. No Railway deployment, real SMTP/API email, gateway payment, live MongoDB transaction or DNS change is claimed.
This overlay leaves the visual design and booking rules intact. It adds configuration, a scheduler and HTTPS email delivery. Browser and database integration acceptance still need to run on the deployed release.

References:
https://docs.railway.com/networking/outbound-networking
https://docs.railway.com/pricing/free-trial
https://docs.railway.com/config-as-code/reference
https://docs.railway.com/cron-jobs
https://resend.com/docs/api-reference/emails/send-email
