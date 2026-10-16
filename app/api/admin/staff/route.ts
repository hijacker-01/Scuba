import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth';
import { ApiError, parse, respond, sameOrigin } from '@/lib/api';
import { withTransaction } from '@/lib/db';
const input = z.strictObject({ email: z.email(), password: z.string().min(16).max(200).optional(), active: z.boolean(), role: z.enum(['owner', 'staff']) });
export async function PUT(request: Request) {
  try {
    sameOrigin(request); const owner = await requireOwner(); const changes = await parse(request, input); const email = changes.email.toLowerCase();
    const passwordHash = changes.password ? await hash(changes.password, 12) : undefined;
    await withTransaction(async (db, session) => {
      const current = await db.collection('staff').findOne({ email }, { session });
      if (String(current?._id) === String(owner.staffId) && changes.password) throw new ApiError(409, 'USE_PASSWORD_FORM', 'Use Change my password to confirm your current password.');
      if (String(current?._id) === String(owner.staffId) && (!changes.active || changes.role !== 'owner')) throw new ApiError(409, 'SELF_ACCESS', 'Keep your own owner account active; use another owner to change it.');
      if (!current && !passwordHash) throw new ApiError(400, 'PASSWORD_REQUIRED', 'A password is required for a new account');
      const updated = await db.collection('staff').findOneAndUpdate({ email }, { $set: { email, active: changes.active, role: changes.role, ...(passwordHash ? { passwordHash } : {}), updatedAt: new Date() }, $inc: { sessionVersion: 1 } }, { upsert: true, returnDocument: 'after', session });
      await db.collection('staff_sessions').deleteMany({ staffId: updated!._id }, { session });
      await db.collection('audit_events').insertOne({ action: 'staff_access_changed', email, staffId: owner.staffId, createdAt: new Date() }, { session });
    });
    return NextResponse.json({ success: true });
  } catch (error) { return respond(error); }
}
