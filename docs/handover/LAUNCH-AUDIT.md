# Launch audit — 1 October 2026

Historical baseline. Subsequent fixes and owner tools are recorded in [Current implementation status](IMPLEMENTATION-STATUS.md); do not treat the old defect list below as the current implementation.

Assessment based on the restored source and local verification. No live gateway, SMTP, hosted scheduler or production database was tested. This is a targeted code audit, not an exhaustive security certification.

## Implemented

| Capability | Current behavior |
| --- | --- |
| Customer discovery | Activity/course catalog, gallery, brochure, contact and WhatsApp |
| Staff access | Password hashing, server-side sessions, eight-hour session lifetime, sign-out |
| Catalog and departures | Publish fixed catalog activities; add future departures; change price/capacity; close departures |
| Reservation | Transactional capacity claim, server-calculated price, 15-minute expiry, retry keys |
| Payment | Server-created Razorpay orders, signature checks, captured amount/currency verification |
| Recovery | Payment webhook and authenticated reconciliation endpoint |
| Confirmation email | Queued customer/staff email, retries, abandoned sending-job recovery |
| Staff operations | Recent bookings/enquiries, cancellation, same-activity/same-price rescheduling, enquiry status |
| Refund support | Manual gateway refund; handler for refund.processed |

## Defect fixed during this audit

`lib/booking.ts`: the duplicate-key fallback returned an existing booking without rechecking that its email, departure and participant count matched the losing request. The normal retry path already checked these. The fallback now performs the same check and preserves unrelated duplicate errors. Five regression cases cover the successful retry, each conflicting field, and a duplicate with no matching booking.

## Launch work, in priority order

| Priority | Finding and evidence | Required completion |
| --- | --- | --- |
| Before accepting money | Refund state accounting is incomplete: `app/api/payment/webhook/route.ts` compares one refund amount with the total rather than recording cumulative refunds. After a partial refund, a later refund can leave the booking in review and seats occupied. A subsequent captured callback can also encounter an unsupported partial-refund state in `lib/payment.ts`. | Store refunds by unique gateway refund ID, preserve confirmed seat ownership until cancellation/full refund, handle cumulative amounts, duplicate/out-of-order events, and prevent reconfirming refunded bookings. Add transaction tests. |
| Before accepting money | Reconciliation always selects the oldest 30 unresolved bookings (`app/api/internal/reconcile/route.ts`). Old unpaid expired orders and persistent payment_review records can permanently fill the batch. Cancelled orders with a late capture are not selected. | Fair retry scheduling with bounded backoff and visibility; include late captures on cancelled reservations without rebooking them. Test a backlog larger than 30. |
| Before accepting money | No operator resolution workflow for payment_review or partial_refund_review. The dashboard only offers actions for pending/confirmed records. | Add a reviewed, auditable resolution workflow linked to gateway evidence; decide which cases require refunds. Avoid direct database edits as routine operation. |
| Before launch | Terms are shown on activity detail pages and copied into bookings, but direct `/book` checkout neither displays them nor records acceptance (`components/BookingFlow.tsx`). | Show the selected activity's approved terms at checkout, require acknowledgement and store accepted version/time server-side. |
| Before launch | No dedicated privacy/cancellation pages or links; operator policies have not been supplied. | Obtain club-approved wording, publish accessible pages, and link from checkout/contact/footer. Do not invent business terms. |
| Before routine staff use | Overview limits bookings/enquiries to 100 and selects the earliest 100 departures (`app/api/admin/overview/route.ts`). Past departures can hide future ones. No search, pagination or export. | Search/paginate bookings and enquiries, prioritise upcoming departures, and provide controlled records export. Test more than 100 records. |
| Before routine staff use | Staff dashboard omits booking phone, participant count and gateway payment ID even though some exist in storage/API. Product fields cannot be loaded for editing or unpublished through UI. | Show operational booking details/payment reference, add product editing/unpublish controls, and make refund/review records findable. |
| Before routine staff use | Departure form interprets datetime-local in the device timezone; displayed departures use Asia/Kolkata (`components/StaffDashboard.tsx`). | Explicit India-time entry/conversion independent of device settings. Test a device outside India. |
| Before routine staff use | Disabled staff can retain an existing session: `requireStaff` checks sessions, not active staff. Provisioning changes passwords without revoking sessions. | Implement account deactivation/session revocation and a documented password-reset flow; test it. |
| Before launch | Enquiries are stored but not emailed. Only paid confirmations create notification jobs. Cancellation/reschedule notices are absent. | Agree expected notifications; provide those required or document the manual daily workflow prominently. |
| Before launch | Failed email jobs have no staff retry/inspection UI; unexpected API errors become generic 503 responses without diagnostic logging (`lib/api.ts`). | Structured private logs, worker health monitoring, failed-job visibility/retry, and club-owned alerts. |
| Before launch | Customer booking lookup is restricted to the original browser cookie; confirmation emails contain a reference but no recovery link. | Agree secure cross-device recovery or document staff-assisted lookup; never make customer records public by reference alone. |
| Before launch | `BookingFlow` creates a fresh retry key on every new attempt, so a network failure after successful reservation may hold additional seats on retry. | Persist the key for each submitted request and recover the original reservation; reset only when booking inputs change. Test lost responses. |
| Deployment check | Rate limiting trusts x-forwarded-for. | Confirm the selected host overwrites trusted client-IP headers; test rate limits through the deployed proxy. |
| Owner sign-off | Fixed activity names, phone numbers, Instagram, brochure, media and KK Tours affiliation are present. | Club confirms accuracy, approved claims and media ownership. Changing catalog entries currently requires a developer. |

## External setup still missing

Club-owned domain/hosting/repository, separate staging and production replica-set databases, real environment configuration, staff account, verified catalog and departures, Razorpay onboarding/test then live setup, SMTP sender, both POST workers, backups, alert destinations and support agreement.

## Validation boundaries

Laptop setup passed build/typecheck/lint, 3 original payment tests, 4 isolated database tests and 6 browser tests. The browser tests cover public navigation, malformed-input rejection and unauthenticated access; they do not prove successful payment or staff operations. After the audit fix, build, typecheck and lint passed again; all 8 fast tests and all 12 database-enabled tests passed. Browser tests were not repeated for the server-side retry fix. Deployment acceptance remains pending.

The identified defects remain launch work unless explicitly marked fixed above. A polished homepage does not establish readiness to accept money.
