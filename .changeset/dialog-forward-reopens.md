---
'@dunky.dev/browser-navigation': minor
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

A nested dialog comes back too. Closing the layer it was opened from unmounts
it — machine and all — so the ground it lost to a Back press has no owner left
to reopen it. It reopens anyway: the ground belongs to the dialog's place in
the stack rather than to the instance that planted it, so the dialog that
comes back with its parent recognizes it. Two dialogs at the same place can't
be told apart, and then neither reopens. The same recognition survives a
reload, so a traversal back into that ground reopens the dialog even after the
page went away.

Under the hood, `interceptBackNavigation(onBack, options?)` takes its optional
callbacks as an object and grew `claim`, the name for that ground, plus a
`watchSpentEntry(claim, reopen)` for a closed layer waiting to be recognized.
A Back-closed guard parks instead of dropping, a traversal re-entering its
spent entry asks the layer to reopen, and the guard re-arms on that entry in
place. A layer that passes neither option behaves exactly as before. A layer
that _closed_ gave its ground up on purpose and nothing reopens from it —
Forward never undoes a dismissal the user made deliberately.

`guardBackNavigation` (`@dunky.dev/dom-dialog`) now returns
`{ sync, release }` rather than a bare disposer: the guard outlives the open
state — that is the whole point of the Forward watch — so a host reports
every change through `sync(open)` and ends the episode with `release()`.
Whether a close parks the registration or releases it stays a DOM-layer
decision, made once for every substrate.

One web-mechanics caveat, spec'd in the navigation util and both DOM
bindings: a controlled dialog's Back-close is completed by the consumer
rather than by the press, so its entry is consumed and Forward has nothing to
re-enter.
