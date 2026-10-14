'use client';
import { ReactNode, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, RevealMedia, RevealText, SvgDraw } from '@/lib/motion';
gsap.registerPlugin(ScrollTrigger);

export default function HomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = gsap.matchMedia();
    media.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)', reduced: '(prefers-reduced-motion: reduce)' }, context => {
      if (context.conditions?.reduced) return;
      const mobile = !!context.conditions?.mobile;
      // Deep links and browser restoration should reveal their destination immediately.
      if (!window.location.hash && window.scrollY < 40) {
        gsap.timeline({ defaults: { ease: motion.ease } })
          .from('.dive-hero__eyebrow', { y: 10, opacity: 0, duration: .5 })
          .from('.hero-line__inner', { yPercent: 110, rotate: mobile ? 0 : 2, duration: mobile ? .75 : 1.1, stagger: .12, clearProps: 'transform' }, '-=.25')
          .from('.dive-hero__content > p, .dive-hero__actions', { y: mobile ? 12 : 22, opacity: 0, stagger: .1, duration: .65, clearProps: 'transform,opacity' }, '-=.65');
      }
      element.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach(section => {
        const text = Array.from(section.querySelectorAll('[data-reveal]')).filter(item => !item.hasAttribute('data-media-reveal'));
        if (text.length) RevealText(text, section, mobile);
      });
      element.querySelectorAll<HTMLElement>('[data-media-reveal]').forEach(target => RevealMedia(target, mobile));
      const route = element.querySelector('.travel-route');
      const path = element.querySelector<SVGPathElement>('.travel-route__line');
      if (route && path) {
        SvgDraw(path, route, mobile);
        gsap.from('.travel-route__stop', { opacity: 0, duration: .5, stagger: mobile ? .12 : .22, scrollTrigger: { trigger: route, start: 'top 80%', once: true } });
      }
      if (!mobile) gsap.to('.dive-hero__media', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.dive-hero', start: 'top top', end: 'bottom top', scrub: .5 } });
    }, element);

    let active = true;
    let frame = 0;
    let deferred = false;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!active) return;
        // Refresh temporarily resets native smooth scroll. Wait until navigation settles.
        if (ScrollTrigger.isScrolling()) { deferred = true; return; }
        deferred = false;
        ScrollTrigger.refresh(true);
      });
    };
    const afterScroll = () => { if (deferred && active) refresh(); };
    ScrollTrigger.addEventListener('scrollEnd', afterScroll);
    const images = Array.from(element.querySelectorAll('img'));
    images.forEach(image => image.addEventListener('load', refresh));
    const details = Array.from(element.querySelectorAll('details'));
    details.forEach(detail => detail.addEventListener('toggle', refresh));
    void document.fonts.ready.then(() => { if (active) refresh(); });
    window.addEventListener('pageshow', refresh);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      images.forEach(image => image.removeEventListener('load', refresh));
      details.forEach(detail => detail.removeEventListener('toggle', refresh));
      window.removeEventListener('pageshow', refresh);
      ScrollTrigger.removeEventListener('scrollEnd', afterScroll);
      media.revert();
    };
  }, []);
  return <main ref={root} className="home-experience">{children}</main>;
}
