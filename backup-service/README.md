# Havelock encrypted database backups

Status: code prepared and tested locally. Railway bucket upload, daily scheduling and a restore of a real hosted backup must still be verified.

This standalone service backs up the single application database with a MongoDB snapshot transaction, preserves BSON values and indexes, compresses and encrypts the result using AES-256-GCM, uploads it to a private S3-compatible bucket, and downloads the object to verify its hash. It does not write application data. It runs once and exits. Only ordinary collections are supported, with a 50 MiB serialized document limit. It fails instead of silently skipping unsupported collections or schema changes. Use streaming MongoDB tools for larger or more complex databases.

## Railway setup

1. In the SAME project and production environment, create a Storage Bucket called `club-backups`. Use a suitable nearby available region. The service uses the bucket's Credentials tab values; bucket display names differ from actual S3 names. Buckets and job compute are usage billed.
2. Add a new service from the Scuba repository. Name it `database-backup`. Set Root Directory to `/backup-service`. Use its Dockerfile (within that root), clear any inherited Railway Config File path, web build override, pre-deploy command and HTTP healthcheck. Start Command is `node backup.mjs`. Do not create a public domain or attach a volume. Set Restart Policy to Never. This service must be in the same Railway project/environment as MongoDB for private networking.
3. Add variables from the example below. Generate a random 32-byte encryption key, encoded as 64 hexadecimal characters. Store a second copy in the owner's password manager, outside Railway and GitHub. Do not commit actual keys. This key is essential for recovery.
4. Set Cron Schedule to `0 21 * * *` (daily at approximately 02:30 India time; Railway uses UTC). Deploy/run once and require the log event `backup_verified` with the uploaded object name and collection count. A completed cron run is expected to stop; it should not stay Online.
5. Independently verify restoration as described below. A successful local test or object upload alone does not mark production disaster recovery complete. Configure Railway failure/deployment notifications for the responsible operator and check the most recent completed backup daily.

### Variables for database-backup only

```env
MONGODB_URI=${{Scuba.MONGODB_URI}}
MONGODB_DB=${{Scuba.MONGODB_DB}}
BACKUP_BUCKET=${{club-backups.BUCKET}}
BACKUP_ENDPOINT=${{club-backups.ENDPOINT}}
AWS_REGION=${{club-backups.REGION}}
AWS_ACCESS_KEY_ID=${{club-backups.ACCESS_KEY_ID}}
AWS_SECRET_ACCESS_KEY=${{club-backups.SECRET_ACCESS_KEY}}
BACKUP_ENCRYPTION_KEY=PASTE_A_NEW_64_CHARACTER_HEX_KEY
```

For older path-style buckets only, add `BACKUP_PATH_STYLE=true` if the Credentials tab requires it. Do not reveal MongoDB/bucket credentials in screenshots or logs.

No existing backups are overwritten or automatically deleted. Review storage growth monthly. These backups are separate from the MongoDB volume but remain within the same Railway account; keep periodic encrypted copies outside the project for account/project loss. Daily scheduling can lose up to roughly one day's changes after the latest successful run; failed jobs increase this window.

## Restore rehearsal of a hosted backup

### Download an encrypted backup

Run `node download-link.mjs` within the deployed backup service with its existing bucket variables. It selects the latest dated `.hdcbk` object across all listing pages, checks its backup metadata and prints `backup_download_link` with a `url` valid for 10 minutes. To choose an older backup, set `BACKUP_OBJECT_KEY` to its exact object name. This command needs bucket list/read permission, but no MongoDB connection or encryption key. Treat the URL as temporary access to the encrypted file: anyone with the link can download it until expiration. It does not make the bucket public or disclose the decryption key.

For Railway cron services without an interactive shell, change the Start Command to `node backup.mjs --download-link` and use **Run now**. This preserves the normal backup operation, and prints a temporary download URL after `backup_verified`. Copy only the `url` value, without JSON quotes, into the browser. The signed response requests a file attachment. Restore the normal `node backup.mjs` command afterward to stop emitting links on future scheduled backups. A link failure does not turn a successfully verified backup into a failed backup.

Use a NEW isolated MongoDB service with no application, email worker or production data attached. Reuse the backup service image in a temporary verification job, keep its bucket credentials and key, and add:

- `RESTORE_TEST_URI`: isolated MongoDB connection URI. Do not reference production MongoDB.
- `BACKUP_OBJECT_KEY`: the exact `havelock-backups/...hdcbk` name from the successful backup log.

Change that temporary job's Start Command to `node verify.mjs`, with no cron schedule or HTTP healthcheck. It downloads and decrypts that object, restores into a randomly named `havelock_restore_verify_...` database, verifies record hashes and indexes, drops only that disposable database, and exits. Require a `restore_verified` event. Production data is never overwritten. Remove the temporary verification service/test database only after the operator has recorded successful evidence and confirmed they are the test resources.

This verifier is a rehearsal, not an automatic disaster-recovery command. For a real incident, stop changes, preserve newer records, restore into an isolated environment, review data and staff access, and approve the cutover separately.

## Local validation

`npm ci` then `npm test`: encryption round trip with BSON fidelity, wrong key/tampering rejection, random nonce, invalid format/key, safe restore target, storage readback, corrupted readback. A local one-member replica-set snapshot/restore test additionally verifies records, unique indexes and source preservation. Docker image build and Railway bucket access require deployment validation.
