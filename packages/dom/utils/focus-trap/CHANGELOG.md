# @dunky.dev/dom-focus-trap

## 0.1.0

### Minor Changes

- [#25](https://github.com/dunky-dev/ui/pull/25) [`a009501`](https://github.com/dunky-dev/ui/commit/a0095016b4d9b88c0808294a2f9dd0c33609ba14) Thanks [@ivanbanov](https://github.com/ivanbanov)! - The dialog's Close part is now always the focus cycle's last stop, wherever
  it renders — a visually-first close button no longer interrupts the
  content's tab order.

  Mechanism: `trapFocus` gains a `last` option resolving the cycle's final
  stop, and now steps focus through the cycle itself on every Tab instead of
  only guarding the edges — a logical order can diverge from DOM order, so
  native tabbing can't be trusted mid-cycle. The dialog's core stays
  substrate-agnostic: Close joins the derived part ids (`ids.close`), and each
  substrate's containment resolves the element by that id.

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
