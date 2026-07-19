---
'@dunky.dev/react-dialog': patch
---

A modal dialog no longer marks its own backdrop `aria-hidden` + `inert`. The
assistive-tech containment walks up from the dialog window and hides every
sibling along the way — and the backdrop is portalled alongside the viewport,
outside the window's subtree yet part of the same layer, so the topmost
dialog was hiding its own backdrop. `inert` blocks pointer hit-testing, so
pressing the backdrop to dismiss silently did nothing in a real browser
(test-runner `.click()` bypasses hit-testing, which is why suites never
caught it). A dialog's layer now excepts its own backdrop from the
containment; everything beneath the topmost layer — lower dialogs' backdrops
included — stays hidden and inert as before.
