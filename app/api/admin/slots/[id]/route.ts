import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth';
import { ApiError, parse, respond, sameOrigin } from '@/lib/api';
import { database } from '@/lib/db';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request); const staff = await requireStaff();
    const { id } = await context.params;
    if (!ObjectId.isValid(id)) throw new ApiError(400, 'INVALID_ID', 'Invalid slot');
    const changes = await parse(request, z.strictObject({ closed: z.boolean().optional(), published: z.boolean().optional(), capacity: z.number().int().min(1).max(100).optional(), pricePaise: z.number().int().min(100).optional(), startAt: z.iso.datetime({ offset: true }).optional(), endAt: z.iso.datetime({ offset: true }).optional() }).refine(value => Object.keys(value).length > 0 && Boolean(value.startAt) === Boolean(value.endAt)));
    const db = await database();
    const filter: Record<string, unknown> = { _id: new ObjectId(id) };
    if (changes.capacity !== undefined) filter.reserved = { $lte: changes.capacity };
    const dates = changes.startAt ? { startAt: new Date(changes.startAt), endAt: new Date(changes.endAt!) } : {};
    if (dates.startAt && (dates.startAt <= new Date() || dates.endAt! <= dates.startAt)) throw new ApiError(400, 'INVALID_DATE', 'Use future start and later end dates');
    if (dates.startAt) filter.reserved = 0;
    const result = await db.collection('slots').updateOne(filter, { $set: { ...changes, ...dates, updatedAt: new Date() } });
    if (!result.matchedCount) throw new ApiError(409, 'INVALID_SLOT', 'Check the departure and reserved seats. Reschedule existing bookings individually before changing departure times.');
    await db.collection('audit_events').insertOne({ action: 'update_slot', changes, slotId: id, staffId: staff.staffId, createdAt: new Date() });
    return NextResponse.json({ success: true });
  } catch (error) { return respond(error); }
}
