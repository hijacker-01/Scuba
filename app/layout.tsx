import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsApp';

export const metadata: Metadata = {
  title: 'Havelock Dive Club | Scuba Diving in Andaman',
  description: 'Discover the underwater paradise of Havelock Island. PADI 5-Star dive center offering scuba diving courses, certifications, and guided dives.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <Footer />
        <WhatsAppFab />
      </body>
    </html>
  );
}
