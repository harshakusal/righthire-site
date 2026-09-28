# RightHire: landing page + brand kit

Tagline: **Right hire for the right people.**

Static site, no build step. Open `index.html` or serve locally:

    cd righthire-site && python3 -m http.server 8000   # http://localhost:8000

## Structure
- `index.html`: single-page site (CSS in `assets/css/styles.css`, tiny JS in `assets/js/main.js`)
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

## Brand
- Concept: an "R" whose leg turns into a precise check mark (the *right* hire, verified).
- Colours: Navy `#0B1736` · Signal green `#2BD989` (on dark) · Deep green `#12A86B` (mark on light) · Text-safe green `#0B7A4C`
- Type: Plus Jakarta Sans ExtraBold (wordmark, converted to outlines; headings) · Instrument Serif italic (accent words) · Inter (body) · JetBrains Mono (labels)

## Motion
- Hero "shortlist forming" animation (clearly labelled Example), scroll reveals, animated gradient mesh, marquee, process line, spotlight/tilt hovers. Pure CSS + ~150 lines of vanilla JS.
- The hero animation pauses when it is off-screen or the tab is hidden.
- `prefers-reduced-motion: reduce` turns off all motion and shows the final shortlist state.

## Before going live
- Set absolute URLs for `og:image` / `twitter:image` (and add `og:url` + `<link rel="canonical">`) once the domain is known.
- Confirm the FAQ wording on turnaround, privacy and NDA.
- The pilot form only opens the visitor's email app (mailto). For real form submissions, use a free form backend such as Netlify Forms or Formspree.
