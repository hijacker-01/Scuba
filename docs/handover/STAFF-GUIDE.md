# Owner and staff operating guide

Updated 6 October 2026. Train with test customers on staging; production use requires launch acceptance.

## Sign in and daily checks

Use the footer's Owner / staff login or /admin/login. This laptop has a separate development account; its details are in the private .codex/local/owner-login.txt file. Production staff must use assigned club-owned accounts.

Search bookings by reference, customer name, email, phone or gateway payment ID. Filter payment_review and refund_required daily. Bookings, enquiries and departures have independent page controls. Upcoming departures appear by default; Include past departures provides history.

Check capacities against actual instructors/equipment and offline sales. Review pending/failed emails and worker last-success dates. A configured secret alone does not prove a scheduler is running.

## Owner setup and publication

Only owners can edit products, club website information, policies and account access. Existing entries load into the activity form. Import missing brochure activities creates drafts without replacing existing edits. Discover Scuba and Boat Dive start at ₹2,999; other prices need approval. The brochure's seasonal discount is not automatically deducted.

Complete the activity's price, description, duration, included services, eligibility/medical requirements, meeting point and approved terms before enabling Published and available for booking. Clear that checkbox and save to stop new bookings. Previous bookings preserve their own price and terms.

Website settings update contact/WhatsApp details, Instagram, club name, homepage headline/introduction, year established, about text, KK travel/car-hire/logistics descriptions, policies and email preferences. Layout/animation changes and new types of media or integrations remain development work.

Add actual departures or course cohorts with start/end, seats and price per person. Entry/display always use India time, regardless of the computer timezone. The selected activity's default price prefills the departure form; review any departure override. A departure with reserved seats cannot be moved silently: reschedule its bookings individually. Close blocks new sales while preserving existing bookings.

## Booking and payment states

| State | What it means / staff action |
| --- | --- |
| pending | Places held temporarily; not yet confirmed as paid. |
| confirmed | Captured payment verified. Processed partial refunds may exist; consult the refund amount. |
| expired | Hold expired; seats released. Late payment is checked against current capacity. |
| cancelled | Unpaid reservation cancelled. A later capture is marked refund_required, without restoring seats. |
| payment_review | Captured payment cannot automatically be fulfilled; use the review workflow. |
| refund_required | Refund handling is due. Issue the approved amount in Razorpay, then synchronise. |
| refunded | Cumulative processed refunds equal the booking payment. |
| partial_refund_review | Legacy state from the previous version; synchronise gateway/refunds and involve the owner. |

The table shows phone, participants, gateway order/payment IDs, booking amount, cumulative processed refunds and accepted terms/time. The revenue card is captured payments minus processed refunds, not a settlement/accounting statement.

## Cancellation, refunds and review

Confirm reference, customer and approved policy before cancelling. Cancellation releases held seats once and queues a customer notice. It does not transfer refund money. The authorised payment administrator issues the refund in Razorpay. Use Check gateway / refunds to retrieve current payment/refund evidence; signed webhooks and the worker also update it. Pending/failed gateway refunds do not count as processed.

A partial processed refund preserves a confirmed departure. A cumulative full refund releases remaining held seats once. Duplicate refund IDs do not increase totals twice.

For payment_review, first check gateway/refunds. If the customer agrees to another available same-activity/same-price departure, select it and Confirm reviewed payment, adding the reason. The server checks unrefunded capture and seats. Otherwise cancel the booking for refund handling. Never mark payments paid through a database edit.

For pending/confirmed rescheduling, choose an eligible departure and press Reschedule. Availability and price are checked, old seats released and a notice queued. The selector uses the current departure page; use its page controls to find later departures.

## Enquiries and email

Change enquiries from New to Contacted to Closed after responding. Enquiry acknowledgements and booking cancellation/rescheduling notices are enabled as requested; owners can change these preferences. Staff alerts use BOOKINGS_NOTIFY_EMAIL.

Failed messages appear under Email delivery. Correct sender/recipient/configuration issues first, then Retry email. The scheduled worker sends pending jobs. Delivery is retried after failures; SMTP delivery is at least once, so staff should not assume duplicates are impossible after a process failure.

## Booking recovery and account security

Customers can request an emailed single-use recovery link with their reference and checkout email. The link expires after 20 minutes. APP_URL, SMTP and the email worker must be correctly configured. Never share customer recovery links.

If email/reference recovery fails, verify identity using the club's agreed process and recorded booking/contact details before discussing a reservation. Do not disclose customer records solely because someone provides a reference. Do not send gateway keys or session cookies to customers.

Owners can add staff/owners, disable accounts and reset passwords (minimum 16 characters). Each access/password/role change revokes that account's sessions. Your own owner account cannot be disabled/demoted from the same session. Use a second authorised owner for that change.

