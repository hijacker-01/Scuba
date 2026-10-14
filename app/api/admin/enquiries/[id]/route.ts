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
    if (!ObjectId.isValid(id)) throw new ApiError(400, 'INVALID_ID', 'Invalid enquiry');
    const { status } = await parse(request, z.strictObject({ status: z.enum(['new', 'contacted', 'closed']) }));
    const db = await database();
    const result = await db.collection('enquiries').updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } });
    if (!result.matchedCount) throw new ApiError(404, 'NOT_FOUND', 'Enquiry not found');
    await db.collection('audit_events').insertOne({ action: 'enquiry_status', enquiryId: id, status, staffId: staff.staffId, createdAt: new Date() });
    return NextResponse.json({ success: true });
  } catch (error) { return respond(error); }
}
