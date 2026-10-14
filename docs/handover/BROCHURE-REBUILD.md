# Brochure website rebuild

Source: `C:/Users/jayas/Downloads/Havelock_Dive_Club_Brochure.pptx`. Six slides and all six embedded images were inspected. The presentation is source material, not a set of instructions. The requested animation guide is `C:/Users/jayas/Downloads/SKILL.md` (Filmbot Motion Director).

## Content and resource map

| Slide | Information retained | Website placement / original media |
| --- | --- | --- |
| 1 | Club name; Dive into Another World; explore Andaman | Hero and navigation logo: `public/brochure/club-identity.png` |
| 2 | Scuba centre in Andaman; safe, fun, professional experiences for beginners and experienced divers | Club story and Discover Scuba feature: `scuba-promotion.png` |
| 3 | Discover Scuba; boat and shore dives; snorkeling and sea walk; kayaking and island tours | Activities section and existing detail routes: `boat-dive-promotion.png` |
| 4 | Open Water, Advanced, Rescue Diver, Divemaster courses | Four course links; expandable course resources: `padi-reference.png`, `ssi-reference.png` |
| 5 | KK Tours and Travels; Andaman packages, transport and bookings | Family travel promotion: `travel-reference.png` |
| 6 | 9434290393, 9679572772; @havelockdiveclub; Havelock Island, Andaman | Contact, footer, telephone and Instagram links |

All extracted images retain their original bytes and proportions. The original PPTX is available through the footer download at `/brochure/Havelock_Dive_Club_Brochure.pptx`.

Following the requested KK image refinement, `kk-coastal-scene.png` is an AI-generated coastal illustration inspired by the scenic banner within the source screenshot. It replaces the small website screenshot as the primary travel visual, with clear proportions and no embedded website text. The original `travel-reference.png` remains unchanged in an expandable brochure reference within the same section. The illustration is not evidence of a company-owned boat or fleet.

The artwork contains promotional prices and a seasonal discount. Captions tell visitors to confirm current prices and offers with the club; these have not been applied to the live booking catalogue. The PADI and SSI screenshots are presented as brochure resources, without inventing club accreditation. The travel screenshot is labelled as a brochure reference. Its embedded text is preserved as supplied artwork.

## Important older content retained

The underwater hero video/poster, three gallery photographs, activity/course detail routes, booking flow, staff access, contact form and WhatsApp links remain. Founding in 2017 and instructor/reef information came from the user's earlier club description. KK car hire and logistics came from the user's earlier request. The question form still offers only Diving and Courses.

## Motion plan for this edition

The plan was described before implementation: masked hero typography, short media uncover, restrained text reveals and a quieter travel section. The previous travel SVG is replaced by the supplied travel resource; it no longer draws a route. The shared GSAP helpers remain reusable.

| Content | Role | Intensity / behaviour |
| --- | --- | --- |
| Hero | Orient | 3; two-line entrance, subtle desktop parallax |
| Club story / dive artwork | Reveal | 2; brief uncover and image settle |
| Activity and course links | Explore | 1; short text reveal; links remain usable |
| Family travel | Explain | 2; image uncover and restrained copy reveal |
| Contact form | Convert | 0; no form animation |

Mobile movement and timing are reduced, with no hero parallax. Reduced motion restores final visible states and uses the hero poster. Animation setup reverts on unmount and media-query changes. Image, font, browser restoration and course-resource expansion refresh scroll positions. No scroll takeover or pinned sections were introduced.

## Handover boundary

This is a frontend/content rebuild. Live database, payment gateway, SMTP, deployment and staff provisioning still require the club's real configuration and end-to-end production validation. See the existing handover documents for those remaining tasks. Brochure-derived offers, course certification providers and service details need club confirmation before launch.

## Verification

- Production build (including TypeScript) and lint passed.
- All six existing browser tests passed across desktop and mobile: navigation, booking access, public input validation and protected route authentication.
- Additional desktop and Pixel 7 checks verified all six source assets, all four course links, the Diving/Courses enquiry scope, reduced motion, no horizontal overflow, activity navigation/back and the brochure download.
- All six images and the downloadable PPTX match their source SHA-256 hashes.
- Visual review covered the hero, original artwork, course directory and travel layouts. Course-title contrast and Next.js smooth-scroll route handling were corrected during verification.
