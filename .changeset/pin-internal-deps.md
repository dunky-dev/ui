---
'@dunky.dev/dialog': patch
'@dunky.dev/react-dialog': patch
'@dunky.dev/react-use-focus-trap': patch
'@dunky.dev/react-use-scroll-lock': patch
---

Internal dependencies on sibling workspace packages are now pinned to an
exact version instead of a caret range.

Every package here versions independently — nothing is forced to share a
version number with anything else. A caret range between two packages that
both sit above a shared dependency lets a consumer's install resolve to two
different physical copies of it once those packages' required ranges drift
apart, silently breaking anything identity-sensitive in that shared
dependency (a singleton, a `WeakMap`, module-level state). Pinning exact
collapses that to one resolvable version: a mismatch now fails at publish
time instead of surfacing as a runtime bug in a consumer's app.
