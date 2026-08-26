---
'@dunky.dev/dom-element': minor
'@dunky.dev/dom-focus-trap': patch
'@dunky.dev/dom-overlay': patch
'@dunky.dev/dom-dialog': patch
---

New package `@dunky.dev/dom-element`, and initial focus now skips a candidate
that didn't render.

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

The predicate is its own package because two utils have to agree on it. The
focus trap already filtered its Tab cycle this way; `getInitialFocus` did not,
so a field in a collapsed section won the draw, `focus()` silently no-opped,
and focus fell back to the dialog window — with the fallback's warning unable
to fire, because from its point of view the fallback had succeeded.

`getInitialFocus` now takes the consumer's designated element as a second
argument and filters **every** step of the chain rather than just the last:

```ts
getInitialFocus(content, designatedElement) // designated -> first field -> content
```

That fixes a second case in the same class: an unrendered designated element
used to go straight to the dialog window, skipping the form-field step, which
contradicted the documented "when one is set and can take focus".
