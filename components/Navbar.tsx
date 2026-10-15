'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar({ clubName = 'Havelock Dive Club' }: { clubName?: string }) {
  const [open, setOpen] = useState(false);
  const links = [{ href: '/#home', text: 'Home' }, { href: '/#activities', text: 'Activities' }, { href: '/#courses', text: 'Courses' }, { href: '/#travel', text: 'Travel & transport' }, { href: '/#gallery', text: 'Gallery' }, { href: '/#contact', text: 'Contact' }];
  return <header className="site-nav"><div className="container nav-inner"><Link className="brand" href="/"><Image className="brand-logo" src="/brochure/club-logo-transparent.png" alt="" width={64} height={60} /> <span>{clubName}</span></Link><button type="button" className="menu-button" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>☰</button><nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.text}</Link>)}<Link className="nav-book" href="/book" onClick={() => setOpen(false)}>Enquire now</Link></nav></div></header>;
}



