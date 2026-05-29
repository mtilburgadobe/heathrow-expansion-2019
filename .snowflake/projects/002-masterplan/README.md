# Snowflake Run 002 — masterplan

**Source:** http://localhost:8000/masterplan.html  
**Template:** heathrow  
**Conversion level:** page-level  
**Branch:** snowflake-001

## Slot mapping summary

| Template slot | Source content | Notes |
|---|---|---|
| hero-block | hero section (data-section="hero") | Direct match |
| stats-band | Derived from masterplan facts | No stats band in source; used 21 components / 4 phases / 142m pax |
| case | overview section (prose) + phases section (timeline) | 4-item timeline mapped to tl-1..tl-4; tl-5 empty |
| sections | components section | 4 of 21 components mapped to cards |
| respond | questions + cta sections | Deadline + Q1-5 summary + CTA |

## Assets
- `hero-masterplan.png` uploaded to DA media: https://content.da.live/mtilburgadobe/heathrow-expansion-2019/media/heathrow-2019/hero-masterplan.png

## Divergences
1. No numeric stats on source page → template stats-band populated with key masterplan facts
2. Only 4 phases → tl-5 slot left empty
3. 21 components → only top 4 mapped to section cards
