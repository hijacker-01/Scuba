# Transfer validation — 30 September 2026

Validation was performed in a separate directory extracted from the transfer ZIP, with no copied node_modules, no .env.local and no access configured to the application's database or payment accounts.

- All 89 project source/assets/configuration files matched the original working tree by SHA-256 after extraction.
- Clean dependency installation passed using `MONGOMS_DISABLE_POSTINSTALL=1 npm ci --no-audit --no-fund` (492 packages). The first attempt without this setting was interrupted while an optional MongoDB test-binary download was pending.
- `npm run build` passed, including TypeScript and production page generation.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed: 3 payment-signature tests.

Verification host: Windows, Node.js 26.8.2, npm 11.19.1. The repository CI specifies Node.js 22; that is the documented baseline for the new laptop, but Node.js 22 was not separately run during this transfer verification.

The final archive contains the same hash-verified project files, with the completed transfer guide, this validation record and generated checksums. Validation dependencies and build output are not packaged.

Database integration tests, browser interaction tests, Razorpay transactions, SMTP delivery, scheduled jobs and a real cross-laptop run were not executed for this transfer. Those require the setup described in START-ON-NEW-LAPTOP.md. The package contains no database export and no private environment credentials. Successful source installation and production compilation do not establish that external services have been configured.
