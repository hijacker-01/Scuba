import gsap from 'gsap';

export const motion = { ease: 'power3.out', duration: .85, mobileDuration: .55, stagger: .08 };

export function RevealText(targets: Element[], trigger: Element, mobile: boolean) {
  return gsap.from(targets, {
    y: mobile ? 14 : 26, opacity: 0,
    duration: mobile ? motion.mobileDuration : motion.duration,
    stagger: mobile ? .04 : motion.stagger, ease: motion.ease,
    clearProps: 'transform,opacity',
    scrollTrigger: { trigger, start: 'top 90%', once: true },
  });
}

export function RevealMedia(target: HTMLElement, mobile: boolean) {
  const timeline = gsap.timeline({ scrollTrigger: { trigger: target, start: 'top 92%', once: true } });
  timeline.from(target, {
    clipPath: 'inset(12% 0 12% 0)', opacity: 0, duration: mobile ? .6 : 1.1,
    ease: motion.ease, clearProps: 'clipPath,opacity',
  });
  const image = target.querySelector('img');
  if (image) timeline.from(image, { scale: mobile ? 1.035 : 1.08, duration: mobile ? .8 : 1.25, ease: motion.ease, clearProps: 'transform' }, 0);
  return timeline;
}

export function SvgDraw(path: SVGPathElement, trigger: Element, mobile: boolean) {
  const length = path.hasAttribute('pathLength') ? Number(path.getAttribute('pathLength')) : path.getTotalLength();
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
  return gsap.to(path, {
    strokeDashoffset: 0, duration: mobile ? 1 : 1.65, ease: 'power2.inOut',
    scrollTrigger: { trigger, start: 'top 85%', once: true },
  });
}
