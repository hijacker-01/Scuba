import { createHash } from 'crypto';
import { ApiError } from './api';
import { database } from './db';

export async function rateLimit(request: Request, route: string, limit = 20) {
  const db = await database();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const minute = Math.floor(Date.now() / 60000);
  const key = createHash('sha256').update(`${route}:${ip}:${minute}`).digest('hex');
  const result = await db.collection('rate_limits').findOneAndUpdate({ _id: key as never }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((minute + 2) * 60000) } }, { upsert: true, returnDocument: 'after' });
  if ((result?.count || 0) > limit) throw new ApiError(429, 'RATE_LIMITED', 'Too many requests; please try again later');
}
