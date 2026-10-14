import Link from 'next/link';
import { clubSettings } from '@/lib/settings';
export default async function Footer() {
  const settings = await clubSettings();
  return <footer className="site-footer"><div className="container footer-content"><div><strong>{settings.clubName}</strong><p>{settings.location}</p><p>Established {settings.foundingYear}</p></div><div><a href={`tel:${settings.phone}`}>{settings.phone}</a><a href={`tel:${settings.alternatePhone}`}>{settings.alternatePhone}</a><a href={`https://www.instagram.com/${settings.instagram}/`} target="_blank" rel="noreferrer">@{settings.instagram}</a></div><div><a href="/brochure/Havelock_Dive_Club_Brochure.pptx" download>Download club brochure (.pptx)</a><Link href="/admin/login">Owner / staff login</Link><Link href="/recover">Recover booking</Link><Link href="/policies">Privacy & cancellation policies</Link></div></div></footer>;
}

