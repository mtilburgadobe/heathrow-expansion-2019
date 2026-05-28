# Notes — 001 index

## Phase: Capture

- Source: `http://localhost:8000/index.html` (16,578 bytes)
- Single image: `img/hero-index.png` (3.7 MB, aerial sunset rendering)
- All CSS inline (lines 7–119). No external stylesheets, no JS, no Google Fonts.
- Font stack: `'Trebuchet MS', Arial, sans-serif` — system font, no CDN loading.
- No placeholder markup (not a Stardust 0.3.x page — hand-coded HTML).

## Phase: Analyze

### Structural map

```
Line  Element / Role
────  ────────────────────────────────────────────────────────────────
122   <nav>                              → HEADER FRAGMENT start
  124   .nav-inner (logo + links + CTA)
135   </nav>                             → HEADER FRAGMENT end

137   <main>

139   <section data-section="hero">      → SECTION 1: hero-block
        inner: .hero (45/55 split grid)
          .hero-photo (img: hero-index.png)
          .hero-content (eyebrow, h1, lead, btn-group[2 links])
152   </section>

154   <div data-section="stats"          → SECTION 2: stats-band
       class="stats-band">
        .stats-inner (3 stat items: num + label each)
169   </div>

171   <section data-section="case">      → SECTION 3: case
        .inner → .split (2 cols)
          LEFT:  eyebrow, .sh2, .prose (4 paragraphs)
          RIGHT: eyebrow, .timeline (5 items: dot/year/text)
226   </section>

228   <section data-section="sections"   → SECTION 4: sections
       class="surface">
        .inner → eyebrow, .sh2, .slead
        .grid-2 → 4 × .topic-card (<a>: tc-num, h3, p, tc-link)
260   </section>

262   <div data-section="respond"        → SECTION 5: respond
       class="cta-band">
        .deadline-chip (hardcoded date text)
        h2, p, .btn-white (link)
267   </div>

269   </main>

271   <footer>                           → FOOTER FRAGMENT start
        .footer-inner → .footer-grid (4 cols: brand + 3 nav cols)
        .footer-bottom (copyright + deadline)
309   </footer>
```

### Section first-class decisions

| Source element | Problem | Template first-class |
|---|---|---|
| `<section data-section="hero">` (no class) | `.hero{display:grid}` → layout collision if we add class="hero" | **`hero-block`** |
| `<div data-section="stats" class="stats-band">` | `.stats-band` has no layout props → safe; tag needs rewrite to `<section>` | **`stats-band`** |
| `<section data-section="case">` (no class) | No CSS collision — adding class="case" | **`case`** |
| `<section data-section="sections" class="surface">` | "surface" is shared utility; reorder to put "sections" first | **`sections`** |
| `<div data-section="respond" class="cta-band">` | `.cta-band` has no layout props → safe; tag needs rewrite to `<section>` | **`respond`** |

### Head-level resources

None. No `<link>` elements in `<head>`. System font stack only. The `head.html` of the EDS repo does not need font-related additions.

### Inline CSS extraction

One `<style>` block, lines 7–119. Extract entirely to `/styles/heathrow.css`.
Contains: `:root` tokens, reset, body, nav, .hero, .stats-band, sections, .prose, .timeline, .topic-card, .cta-band, footer, responsive media queries.

### Slot inventory per section

**hero-block:**
- `hero.image` — `<img data-slot="hero.image">` on the `<img>` in `.hero-photo`
- `hero.eyebrow` — `.hero-eyebrow` text
- `hero.title` — `<h1>` text
- `hero.lead` — `.hero-lead` text
- `hero.cta-primary` — `.btn-primary` link (href + label)
- `hero.cta-ghost` — `.btn-ghost` link (href + label)

**stats-band:**
- `stat-1.num`, `stat-1.label`
- `stat-2.num`, `stat-2.label`
- `stat-3.num`, `stat-3.label`

**case:**
- `case.eyebrow-left` — left column eyebrow
- `case.title` — `.sh2`
- `case.prose` — the full `.prose` div (4 paragraphs as innerHTML)
- `case.eyebrow-right` — right column eyebrow
- `tl-1.year`, `tl-1.text` through `tl-5.year`, `tl-5.text` — 5 timeline items

