import Image from 'next/image';

export default function AboutClub({ about, foundingYear = 2017 }: { about?: string; foundingYear?: number }) {
  return <section id="about" className="club-story" aria-labelledby="club-story-title">
    <div className="container club-story__layout" data-reveal-group>
      <div className="club-story__visual" data-media-reveal>
        <Image src="/images/gallery3.jpg" alt="An underwater moment in the Andaman Islands" width={540} height={650} sizes="(max-width: 768px) 90vw, 42vw" />
        <div className="club-story__year"><span>OUR STORY BEGAN IN</span><strong>{foundingYear}</strong><span>HAVELOCK ISLAND</span></div>
      </div>
      <div className="club-story__copy">
        <p className="section-kicker" data-reveal>MEET HAVELOCK DIVE CLUB</p>
        <h2 id="club-story-title" data-reveal>An island we call home.<br /><em>A world to discover.</em></h2>
        <p className="club-story__lead" data-reveal>Since {foundingYear}, we’ve been sharing the magic beneath Havelock Island’s turquoise waters.</p>
        <p data-reveal>{about || 'Havelock Dive Club is a scuba diving centre in the Andaman Islands, offering safe, fun, and professional experiences for beginners and experienced divers. Our instructors help you explore vibrant coral reefs and marine life, with safety at the heart of your time underwater.'}</p>
        <div className="club-story__details" data-reveal>
          <div><span>YOUR GUIDES</span><h3>Professional instructors</h3></div>
          <div><span>YOUR EXPERIENCE</span><h3>First dive or next adventure</h3></div>
        </div>
        <a className="club-story__link" href="#activities" data-reveal>Find your underwater adventure <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </section>;
}
