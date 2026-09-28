# RightHire: landing page + brand kit

Tagline: **Right hire for the right people.**

Static site, no build step. Open `index.html` or serve locally:

    cd righthire-site && python3 -m http.server 8000   # http://localhost:8000

## Structure
- `index.html`: single-page site (CSS in `assets/css/styles.css`, tiny JS in `assets/js/main.js`)
- `privacy.html`, `terms.html`: legal pages (extra styles in `assets/css/legal.css`), linked from the footer
- `favicon.ico`, `site.webmanifest`
- `assets/og-image.png`: 1200×630 social preview
- `assets/brand/`: logo kit
  - `righthire-logo-light.svg` / `-1200.png`: horizontal lockup for light backgrounds (navy tile)
  - `righthire-logo-dark.svg` / `-1200.png`: horizontal lockup for dark backgrounds (white tile)
  - `righthire-icon.svg` / `righthire-icon-512.png`: icon-only mark (navy tile)
  - `righthire-icon-dark.svg` / `righthire-icon-dark-512.png`: icon for dark backgrounds
  - `righthire-glyph.svg`, `righthire-glyph-white.svg`: mark without tile
  - `righthire-wordmark.svg` / `-1200.png`, `righthire-wordmark-white.svg`: text only
  - `favicon.svg`, `favicon-16/32/48.png`, `apple-touch-icon.png` (180), `icon-192.png`

## Page sections (v3: the full pipeline story)
1. Hero (dark): tagline, "From your JD to the interview room, on evidence." and an animated 7-step pipeline card (labelled Example)
2. `#problems`: "Recruiting is broken": 13 recruiter pains in 4 groups (Résumés you can't trust · Sourcing eats the week · Candidates go dark · Coordination chaos). Each is a flip card: the pain on the front, how RightHire answers it on the back. On mobile each group is a swipeable row.
3. `#why`: Before vs with RightHire ("a pile of résumés" vs "3–5 verified, available matches")
4. `#how`: the 7-stage pipeline (JD intake → Discovery → Evidence-based matching → Skill verification → Availability & notice check → Interview scheduling → Follow-up & feedback loop). It has a sticky stepper with a progress bar, a scroll-driven rail, and an Example mockup for each stage. Each stage links to the pains it solves.
5. `#shortlist`: anatomy of an evidence card (evidence, verification, availability)
6. `#who`: audiences (startups, hiring managers, staffing firms and VMS vendors)
7. `#pilot`: free pilot form, contact and booking
8. `#faq`: turnaround, verification, duplicates and ownership, availability and notice checks, scheduling, automation, cost, roles, privacy, staffing firms
9. Footer: CTA, contact (Nellore), links, privacy/terms

## Brand
- Concept: an "R" whose leg turns into a precise check mark (the *right* hire, verified).
- Colours: Navy `#0B1736` · Signal green `#2BD989` (on dark) · Deep green `#12A86B` (mark on light) · Text-safe green `#0B7A4C`
- Type: Plus Jakarta Sans ExtraBold (wordmark, converted to outlines; headings) · Instrument Serif italic (accent words) · Inter (body) · JetBrains Mono (labels)

## Motion
- Hero "pipeline" animation (clearly labelled Example), scroll reveals, animated gradient mesh, marquee, flip cards for pains, scroll-driven pipeline rail and stepper, spotlight/tilt hovers. Pure CSS + vanilla JS, no libraries.
- The hero animation pauses when it is off-screen or the tab is hidden.
- `prefers-reduced-motion: reduce` turns off all motion and shows the final shortlist state.

## Before going live
- `og:image` / `twitter:image` point to harshakusal.github.io/righthire-site. Update them (and add `og:url` + canonical) if a custom domain is added.
- Confirm the FAQ and pipeline wording on turnaround, how skills are verified, ownership records, and the optional scheduling/follow-up service.
- The pilot form only opens the visitor's email app (mailto). For real form submissions, use a free form backend such as Netlify Forms or Formspree.
- Booking link: set `BOOKING_URL` near the bottom of `index.html` to your Google Calendar appointment-schedule link. The "Book a 20-min call" buttons (hero, pilot contact cards, footer) appear only when it is set.
- Review `privacy.html` / `terms.html` (retention periods, response times, liability cap, jurisdiction) before relying on them.
