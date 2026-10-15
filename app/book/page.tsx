import Contact from '@/components/Contact';
import { catalog } from '@/lib/catalog';
import { clubSettings } from '@/lib/settings';
export const dynamic = 'force-dynamic';
export default async function BookPage({ searchParams }: { searchParams: Promise<{ activity?: string }> }) {
  const [settings, query] = await Promise.all([clubSettings(), searchParams]);
  const activity = catalog.find(item => item.slug === query.activity);
  const course = ['open-water', 'advanced', 'rescue-diver', 'divemaster'].includes(activity?.slug || '');
  return <main className="page-main"><div className="container detail"><h1>Plan your diving experience</h1><p>Contact the club to arrange your dive or course. No online payment is collected through this website. The team will confirm availability and booking details directly with you.</p></div><Contact phone={settings.phone} alternatePhone={settings.alternatePhone} location={settings.location} initialService={course ? 'Courses' : 'Diving'} initialMessage={activity ? `I am interested in ${activity.name}. Preferred dates and group size: ` : ''} /></main>;
}
