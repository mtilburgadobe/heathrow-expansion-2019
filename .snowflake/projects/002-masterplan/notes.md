# Run 002 — masterplan

## Source analysis
- URL: http://localhost:8000/masterplan.html
- Size: 27,978 bytes
- Sections (data-section): hero, overview, components, phases, infrastructure, questions, cta
- Hero image: img/hero-masterplan.png (needs upload)
- Page title: "The Preferred Masterplan — Heathrow Expansion Consultation 2019"

## Template mapping

### hero-block
Straightforward match. Eyebrow "Section 3 of the consultation", H1 "The Preferred Masterplan".
Two CTAs: primary → have-your-say.html#q1, ghost → construction.html.

### stats-band
**Divergence:** The source page has no stats band with large numbers.
Resolved by populating with key masterplan facts: 21 components, 4 phases, 2050 full build-out.

### case block (overview + phases)
Left side: overview section prose (2 paragraphs about masterplan scope and consultation history).
Right side: 4-item phases timeline (only 4 of 5 template tl slots used; tl-5 left empty/omitted).
Phase dates extracted: ~2021–2026, ~2026–2030, ~2030–2035, ~2050.

### sections block (components)
Eyebrow/title/lead from components section h2.
4 cards from top 4 of 21 components: New Northwest Runway, New Terminal Facilities, M25 Tunnel, Green Loop.

### respond block (questions + cta)
Questions 1–5 mapped to respond.body summary.
respond.deadline = "Consultation closes 13 September 2019 at 11:55pm"
CTA → have-your-say.html#q1

## Assets
- hero-masterplan.png: upload to DA media

## Phase history
- Phase 1 (capture): complete
- Phase 2 (analyze): complete
