import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth';
import { parse, respond, sameOrigin } from '@/lib/api';
import { database } from '@/lib/db';
import { settingsInput } from '@/lib/settings';
export async function PUT(request: Request) {
  try { sameOrigin(request); const owner = await requireOwner(); const input = await parse(request, settingsInput, 65536); const db = await database(); await db.collection('settings').updateOne({ key: 'club' }, { $set: { ...input, updatedAt: new Date() } }, { upsert: true }); await db.collection('audit_events').insertOne({ action: 'save_settings', staffId: owner.staffId, createdAt: new Date() }); return NextResponse.json({ success: true }); }
  catch (error) { return respond(error); }
}

