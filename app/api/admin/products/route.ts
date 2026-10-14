import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth';
import { parse, respond, sameOrigin } from '@/lib/api';
import { catalog } from '@/lib/catalog';
import { database } from '@/lib/db';
import { seedBrochureProducts } from '@/lib/products';

const schema = z.strictObject({ slug: z.enum(catalog.map(p => p.slug)), name: z.string().trim().min(2).max(100), description: z.string().trim().min(20).max(2000), duration: z.string().trim().max(100), inclusions: z.string().trim().max(1000), prerequisites: z.string().trim().max(1000), meetingPoint: z.string().trim().max(200), terms: z.string().trim().max(4000), pricePaise: z.number().int().min(100).max(100000000).nullable(), published: z.boolean() }).refine(p => !p.published || Boolean(p.pricePaise && p.duration && p.inclusions && p.prerequisites && p.meetingPoint && p.terms.length >= 10), { message: 'Complete price, eligibility, meeting point and terms before publishing' });
export async function PUT(request: Request) {
  try {
    sameOrigin(request); const owner = await requireOwner();
    const data = await parse(request, schema);
    await (await database()).collection('products').updateOne({ slug: data.slug }, { $set: { ...data, updatedAt: new Date() } }, { upsert: true });
    await (await database()).collection('audit_events').insertOne({ action: 'save_product', slug: data.slug, published: data.published, staffId: owner.staffId, createdAt: new Date() });
    return NextResponse.json({ success: true });
  } catch (error) { return respond(error); }
}
export async function POST(request: Request) {
  try { sameOrigin(request); await requireOwner(); await seedBrochureProducts(); return NextResponse.json({ success: true }); }
  catch (error) { return respond(error); }
}
