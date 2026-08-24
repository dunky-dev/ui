---
'@dunky.dev/dom-overlay': patch
---

Two fixes to how containment and the exit window treat pre-existing markup:

- Elements marked `aria-hidden="false"` are now hidden behind a modal layer
  like any other, and the authored value is restored on undo. `"false"`
  asserts visible — the opposite of author-hidden — so the previous skip left
  such elements exposed to assistive tech behind an open modal. Only a truthy
  `aria-hidden` (or `inert`) still counts as the author's own hiding.
- `hideExitingLayer` no longer inerts `<html>` when the supplied boundary is
  not an ancestor of the content. A stale or mismatched boundary used to
  exhaust the ancestor walk at the document root and take the whole page out
  for the exit window; the hide now falls back to the content itself.
