# Owner password and backup recovery keys

## Deploy this update

1. Push the supplied files to the existing Scuba repository on `main`. Deploy both Scuba and brave-embrace from this commit. The backup service must have the updated `backup.mjs`, `crypto.mjs` and `keyring.mjs` before using rotation.
2. Add ONE variable on Scuba: `BACKUP_ENCRYPTION_KEY=${{brave-embrace.BACKUP_ENCRYPTION_KEY}}`. Use Railway's variable reference picker if entering it manually. It references the backup service's ORIGINAL existing key. Never enter the actual value into source control. Deploy Scuba after adding the reference. No bucket credentials are needed on Scuba.
3. Keep brave-embrace's normal command `node backup.mjs` and its existing schedule and variables. Do not change the original `BACKUP_ENCRYPTION_KEY` variable on either service. That key now also protects the saved keyring. Changing it would prevent future backups until the original is restored.
4. Sign in, expand **Account security → Change my password**. Enter the current password and the owner's new passphrase twice. At least 16 characters, at most 72 UTF-8 bytes; spaces are allowed. On success every existing session is revoked, and the owner signs in again. Other staff can change only their own password with this form.
5. Expand **Backup recovery keys**. Enter the current OWNER password and acknowledge private storage. Start with **Download recovery keys**, save the JSON outside Railway, and then use **Rotate key and download recovery keys** if desired. The export contains actual decryption keys. Keep it private. Do not commit it or attach it to public issues. If browser download is blocked, use Download recovery keys again; exports include every retained key.
6. Run one backup and check `backup_verified` with its new `keyId`. An already-running job may use its previously selected key. Changing keys does not rewrite older objects. Keep ALL recovery keys, including the original, for as long as matching backups exist.

No actual account password or backup key is changed by deployment alone. The owner performs these actions in their dashboard. No plaintext key is returned by dashboard overview APIs, shown inline, sent by email or written to logs. Key rotation/export requires a current owner session and re-entering the current password, and is rate limited per account and IP. Stored keys are encrypted with the original Railway key; only an explicit, authenticated recovery-file download contains plaintext keys. This adds the original key to Scuba's trusted runtime, so access to that service must be restricted like access to the backup service.

## Recovery after rotation

New `.hdcbk` files use the `HDCBK002` envelope with an authenticated key identifier. Old `HDCBK001` backups remain readable. The downloaded recovery JSON contains both old and new keys, and restoration does not depend on the original MongoDB keyring remaining online.

For the existing isolated verification job, securely mount the downloaded JSON and set `BACKUP_RECOVERY_FILE` to its local path in that job. Continue using `BACKUP_OBJECT_KEY`, the bucket variables and an isolated `RESTORE_TEST_URI`; run `node verify.mjs`. It selects the right key from the file, verifies records/indexes, and removes only its disposable database. Without a recovery file, `BACKUP_ENCRYPTION_KEY` remains supported for a backup created with that particular key. Never point RESTORE_TEST_URI at the live application database.

The wrapping key itself is infrastructure configuration, not a human password. Rotating it would need a separate re-wrapping migration and is deliberately not part of this dashboard action. Keep a private independent copy of the original key and the latest recovery file. Keep at least one backup copy outside the Railway account as well.

## Validation and release check

Automated checks cover self-password change, real login with the new password, old-password rejection, revocation of all sessions, cross-origin and wrong-password rejection, bcrypt byte-length limits, account rate limiting, staff rejection for backup management, two rotations with retained legacy/new recovery, encrypted keyring storage and wrong wrapping-key rejection.

After deployment the owner should change their password themselves, confirm the new login, rotate/download keys, run a backup and rehearse restoring that new hosted backup with the downloaded recovery file. Local tests do not replace this hosted check.
