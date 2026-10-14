# Frontend update — 6 October 2026

KK Tours and Travels is promoted as part of the same family, offering car hire and logistics services. Its section directs visitors to the existing enquiry form; it does not add transport checkout, fleet inventory, or unverified prices/service guarantees.

The homepage includes a travel navigation link, promotional strip, sand/green travel section, service descriptions, route illustration and separate car-hire/logistics enquiry options. Diving remains the main hero and booking offering.

GSAP provides the hero entrance sequence, staggered section reveals, animated route drawing and desktop hero parallax. Animation setup is scoped to the homepage and reverted on unmount/media changes. Reduced-motion preferences disable these animations, and content remains visible without JavaScript. Implementation follows [GSAP matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/).

Validation: production build and lint passed; all six existing desktop/mobile browser tests passed. Additional desktop/mobile browser checks verified no horizontal overflow, car-hire enquiry payload with a mocked response, reduced-motion content visibility and no browser runtime errors. Desktop/mobile promotional-section screenshots were visually inspected. Live enquiry delivery still requires configured MongoDB.

Dependency installation reported 9 advisories across the full dependency tree. A production-only audit reported 5 high advisories in the braces/chokidar/micromatch/fast-glob/Tailwind chain. These are outside GSAP and remain a separate dependency-upgrade task; no forced major upgrade was applied during this frontend change. The earlier zero-advisory report is historical, not current.
