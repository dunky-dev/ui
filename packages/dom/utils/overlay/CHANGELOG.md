# @dunky.dev/dom-overlay

## 0.2.0

### Minor Changes

- [#39](https://github.com/dunky-dev/ui/pull/39) [`ffa4fad`](https://github.com/dunky-dev/ui/commit/ffa4fada7719daa8661adab52c20952f3d8d7559) Thanks [@ivanbanov](https://github.com/ivanbanov)! - `escapeScope` now exists. It was documented in the dialog specs — one layer per
  Escape by default, or the whole stack — but no package implemented it, so
  passing it did nothing.

  ```tsx
  // One press closes this dialog and every layer it was opened from.
  <Dialog escapeScope='stack'>
  ```

  Only the dialog that receives the Escape gates and vetoes it: its
  `closeOnEscape` and `onEscapeKeyDown` decide, exactly as before. Once allowed,
  the layers beneath receive a plain close — their own dismissal settings are not
  consulted again — unwinding top-down, so focus lands where it was before the
  bottom-most dialog opened. A vetoed Escape leaves the whole stack standing.

  The mechanics are shared rather than per-dialog: the layer stack gained
  `below(id)` (`@dunky.dev/overlay`) and `layersBelow(id)` plus an optional
  `Layer.dismiss` (`@dunky.dev/dom-overlay`), so any overlay family can offer a
  stack-scoped dismissal on the same stack. A layer that registers no `dismiss`
  opts out and stays open, which is what keeps a stack that mixes primitives from
  being closed out from under them.

  The specs also described a stack-scoped Close _press_; nothing implements that,
  so the claim is removed rather than left standing.

### Patch Changes

- [#48](https://github.com/dunky-dev/ui/pull/48) [`c35d1ab`](https://github.com/dunky-dev/ui/commit/c35d1abe05f07f6df741f297c0d8b35bd0a1e03c) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Two fixes to how containment and the exit window treat pre-existing markup:
  - Elements marked `aria-hidden="false"` are now hidden behind a modal layer
    like any other, and the authored value is restored on undo. `"false"`
    asserts visible — the opposite of author-hidden — so the previous skip left
    such elements exposed to assistive tech behind an open modal. Only a truthy
    `aria-hidden` (or `inert`) still counts as the author's own hiding.
  - `hideExitingLayer` no longer inerts `<html>` when the supplied boundary is
    not an ancestor of the content. A stale or mismatched boundary used to
    exhaust the ancestor walk at the document root and take the whole page out
    for the exit window; the hide now falls back to the content itself.

- [#39](https://github.com/dunky-dev/ui/pull/39) [`4698e0c`](https://github.com/dunky-dev/ui/commit/4698e0c5f24182e050473cd68faf2e60d2b66630) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Assistive-tech containment no longer lapses while a non-modal layer is open
  above a modal one.

  Containment now follows the topmost **modal** layer rather than the topmost
  layer. The ordinary layers — a select menu, a combobox list, a tooltip, a
  context menu — are non-modal and live inside dialogs; opening one used to
  release the dialog's containment, leaving the page behind reachable by
  pointer, keyboard, and screen reader for exactly as long as someone was
  interacting with the menu. The layers stacked above the modal one are held
  out of the hiding — they portal to the body as siblings of the dialog, so
  without the exception the containment would inert the very layer the user is
  in. Topmost keeps its meaning: a non-modal layer above still owns Escape and
  the focus trap; only containment stays put.

  To support this, the agnostic stack gains a public `ordered()` method
  returning every layer topmost first — the host needs to look past the top of
  the stack, while modality stays a host concept:

  ```ts
  const stack = createLayerStack<Layer>()
  stack.ordered() // every layer, topmost first
  ```

- Updated dependencies [[`ffa4fad`](https://github.com/dunky-dev/ui/commit/ffa4fada7719daa8661adab52c20952f3d8d7559), [`4698e0c`](https://github.com/dunky-dev/ui/commit/4698e0c5f24182e050473cd68faf2e60d2b66630)]:
  - @dunky.dev/overlay@0.2.0

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
