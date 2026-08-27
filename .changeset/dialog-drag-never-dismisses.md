---
'@dunky.dev/dom-dialog': minor
'@dunky.dev/react-dialog': patch
'@dunky.dev/solid-dialog': patch
---

A text-selection drag no longer dismisses the dialog. A mousedown inside the
window with a mouseup outside it makes the browser fire `click` on their
common ancestor — the viewport or the backdrop — which was indistinguishable
from a genuine outside press by the click's target alone, so selecting text
across the window's edge closed the dialog and lost the form state with it.

Where a press *began* now decides, not where it ended: `@dunky.dev/dom-dialog`
gains `trackPressOrigin(content)`, which captures each press's origin at
`pointerdown` (before the browser collapses the click target), and
`acceptsBackdropPress` / `acceptsViewportPress` take that as a new
`startedInside` argument and refuse the press when the gesture started
inside the window. A press that starts and ends outside still dismisses as
before.
