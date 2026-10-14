import Image from 'next/image';
import Link from 'next/link';
import { catalog } from '@/lib/catalog';

export default function DiveCourses({ items = catalog }: { items?: readonly { slug: string; name: string; kind: string; pricePaise?: number | null }[] }) {
  return <section id="courses" className="brochure-courses" aria-labelledby="courses-title"><div className="container">
    <div className="course-intro" data-reveal-group><div><p className="section-kicker" data-reveal>02 / KEEP EXPLORING</p><h2 id="courses-title" data-reveal>Your next chapter.<br /><em>Underwater.</em></h2></div><p data-reveal>From Open Water to Divemaster, Havelock Dive Club offers certification courses for your next stage. Ask our team about the programme, requirements, and available dates.</p></div>
    <div className="course-directory" data-reveal-group>{items.filter(item => item.kind === 'course').map((item, index) => <Link href={`/activities/${item.slug}`} key={item.slug} data-reveal><span>0{index + 1}</span><div><h3>{item.name}</h3>{item.pricePaise && <small className="activity-price">From ₹{(item.pricePaise / 100).toLocaleString('en-IN')} per person</small>}</div><span aria-hidden="true">↗</span></Link>)}</div>
    <details className="course-references"><summary>Course resources from our brochure <span aria-hidden="true">+</span></summary><p>The brochure includes PADI and SSI reference images. Speak to the club to confirm the certification organisation and programme for your course.</p><div className="course-references__images"><figure><Image src="/brochure/padi-reference.png" alt="PADI reference screenshot included in the club brochure" width={601} height={401} sizes="(max-width: 768px) 90vw, 40vw" /><figcaption>PADI reference image</figcaption></figure><figure><Image src="/brochure/ssi-reference.png" alt="SSI reference screenshot included in the club brochure" width={601} height={400} sizes="(max-width: 768px) 90vw, 40vw" /><figcaption>SSI reference image</figcaption></figure></div></details>
  </div></section>;
}
