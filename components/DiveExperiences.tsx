import Image from 'next/image';
import Link from 'next/link';
import { catalog } from '@/lib/catalog';

export default function DiveExperiences({ items = catalog }: { items?: readonly { slug: string; name: string; kind: string; pricePaise?: number | null }[] }) {
  const discover = items.find(p => p.slug === 'discover-scuba');
  return <section id="activities" className="brochure-experiences" aria-labelledby="experiences-title">
    <div className="container">
      <div className="brochure-heading" data-reveal-group>
        <p className="section-kicker" data-reveal>01 / THE UNDERWATER EXPERIENCE</p>
        <h2 id="experiences-title" data-reveal>Find your way<br /><em>into the blue.</em></h2>
        <p data-reveal>Discover scuba diving, explore by boat or shore, or spend a day enjoying the waters of the Andaman Islands.</p>
      </div>
      <div className="dive-feature">
        <figure className="brochure-art" data-media-reveal><Image src="/brochure/scuba-promotion.png" alt="Havelock Dive Club scuba diving promotional artwork from the brochure" width={601} height={601} sizes="(max-width: 768px) 90vw, 45vw" /><figcaption>Club promotional artwork. Ask the team for current prices and offers.</figcaption></figure>
        <div className="dive-feature__copy" data-reveal-group>
          <span className="section-kicker" data-reveal>YOUR FIRST DIVE</span>
          <h3 data-reveal>{discover?.name || 'Discover Scuba Diving'}</h3>
          {discover?.pricePaise && <p className="brochure-price" data-reveal>From ₹{(discover.pricePaise / 100).toLocaleString('en-IN')} per person</p>}
          <p data-reveal>A first look at a different world. Meet our professional instructors and ask about a diving experience suited to your starting point.</p>
          <Link className="editorial-link" href="/activities/discover-scuba" data-reveal>Details and availability <span aria-hidden="true">↗</span></Link>
          <div className="dive-feature__aside" data-reveal><span>ALREADY A DIVER?</span><p>Explore boat and shore diving, or ask the team about your next course.</p></div>
        </div>
      </div>
      <div className="dive-feature dive-feature--reverse">
        <figure className="brochure-art brochure-art--boat" data-media-reveal><Image src="/brochure/boat-dive-promotion.png" alt="Havelock Dive Club professional boat dive promotional artwork from the brochure" width={801} height={601} sizes="(max-width: 768px) 90vw, 45vw" /><figcaption>Boat dive promotion from the brochure. Current availability and prices are confirmed separately.</figcaption></figure>
        <div className="dive-feature__copy" data-reveal-group><span className="section-kicker" data-reveal>MORE OF THE ANDAMAN SEA</span><h3 data-reveal>Choose your adventure.</h3><p data-reveal>The brochure brings together diving and other island experiences. Find the activity you’re interested in and speak to the team about dates.</p>
          <div className="activity-directory">{items.filter(item => item.kind === 'activity' && item.slug !== 'discover-scuba').map((item, index) => <Link href={`/activities/${item.slug}`} key={item.slug} data-reveal><span className="activity-directory__number">{String(index + 2).padStart(2, '0')}</span><span>{item.name}{item.pricePaise && <small className="activity-price">From ₹{(item.pricePaise / 100).toLocaleString('en-IN')} per person</small>}</span><span aria-hidden="true">↗</span></Link>)}</div>
        </div>
      </div>
    </div>
  </section>;
}
