# @dunky.dev/dom-overlay

## 0.1.1

### Patch Changes

- [#32](https://github.com/dunky-dev/ui/pull/32) [`548ef7c`](https://github.com/dunky-dev/ui/commit/548ef7cd6e10263e02e9d0203292d61621f17a8d) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Anchor the overlay layer stack and the scroll-lock registry on a realm-global
  keyed by `Symbol.for`, so they survive the module being loaded more than once in
  a single page (duplicate bundles in a monorepo or micro-frontend).

  Both were plain module-level singletons. When a bundler ships two copies of the
  module — a common monorepo/micro-frontend hazard — each copy got its own stack
  and its own lock registry, so their "which layer is topmost" and "is the page
  still locked" decisions drifted apart: Escape or an outside press could dismiss
  the wrong dialog in a nested stack, and scroll lock could double-lock or leak.
  Radix hit the same class of bug with its focus-scope stack
  (radix-ui/primitives#2815).

  The shared state now resolves through a well-known global symbol, so every
  duplicate copy rendezvous on the same instance. It is resolved lazily on first
  use, so the packages keep their `sideEffects: false` contract (no import-time
  global write). No API change.

- [#36](https://github.com/dunky-dev/ui/pull/36) [`827c079`](https://github.com/dunky-dev/ui/commit/827c079716e6dcb5d78e9341285627137cf0ade3) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Ship `SPEC.md` and the TypeScript sources in the published package, alongside
  the built `dist`.

  The tarball used to carry `dist` and `README.md` only, so the two things you
  actually want when a behavior surprises you — the spec that defines the contract
  and the code that implements it — were reachable only by finding the repo and
  guessing which tag matches the installed version. Both now sit in
  `node_modules/<pkg>/`, pinned to the exact version installed.

  Nothing about resolution changes: `publishConfig` still points `main`, `types`,
  and `exports` at `dist`, and the sources are inert payload — read them, don't
  import them.

- Updated dependencies [[`827c079`](https://github.com/dunky-dev/ui/commit/827c079716e6dcb5d78e9341285627137cf0ade3)]:
  - @dunky.dev/overlay@0.1.1

## 0.1.0

### Minor Changes

- [#26](https://github.com/dunky-dev/ui/pull/26) [`f4628e7`](https://github.com/dunky-dev/ui/commit/f4628e733f657695099b54991bd29c0487293557) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Add exit-animation support via a new `animated` option. An animated dialog
  closes through a `closing` state — every part carries it as
  `data-state="closing"`, the styling hook for the exit — and unmounts when its
  transition or animation on Content ends (with a fallback ceiling, and skipped
  entirely under `prefers-reduced-motion`).

  ```tsx
  <Dialog animated>…</Dialog>
  ```

  ```css
  [data-state='closing'] {
    opacity: 0;
    transition: opacity 150ms;
  }
  ```

  The exit window lives in the core machine, not in per-substrate unmount
  deferral, so reopening mid-exit is a named transition instead of a timing
  race, and every substrate inherits identical behavior. The exit is cosmetic
  by design: the close is reported, focus returns, and the page becomes
  interactive the moment closing starts — the still-painting layer is made
  `inert` until it leaves. Enter animations need no option: parts mount
  straight into `data-state="open"`, so CSS animations (or transitions via
  `@starting-style`) play from mount. Default (`animated: false`) behavior is
  unchanged.

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

### Patch Changes

- Updated dependencies [[`89ed3f7`](https://github.com/dunky-dev/ui/commit/89ed3f7f9c1e5c6909ff2cfaa4c5ed952846518e)]:
  - @dunky.dev/overlay@0.1.0
