---
'@dunky.dev/dom-navigation': minor
'@dunky.dev/dom-dialog': minor
'@dunky.dev/dialog': minor
'@dunky.dev/react-dialog': minor
'@dunky.dev/solid-dialog': minor
---

`closeOnBack` is now symmetric: the browser's Forward reopens what Back
closed. The history entry a Back press spends survives in the forward stack
and keeps marking the dialog's open ground — traversing forward into it
reopens the dialog, guarded again for the next Back. Reopening through the
trigger instead plants a fresh entry, exactly like navigating after a Back.
No new setting: back-close and forward-reopen are one behavior, so the
existing `closeOnBack` gates both. Both DOM substrates get it — React and
Solid — from the same code.

The reopen follows the shared dismissal contract — a new
`onForwardNavigation` callback fires first and `preventDefault()` vetoes,
and a controlled dialog only records the intent:

```tsx
<Dialog
  closeOnBack
  onForwardNavigation={event => {
    // e.g. decline the history-driven reopen while a form is mid-submit
    if (submitting) event?.preventDefault?.()
  }}
>
```

Under the hood, `interceptBackNavigation(onBack, onForward?)` grew the
optional second callback: a Back-closed guard parks instead of dropping, a
traversal re-entering its spent entry asks the layer to reopen, and the
guard re-arms on that entry in place. A layer that passes no `onForward`
behaves exactly as before.

`guardBackNavigation` (`@dunky.dev/dom-dialog`) now returns
`{ sync, release }` rather than a bare disposer: the guard outlives the open
state — that is the whole point of the Forward watch — so a host reports
every change through `sync(open)` and ends the episode with `release()`.
Whether a close parks the registration or releases it stays a DOM-layer
decision, made once for every substrate.

Web-mechanics caveats, spec'd in the navigation util and both DOM bindings:
a controlled dialog's Back-close is completed by the consumer rather than
the press, so its entry is consumed and Forward has nothing to re-enter;
and the Forward watch lives in script, so it doesn't survive a reload.
