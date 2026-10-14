import Image from 'next/image';

export default function Gallery() {
  const images = [
    { src: '/images/gallery1.jpg', title: 'Underwater view', location: 'Andaman Islands' },
    { src: '/images/gallery4.jpg', title: 'Underwater world', location: 'Andaman Islands' },
    { src: '/images/gallery5.jpg', title: 'Scuba diving', location: 'Andaman Islands' },
  ];

  return (
    <section id="gallery" className="gallery">
      <div className="container" data-reveal-group>
        <div className="section-header" data-reveal>
          <span className="section-badge">LIFE BELOW THE SURFACE</span>
          <h2 className="section-title">A glimpse of the blue.</h2>
          <p className="section-description">
            Underwater moments from the club’s existing gallery.
          </p>
        </div>
        <div className="gallery-grid">
          {images.map((img) => (
            <div className="gallery-card" data-media-reveal key={img.title}>
              <Image src={img.src} alt={img.title} width={540} height={360} />
              <div className="gallery-overlay">
                <h3>{img.title}</h3>
                <p>{img.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
