---
'@dunky.dev/overlay': minor
'@dunky.dev/dom-overlay': minor
'@dunky.dev/dom-dialog': minor
'@dunky.dev/dialog': minor
'@dunky.dev/react-dialog': minor
'@dunky.dev/solid-dialog': minor
---

`escapeScope` now exists. It was documented in the dialog specs — one layer per
Escape by default, or the whole stack — but no package implemented it, so
passing it did nothing.

```tsx
// One press closes this dialog and every layer it was opened from.
<Dialog escapeScope='stack'>
```

Only the dialog that receives the Escape gates and vetoes it: its
`closeOnEscape` and `onEscapeKeyDown` decide, exactly as before. Once allowed,
the layers beneath receive a plain close — their own dismissal settings are not
consulted again — unwinding top-down, so focus lands where it was before the
bottom-most dialog opened. A vetoed Escape leaves the whole stack standing.

The mechanics are shared rather than per-dialog: the layer stack gained
`below(id)` (`@dunky.dev/overlay`) and `layersBelow(id)` plus an optional
`Layer.dismiss` (`@dunky.dev/dom-overlay`), so any overlay family can offer a
stack-scoped dismissal on the same stack. A layer that registers no `dismiss`
opts out and stays open, which is what keeps a stack that mixes primitives from
being closed out from under them.

The specs also described a stack-scoped Close _press_; nothing implements that,
so the claim is removed rather than left standing.
