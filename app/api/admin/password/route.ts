import { NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';
import { z } from 'zod';
import { ApiError, parse, respond, sameOrigin } from '@/lib/api';
import { confirmCurrentPassword } from '@/lib/account-security';
import { withTransaction } from '@/lib/db';

const input = z.strictObject({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(16).max(72), confirmPassword: z.string().min(16).max(72) });
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const body = await parse(request, input);
    if (body.newPassword !== body.confirmPassword) throw new ApiError(400, 'PASSWORD_MISMATCH', 'New passwords do not match.');
    if (Buffer.byteLength(body.newPassword, 'utf8') > 72) throw new ApiError(400, 'PASSWORD_LENGTH', 'Use a password with at most 72 UTF-8 bytes.');
    const staff = await confirmCurrentPassword(request, body.currentPassword);
    if (await compare(body.newPassword, staff.passwordHash)) throw new ApiError(400, 'PASSWORD_UNCHANGED', 'Choose a different password.');
    const passwordHash = await hash(body.newPassword, 12);
    await withTransaction(async (db, session) => {
      const result = await db.collection('staff').updateOne({ _id: staff._id, active: true, passwordHash: staff.passwordHash }, { $set: { passwordHash, updatedAt: new Date() }, $inc: { sessionVersion: 1 } }, { session });
      if (result.matchedCount !== 1) throw new ApiError(409, 'ACCOUNT_CHANGED', 'Account changed. Sign in again before retrying.');
      await db.collection('staff_sessions').deleteMany({ staffId: staff._id }, { session });
      await db.collection('audit_events').insertOne({ action: 'own_password_changed', staffId: staff._id, createdAt: new Date() }, { session });
    });
    const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.delete('staff_session');
    return response;
  } catch (error) { return respond(error); }
}
