# @dunky.dev/dom-back-navigation

Framework-free session-history guard. `interceptBackNavigation` plants a
guard entry in the session history so the host's Back dismisses a layer — a
dialog, drawer, sheet, anything overlaid on the page — instead of leaving it,
the pattern mobile users expect from a full-screen overlay.

Guards stack in open order and one shared popstate listener arbitrates: a
Back press pops exactly one entry, so stacked layers unwind one per press
with no cross-layer bookkeeping. A declined close (a veto, or a controlled
layer that decides later) re-arms the entry; releasing consumes a
still-current entry so it can't swallow the next Back; and a synchronous
release + re-register (StrictMode's double-invoked effects, a same-commit
reopen) adopts the entry in place — no history traversal is queued, so there
is no race to compensate for. An entry buried under later in-app navigation
is unreachable and left alone.

Substrate bindings wrap this — e.g. `@dunky.dev/react-dialog`'s
`closeOnBack` — so every framework inherits identical Back semantics.

## Install

```sh
npm install @dunky.dev/dom-back-navigation
```

## Usage

```ts
import { interceptBackNavigation } from '@dunky.dev/dom-back-navigation'

// On open: plant the guard. `onBack` returns whether the layer closed —
// returning false (vetoed, deferred) re-arms the guard for the next press.
const release = interceptBackNavigation(() => {
  requestClose()
  return isClosed()
})

// On close by any other means: consume the guard entry.
release()
```
