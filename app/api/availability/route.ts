import { NextResponse } from 'next/server';
import { ApiError, respond } from '@/lib/api';
import { catalog } from '@/lib/catalog';
import { releaseExpired } from '@/lib/booking';
import { database } from '@/lib/db';
import { termsVersion } from '@/lib/products';

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get('activity');
    if (!slug || !catalog.some(p => p.slug === slug)) throw new ApiError(400, 'INVALID_ACTIVITY', 'Choose a listed activity');
    await releaseExpired();
    const db = await database();
    const product = await db.collection('products').findOne({ slug, published: true });
    if (!product?.terms || !product.duration || !product.inclusions || !product.prerequisites || !product.meetingPoint) return NextResponse.json({ slots: [], product: null });
    const slots = await db.collection('slots').find({ productSlug: slug, published: true, closed: { $ne: true }, startAt: { $gt: new Date() } }).sort({ startAt: 1 }).limit(100).toArray();
    return NextResponse.json({ product: { name: product.name, terms: product.terms, termsVersion: termsVersion(product.terms) }, slots: slots.filter(s => s.capacity > (s.reserved || 0)).map(s => ({ id: String(s._id), startAt: s.startAt, endAt: s.endAt, pricePaise: s.pricePaise, seats: s.capacity - (s.reserved || 0) })) });
  } catch (error) { return respond(error); }
}
