---
'@dunky.dev/browser-navigation': patch
---

Two `interceptBackNavigation` hardenings:

- Released entries are now consumed one traversal at a time — a chain of
  single pops — instead of one `history.go(-n)` jump. Entries below the
  current one are opaque, so a multi-step jump could cross history entries
  the app planted itself; the chain stops at the first entry that isn't the
  guard's to spend. A released entry buried beneath a live layer is also no
  longer able to swallow a Back: the press that surfaces it unwinds the live
  layer and consumes the dead entry in one go.
- An `onBack` that throws now counts as a decline: the guard re-arms so the
  next Back still reaches the layer, and the error propagates instead of
  aborting the unwind in an inconsistent state.
