# @dunky.dev/dom-focus-trap

## 0.1.3

### Patch Changes

- [#50](https://github.com/dunky-dev/ui/pull/50) [`bbb04da`](https://github.com/dunky-dev/ui/commit/bbb04da6397f5e9a1641cbea9e2eb0c082c2965c) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Focus candidates barred by an ancestor are excluded: controls disabled through
  `fieldset[disabled]` and anything inside `[inert]`.

  `FOCUSABLE_SELECTOR` and the form-field selector gate on an element's own
  attributes (`input:not([disabled])`), but both bars also arrive from
  ancestors, so a barred control satisfied the selector while a browser refuses
  to focus it — silently.

  In the focus trap that was a hard dead end: the Tab keydown is already
  `preventDefault()`-ed when focus is stepped by hand, so every press recomputed
  the same refused target and focus never moved again. The cycle now only holds
  what a browser would actually focus, keeping the native exception that
  controls in a disabled fieldset's first `legend` stay enabled.

  In the initial-focus chain it was the quieter failure mode: the barred field
  won the draw, `focus()` no-opped, and focus fell to the overlay window even
  when a viable field came later. Every candidate — designated element and form
  fields alike — is now also filtered for these bars.

  Both use the new `isFocusable` from `@dunky.dev/dom-element`, beside the
  `isRendered` filter they already shared.

- [#50](https://github.com/dunky-dev/ui/pull/50) [`bfbe863`](https://github.com/dunky-dev/ui/commit/bfbe86307b07bfc8d55207c70cfdc328693e5814) Thanks [@ivanbanov](https://github.com/ivanbanov)! - The Tab cycle's rendered check now comes from `@dunky.dev/dom-element` instead
  of a private copy.

  `@dunky.dev/dom-overlay` needs the same predicate to filter its initial-focus
  candidates, and two packages answering the question separately would drift.
  The check itself is unchanged in intent — a non-rendered element is a no-op to
  focus, so keeping one in the cycle would stall the trap on it — but sharing it
  tightens two cases:
  - A **detached** element is now excluded. It can't take focus, and computed
    style on one reports the property defaults rather than `none`, so the display
    walk alone let it through.
  - A `display: none` ancestor **above the container** now excludes the
    focusables under it. The private copy stopped its walk at the container.
    Nothing inside a hidden container can take focus either way, so this lands on
    the trap's documented behavior for an empty cycle: Tab is a no-op.

- Updated dependencies [[`6c249f9`](https://github.com/dunky-dev/ui/commit/6c249f96dd6e3f821d4b71bae250f1d94e40298c)]:
  - @dunky.dev/dom-element@0.1.0

## 0.1.2

### Patch Changes

- [#39](https://github.com/dunky-dev/ui/pull/39) [`560d539`](https://github.com/dunky-dev/ui/commit/560d539dac5d2ed4b318b9ddad08f9717ddb8f00) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Two fixes to which elements the trap's Tab cycle visits:
  - **Rendered-ness is now decided by a computed-style walk instead of
    `Element.checkVisibility()`.** The API is recent (Chrome/Edge 105+,
    Firefox 106+, Safari 17.4+), and the trap resolves focusables after the Tab
    keydown's `preventDefault()` — on a browser without it, the resulting throw
    left Tab dead entirely. The walk checks the same conditions (`hidden`
    attribute, `visibility: hidden`, `display: none` on the element or an
    ancestor) and works everywhere.
  - **`iframe` and `details > summary` now participate in the cycle.** Browsers
    tab to both, but the trap — which steps focus itself — skipped them, making
    them unreachable by keyboard while trapped. Only a details' first summary is
    matched, since that is the disclosure widget browsers focus.

- [#48](https://github.com/dunky-dev/ui/pull/48) [`6ed64a2`](https://github.com/dunky-dev/ui/commit/6ed64a213a42f2f03d07759afd84b456fd753218) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Make the trap's Tab cycle match what a browser would actually focus.

  Three fixes, all consumer-visible:
  - **The trap now intercepts Tab from anywhere in the document.** The keydown
    listener moved from the container to the document (capture phase), so a Tab
    pressed while focus is still outside — on the trigger, or on `body` — wraps
    into the cycle at the edge instead of following native tab order out of the
    trap. Initial focus on open remains the caller's job.
  - **Non-rendered elements no longer enter the cycle.** Elements hidden via the
    `hidden` attribute, `display: none` (own or ancestor), or
    `visibility: hidden` are filtered out. Focusing a non-rendered element is a
    no-op, so a hidden element in the cycle used to stall the trap on it.
  - **A same-name radio group is one tab stop.** Per the APG radio group
    pattern, the stop is the checked radio, else the group's first; groups are
    scoped by name and form owner. The trap steps focus itself, so it now
    reproduces the browser's grouping instead of visiting every radio.

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
