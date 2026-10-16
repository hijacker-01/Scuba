import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { ApiError } from './api';
import { database } from './db';

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('hex');
export async function requireStaff() {
  const token = (await cookies()).get('staff_session')?.value;
  if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Staff sign in required');
  const db = await database();
  const session = await db.collection('staff_sessions').findOne({ tokenHash: tokenHash(token), expiresAt: { $gt: new Date() } });
  if (!session) throw new ApiError(401, 'UNAUTHORIZED', 'Staff session expired');
  const staff = await db.collection('staff').findOne({ _id: session.staffId, active: true });
  if (!staff || (staff.sessionVersion || 0) !== (session.sessionVersion || 0)) throw new ApiError(401, 'UNAUTHORIZED', 'Account access has changed. Sign in again.');
  return { ...session, staffId: staff._id, sessionVersion: staff.sessionVersion || 0, role: staff.role || 'staff', email: staff.email };
}
export async function requireOwner() {
  const staff = await requireStaff();
  if (staff.role !== 'owner') throw new ApiError(403, 'FORBIDDEN', 'Owner access required');
  return staff;
}
