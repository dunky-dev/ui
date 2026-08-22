# SPEC / DOM / __Name__

## Overview

The DOM half of the __name__, shared by every DOM substrate. Behavior is
[`@dunky.dev/__name__`](../../../core/__name__/SPEC.md)'s; this package owns the
part of the wiring that is specific to the document but not to any framework —
document listeners, ordered focus or stack sequences, and the predicates a part
consults before forwarding an event.

It sits between the DOM utils and the substrate bindings:

```
  @dunky.dev/__name__        core behavior (no DOM)
          |
          v
  @dunky.dev/dom-__name__    this package -- DOM, no framework
          |     ^
          |     +----------- the @dunky.dev/dom-* utils
          v
  @dunky.dev/<substrate>-__name__
```

A `dom/utils/*` package is primitive-agnostic and imports nothing from the
repo. A `dom/components/*` package is the opposite: it is about exactly one
primitive, so it may import that primitive's core package and any DOM util.
What it must not do is import a framework, or another primitive.

TODO(spec): describe what this package owns for the __name__ — one section per
concern, each stating the sequence and why its order is load-bearing.

## API

| Export                | Description                                                       |
| --------------------- | ------------------------------------------------------------------- |
| `dom__Name__Effects`  | Core effects + the document-level ones, as effect tuples.         |

## Constraints

- No framework import, ever — that is the whole point of the layer.
- No decisions of its own. Anything a substrate could answer differently
  belongs in the core machine; what lives here is only the DOM realization of
  a decision already made.
- Every entry point returns its own disposer, and the disposer undoes exactly
  what the call did — substrate lifecycles differ, so nothing may rely on a
  particular teardown order between calls.
- Reads that must stay live are taken as the machine or as accessors, never
  snapshotted at call time.
