'use client';

import { useState } from 'react';

export default function WhatsAppFab() {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href="https://wa.me/919876543210?text=Hi%20I%20am%20interested%20in%20scuba%20diving%20courses%20at%20Havelock%20Dive%20Club"
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Chat with us on WhatsApp"
      aria-label="Chat with us on WhatsApp"
    >
      <i className="fab fa-whatsapp"></i>
    </a>
  );
}
