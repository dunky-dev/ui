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
  guard entry, so the next Back reaches the same layer again. An `onBack`
  that throws counts as a decline: the guard re-arms and the error
  propagates.
- **Forward reopens** (opt-in `onForward`): the entry a Back press spent
  still marks the layer's open ground in the forward stack, and a traversal
  re-entering it fires `onForward`, which returns whether the layer actually
  reopened — the guard re-arms on the entry in place, no new entry. A decline
  keeps the watch: a later traversal into the entry offers the reopen again.
  A multi-entry jump across several spent entries reopens each crossed layer,
  lowest first.
- **A marked entry with no live owner never unwinds anything.** Marked ground
  above the armed guards is forward residue, not a Back — landing there either
  reopens the layer or does nothing; it never closes one.
- **A layer torn down mid-episode can still come back.** A layer that was
  Back-closed and then destroyed — a nested layer unmounted along with the
  surroundings that held it — leaves ground it never gave up. The layer that
  takes its place recognizes that ground as its own and reopens from it, even
  though the registration that planted the entry is long gone. Only a sole
  claimant answers: when two layers claim the same ground there is no telling
  which one was there, and reopening the wrong layer is worse than reopening
  none. A layer that _closed_ gave its ground up on purpose, so nothing
  reopens from it — that is what keeps Forward from undoing a dismissal the
  user made deliberately.
- **The Forward watch ends** when the layer releases, when a newly planted
  entry truncates the forward stack the spent entry lives in, or when a new
  registration adopts the entry. A layer that tears itself down inside
  `onBack` — releasing rather than closing — keeps no watch at all: there is
  nothing left to reopen.
- **Release** (the layer closed by any other means, or gone for good)
  consumes a still-current guard entry so it can't swallow the next Back,
  and ends a parked guard's Forward watch. Layers closing together consume
  all their entries, one traversal at a time, until a live guard's entry —
  or navigation this package doesn't own — surfaces. An entry buried under
  later in-app navigation is unreachable and left alone — Back then both
  navigates and closes the layer; a released entry a later Back does surface
  is consumed then, alongside the layer that press unwound.
- **A whole stack closing at once** — a close-all affordance, an unmounting
  subtree — leaves nothing behind either: every entry the layers planted is
  gone, so the next Back goes back rather than being spent on a layer that is
  no longer there. It makes no difference which layer releases first.
- **Release then re-register in the same synchronous turn** nets out to zero
  traversals: the re-register adopts the entry in place, and the deferred
  consumption finds it no longer owned and queues nothing.
- **Self-caused pops** — a release consuming its own entry — report through
  the same `popstate` as a user's Back; they are counted and never read as
  one.

### Reload

The guard entry survives a reload; the layer's open-state doesn't, leaving a
same-URL entry the first Back appears to spend on nothing. What the entry does
keep is the layer's claim on it, so the ground is still recognizable: a
traversal back into it reopens the layer. Nothing opens on load itself — only
a traversal onto that ground does. One memory does not survive: whether the
ground was given up on purpose. A deliberate close is remembered in script (an
entry already in the forward stack can no longer be rewritten), so after a
reload the page cannot tell surrendered ground from lost ground, and a
traversal onto either offers the reopen.

Two things this still doesn't give you: an entry planted before the reload
can't say whether its layer was open when the page went away, so a Back that
lands short of it closes nothing; and the ground is a place in the stack, not a
URL, so it isn't shareable. A layer that must survive reload in its own right
(or be linkable) keeps its open-state in the URL and derives itself from it —
Back then closes for free and needs no interceptor.

## API

| Export                                      | Description                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `interceptBackNavigation(onBack, options?)` | Arms a guard; `onBack` fires when the user pops it and returns whether the layer closed. `options.onForward` fires when a traversal re-enters the popped entry and returns whether the layer reopened. `options.claim` names the ground so a later layer can recognize it. Returns the release — `{ keepClaim: true }` for a layer torn down rather than closed. |
| `watchSpentEntry(claim, reopen)`            | For a closed layer: a landing on spent ground bearing this claim asks it to reopen. Returns the release.                                                                                                                                                                                                                                                         |

## Constraints

- One shared registry and one `popstate` listener module-wide — the
  one-pop-one-guard ordering is the whole unwinding contract.
- Parked entries always sit above every armed entry: parking only ever pops
  topmost entries, and every planted entry truncates the forward stack the
  parked ones live in.
- The listener detaches only when nothing is left to hear: no armed guards, no
  parked watchers, no layer waiting to claim its ground back, no in-flight
  self-caused pop, and no release still waiting on its deferred consumption.
- A claim identifies ground, not an instance: it has to outlive the
  registration that planted the entry, which is the whole point, so it can
  only ever be as precise as the caller's own naming of that ground.
- **Nested layers that open in the same commit unwind outside-in.** Arming
  order is the caller's lifecycle order, and effect-based hosts (React runs
  child effects before parent effects) arm an inner layer that mounts
  already open beneath its parent — the first Back then closes the outer
  layer. A layer that opens after its parent is already mounted unwinds
  inside-out as expected. An ordering signal that isn't mount order is
  tracked separately.

## Internals

| Position                                                                                                                           | Why                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| One registry + one listener across every layer                                                                                     | A Back pops one entry; only the guard whose entry vanished may answer — that ordering is what unwinds stacks one press at a time with no cross-layer bookkeeping.                                                                                                                                                              |
| Consumption is deferred a microtask                                                                                                | A queued `history.back()` is not reliably delivered once another entry is pushed before it lands; letting a same-turn re-register adopt the entry removes the race instead of compensating for it.                                                                                                                             |
| Self-caused pops are counted, and re-arm a live guard whose entry they consumed                                                    | The browser reports them through the same `popstate` as a user's Back; uncounted, one release would unwind another layer.                                                                                                                                                                                                      |
| A Back-closed guard parks instead of dropping; ownership of the landing entry — not traversal direction — decides reopen vs unwind | `popstate` carries no direction. A parked or stale marker can only be forward residue above the armed guards (pushes truncate it everywhere else), so landing on one must never unwind — it would close layers on a Forward.                                                                                                   |
| Reopening re-arms the guard on the spent entry in place                                                                            | The traversal already made the entry current; planting another would truncate the remaining forward stack and stack junk entries.                                                                                                                                                                                              |
| Sibling releases consume entries one traversal at a time, not one `history.go(-n)`                                                 | Entries below the current one are opaque, so a multi-step jump could cross navigation this package doesn't own; chaining single pops — each landing continuing the chain — stops at the first entry that isn't ours to spend. Call order still can't matter: the pending set is order-free.                                    |
| Built on the History API, not the Navigation API                                                                                   | The Navigation API answers natively what this module reconstructs — whose traversal it was and which direction it ran — dissolving the self-caused-pop counting and the direction inference. It is not cross-browser yet (Chromium ships it; Safari and Firefox don't fully); once it is, this module should be rebuilt on it. |
