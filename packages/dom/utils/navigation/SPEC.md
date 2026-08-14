# SPEC / DOM / Navigation

## Overview

Framework-free browser-navigation helpers. Today that is one:
`interceptBackNavigation`, the web mechanics behind a layer's Back dismissal
(the dialog contract's `closeOnBack`) — a guard entry planted in the session
history so the browser's Back closes an overlaid layer (dialog, drawer,
sheet) instead of leaving the page. The entry a Back press pops survives in
the forward stack, so for a layer that opts in, the Forward that re-enters
it reopens the layer.

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
- **Forward reopens** (opt-in `onForward`): the entry a Back press spent
  still marks the layer's open ground in the forward stack, and a traversal
  re-entering it fires `onForward`, which returns whether the layer actually
  reopened — the guard re-arms on the entry in place, no new entry. A decline
  keeps the watch: a later traversal into the entry offers the reopen again.
  A multi-entry jump across several spent entries reopens each crossed layer,
  lowest first.
- **A marked entry with no live owner never unwinds anything.** Marked ground
  above the armed guards is forward residue, not a Back — landing there
  either reopens (a parked watcher owns it) or does nothing (its layer closed
  for good).
- **The Forward watch ends** when the layer releases, when a newly planted
  entry truncates the forward stack the spent entry lives in, or when a new
  registration adopts the entry.
- **Release** (the layer closed by any other means, or gone for good)
  consumes a still-current guard entry so it can't swallow the next Back,
  and ends a parked guard's Forward watch. An entry buried under later
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
layer should reopen. The Forward reopen is a session-lifetime watch for the
same reason — it lives in script, not in the entry. A layer that must
survive reload (or be shareable) keeps its open-state in the URL and derives
itself from it — Back then closes for free and needs no interceptor.

## API

| Export                                        | Description                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `interceptBackNavigation(onBack, onForward?)` | Arms a guard; `onBack` fires when the user pops it and returns whether the layer closed. `onForward` fires when a traversal re-enters the popped entry and returns whether the layer reopened. Returns the release for a layer closed by other means or gone for good. |

## Constraints

- One shared registry and one `popstate` listener module-wide — the
  one-pop-one-guard ordering is the whole unwinding contract.
- Parked entries always sit above every armed entry: parking only ever pops
  topmost entries, and every planted entry truncates the forward stack the
  parked ones live in.
- The listener detaches only when nothing is left to hear: no armed guards,
  no parked watchers, and no in-flight self-caused pop.

## Internals

| Position                                                                                                                           | Why                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One registry + one listener across every layer                                                                                     | A Back pops one entry; only the guard whose entry vanished may answer — that ordering is what unwinds stacks one press at a time with no cross-layer bookkeeping.                                                            |
| Consumption is deferred a microtask                                                                                                | A queued `history.back()` is not reliably delivered once another entry is pushed before it lands; letting a same-turn re-register adopt the entry removes the race instead of compensating for it.                           |
| Self-caused pops are counted, and re-arm a live guard whose entry they consumed                                                    | The browser reports them through the same `popstate` as a user's Back; uncounted, one release would unwind another layer.                                                                                                    |
| A Back-closed guard parks instead of dropping; ownership of the landing entry — not traversal direction — decides reopen vs unwind | `popstate` carries no direction. A parked or stale marker can only be forward residue above the armed guards (pushes truncate it everywhere else), so landing on one must never unwind — it would close layers on a Forward. |
| Reopening re-arms the guard on the spent entry in place                                                                            | The traversal already made the entry current; planting another would truncate the remaining forward stack and stack junk entries.                                                                                            |
