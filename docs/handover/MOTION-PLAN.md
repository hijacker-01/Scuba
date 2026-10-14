# Editorial motion plan and implementation

Source: `C:/Users/jayas/Downloads/SKILL.md`, Filmbot Motion Director. The referenced research, catalog, recipes and plan template were not included beside the supplied skill; implementation follows the main document's motion roles and guardrails. No Filmbot assets or layout were copied.

## Section inventory

| Section | Purpose / content | Importance | Control | Primary role | Intensity |
| --- | --- | --- | --- | --- | --- |
| Hero | Orient / typography and video | Primary | Passive, scroll | Orient | 3 |
| Club story | Explain / text and photograph | Supporting | Scroll | Reveal | 2 |
| Activities | Explore / linked cards | Primary | Scroll, hover, click | Explore | 1 |
| Courses | Explore / linked cards | Supporting | Scroll, hover, click | Explore | 1 |
| KK promotion | Explain / services and route | Supporting | Scroll | Explain | 2 |
| Gallery | Show experiences / photographs | Supporting | Scroll, hover | Reveal | 2 |
| CTA links | Navigate / links | Utility | Hover, click | Navigate | 1 |
| Questions form | Convert / inputs | Primary | Keyboard, click | Convert | 0 |

The plan was presented in chat before implementation. Shared grammar: masked hero typography, fade-rise supporting text, scale-uncover media, and meaningful SVG stroke drawing. CSS handles hover feedback; GSAP handles sequences and ScrollTrigger handles entry/parallax. No scroll takeover, pinned content, or exit overlay is needed for this site's reading and booking flow. The hero entrance provides the homepage arrival transition and is skipped on deep links/restored scroll positions.

## Implemented changes

| File | Change |
| --- | --- |
| `components/HomeMotion.tsx` | Media-aware orchestration, scoped cleanup, deep-link-aware entrance, image/font refresh, browser restoration refresh |
| `lib/motion.ts` | Reusable RevealText, RevealMedia and SvgDraw helpers with shared motion timings/easing |
| `components/Hero.tsx` | Accessible masked title lines; video/ripple work pauses offscreen or in hidden tabs |
| `components/AboutClub.tsx` | Independent image uncover alongside supporting text reveal |
| `components/Gallery.tsx` | Media-reveal hooks and heading reveal |
| `app/globals.css` | Motion timing/easing tokens, hero masks, restrained touch-safe hover treatments |

Existing GSAP and ScrollTrigger are reused; no dependencies added. DrawSVG-equivalent stroke drawing uses the current SVG, including its normalized pathLength. Manual hero line masks avoid a typography plugin and preserve an accessible heading name.

Desktop uses 26px supporting text movement, a gentle 8% hero parallax and slower media settles. Below 900px, movement is 14px, stagger/timing is shortened, image scale is reduced, and parallax is removed. Reduced motion bypasses the GSAP timelines and restores final states. The existing hero poster replaces video under reduced motion. Forms receive no entrance animation.

Performance choices: transforms/opacity dominate; clip-path is used only for short media reveals. Hero video and ripple rendering pause when irrelevant. No Three.js, WebGL, inertial carousel, odometer or full-page transition overlay was added because the current content does not need those mechanics. No measured frame-rate claim is made; automated checks do not constitute a high-refresh-device performance benchmark.

## Verification

- Production build, including TypeScript, and lint passed.
- Desktop and Pixel 7 browser checks passed for scrolling, reduced-motion toggling, deep links, route navigation/back, desktop/mobile resizing, form selection, no horizontal overflow and no page runtime errors.
- Hero screenshots visually inspected at desktop and mobile sizes.
- Offscreen hero video pause verified.
- Keyboard form typing and visible focus outline verified.
- Hero and travel content remained visible with JavaScript disabled.
- Cleanup uses GSAP matchMedia.revert plus explicit removal of font/image/page-show refresh work and video visibility listeners. Route/back checks showed no runtime errors; internal ScrollTrigger counts were not instrumented.

Implementation reference: [GSAP matchMedia lifecycle and conditions](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/).
