# @dunky.dev/browser-navigation

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
