# @dunky.dev/dom-element

Framework-free predicates about a single element — the DOM questions more than
one primitive has to ask, answered once so the answers can't drift.

`isRendered(element)` tells you whether an element actually rendered, and so
can take focus, be pressed, or be read out. Presence in the DOM is not enough:
an element inside a collapsed section still answers `querySelector`, but
`focus()` on it does nothing and reports nothing.

## Install

```sh
npm install @dunky.dev/dom-element
```

## Usage

```ts
import { isRendered } from '@dunky.dev/dom-element'

// Pick the first field that can really take focus, not just the first match.
for (const field of content.querySelectorAll('input, select, textarea')) {
  if (isRendered(field)) {
    field.focus()
    break
  }
}
```

Checked: the `hidden` attribute (including `hidden="until-found"`),
`display: none` on the element or any ancestor, `visibility: hidden | collapse`,
and being detached. Not checked: `opacity: 0` and `content-visibility` — those
render, and rendering is what decides focusability.
