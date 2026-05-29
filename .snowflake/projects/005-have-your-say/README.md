# Snowflake Run 005 — have-your-say

**Source:** http://localhost:8000/have-your-say.html  
**Template:** heathrow  
**Conversion level:** page-level  
**Branch:** snowflake-001

## Slot mapping summary

| Template slot | Source content | Notes |
|---|---|---|
| hero-block | hero section | No hero image → reused hero-index.png from run 001 |
| stats-band | Derived from consultation scope | 24 questions / 50+ events / 4 response methods |
| case | hero prose + respond methods | 4 response methods as tl-1..tl-4; tl-5 empty |
| sections | questions grouped by topic | 4 cards: Masterplan Q1-5, Construction Q6-11, Environment Q12-21, Views Q22-24 |
| respond | big-cta section | CTA → external consultation site |

## Assets
- No new image upload needed — reusing `hero-index.png` already at DA media from run 001

## Divergences
1. No hero image in source — reused hero-index.png (most divergent page from template)
2. No stats band → derived consultation scope facts
3. tl-5 empty (only 4 response methods)
4. respond.cta links to external URL (aec.heathrowconsultation.com)
5. Sections cards group questions by topic area, not individual question text
