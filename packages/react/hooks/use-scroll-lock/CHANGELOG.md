# @dunky.dev/react-use-scroll-lock

## 0.1.2

### Patch Changes

- [#48](https://github.com/dunky-dev/ui/pull/48) [`4208569`](https://github.com/dunky-dev/ui/commit/4208569ecad4b141ecdf814ae195bcc0e14a7afc) Thanks [@ivanbanov](https://github.com/ivanbanov)! - `useScrollLock` now treats a `null` target as "no target yet" and locks
  nothing. Previously `null` collapsed into "the page body", so passing a
  not-yet-resolved element (e.g. `ref.current` on the first run) locked the
  page instead of the intended container — and never corrected itself. An
  omitted target still means the page body.

  Pass the element through something reactive so the lock engages once the
  node resolves — in React hold it in state (a ref populating doesn't
  re-render), in Solid pass a signal-backed element (a plain `ref` read is
  not reactive):

  ```tsx
  // React
  const [panel, setPanel] = useState<HTMLElement | null>(null)
  useScrollLock(open, panel) // locks nothing until the node resolves

  // Solid
  const [panel, setPanel] = createSignal<HTMLElement | null>(null)
  useScrollLock(open, panel)
  ```

- Updated dependencies [[`4208569`](https://github.com/dunky-dev/ui/commit/4208569ecad4b141ecdf814ae195bcc0e14a7afc), [`9d93cfc`](https://github.com/dunky-dev/ui/commit/9d93cfc638c75e8ee8c48a1ad51b2537645680cf)]:
  - @dunky.dev/dom-scroll-lock@0.1.2

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

- Updated dependencies [[`548ef7c`](https://github.com/dunky-dev/ui/commit/548ef7cd6e10263e02e9d0203292d61621f17a8d), [`827c079`](https://github.com/dunky-dev/ui/commit/827c079716e6dcb5d78e9341285627137cf0ade3)]:
  - @dunky.dev/dom-scroll-lock@0.1.1

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

### Patch Changes

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

- Updated dependencies [[`599ff3e`](https://github.com/dunky-dev/ui/commit/599ff3e985dd596c8a3201fe3c78b02b2d183082)]:
  - @dunky.dev/dom-scroll-lock@0.1.0
