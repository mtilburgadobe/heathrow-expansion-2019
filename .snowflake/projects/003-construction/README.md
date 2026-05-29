# Snowflake Run 003 — construction

**Source:** http://localhost:8000/construction.html  
**Template:** heathrow  
**Conversion level:** page-level  
**Branch:** snowflake-001

## Slot mapping summary

| Template slot | Source content | Notes |
|---|---|---|
| hero-block | hero section | Direct match; added ghost CTA to environment page |
| stats-band | Derived from operations facts | No stats in source; 6.5hr ban / 70% westerly / 50% public transport |
| case | alternation + mode-allocations | 4 mode allocations → tl-1..tl-4; tl-5 empty |
| sections | alternation/night-flights/early-growth/surface-access | 4 cards, one per major topic |
| respond | consultation-qs + cta-band | Q6–11 summary + deadline |

## Assets
- `hero-construction.png` uploaded to DA media: https://content.da.live/mtilburgadobe/heathrow-expansion-2019/media/heathrow-2019/hero-construction.png

## Divergences
1. No stats band in source → template stats-band populated with ops key facts
2. 4 mode allocations → tl-5 slot empty
3. Source page has no ghost CTA → added navigation link to environment page
