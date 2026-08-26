---
'@dunky.dev/dom-element': minor
---

New package: `@dunky.dev/dom-element`, framework-free predicates about a single
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

It's a package of its own because two utils have to agree on the answer:
`@dunky.dev/dom-focus-trap` filters its Tab cycle with it and
`@dunky.dev/dom-overlay` filters its initial-focus candidates, both guarding
against the same silent `focus()` no-op.
