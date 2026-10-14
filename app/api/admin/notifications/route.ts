import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth';
import { ApiError, parse, respond, sameOrigin } from '@/lib/api';
import { database } from '@/lib/db';
export async function POST(request: Request) {
  try {
    sameOrigin(request); const staff = await requireStaff(); const { id } = await parse(request, z.strictObject({ id: z.string().max(200) })); const db = await database();
    const result = await db.collection('notification_jobs').updateOne({ _id: id as never, status: 'failed', $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] }, { $set: { status: 'pending', attempts: 0, nextAttemptAt: new Date() } });
    if (!result.modifiedCount) throw new ApiError(409, 'INVALID_JOB', 'Only failed, unexpired messages can be retried');
    await db.collection('audit_events').insertOne({ action: 'retry_email', jobId: id, staffId: staff.staffId, createdAt: new Date() }); return NextResponse.json({ success: true });
  } catch (error) { return respond(error); }
}
