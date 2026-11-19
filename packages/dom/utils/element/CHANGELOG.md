# @dunky.dev/dom-element

## 0.1.0

### Minor Changes

- [#50](https://github.com/dunky-dev/ui/pull/50) [`6c249f9`](https://github.com/dunky-dev/ui/commit/6c249f96dd6e3f821d4b71bae250f1d94e40298c) Thanks [@ivanbanov](https://github.com/ivanbanov)! - New package: `@dunky.dev/dom-element`, framework-free predicates about a single
  element.

  `isRendered(element)` answers whether an element actually rendered, and so can
  take focus, be pressed, or be read out. Presence in the DOM is not enough: an
  element inside a collapsed section still answers `querySelector`, but `focus()`
  on it does nothing and reports nothing.

  ```ts
  import { isRendered } from '@dunky.dev/dom-element'

  for (const field of content.querySelectorAll('input, select, textarea')) {
    if (isRendered(field)) {
      field.focus()
      break
    }
  }
  ```

  Checked: the `hidden` attribute (`hidden="until-found"` included),
  `display: none` on the element or any ancestor — `display` doesn't inherit, so
  ancestors are walked — `visibility: hidden | collapse`, and being detached.
  Not checked: `opacity: 0` and `content-visibility`, which do render, and
  rendering is what decides focusability.

  `isFocusable(element)` is the sibling facet: whether anything bars the element
  from taking focus. Disabling and inertness also arrive from ancestors — a
  control inside a `fieldset[disabled]` subtree (with the native exception for
  its first `legend`) or anything inside `[inert]` refuses `focus()` — which a
  selector's own-attribute checks (`:not([disabled])`) can't see. The facets are
  deliberately narrow and compose; the tab order stays the caller's question.

  It's a package of its own because two utils have to agree on the answers:
  `@dunky.dev/dom-focus-trap` filters its Tab cycle with them and
  `@dunky.dev/dom-overlay` filters its initial-focus candidates, both guarding
  against the same silent `focus()` no-op.
