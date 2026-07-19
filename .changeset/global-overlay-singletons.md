---
'@dunky.dev/dom-overlay': patch
'@dunky.dev/dom-scroll-lock': patch
---

Anchor the overlay layer stack and the scroll-lock registry on a realm-global
keyed by `Symbol.for`, so they survive the module being loaded more than once in
a single page (duplicate bundles in a monorepo or micro-frontend).

Both were plain module-level singletons. When a bundler ships two copies of the
module — a common monorepo/micro-frontend hazard — each copy got its own stack
and its own lock registry, so their "which layer is topmost" and "is the page
still locked" decisions drifted apart: Escape or an outside press could dismiss
the wrong dialog in a nested stack, and scroll lock could double-lock or leak.
Radix hit the same class of bug with its focus-scope stack
(radix-ui/primitives#2815).

The shared state now resolves through a well-known global symbol, so every
duplicate copy rendezvous on the same instance. It is resolved lazily on first
use, so the packages keep their `sideEffects: false` contract (no import-time
global write). No API change.
