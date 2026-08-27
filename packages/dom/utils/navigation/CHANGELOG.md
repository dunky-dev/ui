# @dunky.dev/browser-navigation

## 0.2.1

### Patch Changes

- [#52](https://github.com/dunky-dev/ui/pull/52) [`f5becd4`](https://github.com/dunky-dev/ui/commit/f5becd4f5e08e0fbf0930e65961c92e281f9e463) Thanks [@ivanbanov](https://github.com/ivanbanov)! - `SPEC.md` (shipped with the package) gains a Scenarios section: 26 compact
  traces of `interceptBackNavigation` and `watchSpentEntry` behavior, grouped
  by one layer, release and consumption, forward/claims/reload, stacked
  layers, and timing edges.

  The behavior contract was already fully stated, but as one mechanism per
  prose bullet — nothing let a reader replay a concrete flow end to end.
  Each trace is a replayable episode in the module's own vocabulary (`arm`,
  `release`, `Back`, `Forward`), e.g.:

  ```
  arm A -> arm B -> arm C -> Back -> release B -> Forward -> Forward
    => the Back closes C; the first Forward soaks into B's abandoned entry;
       the second asks C, which reopens only if it still can without B.
  ```

  Two outcomes the prose previously left implicit are now stated outright: a
  deliberately released entry absorbs one Forward press (it can't be deleted,
  only left to soak the traversal), and any re-plant — a new layer or a
  veto's re-arm — truncates every parked Forward watch above it.

## 0.2.0

### Minor Changes

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

- [#46](https://github.com/dunky-dev/ui/pull/46) [`5a58c2d`](https://github.com/dunky-dev/ui/commit/5a58c2dd2afcea9c02d54262beaec6e5a95e9e95) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Rename `@dunky.dev/dom-navigation` to `@dunky.dev/browser-navigation`.

  The util guards the browser's session history — Back, Forward, reload — and
  never touches the DOM, so the old name pointed at the wrong layer. The API is
  unchanged; only the package name moves:

  ```diff
  -import { interceptBackNavigation } from '@dunky.dev/dom-navigation'
  +import { interceptBackNavigation } from '@dunky.dev/browser-navigation'
  ```

  `@dunky.dev/dom-navigation` will receive no further releases.

### Patch Changes

- [#39](https://github.com/dunky-dev/ui/pull/39) [`a33e149`](https://github.com/dunky-dev/ui/commit/a33e1496a5e2440c968002efc493f850ea9db26a) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Fix: releasing a whole guarded stack in one turn (close-all, a route change,
  an unmounting subtree) only consumed the topmost guard's entry — each entry
  beneath stayed behind and silently swallowed a later browser Back.

  ```ts
  const releaseOuter = interceptBackNavigation(() => closeOuter())
  const releaseInner = interceptBackNavigation(() => closeInner())

  // "close all" — both released in the same turn
  releaseInner()
  releaseOuter()

  history.back()
  // before: ❌ nothing happens — spent on outer's leftover entry
  // after:  ✅ leaves the page — every freed entry was consumed
  ```

  Release order doesn't matter, and an entry genuinely buried under later
  in-app navigation is still left alone.

- [#39](https://github.com/dunky-dev/ui/pull/39) [`8ae32b4`](https://github.com/dunky-dev/ui/commit/8ae32b422e66b9bf9810a85d299a730205f2f1ca) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Two `interceptBackNavigation` hardenings:
  - Released entries are now consumed one traversal at a time — a chain of
    single pops — instead of one `history.go(-n)` jump. Entries below the
    current one are opaque, so a multi-step jump could cross history entries
    the app planted itself; the chain stops at the first entry that isn't the
    guard's to spend. A released entry buried beneath a live layer is also no
    longer able to swallow a Back: the press that surfaces it unwinds the live
    layer and consumes the dead entry in one go.
  - An `onBack` that throws now counts as a decline: the guard re-arms so the
    next Back still reaches the layer, and the error propagates instead of
    aborting the unwind in an inconsistent state.

- [#48](https://github.com/dunky-dev/ui/pull/48) [`979c3c7`](https://github.com/dunky-dev/ui/commit/979c3c7a03e793d98ea33fd7392a6d87fe84517a) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Fix two `interceptBackNavigation` bugs around releases:
  - Two guards released in the same synchronous turn no longer strand the
    shared `popstate` listener: the first release's idle check could detach it
    while the second release's self-caused pop was still in flight, leaving
    that pop uncounted — the next guard's first Back press was then misread as
    self-caused and its `onBack` never fired.
  - A guard that releases itself inside its own `onBack` (a legal use of the
    public API) no longer evicts the guard beneath it: the handler now removes
    the answering guard by identity instead of positionally, so lower layers
    stay armed and keep their history entries.

## 0.1.1

### Patch Changes

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

## 0.1.0

### Minor Changes

- [#27](https://github.com/dunky-dev/ui/pull/27) [`f0d5ca4`](https://github.com/dunky-dev/ui/commit/f0d5ca4432774f5f88c1f0cc54ad7410a3c7d2fb) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Add `closeOnBack` — the host's Back navigation closes the open dialog instead
  of leaving the page, the pattern mobile users expect from a full-screen
  overlay. Off by default.

  ```tsx
  <Dialog closeOnBack onBackNavigation={event => /* preventDefault() vetoes */ {}}>
    …
  </Dialog>
  ```

  It follows the shared dismissal contract: `onBackNavigation` fires first and
  `preventDefault()` vetoes, a controlled dialog only records the intent (close
  it from your own state as usual), a nested stack unwinds one layer per Back
  press, and it composes with `animated` (Back plays the exit animation). The
  decision — gate, veto, controlled — lives once in the core's `backNavigate`;
  substrates only wire their host's mechanics to it.

  The web mechanics ship as their own framework-free util,
  `@dunky.dev/dom-navigation` (`interceptBackNavigation`) — a session
  history guard any overlaid layer can use, not just the dialog: opening
  plants a guard entry in the session history and Back consumes it. A dialog
  closed any other way consumes its own entry too, so no leftover ever swallows
  a later Back press — including across reopen races (React StrictMode's
  double-invoked effects adopt the entry in place rather than queueing a
  history traversal, which browsers don't reliably deliver once another entry
  is pushed).
