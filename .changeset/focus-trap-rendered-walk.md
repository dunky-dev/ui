---
'@dunky.dev/dom-focus-trap': patch
---

Two fixes to which elements the trap's Tab cycle visits:

- **Rendered-ness is now decided by a computed-style walk instead of
  `Element.checkVisibility()`.** The API is recent (Chrome/Edge 105+,
  Firefox 106+, Safari 17.4+), and the trap resolves focusables after the Tab
  keydown's `preventDefault()` — on a browser without it, the resulting throw
  left Tab dead entirely. The walk checks the same conditions (`hidden`
  attribute, `visibility: hidden`, `display: none` on the element or an
  ancestor) and works everywhere.
- **`iframe` and `details > summary` now participate in the cycle.** Browsers
  tab to both, but the trap — which steps focus itself — skipped them, making
  them unreachable by keyboard while trapped. Only a details' first summary is
  matched, since that is the disclosure widget browsers focus.
