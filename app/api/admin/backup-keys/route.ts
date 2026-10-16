import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Document } from 'mongodb';
import { ApiError, parse, respond, sameOrigin } from '@/lib/api';
import { confirmCurrentPassword } from '@/lib/account-security';
import { withTransaction } from '@/lib/db';
import { encryptionKey } from '@/backup-service/crypto.mjs';
import { keyringSetting, recoveryFile, rotatedKeys } from '@/backup-service/keyring.mjs';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const body = await parse(request, z.strictObject({ currentPassword: z.string().min(1).max(200), action: z.enum(['rotate', 'export']) }));
    const owner = await confirmCurrentPassword(request, body.currentPassword, true);
    if (!process.env.BACKUP_ENCRYPTION_KEY) throw new ApiError(503, 'BACKUP_SETUP', 'Backup key management requires its one-time server setup.');
    const root = encryptionKey(process.env.BACKUP_ENCRYPTION_KEY);
    const file = await withTransaction(async (db, session) => {
      const currentOwner = await db.collection('staff').findOne({ _id: owner._id, active: true, role: 'owner', passwordHash: owner.passwordHash }, { session });
      if (!currentOwner) throw new ApiError(401, 'ACCOUNT_CHANGED', 'Account changed. Sign in again.');
      let stored: Document | null = await db.collection('settings').findOne({ key: keyringSetting }, { session });
      if (body.action === 'rotate') {
        const updated = rotatedKeys(stored, root);
        await db.collection('settings').updateOne({ key: keyringSetting }, { $set: updated }, { upsert: true, session });
        stored = updated;
      }
      const exported = recoveryFile(stored, root);
      await db.collection('audit_events').insertOne({ action: body.action === 'rotate' ? 'backup_key_rotated' : 'backup_keys_exported', staffId: owner._id, createdAt: new Date() }, { session });
      return exported;
    });
    return new NextResponse(JSON.stringify(file, null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="havelock-backup-recovery-keys.json"', 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) { return respond(error); }
}
