---
'@dunky.dev/dom-scroll-lock': patch
---

Two `lockScroll` fixes:

- Scrollbar compensation is now additive: the footprint is added on top of
  the target's computed padding instead of assigned over it. Previously the
  inline longhand won the cascade and erased any `padding-inline-end` /
  `padding-block-end` the target already had (inline or from a stylesheet),
  shifting layout the other way — the lock must not shift layout in either
  direction.
- Release restores the saved inline styles via `style.setProperty` instead of
  branching per value: a saved `''` (originally unset) removes the
  declaration per CSSOM, so the target returns to exactly what the first
  holder saw.
