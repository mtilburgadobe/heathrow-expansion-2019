# DOM equality report

- **Source URL:**     http://localhost:8000/index.html
- **Rendered URL:**   https://snowflake-001--heathrow-expansion-2019--mtilburgadobe.aem.page/heathrow-2019/
- **Source scope:**   `body`
- **Rendered scope:** `body`
- **Generated:**      2026-05-28T07:55:09.757Z

## Summary

| Field                 | Source                  | Rendered                | Status |
|-----------------------|-------------------------|-------------------------|--------|
| Element count         | 148                     | 152                     | ✗      |
| Tag+class sequence    | 148                     | 152                     | ✗      |
| Visible text (chars)  | 3983                    | 3983                    | ✓      |
| Image refs            | 1                       | 1                       | ✓      |

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

