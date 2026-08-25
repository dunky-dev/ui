# @dunky.dev/dom-dialog

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

- [#39](https://github.com/dunky-dev/ui/pull/39) [`6b51d8d`](https://github.com/dunky-dev/ui/commit/6b51d8de4d1069863a56c7ac5f74cb3c8dfaa20c) Thanks [@ivanbanov](https://github.com/ivanbanov)! - `closeOnBack` is now symmetric: the browser's Forward reopens what Back
  closed. The history entry a Back press spends survives in the forward stack
  and keeps marking the dialog's open ground — traversing forward into it
  reopens the dialog, guarded again for the next Back. Reopening through the
  trigger instead plants a fresh entry, exactly like navigating after a Back.
  No new setting: back-close and forward-reopen are one behavior, so the
  existing `closeOnBack` gates both. Both DOM substrates get it — React and
  Solid — from the same code.

  The reopen follows the shared dismissal contract — a new
  `onForwardNavigation` callback fires first and `preventDefault()` vetoes,
  and a controlled dialog only records the intent:

  ```tsx
  <Dialog
    closeOnBack
    onForwardNavigation={event => {
      // e.g. decline the history-driven reopen while a form is mid-submit
      if (submitting) event?.preventDefault?.()
    }}
  >
  ```

  A nested dialog comes back too. Closing the layer it was opened from unmounts
  it — machine and all — so the ground it lost to a Back press has no owner left
  to reopen it. It reopens anyway: the ground belongs to the dialog's place in
  the stack rather than to the instance that planted it, so the dialog that
  comes back with its parent recognizes it. Two dialogs at the same place can't
  be told apart, and then neither reopens. The same recognition survives a
  reload, so a traversal back into that ground reopens the dialog even after the
  page went away.

  Under the hood, `interceptBackNavigation(onBack, options?)` takes its optional
  callbacks as an object and grew `claim`, the name for that ground, plus a
  `watchSpentEntry(claim, reopen)` for a closed layer waiting to be recognized.
  A Back-closed guard parks instead of dropping, a traversal re-entering its
  spent entry asks the layer to reopen, and the guard re-arms on that entry in
  place. A layer that passes neither option behaves exactly as before. A layer
  that _closed_ gave its ground up on purpose and nothing reopens from it —
  Forward never undoes a dismissal the user made deliberately.

  `guardBackNavigation` (`@dunky.dev/dom-dialog`) now returns
  `{ sync, release }` rather than a bare disposer: the guard outlives the open
  state — that is the whole point of the Forward watch — so a host reports
  every change through `sync(open)` and ends the episode with `release()`.
  Whether a close parks the registration or releases it stays a DOM-layer
  decision, made once for every substrate.

  One web-mechanics caveat, spec'd in the navigation util and both DOM
  bindings: a controlled dialog's Back-close is completed by the consumer
  rather than by the press, so its entry is consumed and Forward has nothing to
  re-enter.

### Patch Changes

- [#48](https://github.com/dunky-dev/ui/pull/48) [`c35d1ab`](https://github.com/dunky-dev/ui/commit/c35d1abe05f07f6df741f297c0d8b35bd0a1e03c) Thanks [@ivanbanov](https://github.com/ivanbanov)! - `openDialogLayer` now warns when focus cannot move into the dialog at all —
  when the initial focus target refuses focus and the dialog window can't take
  the fallback either (typically because it lacks `tabindex="-1"`). Focus
  stranded outside an open modal breaks the modal dialog pattern; the miss used
  to be silent, now the warning names the fix.

- [#46](https://github.com/dunky-dev/ui/pull/46) [`5a58c2d`](https://github.com/dunky-dev/ui/commit/5a58c2dd2afcea9c02d54262beaec6e5a95e9e95) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Rename `@dunky.dev/dom-navigation` to `@dunky.dev/browser-navigation`.

  The util guards the browser's session history — Back, Forward, reload — and
  never touches the DOM, so the old name pointed at the wrong layer. The API is
  unchanged; only the package name moves:

  ```diff
  -import { interceptBackNavigation } from '@dunky.dev/dom-navigation'
  +import { interceptBackNavigation } from '@dunky.dev/browser-navigation'
  ```

  `@dunky.dev/dom-navigation` will receive no further releases.

- Updated dependencies [[`a33e149`](https://github.com/dunky-dev/ui/commit/a33e1496a5e2440c968002efc493f850ea9db26a), [`8ae32b4`](https://github.com/dunky-dev/ui/commit/8ae32b422e66b9bf9810a85d299a730205f2f1ca), [`ffa4fad`](https://github.com/dunky-dev/ui/commit/ffa4fada7719daa8661adab52c20952f3d8d7559), [`6b51d8d`](https://github.com/dunky-dev/ui/commit/6b51d8de4d1069863a56c7ac5f74cb3c8dfaa20c), [`979c3c7`](https://github.com/dunky-dev/ui/commit/979c3c7a03e793d98ea33fd7392a6d87fe84517a), [`560d539`](https://github.com/dunky-dev/ui/commit/560d539dac5d2ed4b318b9ddad08f9717ddb8f00), [`6ed64a2`](https://github.com/dunky-dev/ui/commit/6ed64a213a42f2f03d07759afd84b456fd753218), [`c35d1ab`](https://github.com/dunky-dev/ui/commit/c35d1abe05f07f6df741f297c0d8b35bd0a1e03c), [`4698e0c`](https://github.com/dunky-dev/ui/commit/4698e0c5f24182e050473cd68faf2e60d2b66630), [`5a58c2d`](https://github.com/dunky-dev/ui/commit/5a58c2dd2afcea9c02d54262beaec6e5a95e9e95)]:
  - @dunky.dev/browser-navigation@0.2.0
  - @dunky.dev/dom-overlay@0.2.0
  - @dunky.dev/dialog@0.4.0
  - @dunky.dev/dom-focus-trap@0.1.2

## 0.1.0

### Minor Changes

- [#44](https://github.com/dunky-dev/ui/pull/44) [`e3a5e96`](https://github.com/dunky-dev/ui/commit/e3a5e96b13499b3a0b1dc49d6ec195f67b2d0071) Thanks [@ivanbanov](https://github.com/ivanbanov)! - New package: `@dunky.dev/dom-dialog`, the framework-free DOM half of the
  Dialog. The React and Solid bindings had grown two copies of the same
  document-level code — the Escape listener, the ordered focus/stack sequence
  around the open edge, the exit window, the session-history guard, the
  outside-press gating — differing only in which lifecycle scheduled them. That
  duplication is the drift risk the architecture exists to remove, and it would
  have been copied a third time for Vue.

  Both bindings now contribute only their host's lifecycle:

  ```ts
  // before — the same twenty lines in every DOM substrate
  const previous = document.activeElement
  const unregister = registerLayer({
    id,
    depth,
    element: content,
    modal,
    backdrop,
  })
  const target = initialFocus ?? getInitialFocus(content)
  target.focus({ preventScroll: true })
  // ...

  // after
  return openDialogLayer(content, { id, depth, modal, backdrop, initialFocus })
  ```

  The ordering that made those sequences correct — the stack joins before focus
  moves in, and releases the layers beneath before focus moves back out — is now
  stated and tested in one place rather than re-derived per substrate.

  No consumer-visible behavior changes in either binding; this is an internal
  extraction. `@dunky.dev/dom-dialog` is published because the bindings depend on
  it at runtime, and a substrate outside this repo can build on it directly.

  This also establishes `packages/dom/components/` as a layer: a DOM package
  scoped to one primitive, which may import that primitive's core package and any
  DOM util, but never a framework. `pnpm scaffold <name>` stamps one for every new
  primitive.

### Patch Changes

- Updated dependencies [[`e3a5e96`](https://github.com/dunky-dev/ui/commit/e3a5e96b13499b3a0b1dc49d6ec195f67b2d0071)]:
  - @dunky.dev/dialog@0.3.1
