import Hero from '@/components/Hero';
import Gallery from '@/components/Gallery';
import Contact from '@/components/Contact';
import HomeMotion from '@/components/HomeMotion';
import TravelPromotion from '@/components/TravelPromotion';
import AboutClub from '@/components/AboutClub';
import DiveExperiences from '@/components/DiveExperiences';
import DiveCourses from '@/components/DiveCourses';
import { clubSettings } from '@/lib/settings';
import { publicCatalog } from '@/lib/public-catalog';
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [settings, items] = await Promise.all([clubSettings(), publicCatalog()]);
  return <HomeMotion>
    <Hero line1={settings.heroLine1} line2={settings.heroLine2} description={settings.heroDescription} location={settings.location} />
    <div className="journey-strip"><div className="container"><span>{settings.location}</span><span>Welcoming divers since {settings.foundingYear}</span><a href="#about">Meet the club ↗</a></div></div>
    <AboutClub about={settings.about} foundingYear={settings.foundingYear} />
    <DiveExperiences items={items} />
    <DiveCourses items={items} />
    <TravelPromotion description={settings.travelDescription} phone={settings.phone} carHireDescription={settings.carHireDescription} logisticsDescription={settings.logisticsDescription} /><Gallery /><Contact phone={settings.phone} alternatePhone={settings.alternatePhone} location={settings.location} />
  </HomeMotion>;
}
