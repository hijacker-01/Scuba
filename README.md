# Havelock Dive Club

For production readiness and club handover, start with [the handover pack](docs/handover/README.md). It records current launch gaps, club requirements, staff/owner guidance and acceptance checks.

Next.js booking site for Havelock Dive Club. Customers can browse activities, reserve a published departure for 15 minutes, and pay the full configured price through Razorpay. Staff can publish activity details and departures, view bookings and enquiries, and close slots. KK Tours and Travels requests use the enquiry form.

## Setup

Use Node.js 20.9+ and a MongoDB replica set (transactions are required for seat reservations). Install with `npm ci`, copy `.env.example` to `.env.local`, and fill in the actual values. Never use placeholder payment keys in a deployed environment. `SESSION_SECRET` and `CRON_SECRET` must be long random values. Set `MONGODB_DB` to the intended database.

Provision one staff user by setting `STAFF_EMAIL` and `STAFF_PASSWORD` in the shell, running `npm run provision:staff`, then clearing those shell variables. Do not save staff passwords in `.env.local`. Sign in at `/admin/login`, publish each product with verified details and terms, then add priced departures or course cohorts. Unconfigured products are visible for enquiries but cannot be booked.

Set Razorpay test keys and configure its `payment.captured` webhook at `/api/payment/webhook` using `RAZORPAY_WEBHOOK_SECRET`. Test mode must pass before switching to live keys. Configure automatic capture in Razorpay. `NEXT_PUBLIC_RAZORPAY_KEY_ID` is public; keep the key secret and webhook secret on the server.

Configure a scheduler to POST `/api/internal/notifications` with `Authorization: Bearer <CRON_SECRET>` every minute. POST `/api/internal/reconcile` with the same authorization every five minutes to recover uncertain payment results. The notification worker sends queued booking confirmations through SMTP and retries failures. Set `BOOKINGS_NOTIFY_EMAIL` to receive staff copies; staff can also see confirmed bookings in the dashboard.

## Checks

- `npm run typecheck`
- `npm run lint`
- `npm run test` (fast unit tests); `RUN_DB_TESTS=1 npm run test` runs isolated MongoDB replica set tests and downloads a MongoDB test binary on first use.
- `npm run build`
- `npm run test:e2e` (requires Google Chrome; CI installs it with Playwright)
- `npm audit --omit=dev --audit-level=high`

The unit and browser checks do not make live payments. Before launch, run an isolated staging MongoDB database and Razorpay test keys through the full select → reserve → pay → confirm → staff dashboard flow. Verify concurrent last-seat attempts, late capture, replayed webhooks, and refund handling in Razorpay's dashboard. Do not publish prices, prerequisites, claims, or cancellation terms until the dive operator verifies them.

## Main routes

Customer: `/`, `/activities/[slug]`, `/book`, `/booking/[reference]`. Staff: `/admin/login`, `/admin`.

Public APIs: `GET /api/activities`, `GET /api/availability?activity=slug`, `POST /api/enquiries`, `POST /api/bookings`, `GET /api/bookings/[reference]`, `POST /api/payment/create-order`, `POST /api/payment/verify-payment`, `POST /api/payment/webhook`. Booking creation needs a UUID `Idempotency-Key` header and returns a scoped HttpOnly access cookie. Staff APIs require the server-validated `staff_session` cookie.
