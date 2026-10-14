import { clubSettings } from '@/lib/settings';
export const dynamic = 'force-dynamic';
export default async function Policies() {
  const settings = await clubSettings();
  return <main className="section page-main"><div className="container detail"><h1>Privacy & cancellation policies</h1><h2>Privacy</h2><p className="policy-copy">{settings.privacyPolicy || 'The club has not published its privacy policy yet. Please contact us before submitting personal information.'}</p><h2>Cancellations and refunds</h2><p className="policy-copy">{settings.cancellationPolicy || 'Please contact the club for cancellation and refund conditions. Selected activity terms appear before checkout.'}</p><a href={`tel:${settings.phone}`}>Contact the club: {settings.phone}</a></div></main>;
}
