# @dunky.dev/react-dialog

## 0.4.0

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

- Updated dependencies [[`ffa4fad`](https://github.com/dunky-dev/ui/commit/ffa4fada7719daa8661adab52c20952f3d8d7559), [`c35d1ab`](https://github.com/dunky-dev/ui/commit/c35d1abe05f07f6df741f297c0d8b35bd0a1e03c), [`6b51d8d`](https://github.com/dunky-dev/ui/commit/6b51d8de4d1069863a56c7ac5f74cb3c8dfaa20c), [`5a58c2d`](https://github.com/dunky-dev/ui/commit/5a58c2dd2afcea9c02d54262beaec6e5a95e9e95), [`4208569`](https://github.com/dunky-dev/ui/commit/4208569ecad4b141ecdf814ae195bcc0e14a7afc)]:
  - @dunky.dev/dom-dialog@0.2.0
  - @dunky.dev/dialog@0.4.0
  - @dunky.dev/react-use-scroll-lock@0.1.2
  - @dunky.dev/react-use-focus-trap@0.1.2

## 0.3.0

### Minor Changes

- [#40](https://github.com/dunky-dev/ui/pull/40) [`148ee66`](https://github.com/dunky-dev/ui/commit/148ee66481f70852734a77814643814af5b339fc) Thanks [@ivanbanov](https://github.com/ivanbanov)! - `Dialog.Content` now renders a `<div>` carrying the `dialog` (or `alertdialog`) role instead of the native `<dialog>` element. Consumers styling `dialog { ... }` should target the part directly (or its role), and a forwarded ref is now an `HTMLDivElement`; `...props` accept `ComponentProps<'div'>`.

  The dialog window is the initial focus target — focusable in script, out of the tab order — which needs `tabindex="-1"`, and HTML states that [the `tabindex` attribute must not be specified on `dialog` elements](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element). The native element would only pay off through `showModal()`, and this contract deliberately keeps modality, dismissal, and focus in the core machine rather than splitting authority with the browser's built-in behavior — so the element brought nothing but a conformance violation. Nothing about the exposed semantics changes: the same role, `aria-modal`, name, description, and focus behavior as before. UA `<dialog>` resets (`position: static`, `border: none`) are no longer needed in consumer styles.

### Patch Changes

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

- [#44](https://github.com/dunky-dev/ui/pull/44) [`e3a5e96`](https://github.com/dunky-dev/ui/commit/e3a5e96b13499b3a0b1dc49d6ec195f67b2d0071) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Update the state-machine packages to the 2026-08-22 release: runtime `0.3.3`,
  bindings `0.4.1`, utils `0.4.0`, and the React (`0.3.4`), Solid (`0.3.0`), and
  native (`0.4.0`) adapters.

  Every range moves together on purpose. The published adapters pin the runtime
  exactly (`@dunky.dev/state-machine: 0.3.3`), so a package left on an older
  caret would have pulled a second physical copy of the runtime into a consumer's
  install — the dependency diamond `ARCHITECTURE.md` warns about, where anything
  identity-sensitive (a singleton, a `WeakMap`, module-level state) silently stops
  agreeing across the two copies. `@dunky.dev/controllable` was the oldest
  offender, still on `^0.1.0`; the tree now resolves to a single runtime.

- Updated dependencies [[`e3a5e96`](https://github.com/dunky-dev/ui/commit/e3a5e96b13499b3a0b1dc49d6ec195f67b2d0071), [`e3a5e96`](https://github.com/dunky-dev/ui/commit/e3a5e96b13499b3a0b1dc49d6ec195f67b2d0071)]:
  - @dunky.dev/dom-dialog@0.1.0
  - @dunky.dev/dialog@0.3.1

## 0.2.2

### Patch Changes

- [#33](https://github.com/dunky-dev/ui/pull/33) [`21cc0b8`](https://github.com/dunky-dev/ui/commit/21cc0b82d858789ea0e6a90a7e8d65f4a773d669) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Add `@dunky.dev/native-dialog` — the React Native binding for the dialog, the
  first package of the native substrate. Same compound API as the React
  binding; the parts translate the core's logical bindings into React Native
  props (`onPress`, `accessibilityState`, `accessibilityViewIsModal`), the
  Portal renders the host's `Modal`, and the hardware Back press reports
  through the core `closeOnBack` contract.

  ```tsx
  import { Dialog } from '@dunky.dev/native-dialog'
  ;<Dialog>
    <Dialog.Trigger>
      <Text>Open</Text>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop />
      <Dialog.Viewport>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Close>
            <Text>Close</Text>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
  ```

  `@dunky.dev/dialog` now exports `dialogEffects` — the substrate-free effect
  list (the controlled-open echo) every binding consumes instead of
  re-implementing, so the controlled contract can't fork between substrates. A
  substrate composes its host-specific effects around it (the React binding
  adds its DOM Escape listener); the echo itself is written once, in core.

- [#33](https://github.com/dunky-dev/ui/pull/33) [`b02dc81`](https://github.com/dunky-dev/ui/commit/b02dc81c524e19dd660bf342ed9583ee91e6b6ee) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Update the state-machine runtime packages to 0.3.2.

  For `@dunky.dev/native-dialog` this fixes a native crash on Android: the runtime's `normalize` used to emit the machine's `role: 'dialog'` as the legacy `accessibilityRole` prop, which Android rejects at mount (`Invalid accessibility role value: dialog`). It now emits React Native's web-aligned `role` prop, which also restores the intended semantics on iOS (VoiceOver previously got no dialog traits at all). `hidden` now lands on `aria-hidden` instead of being silently ignored.

- Updated dependencies [[`21cc0b8`](https://github.com/dunky-dev/ui/commit/21cc0b82d858789ea0e6a90a7e8d65f4a773d669), [`b02dc81`](https://github.com/dunky-dev/ui/commit/b02dc81c524e19dd660bf342ed9583ee91e6b6ee)]:
  - @dunky.dev/dialog@0.3.0

## 0.2.1

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

- Updated dependencies [[`548ef7c`](https://github.com/dunky-dev/ui/commit/548ef7cd6e10263e02e9d0203292d61621f17a8d), [`827c079`](https://github.com/dunky-dev/ui/commit/827c079716e6dcb5d78e9341285627137cf0ade3)]:
  - @dunky.dev/dom-overlay@0.1.1
  - @dunky.dev/dialog@0.2.1
  - @dunky.dev/dom-navigation@0.1.1
  - @dunky.dev/react-use-focus-trap@0.1.1
  - @dunky.dev/react-use-scroll-lock@0.1.1

## 0.2.0

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

### Patch Changes

- [#26](https://github.com/dunky-dev/ui/pull/26) [`0e259c6`](https://github.com/dunky-dev/ui/commit/0e259c6a7e6fa0e032ecce094820db6dc4319734) Thanks [@ivanbanov](https://github.com/ivanbanov)! - A modal dialog no longer marks its own backdrop `aria-hidden` + `inert`. The
  assistive-tech containment walks up from the dialog window and hides every
  sibling along the way — and the backdrop is portalled alongside the viewport,
  outside the window's subtree yet part of the same layer, so the topmost
  dialog was hiding its own backdrop. `inert` blocks pointer hit-testing, so
  pressing the backdrop to dismiss silently did nothing in a real browser
  (test-runner `.click()` bypasses hit-testing, which is why suites never
  caught it). A dialog's layer now excepts its own backdrop from the
  containment; everything beneath the topmost layer — lower dialogs' backdrops
  included — stays hidden and inert as before.

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

- Updated dependencies [[`f0d5ca4`](https://github.com/dunky-dev/ui/commit/f0d5ca4432774f5f88c1f0cc54ad7410a3c7d2fb), [`f4628e7`](https://github.com/dunky-dev/ui/commit/f4628e733f657695099b54991bd29c0487293557), [`89ed3f7`](https://github.com/dunky-dev/ui/commit/89ed3f7f9c1e5c6909ff2cfaa4c5ed952846518e)]:
  - @dunky.dev/dialog@0.2.0
  - @dunky.dev/dom-navigation@0.1.0
  - @dunky.dev/dom-overlay@0.1.0

## 0.1.0

### Minor Changes

- [#4](https://github.com/dunky-dev/ui/pull/4) [`3d6981c`](https://github.com/dunky-dev/ui/commit/3d6981c187d20d558c8487391be099acb75c7be4) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Add the Dialog primitive — a modal dialog following the WAI-ARIA APG pattern,
  shipped as an agnostic core (`@dunky.dev/dialog`) plus a React binding
  (`@dunky.dev/react-dialog`).

  ```tsx
  import { Dialog } from '@dunky.dev/react-dialog'

  function App() {
    return (
      <Dialog onOpenChange={console.log}>
        <Dialog.Trigger>Delete...</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Viewport>
            <Dialog.Content>
              <Dialog.Title>Delete file?</Dialog.Title>
              <Dialog.Description>This cannot be undone.</Dialog.Description>
              <Dialog.Close>Cancel</Dialog.Close>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    )
  }
  ```

### Patch Changes

- [#25](https://github.com/dunky-dev/ui/pull/25) [`a009501`](https://github.com/dunky-dev/ui/commit/a0095016b4d9b88c0808294a2f9dd0c33609ba14) Thanks [@ivanbanov](https://github.com/ivanbanov)! - The dialog's Close part is now always the focus cycle's last stop, wherever
  it renders — a visually-first close button no longer interrupts the
  content's tab order.

  Mechanism: `trapFocus` gains a `last` option resolving the cycle's final
  stop, and now steps focus through the cycle itself on every Tab instead of
  only guarding the edges — a logical order can diverge from DOM order, so
  native tabbing can't be trusted mid-cycle. The dialog's core stays
  substrate-agnostic: Close joins the derived part ids (`ids.close`), and each
  substrate's containment resolves the element by that id.

- [#17](https://github.com/dunky-dev/ui/pull/17) [`f339cd5`](https://github.com/dunky-dev/ui/commit/f339cd53e5bb62742a0065c262bea573a9692bbe) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Make controlled `open` truly controlled. A dialog with the `open` prop set
  never opens or closes on its own — it follows the prop alone. `onOpenChange`
  now means exactly what it says: it fires on every actual open ⇄ close change,
  whatever drove it (including a prop flip), and never for a dismissal that
  changed nothing. Dismissal decisions happen at their source: `preventDefault()`
  in `onEscapeKeyDown` / `onInteractOutside`, and your own handlers on
  `Dialog.Trigger` / `Dialog.Close`.

  ```tsx
  const [open, setOpen] = useState(true)

  <Dialog
    open={open}
    onOpenChange={setOpen} // fires only when open actually changed
    onEscapeKeyDown={(e) => (canClose ? setOpen(false) : e.preventDefault())}
  >
  ```

  Controlled-ness is live, not fixed at mount: set `open` back to `undefined`
  and the dialog takes over uncontrolled, right where it stands; supply the
  prop again to retake control.

  Previously an internal dismissal closed a controlled dialog immediately and
  left it out of sync with the prop until the next flip.

  `@dunky.dev/react-dialog` also now declares `react-dom` as a peer dependency
  (it renders through a portal — strict installs previously couldn't resolve
  it), and an explicit `id={undefined}` no longer discards the generated
  SSR-safe id.

- [#24](https://github.com/dunky-dev/ui/pull/24) [`44ca139`](https://github.com/dunky-dev/ui/commit/44ca139ee3f2097ccb1be6496d92e21040d6a531) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Internal dependencies on sibling workspace packages are now pinned to an
  exact version instead of a caret range.

  Every package here versions independently — nothing is forced to share a
  version number with anything else. A caret range between two packages that
  both sit above a shared dependency lets a consumer's install resolve to two
  different physical copies of it once those packages' required ranges drift
  apart, silently breaking anything identity-sensitive in that shared
  dependency (a singleton, a `WeakMap`, module-level state). Pinning exact
  collapses that to one resolvable version: a mismatch now fails at publish
  time instead of surfacing as a runtime bug in a consumer's app.

- Updated dependencies [[`a009501`](https://github.com/dunky-dev/ui/commit/a0095016b4d9b88c0808294a2f9dd0c33609ba14), [`f339cd5`](https://github.com/dunky-dev/ui/commit/f339cd53e5bb62742a0065c262bea573a9692bbe), [`3d6981c`](https://github.com/dunky-dev/ui/commit/3d6981c187d20d558c8487391be099acb75c7be4), [`599ff3e`](https://github.com/dunky-dev/ui/commit/599ff3e985dd596c8a3201fe3c78b02b2d183082), [`44ca139`](https://github.com/dunky-dev/ui/commit/44ca139ee3f2097ccb1be6496d92e21040d6a531), [`599ff3e`](https://github.com/dunky-dev/ui/commit/599ff3e985dd596c8a3201fe3c78b02b2d183082)]:
  - @dunky.dev/dialog@0.1.0
  - @dunky.dev/react-use-focus-trap@0.1.0
  - @dunky.dev/react-use-scroll-lock@0.1.0
