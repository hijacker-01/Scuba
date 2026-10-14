import Image from 'next/image';

export default function TravelPromotion({ description, phone = '+919434290393', carHireDescription = 'Make room for the journey. Ask the team about a car for your travel dates and the places you want to go.', logisticsDescription = 'Have transport or coordination requirements? Share the details with KK Tours and Travels to discuss the arrangements you need.' }: { description?: string; phone?: string; carHireDescription?: string; logisticsDescription?: string }) {
  return <section id="travel" className="travel-promotion" aria-labelledby="travel-title"><div className="container">
    <div className="travel-topline"><span>BEYOND THE WATER</span><span>FROM THE SAME FAMILY</span></div>
    <div className="travel-layout" data-reveal-group><div className="travel-copy">
      <p className="travel-brand" data-reveal>KK Tours <span>&</span> Travels</p>
      <h2 id="travel-title" data-reveal>Your island days.<br /><em>Connected.</em></h2>
      <p className="travel-intro" data-reveal>{description || 'Part of the same family, KK Tours and Travels helps with Andaman travel packages, transport, and bookings. Ask about car hire and logistics to bring your island plans together.'}</p>
      <a className="travel-cta" href={`https://wa.me/${phone.replace(/\D/g, '')}?text=Hello%2C%20I%20would%20like%20to%20enquire%20about%20KK%20Tours%20and%20Travels%20services.`} target="_blank" rel="noopener noreferrer" data-reveal>Enquire about your journey <span aria-hidden="true">↗</span></a>
      <p className="travel-note" data-reveal>Share your dates and requirements. The team will confirm availability and a quote.</p>
    </div><div className="travel-visual"><figure className="travel-scene" data-media-reveal>
      <div className="travel-scene__image"><Image src="/brochure/kk-coastal-scene.png" alt="Illustrative coastal scene with a wooden boat, turquoise water and a palm-lined island shore" width={1536} height={1024} sizes="(max-width: 768px) 90vw, (max-width: 1200px) 42vw, 500px" /></div>
      <figcaption><span>THE ISLAND, BEYOND YOUR DIVE</span><span>Coastal illustration</span></figcaption>
    </figure><details className="travel-source"><summary>View KK Tours and Travels brochure image <span aria-hidden="true">+</span></summary><div><Image src="/brochure/travel-reference.png" alt="Original KK Tours and Travels website screenshot supplied in the club brochure" width={801} height={501} sizes="(max-width: 768px) 90vw, 500px" /><p>Original reference from the club brochure. Contact the team for current travel packages and prices.</p></div></details></div></div>
    <div className="travel-services" data-reveal-group>
      <article data-reveal><span className="travel-number">01 / ON THE ROAD</span><h3>Car hire</h3><p>{carHireDescription}</p><a href={`https://wa.me/${phone.replace(/\D/g, '')}?text=Hello%2C%20I%20would%20like%20a%20car%20hire%20quote%20from%20KK%20Tours%20and%20Travels.`} target="_blank" rel="noopener noreferrer">Ask about car hire <span aria-hidden="true">↗</span></a></article>
      <article data-reveal><span className="travel-number">02 / BEHIND THE JOURNEY</span><h3>Logistics services</h3><p>{logisticsDescription}</p><a href={`https://wa.me/${phone.replace(/\D/g, '')}?text=Hello%2C%20I%20would%20like%20to%20discuss%20logistics%20services%20with%20KK%20Tours%20and%20Travels.`} target="_blank" rel="noopener noreferrer">Discuss logistics <span aria-hidden="true">↗</span></a></article>
    </div>
  </div></section>;
}


