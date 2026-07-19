# @dunky.dev/overlay

## 0.1.0

### Minor Changes

- [#29](https://github.com/dunky-dev/ui/pull/29) [`89ed3f7`](https://github.com/dunky-dev/ui/commit/89ed3f7f9c1e5c6909ff2cfaa4c5ed952846518e) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Add `@dunky.dev/overlay` and `@dunky.dev/dom-overlay` — the shared overlay
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
