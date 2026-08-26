# SPEC / DOM / Element

## Overview

Framework-free predicates about a single element — the DOM questions more than
one primitive has to ask, answered once so the answers can't drift. Today that
is two questions about whether a browser would actually focus an element: did
it render, and is it barred?

Two packages ask them for the same reason. `@dunky.dev/dom-focus-trap` filters
the Tab cycle, and `@dunky.dev/dom-overlay` filters the initial-focus
candidates; both are guarding against the same silent failure — a focus
candidate that looks right to a selector but refuses `focus()` without saying
so — so they must agree on what counts.

## Behavior

- An element is **rendered** when it is connected, carries no `hidden`
  attribute on itself or an ancestor, computes to neither
  `visibility: hidden` nor `visibility: collapse`, and has no
  `display: none` on itself or any ancestor.
- A detached element is never rendered. It can't take focus, and computed
  style on one reports the property defaults rather than `none`, so nothing
  else in the check would catch it.
- `opacity: 0` and `content-visibility` are out of scope: those render.
  Whether something is _perceivable_ is a different question from whether it
  rendered at all, and only the latter decides focusability.
- An element is **focusable** when nothing bars it from taking focus:
  neither disabled — its own attribute or an ancestor `fieldset[disabled]`,
  with the native exception that controls in the fieldset's first `legend`
  stay enabled — nor inside an `[inert]` element or subtree. A selector's
  own-attribute checks (`:not([disabled])`) can't see either ancestry.
- The facets are deliberately narrow and compose: `isFocusable` doesn't ask
  about rendering, `isRendered` doesn't ask about bars, and the tab order
  (`tabIndex`) stays the caller's question.

## API

| Export                 | Description                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `isRendered(element)`  | Whether the element rendered, and so can take focus, be pressed, or be read out.           |
| `isFocusable(element)` | Whether nothing bars the element from focus: not `:disabled`, not in an `[inert]` subtree. |

## Constraints

- The answer is read from the live DOM on every call — a collapsed section
  opens and closes between two of them.
- No caching and no layout reads: callers run this over every candidate in a
  container, sometimes inside a `preventDefault`-ed keydown.

## Internals

| Position                                                                           | Why                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rendered-ness via a computed-style walk, not `Element.checkVisibility()`           | The API is recent (Chrome/Edge 105+, Firefox 106+, Safari 17.4+) and a caller may resolve candidates after a Tab keydown's `preventDefault()`, so on a browser without it the throw would leave Tab dead entirely; the walk is spec-defined behavior everywhere, and needs no test-environment shim. |
| Not `getClientRects().length` or `offsetParent`                                    | Both are geometry, which test environments report as zeros — so nothing here would be covered. `offsetParent` is also `null` for a `position: fixed` element that is plainly visible, a false negative on exactly the overlay content this guards.                                                   |
| The `hidden` attribute is checked with `closest`, not folded into the display walk | `hidden="until-found"` hides through `content-visibility`, not `display`, so the computed `display` of an element inside one is its own value. The attribute is the only signal.                                                                                                                     |
| Disabling is asked via `element.matches(':disabled')`, not the IDL property        | The property reflects only the element's own attribute and misses `fieldset[disabled]` ancestry; the pseudo-class resolves it — first-`legend` exception included — for free.                                                                                                                        |
