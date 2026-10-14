import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth';
import { ApiError, parse, respond, sameOrigin } from '@/lib/api';
import { database } from '@/lib/db';

const schema = z.strictObject({ productSlug: z.string().min(1), startAt: z.iso.datetime({ offset: true }), endAt: z.iso.datetime({ offset: true }), capacity: z.number().int().min(1).max(100), pricePaise: z.number().int().min(100), published: z.boolean() });
export async function POST(request: Request) {
  try {
    sameOrigin(request); await requireStaff();
    const input = await parse(request, schema);
    const startAt = new Date(input.startAt), endAt = new Date(input.endAt);
    if (startAt <= new Date() || endAt <= startAt) throw new ApiError(400, 'INVALID_DATE', 'Use future start and later end dates');
    const db = await database();
    if (!await db.collection('products').findOne({ slug: input.productSlug, published: true })) throw new ApiError(409, 'UNAVAILABLE', 'Publish the product first');
    const result = await db.collection('slots').insertOne({ ...input, startAt, endAt, reserved: 0, closed: false, createdAt: new Date() });
    return NextResponse.json({ id: String(result.insertedId) }, { status: 201 });
  } catch (error) { return respond(error); }
}