**sections (topic cards):**
- `sections.eyebrow`, `sections.title`, `sections.lead`
- `card-1.num`, `card-1.title`, `card-1.body`, `card-1.link` (×4 cards)

**respond:**
- `respond.deadline` — `.deadline-chip` text (hardcoded "Consultation closes 13 September 2019 at 11:55pm")
- `respond.title` — `<h2>` text
- `respond.body` — `<p>` text
- `respond.cta` — `.btn-white` link (href + label)

### Asset strategy

Source is `localhost:8000` — local only. Production preview cannot reach `localhost` assets.
Hero image: 3.7 MB. Too large to vendor in git for a tidy repo.
**Decision: `da-media`.** Upload hero image via `da-media-upload.mjs`. DA cell `<img>` uses `content.da.live` absolute URL; template/fragment `<img>` uses root-relative `/assets/img/hero-index.png` (vendored copy for local dev server round-trip ONLY). Root-relative works because the browser resolves against the code-bus host; the template is not subject to Media Bus.

Wait — actually we need to think about this more carefully for the local dev server (Phase 5). The local round-trip uses `aem up --html-folder drafts` which serves from the EDS repo. If the template references `content.da.live/...` the browser fetches it directly — no CORS issues with images. So we can actually use the `content.da.live` absolute URL in the template too. No need to vendor separately.

**Revised asset strategy:** `da-media` throughout (template, fragment, DA cell all use `content.da.live` URL). No binary in git.

### Block-level feasibility

| Section | Structure | CSS scope | Content model | JS | Visual | Level |
|---------|-----------|-----------|---------------|-----|--------|-------|
| hero-block | ✅ (after tag fix) | ❌ `.hero{display:grid}` — shared layout class | ✅ | ✅ | ✅ | **page** |
| stats-band | ✅ (after tag fix) | ✅ scoped | ✅ 3 stat items | ✅ | ✅ | block |
| case | ✅ | ❌ shared utilities: .split, .inner, .prose, .timeline | ⚠️ complex split+timeline | ✅ | ✅ | **page** |
| sections | ✅ | ❌ shared utilities: .inner, .eyebrow, .sh2, .slead, .grid-2 | ✅ 4 topic cards | ✅ | ✅ | **page** |
| respond | ✅ (after tag fix) | ✅ scoped | ✅ | ✅ | ✅ | block |

**Recommendation: page-level.** 3 of 5 sections fail CSS-scope check due to shared utility classes (.split, .inner, .prose, .timeline, .eyebrow, .sh2, .slead, .grid-2, .grid-3). All CSS is in one inline block covering the whole page — no natural per-section boundary. The overlay pattern is the right fit.

### Decisions for Generate phase

1. Template name: `heathrow`
2. Level: page-level (overlay)
3. `<main>` exists — no synthesis needed
4. Rewrite outer section tags for `stats` and `respond` from `<div>` to `<section>`
5. Add `class="hero-block"` to hero section (cannot use "hero" — layout class collision)
6. Add `class="case"` to case section (no existing class)
7. Reorder `sections` section classes to `"sections surface"` (sections first)
8. Keep `cta-band` second class on respond section; use `respond` as first class
9. Asset strategy: `da-media` — upload hero image via `da-media-upload.mjs` before Phase 5
10. Head links: none to lift (system font, inline CSS only)
11. Extract inline `<style>` (lines 7–119) to `/styles/heathrow.css`
12. No inline scripts to extract
13. `.deadline-chip` content ("Consultation closes 13 September 2019...") — slot it (authorable date)
14. No placeholder elements present

### CSS first-class collision check (mandatory per learnings)

Checking each candidate first-class against CSS for layout properties:

- `.hero` → `display:grid` ❌ COLLISION → renamed to `hero-block`
- `.stats-band` → `background`, `color`, `padding` only ✅
- `.case` → not in CSS ✅
- `.sections` → not in CSS ✅ (was "surface" → no layout, but "sections" is cleaner)
- `.respond` → not in CSS ✅ (`.cta-band` has no layout props, but "respond" from data-section)
