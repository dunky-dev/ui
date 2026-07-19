# @dunky.dev/react-use-focus-trap

## 0.1.0

### Minor Changes

- [#4](https://github.com/dunky-dev/ui/pull/4) [`599ff3e`](https://github.com/dunky-dev/ui/commit/599ff3e985dd596c8a3201fe3c78b02b2d183082) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Add focus-trap — Tab / Shift+Tab containment for a subtree: focus wraps at both
  ends and never tabs out; Tab is a no-op with no focusables. Ships as the
  framework-free `@dunky.dev/dom-focus-trap` (`trapFocus(container, { enabled })`)
  and its React binding `@dunky.dev/react-use-focus-trap`
  (`useFocusTrap(ref, { enabled })`), which traps while the component is mounted.

  ```tsx
  import { useRef } from 'react'
  import { useFocusTrap } from '@dunky.dev/react-use-focus-trap'

  function Panel() {
    const ref = useRef<HTMLDivElement>(null)
    useFocusTrap(ref) // Tab cycles inside the panel while it is mounted

    return (
      <div ref={ref} tabIndex={-1} role='dialog'>
        <button type='button'>First</button>
        <button type='button'>Last</button>
      </div>
    )
  }
  ```

  ```ts
  // Framework-free: returns a release function; `enabled` is re-checked per Tab.
  import { trapFocus } from '@dunky.dev/dom-focus-trap'

  const release = trapFocus(panel, { enabled: () => isTopmost(panel) })
  release()
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

- Updated dependencies [[`a009501`](https://github.com/dunky-dev/ui/commit/a0095016b4d9b88c0808294a2f9dd0c33609ba14), [`599ff3e`](https://github.com/dunky-dev/ui/commit/599ff3e985dd596c8a3201fe3c78b02b2d183082)]:
  - @dunky.dev/dom-focus-trap@0.1.0
