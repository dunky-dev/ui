# @dunky.dev/dom-overlay

## 0.2.1

### Patch Changes

- [#50](https://github.com/dunky-dev/ui/pull/50) [`bbb04da`](https://github.com/dunky-dev/ui/commit/bbb04da6397f5e9a1641cbea9e2eb0c082c2965c) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Focus candidates barred by an ancestor are excluded: controls disabled through
  `fieldset[disabled]` and anything inside `[inert]`.

  `FOCUSABLE_SELECTOR` and the form-field selector gate on an element's own
  attributes (`input:not([disabled])`), but both bars also arrive from
  ancestors, so a barred control satisfied the selector while a browser refuses
  to focus it — silently.

  In the focus trap that was a hard dead end: the Tab keydown is already
  `preventDefault()`-ed when focus is stepped by hand, so every press recomputed
  the same refused target and focus never moved again. The cycle now only holds
  what a browser would actually focus, keeping the native exception that
  controls in a disabled fieldset's first `legend` stay enabled.

  In the initial-focus chain it was the quieter failure mode: the barred field
  won the draw, `focus()` no-opped, and focus fell to the overlay window even
  when a viable field came later. Every candidate — designated element and form
  fields alike — is now also filtered for these bars.

  Both use the new `isFocusable` from `@dunky.dev/dom-element`, beside the
  `isRendered` filter they already shared.

- [#50](https://github.com/dunky-dev/ui/pull/50) [`bfbe863`](https://github.com/dunky-dev/ui/commit/bfbe86307b07bfc8d55207c70cfdc328693e5814) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Initial focus now skips a candidate that didn't render.

  `getInitialFocus` filtered `[disabled]` and `[type="hidden"]` but never asked
  whether the element actually rendered. A field inside a collapsed section
  satisfied the selector and won the draw; `focus()` on it did nothing — and said
  nothing — so focus fell back to the dialog window, with the fallback's warning
  unable to fire, because from its point of view the fallback had succeeded. The
  overlay opened on its window instead of the field: degraded, not broken, and
  silent.

  A designated `initialFocus` that hadn't rendered was worse. It went straight to
  the window and skipped the form-field step entirely, contradicting the
  documented "when one is set **and can take focus**". So `getInitialFocus` now
  takes the designated element as a second argument and resolves the whole chain
  in one call, filtering every step rather than just the last:

  ```ts
  // designated -> first form field -> the overlay window itself
  getInitialFocus(content, designatedElement).focus({ preventScroll: true })
  ```

  Callers that were writing `initialFocus ?? getInitialFocus(content)` should
  pass the designated element in instead — the `??` is what spent it on a
  candidate that couldn't take focus. `@dunky.dev/dom-dialog` does this for every
  DOM substrate already, so a dialog's `initialFocus` inherits the fix without a
  change on the consumer's side.

  The predicate is `isRendered` from `@dunky.dev/dom-element`, shared with the
  focus trap so the two can't disagree on what counts as rendered.

- [#49](https://github.com/dunky-dev/ui/pull/49) [`772a7df`](https://github.com/dunky-dev/ui/commit/772a7dfe18a58d070c1872b48ef8e6acec180723) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Page content beside a layer portalled into an app branch is now hidden by a
  modal layer's containment.

  Containment holds a few elements out of the hiding — the topmost modal layer,
  its backdrop, and the layers stacked above it — and it matched them by
  ancestry, so a branch that _contained_ one was skipped whole. Where a layer
  sits is the consumer's choice: `container` on the Portal part lets it land
  anywhere, and when that branch also held page content, the entire branch went
  unhidden — the page reachable by pointer, keyboard, and screen reader for as
  long as the layer was open.

  ```tsx
  // The menu lands inside the app branch, beside the page content.
  <Dialog.Portal container={appElement}>
  ```

  Hiding now descends from the body instead of walking up from the layer. A
  branch that holds one of those retained elements is descended into rather than
  spared, so the content beside it is hidden individually while the layer itself
  stays reachable. A layer at or above the body is a no-op — nothing sits
  outside it.

- Updated dependencies [[`6c249f9`](https://github.com/dunky-dev/ui/commit/6c249f96dd6e3f821d4b71bae250f1d94e40298c)]:
  - @dunky.dev/dom-element@0.1.0

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
