# Launch and acceptance checklist

Current status: staging/production acceptance pending. Use test customers, a separate database and gateway test mode for all staging cases. Add tester, date, booking/payment/refund reference and private evidence location to each result. Never store credentials or customer personal data in this file.

## Gate 1 — requirements and code

- [ ] Club requirements sheet approved, including capacity handling for offline sales.
- [ ] Owner reviews completed fixes and remaining launch work in IMPLEMENTATION-STATUS.md; LAUNCH-AUDIT.md is the historical baseline.
- [ ] Approved terms/privacy/cancellation information visible at checkout and from the footer.
- [ ] Owner confirms contact details, brochure, media and activity descriptions.
- [ ] Staff can find older bookings and upcoming departures beyond list limits.
- [ ] Build, typecheck, lint and unit/database/browser tests pass on the release being deployed; production dependency audit is clean and the remaining development-tool advisories are reviewed.

## Gate 2 — staging services and acceptance

| Case | Required outcome | Result / evidence |
| --- | --- | --- |
| Provision/sign in/out staff | Authorized user operates dashboard; logout/disabled account/password reset revokes access as designed | Pending |
| Publish and update activity | Approved details and terms appear; unpublish prevents new bookings | Pending |
| Manage departure | Correct India time, price and capacity; close prevents reservations without cancelling paid bookings | Pending |
| Successful checkout | Server price matches approved amount; captured test payment confirms booking and seat count | Pending |
| Tampered checkout | Client price/status changes rejected; wrong amount/order/signature cannot confirm | Pending |
| Concurrent last seat | Exactly one successful reservation; no overbooking | Pending |
| Lost reservation response/retry | Same request recovers one booking and one capacity claim | Pending |
| Failed/dismissed checkout | Clear retry path; reservation expires and seats release | Pending |
| Webhook before/after browser callback | One confirmation/payment record/notification job per recipient | Pending |
| Duplicate and out-of-order events | No duplicated seats, confirmations or refunds | Pending |
| Late capture with seats available/full/closed | Defined confirmation or review outcome; no overbooking | Pending |
| Capture after cancellation | Review/refund process; cancelled booking is not silently fulfilled | Pending |
| Reconcile backlog >30 | New unresolved orders processed despite old unpaid/review records | Pending |
| Cancel unpaid/paid booking | Seats released once; paid cancellation requires tracked gateway refund | Pending |
| Full/partial/cumulative refund | Correct gateway/application totals and seats; duplicate events harmless | Pending |
| Reschedule | Same product/price and enough seats; original seats released once; customer informed | Pending |
| Customer/staff email | Real test mailbox receives correct details; retries/failures visible | Pending |
| Scheduler authentication | Both POST workers run on schedule; unauthorized call rejected; outage alerts work | Pending |
| Enquiry | Stored, staff notified through agreed workflow, contacted/closed status works | Pending |
| Customer recovery | Agreed cross-device or staff-assisted process verified without exposing records | Pending |
| Backup restore | Isolated restore succeeds; payment reconciliation procedure rehearsed | Pending |
| Mobile/browser/accessibility | Checkout, forms, keyboard navigation and staff workflows usable | Pending |

## Gate 3 — production launch

- [ ] Club-owned accounts, billing, recovery contacts and access invitations verified.
- [ ] Domain/HTTPS and production secrets set; test/live gateway modes not mixed.
- [ ] Production database/network access and backup policy verified.
- [ ] Production staff and approved catalog/departures provisioned without test records.
- [ ] Live capture/refund webhooks and both workers verified; monitoring destinations receive test alerts.
- [ ] Club authorizes a controlled low-value live booking and refund; all results reconciled before public promotion.
- [ ] Code rollback release and database recovery procedure recorded.

## Gate 4 — handover acceptance

- [ ] Club staff demonstrate publish departure → find booking → handle cancellation/refund → respond to enquiry.
- [ ] Staff/owner guides updated for the final implementation and delivered.
- [ ] Source repository and deployed release under club ownership; private secrets excluded from delivery.
- [ ] Account inventory, recurring charges, backup evidence, known limitations and support terms acknowledged.
- [ ] Club owner accepts delivery in writing; freelancer access retained/removed as agreed.

Owner/approver: __________  Developer: __________  Accepted release: __________  Date: __________
