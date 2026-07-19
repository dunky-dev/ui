# @dunky.dev/dialog

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

- Updated dependencies [[`ee163cb`](https://github.com/dunky-dev/ui/commit/ee163cbfcf57c3da3ae7bb162b6b108b1e83294d)]:
  - @dunky.dev/controllable@0.1.0
