---
'@dunky.dev/dom-overlay': patch
---

Internal cleanup: containment (`hideOutside`) and the exit window
(`hideExitingLayer`) now share one hide/undo tracker instead of each keeping
its own copy of the bookkeeping. The two rules the copies could have let
drift — what counts as author-hidden (an existing `inert`, a truthy
`aria-hidden`; `aria-hidden="false"` asserts visible and doesn't count) and
that the undo restores exactly the authored value — are now written once. No
behavior change.
