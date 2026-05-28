# DOM equality report

- **Source URL:**     http://localhost:8000/index.html
- **Rendered URL:**   http://localhost:3001/drafts/heathrow-index.html
- **Source scope:**   `body`
- **Rendered scope:** `body`
- **Generated:**      2026-05-28T07:51:32.213Z

## Summary

| Field                 | Source                  | Rendered                | Status |
|-----------------------|-------------------------|-------------------------|--------|
| Element count         | 148                     | 152                     | ✗      |
| Tag+class sequence    | 148                     | 152                     | ✗      |
| Visible text (chars)  | 3983                    | 3983                    | ✓      |
| Image refs            | 1                       | 1                       | ✗      |

**Overall:** **FAIL**

## Differences

### elementCount

Source has 148, rendered has 152 (delta: +4).

### tagSequence

First divergence at position 0.

```diff
- [0] nav
  [1] div.nav-inner
  [2] a.nav-logo
---
+ [0] header.header-wrapper
  [1] div.header
  [2] nav
```

### imageSrcs

1 unexpected difference(s):

- [0] source=`img/hero-index.png` rendered=`https://content.da.live/mtilburgadobe/heathrow-expansion-2019/media/heathrow-2019/hero-index.png`

*Media Bus rewrites (`./media_<sha>.<ext>?...`) are not counted as differences.*

