# @dunky.dev/react-use-scroll-lock

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
