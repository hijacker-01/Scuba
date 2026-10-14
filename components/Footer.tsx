import Link from 'next/link';

const logoSvg = (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
    <circle cx="20" cy="20" r="18" fill="#0a2540" />
    <path d="M12 22C12 18 15 14 20 14C25 14 28 18 28 22C28 26 25 30 20 30C15 30 12 26 12 22Z" fill="#00c3ff" />
    <ellipse cx="20" cy="22" rx="8" ry="5" fill="#ffffff" />
    <path d="M8 20L6 18" stroke="#00c3ff" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 20L34 18" stroke="#00c3ff" strokeWidth="2" strokeLinecap="round" />
    <path d="M10 24L8 26" stroke="#00c3ff" strokeWidth="2" strokeLinecap="round" />
    <path d="M30 24L32 26" stroke="#00c3ff" strokeWidth="2" strokeLinecap="round" />
    <circle cx="20" cy="18" r="2" fill="#0a2540" />
  </svg>
);

const waveSvg = (
  <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
    <path d="M0 50C360 100 720 0 1080 50C1260 75 1380 50 1440 50V100H0V50Z" fill="#0a2540" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="footer">
      {waveSvg}
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="#home" className="navbar-logo" style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/images/club-logo.jpg" alt="Havelock Dive Club" style={{ width: 360, height: 360, borderRadius: '50%', objectFit: 'cover' }} />
              <span>Havelock Dive Club</span>
            </Link>
            <p>Your premier destination for scuba diving in the Andaman Islands. Join us for unforgettable underwater experiences.</p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#features">About</a></li>
              <li><a href="#courses">Courses</a></li>
              <li><a href="#gallery">Gallery</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Courses</h4>
            <ul>
              <li><a href="#courses">Open Water</a></li>
              <li><a href="#courses">Advanced</a></li>
              <li><a href="#courses">Rescue</a></li>
              <li><a href="#courses">Dive Master</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:info@havelockdiveclub.com">info@havelockdiveclub.com</a></li>
              <li><a href="tel:+919876543210">+91 98765 43210</a></li>
              <li><a href="#contact">Visit Us</a></li>
              <li><a href="#">Havelock Island, Andaman</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Havelock Dive Club. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
