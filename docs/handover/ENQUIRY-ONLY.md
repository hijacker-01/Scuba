# Enquiry-only launch

The owner has chosen direct enquiries without website payments. The website collects enquiries; the club confirms availability, prices, booking and any offline payment directly.

- Navigation and activity calls to action open the enquiry form. Activity links prefill the message.
- No checkout script is loaded. New reservation and payment POST endpoints return 410.
- Old booking and recovery pages redirect to the enquiry page.
- The Railway worker sends notifications only. Old worker versions calling reconciliation receive an authenticated no-op response.
- Staff see enquiries, content, team access and email delivery, without payment readiness or payment management.
- Existing database records and legacy operational libraries are retained; no records are deleted.
- Railway needs no Razorpay credentials. Existing email, MongoDB, APP_URL, session and worker secrets remain necessary.
- This change does not configure database backups or activate a paid Railway plan.
