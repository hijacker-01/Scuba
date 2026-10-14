'use client';

import { useEffect, useRef } from 'react';

type Ripple = { x: number; y: number; born: number; strength: number };

export default function Hero({ line1 = 'Dive into', line2 = 'another world.', description = 'Explore the Andaman Islands with Havelock Dive Club. Professional diving experiences for beginners and certified divers, in the waters we’ve called home since 2017.', location = 'Havelock Island · Andaman Sea' }: { line1?: string; line2?: string; description?: string; location?: string }) {
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    if (!hero || !canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const ripples: Ripple[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastMove = 0;
    let visible = true;

    const resize = () => {
      const bounds = hero.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'screen';
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        const progress = (now - ripple.born) / 1700;
        if (progress >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        const radius = 18 + progress * Math.min(width * 0.21, 210) * ripple.strength;
        const opacity = (1 - progress) ** 2 * 0.45 * ripple.strength;
        const glow = context.createRadialGradient(ripple.x, ripple.y, Math.max(0, radius - 24), ripple.x, ripple.y, radius + 30);
        glow.addColorStop(0, 'rgba(94, 218, 237, 0)');
        glow.addColorStop(0.54, `rgba(76, 208, 228, ${opacity * 0.3})`);
        glow.addColorStop(1, 'rgba(94, 218, 237, 0)');
        context.fillStyle = glow;
        context.beginPath();
        context.arc(ripple.x, ripple.y, radius + 30, 0, Math.PI * 2);
        context.fill();
        for (let ring = 0; ring < 3; ring++) {
          context.beginPath();
          context.arc(ripple.x, ripple.y, Math.max(1, radius - ring * 13), 0, Math.PI * 2);
          context.strokeStyle = `rgba(175, 245, 255, ${opacity * (0.9 - ring * 0.23)})`;
          context.lineWidth = ring === 0 ? 1.6 : 0.8;
          context.stroke();
        }
      }
      context.globalCompositeOperation = 'source-over';
      frame = ripples.length ? requestAnimationFrame(draw) : 0;
    };

    const addRipple = (x: number, y: number, strength = 1) => {
      if (motion.matches || !visible || document.hidden) return;
      ripples.push({ x, y, born: performance.now(), strength });
      if (ripples.length > 14) ripples.shift();
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || performance.now() - lastMove < 105) return;
      lastMove = performance.now();
      const bounds = hero.getBoundingClientRect();
      addRipple(event.clientX - bounds.left, event.clientY - bounds.top, 0.7);
    };
    const onPointerDown = (event: PointerEvent) => {
      const bounds = hero.getBoundingClientRect();
      addRipple(event.clientX - bounds.left, event.clientY - bounds.top, 1.25);
    };
    const onMotionChange = () => {
      if (motion.matches) {
        ripples.length = 0;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        context.clearRect(0, 0, width, height);
        videoRef.current?.pause();
      } else if (visible && !document.hidden) {
        void videoRef.current?.play().catch(() => {});
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        videoRef.current?.pause();
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        ripples.length = 0;
        context.clearRect(0, 0, width, height);
      } else if (visible && !motion.matches) {
        void videoRef.current?.play().catch(() => {});
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !motion.matches && !document.hidden) void videoRef.current?.play().catch(() => {});
      else videoRef.current?.pause();
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
        ripples.length = 0;
        context.clearRect(0, 0, width, height);
      }
    });
    const resizeObserver = new ResizeObserver(resize);
    resize();
    resizeObserver.observe(hero);
    observer.observe(hero);
    hero.addEventListener('pointermove', onPointerMove);
    hero.addEventListener('pointerdown', onPointerDown);
    motion.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    onMotionChange();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      hero.removeEventListener('pointermove', onPointerMove);
      hero.removeEventListener('pointerdown', onPointerDown);
      motion.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <section id="home" className="dive-hero" ref={heroRef} aria-labelledby="hero-title">
      <div className="dive-hero__media" aria-hidden="true">
        <video ref={videoRef} autoPlay muted loop playsInline preload="metadata" poster="/images/gallery6.jpg">
          <source src="/videos/hero-video.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="dive-hero__shade" aria-hidden="true" />
      <canvas ref={canvasRef} className="dive-hero__ripples" aria-hidden="true" data-testid="hero-ripples" />
      <div className="dive-hero__content container">
        <span className="dive-hero__eyebrow"><span /> {location}</span>
        <h1 id="hero-title" aria-label={`${line1} ${line2}`}><span className="hero-line" aria-hidden="true"><span className="hero-line__inner">{line1}</span></span><span className="hero-line" aria-hidden="true"><em className="hero-line__inner">{line2}</em></span></h1>
        <p>{description}</p>
        <div className="dive-hero__actions">
          <a className="dive-hero__primary" href="#activities">Explore experiences <span aria-hidden="true">↗</span></a>
          <a className="dive-hero__secondary" href="#contact">Talk to our team <span aria-hidden="true">→</span></a>
        </div>
      </div>
      <div className="dive-hero__bottom container" aria-hidden="true">
        <span>INDIA · 12.03° N / 92.97° E</span>
        <span>SCROLL TO EXPLORE <span className="dive-hero__scroll-line" /></span>
      </div>
    </section>
  );
}
