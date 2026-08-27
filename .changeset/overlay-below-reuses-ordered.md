---
'@dunky.dev/overlay': patch
---

Internal cleanup: `below(id)` now derives "the layers beneath" from the same
`ordered()` ranking the rest of the stack uses — everything after the layer in
topmost-first order — instead of carrying a second copy of the depth/open-order
comparison. One ranking rule, written once. No behavior change.
