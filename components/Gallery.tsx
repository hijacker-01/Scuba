export default function Gallery() {
  const images = [
    { src: '/images/gallery1.jpg', title: 'Coral Reef', location: 'Havelock Island' },
    { src: '/images/download.jpg', title: 'Swimming with the Fishes', location: 'Neil Island' },
    { src: '/images/gallery3.jpg', title: 'Dive Point', location: 'South Bay' },
    { src: '/images/gallery4.jpg', title: 'Underwater World', location: 'Lighthouse' },
    { src: '/images/gallery5.jpg', title: 'Rescue Diver', location: 'Mac Point' },
    { src: '/images/gallery6.jpg', title: 'Sunset Dive', location: 'Bharatpur' },
  ];

  return (
    <section id="gallery" className="gallery">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Gallery</span>
          <h2 className="section-title">Explore Our Dive Sites</h2>
          <p className="section-description">
            Browse through stunning moments from our dive sites across the Andaman Islands.
          </p>
        </div>
        <div className="gallery-grid">
          {images.map((img) => (
            <div className="gallery-card" key={img.title}>
              <img src={img.src} alt={img.title} loading="lazy" />
              <div className="gallery-overlay">
                <h3>{img.title}</h3>
                <p><i className="fas fa-map-marker-alt"></i> {img.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
