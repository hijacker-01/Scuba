'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const logoSvg = (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#home', label: 'Home' },
    { href: '#features', label: 'About' },
    { href: '#courses', label: 'Courses' },
    { href: '#gallery', label: 'Gallery' },
    { href: '#testimonials', label: 'Reviews' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <>
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-inner">
          <Link href="#home" className="navbar-logo">
            {logoSvg}
            <span>Havelock Dive</span>
          </Link>
          <ul className="navbar-nav">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
          <div className="navbar-cta">
            <a href="#contact" className="btn btn-primary">Book a Dive</a>
            <button className="navbar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </header>
      {mobileOpen && (
        <div className="mobile-menu active">
          <nav>
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>{link.label}</a>
            ))}
            <a href="#contact" className="btn btn-primary" onClick={() => setMobileOpen(false)}>Book a Dive</a>
          </nav>
        </div>
      )}
    </>
  );
}
