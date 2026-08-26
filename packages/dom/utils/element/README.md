# @dunky.dev/dom-element

Framework-free predicates about a single element — the DOM questions more than
one primitive has to ask, answered once so the answers can't drift.

Two facets of "would a browser actually focus this element":

- `isRendered(element)` — did it render? Presence in the DOM is not enough: an
  element inside a collapsed section still answers `querySelector`, but
  `focus()` on it does nothing and reports nothing.
- `isFocusable(element)` — is nothing barring it? Disabling and inertness also
  arrive from ancestors (`fieldset[disabled]`, `[inert]`), which a selector's
  own-attribute checks can't see.

## Install

```sh
npm install @dunky.dev/dom-element
```

## Usage

```ts
import { isFocusable, isRendered } from '@dunky.dev/dom-element'

// Pick the first field a browser would really focus, not the first match.
for (const field of content.querySelectorAll('input, select, textarea')) {
  if (isFocusable(field) && isRendered(field)) {
    field.focus()
    break
  }
}
```

`isRendered` checks: the `hidden` attribute (including `hidden="until-found"`),
`display: none` on the element or any ancestor, `visibility: hidden | collapse`,
and being detached. Not checked: `opacity: 0` and `content-visibility` — those
render, and rendering is what decides focusability.

`isFocusable` checks: `:disabled` (own attribute or an ancestor
`fieldset[disabled]`, keeping the native exception for controls in its first
`legend`) and `[inert]` on the element or any ancestor. Rendering is
`isRendered`'s question — the facets compose.
