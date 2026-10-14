# Owner and technical handover guide

Updated 6 October 2026. Read IMPLEMENTATION-STATUS.md for local owner login and completed software fixes. Fill account inventory and verify this runbook during staging and production acceptance.

## Account ownership

The club owns domain/DNS, hosting, source repository, database, Razorpay, sender email, scheduler and monitoring. Set club-controlled billing/recovery contacts and store recovery codes securely. Invite the freelancer with the access needed for setup and maintenance; agree access after handover.

Use a production-capable Node.js host for this Next.js app. A static-only upload cannot run its API routes. The host must support Node.js 22, secrets, HTTPS, MongoDB connections, outgoing email, gateway requests and authenticated scheduled POST calls. Select a plan only after confirming these capabilities and the club's budget. No hosting purchase or deployment has been made by this audit.

Keep staging and production databases, secrets and payment modes separate. Staging never contains production customer data by default. Select a MongoDB replica set because reservation transactions require it. Verify network access from the hosting runtime and least-privilege database credentials.

## Deployment configuration

Install using the lockfile with `MONGOMS_DISABLE_POSTINSTALL=1 npm ci`, then `npm run build`. Run `npm start` on a Node host, or use the selected provider's supported Next.js deployment. Configure secrets in the hosting dashboard, not in Git or a downloadable ZIP.

| Settings | Responsible party |
| --- | --- |
| MONGODB_URI, MONGODB_DB | Database administrator; staging/production separated |
| APP_URL | Canonical HTTPS website URL for recovery links |
| SESSION_SECRET | Developer generates securely; rotation invalidates customer booking cookies |
| NEXT_PUBLIC_RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET | Club's gateway administrator; matching mode/account |
| RAZORPAY_WEBHOOK_SECRET | Developer/gateway administrator; distinct from API secret |
| SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, SMTP_FROM | Email administrator |
| BOOKINGS_NOTIFY_EMAIL | Club-approved booking notification inbox |
| CRON_SECRET | Developer generates securely; supplied only to scheduler |

Provision staff using `npm run provision:staff` with STAFF_EMAIL and STAFF_PASSWORD in the terminal. Set STAFF_ROLE=owner for the first owner account, or STAFF_ROLE=staff for an operational account. Minimum password length is 16 characters. Clear these variables afterward. Provisioning an existing email resets its password and revokes its sessions; owners can manage accounts through the dashboard.

Configure `/api/payment/webhook` on the public HTTPS staging/production domain for `payment.captured` and `refund.processed`. The code handles both, although the earlier README mentions only capture. Test each mode separately. Razorpay documents separate test/live webhook configuration in [its webhook guide](https://razorpay.com/docs/webhooks/). Confirm automatic capture settings and verify signed events against gateway records.

Set authenticated POST workers, using `Authorization: Bearer <CRON_SECRET>`:

- `/api/internal/notifications`: every minute.
- `/api/internal/reconcile`: every five minutes.

Confirm the provider supports POST and secret headers. Monitor failures and record the last successful run. Reconciliation now leases and fairly rotates records with retry scheduling. Configure authenticated POST polling of /api/internal/health and route non-200 responses to the club-owned alert destination. It reports missing/stale workers, failed emails and review/refund counts. An endpoint alone does not configure hosting alerts.

## Backups and recovery

Document backup method, retention, frequency, recovery owner and tolerated data loss/outage. Source code and the transfer ZIP contain no database records. Verify the selected database plan's backup capability. MongoDB documents [Atlas backup options](https://www.mongodb.com/docs/atlas/backup-restore-cluster/) and [backup/restore tools](https://www.mongodb.com/docs/v8.0/tutorial/backup-and-restore-tools/).

The development utility scripts/backup-verify.mjs saves a BSON-preserving compressed snapshot and verifies it in an isolated disposable database. It was tested locally, including record hashes and recreated indexes. Keep these files private; this utility does not replace managed offsite backups, production retention or disaster recovery. Before launch, restore a production-capable backup into an isolated database and verify bookings, departure counts, staff and payment references without enabling gateway/email workers. Record time taken and evidence. Keep backup access restricted because records contain customer information.

For an incident: identify and pause the affected booking/payment path; preserve logs and gateway references; restore service in staging first. Never blindly roll back the production database: captured payments may have happened after a snapshot. Reconcile payment IDs, refunds, notifications and seats before reopening checkout. Use a previous verified app release for code rollback, taking data compatibility into account.

## Daily and ongoing responsibilities

Club manager reviews bookings/enquiries, payment exceptions and refund obligations. Technical owner monitors HTTPS uptime, application errors, workers, failed emails and backups. Payment administrator reconciles gateway records and settlements separately; the site's captured-payment total is not a settlement/accounting report.

Record recurring invoices for domain, hosting, database/backup, email, scheduler/monitoring and gateway charges. Obtain current provider quotations rather than assuming free tiers are sufficient. Agree dependency/security updates, incident support and changes to activities or policies with the freelancer.

## Handover inventory

| Item | Club account/contact | Location or ID (no secret) | Renewal/billing owner | Verified by/date |
| --- | --- | --- | --- | --- |
| Domain/DNS | | | | |
| Production/staging hosting | | | | |
| Source repository/release | | | | |
| Database/backup/restore | | | | |
| Razorpay/webhook | | | | |
| Email/sender domain | | | | |
| Scheduler/monitoring | | | | |
| Staff administration | | | | |
| Support arrangement | | | | |

