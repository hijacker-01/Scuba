import { notFound } from 'next/navigation';
import Link from 'next/link';
import { catalog, brochurePrices } from '@/lib/catalog';
import { database } from '@/lib/db';

export default async function Activity({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = catalog.find(i => i.slug === slug);
  if (!entry) notFound();
  const product = await database().then(db => db.collection('products').findOne({ slug, published: true })).catch(() => null);
  return <main className="section page-main"><div className="container detail"><Link href="/#activities">← All activities</Link><h1>{product?.name || entry.name}</h1>{product ? <><p>{product.description}</p>{product.pricePaise && <p className="total">From ₹{(product.pricePaise / 100).toLocaleString('en-IN')} per person. Your departure price is shown at checkout.</p>}<dl><dt>Duration</dt><dd>{product.duration}</dd><dt>Included</dt><dd>{product.inclusions}</dd><dt>Prerequisites</dt><dd>{product.prerequisites}</dd><dt>Meeting point</dt><dd>{product.meetingPoint}</dd><dt>Terms</dt><dd>{product.terms}</dd></dl><Link className="btn btn-primary" href={`/book?activity=${slug}`}>Check availability</Link></> : <>{brochurePrices[slug] && <p>Brochure price: ₹{(brochurePrices[slug] / 100).toLocaleString('en-IN')} per person. Contact the club for current availability.</p>}<p>Dates and activity details are being prepared by our team.</p><Link className="btn btn-primary" href="/#contact">Ask about this activity</Link></>}</div></main>;
}

