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

## Try RightHire (`demo.html`)

A recruiter pastes a job description, uploads or pastes a résumé (PDF, DOCX, or TXT), and gets an evidence report: role-fit score, must-have and nice-to-have matches, experience fit, an AI-writing likelihood, and interview questions. "Try a sample" loads a shared job description with a strong human résumé, an AI-heavy résumé, or a partial frontend résumé.

The page is plain HTML, CSS, and JavaScript. GitHub Pages serves it with no build. PDF text uses pdf.js and DOCX text uses mammoth, both loaded from a CDN in the browser.

### Instant mode

`RIGHTHIRE_PROXY_URL` at the bottom of `demo.html` starts empty. With it empty, the page only runs instant mode. Scoring happens in the browser. The job description and résumé are not uploaded, and the page says so.

### How the fit score is computed

The page pulls requirements from the job description. Bullets under must-have and nice-to-have headings become requirements. If the description is prose, sentences that name a skill become requirements, and a sentence that says "a plus" or "preferred" is a nice-to-have.

Each requirement is scored from the résumé, using a skill and synonym list:

- About 100 when the résumé shows the skill in real work: a system, an action, and a number or outcome.
- About 80 when it names where the skill was used, without a measured result.
- About 26 to 44 when the word only appears in a generic line.
- 16 when the skill is only on a skills list, with no project behind it. Those are flagged "listed only".
- 0 when it is missing, or when the résumé only mentions it to deny it ("have not shipped Go").

Must-haves are about 78% of the requirement score. Nice-to-haves are about 22%. Years and seniority are a separate experience score: date ranges on the résumé against the years the role asks for, plus title level. A track mismatch (for example a frontend résumé against a backend role) caps that part. Role fit is about 82% requirements and 18% experience, from 0 to 100. 75 and above is Strong, 45 to 74 is Possible, below 45 is Weak.

### How the AI-writing estimate is computed

This is a likelihood, not proof. Five signals are mixed: stock phrases such as "spearheaded", "leveraged", "dynamic", "results-driven", and "proven track record" (the largest share); how little sentence length varies; bullets that open with the same kind of stock verb; how few sentences contain a number, a named system, or concrete technical detail; and stacked buzzword phrases. A skills list is not judged as prose rhythm. The report shows the percentage, the signals, a section breakdown, and the most AI-like passages, plus this line: "This is an estimate of how much the writing resembles common AI-generated résumé language. It is not proof that a person or a tool wrote it."

### Deep AI mode

Optional. The browser calls a small Cloudflare Worker. The model key stays on the worker.

1. From `worker/`, deploy: `npx wrangler deploy`
2. Set the secret (this is the only place the key lives): `npx wrangler secret put LLM_API_KEY`
3. In `worker/wrangler.toml`, `ALLOWED_ORIGIN` is `https://harshakusal.github.io`. Add a local origin, comma-separated, if you test deep mode on your own machine. `LLM_BASE_URL` defaults to `https://api.openai.com/v1` and `LLM_MODEL` to `gpt-4o-mini`. Set `LLM_JSON_MODE = "off"` under `[vars]` if your provider rejects JSON mode.
4. Copy the `workers.dev` URL into `demo.html`, near the bottom:

```
var RIGHTHIRE_PROXY_URL = 'https://righthire-demo-proxy.<your-subdomain>.workers.dev';
```

Leave the value empty to stay on instant mode. Never put an API key in `demo.html` or in git. For local worker development, copy `worker/.dev.vars.example` to `worker/.dev.vars` (gitignored) and run `npx wrangler dev`. The page POSTs `{ jd, resume }` to `{proxy}/analyze`. If the proxy fails, the page falls back to the in-browser report and says so.
