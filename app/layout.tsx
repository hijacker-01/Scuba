import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsApp';
import { clubSettings } from '@/lib/settings';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Havelock Dive Club | Scuba Diving in Andaman',
  description: 'Explore diving activities and courses on Havelock Island. Explore experiences and contact Havelock Dive Club to arrange your visit.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await clubSettings();
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Navbar clubName={settings.clubName} />
        {children}
        <Footer />
        <WhatsAppFab phone={settings.phone} />
      </body>
    </html>
  );
}
