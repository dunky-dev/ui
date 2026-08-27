# SPEC / DOM / Press origin

## Overview

Framework-free tracking of where a pointer press began. The browser answers
"where did this press _end_" for free; where it _began_ is gone by the time
`click` fires — a mousedown in one place and a mouseup in another dispatch
`click` on their common ancestor, and nothing on the event says the gesture
started somewhere else. Any surface that treats a click as an "outside press"
misreads a text-selection drag because of exactly that collapse; this package
recovers the origin by capturing it at `pointerdown`, the last moment it is
still observable.

## Behavior

- `trackPressOrigin(element)` listens for `pointerdown` on the document
  (capture phase) and remembers whether the press began inside `element`.
- `startedInside()` answers for the most recent press — it is a reading of
  the latest gesture, not a log.
- Before any press is observed, the answer is `false`.
- `dispose()` detaches the listener; the last answer freezes.

## API

| Export                      | Description                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| `trackPressOrigin(element)` | Starts tracking; returns `{ startedInside, dispose }`.            |
| `PressOriginTracker`        | The returned pair: `startedInside(): boolean`, `dispose(): void`. |

## Constraints

- No framework import, and nothing from this repo — the util sits at the
  bottom of the DOM layer.
- One tracker per tracked element; consumers that need the answer in several
  places share the `startedInside` reference rather than tracking twice.
