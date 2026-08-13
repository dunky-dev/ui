# @dunky.dev/dom-scroll-lock

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

## 0.1.0

### Minor Changes

- [#4](https://github.com/dunky-dev/ui/pull/4) [`599ff3e`](https://github.com/dunky-dev/ui/commit/599ff3e985dd596c8a3201fe3c78b02b2d183082) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Add scroll-lock — a reference-counted scroll lock for any container (the page
  body by default), so overlapping holders release in any order, compensating
  both vanished scrollbars with logical padding. Ships as the framework-free
  `@dunky.dev/dom-scroll-lock` (`lockScroll(target?)`) and its React binding
  `@dunky.dev/react-use-scroll-lock` (`useScrollLock(locked, target?)`), which
  locks while the component is mounted; pass a `target` to scope the lock to a
  container instead of the page.

  ```tsx
  import { useScrollLock } from '@dunky.dev/react-use-scroll-lock'

  // Rendered only while the overlay is open, e.g. {open && <ModalPanel />}
  function ModalPanel({ panelRef }: { panelRef?: React.RefObject<HTMLElement> }) {
    useScrollLock() // locks the page while mounted
    // useScrollLock(true, panelRef?.current) // ...or scope it to a container
    return <div role='dialog'>...</div>
  }
  ```

  ```ts
  // Framework-free: returns a release; the last holder restores the target.
  import { lockScroll } from '@dunky.dev/dom-scroll-lock'

  const releaseBody = lockScroll() // the page body
  const releasePanel = lockScroll(panel) // any scroll container
  releaseBody()
  releasePanel()
  ```
