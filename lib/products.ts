import { createHash } from 'crypto';
import { catalog, brochurePrices } from './catalog';
import { database } from './db';

export const termsVersion = (terms: string) => createHash('sha256').update(terms).digest('hex');
export async function seedBrochureProducts() {
  const db = await database();
  for (const item of catalog) await db.collection('products').updateOne({ slug: item.slug }, { $setOnInsert: { ...item, description: `${item.name} with Havelock Dive Club on Havelock Island, Andaman Islands. Contact our team to plan your experience.`, duration: '', inclusions: '', prerequisites: '', meetingPoint: '', terms: '', pricePaise: brochurePrices[item.slug] ?? null, published: false, createdAt: new Date() } }, { upsert: true });
}
