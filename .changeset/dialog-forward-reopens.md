---
'@dunky.dev/dom-navigation': minor
'@dunky.dev/dialog': minor
'@dunky.dev/react-dialog': minor
---

`closeOnBack` is now symmetric: the browser's Forward reopens what Back
closed. The history entry a Back press spends survives in the forward stack
and keeps marking the dialog's open ground — traversing forward into it
reopens the dialog, guarded again for the next Back. Reopening through the
trigger instead plants a fresh entry, exactly like navigating after a Back.
No new setting: back-close and forward-reopen are one behavior, so the
existing `closeOnBack` gates both.

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
guard re-arms on that entry in place. Layers that don't pass `onForward`
(the Vue dialog, for now) behave exactly as before.

Web-mechanics caveats, spec'd in the navigation util and the React dialog:
a controlled dialog's Back-close is completed by the consumer rather than
the press, so its entry is consumed and Forward has nothing to re-enter;
and the Forward watch lives in script, so it doesn't survive a reload.
