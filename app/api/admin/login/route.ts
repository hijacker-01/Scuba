import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { newToken, tokenHash } from '@/lib/auth';
import { ApiError, parse, respond, sameOrigin } from '@/lib/api';
import { database } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await rateLimit(request, 'staff-login', 5);
    const { email, password } = await parse(request, z.strictObject({ email: z.email(), password: z.string().min(1) }));
    const db = await database();
    const staff = await db.collection('staff').findOne({ email: email.toLowerCase(), active: true });
    if (!staff || !await compare(password, staff.passwordHash)) throw new ApiError(401, 'INVALID_LOGIN', 'Invalid email or password');
    const token = newToken();
    await db.collection('staff_sessions').insertOne({ tokenHash: tokenHash(token), staffId: staff._id, sessionVersion: staff.sessionVersion || 0, expiresAt: new Date(Date.now() + 8 * 60 * 60_000), createdAt: new Date() });
    const response = NextResponse.json({ success: true });
    response.cookies.set('staff_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 8 * 60 * 60 });
    return response;
  } catch (error) { return respond(error); }
}
