import { compare } from 'bcryptjs';
import { requireStaff } from './auth';
import { ApiError } from './api';
import { database } from './db';
import { rateLimit } from './rate-limit';

export async function confirmCurrentPassword(request: Request, password: string, ownerOnly = false) {
  const account = await requireStaff();
  if (ownerOnly && account.role !== 'owner') throw new ApiError(403, 'FORBIDDEN', 'Owner access required');
  await rateLimit(request, 'account-security', 10);
  await rateLimit(request, 'account-security-account', 5, String(account.staffId));
  const staff = await (await database()).collection('staff').findOne({ _id: account.staffId, active: true });
  if (!staff || (staff.sessionVersion || 0) !== (account.sessionVersion || 0) || !await compare(password, staff.passwordHash)) {
    throw new ApiError(401, 'INVALID_PASSWORD', 'Current password is incorrect or your session has changed.');
  }
  return staff;
}
