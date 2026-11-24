---
'@dunky.dev/dom-dialog': patch
---

`gateBackdropPress` / `gateViewportPress` also gate a press normalized to the
lowercase `onclick` — Svelte's spelling of the DOM event attribute — so the
Svelte dialog shares the same gates as every other DOM host instead of
re-wrapping the press by hand.
