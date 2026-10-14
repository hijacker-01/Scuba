import Hero from '@/components/Hero';
import Features from '@/components/Features';
import MechanicalSwitchTransition from '@/components/MechanicalSwitchTransition';
import Courses from '@/components/Courses';
import Gallery from '@/components/Gallery';
import Testimonials from '@/components/Testimonials';
import BookingCTA from '@/components/BookingCTA';
import Contact from '@/components/Contact';

export default function Home() {
  return (
    <MechanicalSwitchTransition
      heroContent={<Hero />}
      nextSectionContent={<Features />}
      transitionLabel="INITIATE DIVE SEQUENCE"
    />
  );
}
