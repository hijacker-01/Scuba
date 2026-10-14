import { brochurePrices, catalog } from './catalog';
import { database } from './db';
export async function publicCatalog() {
  const defaults = catalog.map(item => ({ ...item, pricePaise: brochurePrices[item.slug] ?? null }));
  if (!process.env.MONGODB_URI || /placeholder|xxxxx|your_|replace/i.test(process.env.MONGODB_URI)) return defaults;
  try {
    const products = await (await database()).collection('products').find().toArray();
    return defaults.map(item => { const product = products.find(p => p.slug === item.slug); return product ? { ...item, name: product.published ? product.name : item.name, pricePaise: product.published ? product.pricePaise : null } : item; });
  } catch { return defaults; }
}
