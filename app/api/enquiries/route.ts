import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parse, respond, sameOrigin } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { queueEmail } from '@/lib/email';
import { defaultSettings } from '@/lib/settings';
import { withTransaction } from '@/lib/db';

const input = z.strictObject({ name: z.string().trim().min(2).max(100), email: z.email(), phone: z.string().trim().max(20), service: z.enum(['Diving', 'Courses']), message: z.string().trim().min(5).max(2000) });
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const data = await parse(request, input);
    await rateLimit(request, 'enquiry', 10);
    await withTransaction(async (db, session) => {
      const result = await db.collection('enquiries').insertOne({ ...data, createdAt: new Date(), status: 'new' }, { session });
      const settings = await db.collection('settings').findOne({ key: 'club' }, { session });
      if (settings?.enquiryEmails ?? defaultSettings.enquiryEmails) await queueEmail(db, `enquiry:${result.insertedId}:customer`, data.email, 'We received your enquiry — Havelock Dive Club', `Hello ${data.name},\nWe received your enquiry about ${data.service}. Our team will contact you.\nThis is an enquiry acknowledgement, not a booking confirmation.\nFor help call ${settings?.phone || defaultSettings.phone}.`, session);
      if (process.env.BOOKINGS_NOTIFY_EMAIL) await queueEmail(db, `enquiry:${result.insertedId}:staff`, process.env.BOOKINGS_NOTIFY_EMAIL, 'New diving/course enquiry', `${data.name}\n${data.email}\n${data.phone}\n${data.service}\n${data.message}`, session);
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) { return respond(error); }
}
