# SPEC / DOM / Navigation

## Overview

Framework-free browser-navigation helpers. Today that is one:
`interceptBackNavigation`, the web mechanics behind a layer's Back dismissal
(the dialog contract's `closeOnBack`) — a guard entry planted in the session
history so the browser's Back closes an overlaid layer (dialog, drawer,
sheet) instead of leaving the page.

## Behavior

- **Arming**: registering plants a guard entry in the session history — or
  adopts a still-current entry no live guard owns (see the
  release/re-register window below).
- **A Back press pops exactly one entry**, so only the interceptor whose
  entry vanished answers; guards beneath see their entry still current and
  stay armed. Stacked layers unwind one per press with no cross-layer
  bookkeeping. A multi-entry jump (`history.go(-n)`) unwinds every guard the
  traversal crossed, topmost first.
- **`onBack` returns whether the layer actually closed.** A decline —
  vetoed, or a controlled layer whose consumer hasn't followed — re-arms the
  guard entry, so the next Back reaches the same layer again.
- **Release** (the layer closed by any other means) consumes a still-current
  guard entry so it can't swallow the next Back. An entry buried under later
  in-app navigation is unreachable and left alone — Back then both navigates
  and closes the layer.
- **Release then re-register in the same synchronous turn** nets out to zero
  traversals: the re-register adopts the entry in place, and the deferred
  consumption finds it no longer owned and queues nothing.
- **Self-caused pops** — a release consuming its own entry — report through
  the same `popstate` as a user's Back; they are counted and never read as
  one.

### Reload

The guard entry survives a reload; the layer's open-state doesn't, leaving a
dead same-URL entry the first Back appears to spend on nothing. That is out
of this package's scope by design: on reload only the host knows whether the
layer should reopen. A layer that must survive reload (or be shareable, or
reopen on Forward) keeps its open-state in the URL and derives itself from
it — Back then closes for free and needs no interceptor.

## API

| Export                            | Description                                                                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `interceptBackNavigation(onBack)` | Arms a guard; `onBack` fires when the user pops it and returns whether the layer closed. Returns the release for a layer closed by other means. |

## Constraints

- One shared registry and one `popstate` listener module-wide — the
  one-pop-one-guard ordering is the whole unwinding contract.
- The listener detaches only when nothing is left to hear: no guards and no
  in-flight self-caused pop.

## Internals

| Position                                                                        | Why                                                                                                                                                                                                |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One registry + one listener across every layer                                  | A Back pops one entry; only the guard whose entry vanished may answer — that ordering is what unwinds stacks one press at a time with no cross-layer bookkeeping.                                  |
| Consumption is deferred a microtask                                             | A queued `history.back()` is not reliably delivered once another entry is pushed before it lands; letting a same-turn re-register adopt the entry removes the race instead of compensating for it. |
| Self-caused pops are counted, and re-arm a live guard whose entry they consumed | The browser reports them through the same `popstate` as a user's Back; uncounted, one release would unwind another layer.                                                                          |
