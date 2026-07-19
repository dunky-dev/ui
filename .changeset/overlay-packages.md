---
'@dunky.dev/overlay': minor
'@dunky.dev/dom-overlay': minor
'@dunky.dev/react-dialog': patch
---

Add `@dunky.dev/overlay` and `@dunky.dev/dom-overlay` — the shared overlay
coordination the whole overlay family (dialog, drawer, alert-dialog, popover,
menu, combobox) builds on, so the behavior is implemented once instead of
forked per primitive.

- `@dunky.dev/overlay` is the agnostic half: a stack of open layers and the
  rule for which is topmost (deepest nesting, open order breaking ties). No
  DOM, no framework — a future native substrate reuses it.
- `@dunky.dev/dom-overlay` is the DOM realization on top of it: the layer
  stack wired to assistive-tech containment (`aria-hidden` + `inert`), the
  exit window (`hideExitingLayer` / `watchExitAnimation`), and initial focus
  (`getInitialFocus`).

```ts
import { createLayerStack, type OverlayLayer } from '@dunky.dev/overlay'
import { registerLayer, isTopmostLayer } from '@dunky.dev/dom-overlay'
```

This replaces `@dunky.dev/dom-dialog`, which is removed — its behavior was
never dialog-specific, only its name was. `@dunky.dev/react-dialog` now
consumes `@dunky.dev/dom-overlay`; its public API and behavior are unchanged
(`registerDialog` / `isTopmostDialog` become `registerLayer` /
`isTopmostLayer` internally).
