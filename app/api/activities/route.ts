import { NextResponse } from 'next/server';
import { catalog } from '@/lib/catalog';
import { database } from '@/lib/db';

export async function GET() {
  try {
    const configured = await (await database()).collection('products').find({ published: true }).project({ _id: 0 }).toArray();
    return NextResponse.json({ activities: catalog.map(item => ({ ...item, ...(configured.find(p => p.slug === item.slug) || {}), bookable: configured.some(p => p.slug === item.slug) })) });
  } catch { return NextResponse.json({ activities: catalog.map(item => ({ ...item, bookable: false })) }); }
}
