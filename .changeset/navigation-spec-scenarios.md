---
'@dunky.dev/browser-navigation': patch
---

`SPEC.md` (shipped with the package) gains a Scenarios section: 26 compact
traces of `interceptBackNavigation` and `watchSpentEntry` behavior, grouped
by one layer, release and consumption, forward/claims/reload, stacked
layers, and timing edges.

The behavior contract was already fully stated, but as one mechanism per
prose bullet — nothing let a reader replay a concrete flow end to end.
Each trace is a replayable episode in the module's own vocabulary (`arm`,
`release`, `Back`, `Forward`), e.g.:

```
arm A -> arm B -> arm C -> Back -> release B -> Forward -> Forward
  => the Back closes C; the first Forward soaks into B's abandoned entry;
     the second asks C, which reopens only if it still can without B.
```

Two outcomes the prose previously left implicit are now stated outright: a
deliberately released entry absorbs one Forward press (it can't be deleted,
only left to soak the traversal), and any re-plant — a new layer or a
veto's re-arm — truncates every parked Forward watch above it.
