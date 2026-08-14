// Marks a layer's guard entry in the session history; the value says which
// interceptor owns the entry.
const STATE_KEY = '@dunky.back'

interface BackGuard {
  id: number
  onBack: () => boolean
  onForward: (() => boolean) | undefined
}

// One shared registry + one popstate listener across every layer: a Back
// press pops exactly one entry, so only the interceptor whose guard entry
// vanished may answer — the ones beneath see their entry still current and
// stay armed. That ordering is what makes stacked layers (nested dialogs,
// a drawer under a sheet) unwind one per press with no cross-layer
// bookkeeping.
const guards: BackGuard[] = []
// Guards whose entry a Back press already popped, kept for the way back: the
// popped entry survives in the session's forward stack, and a traversal
// re-entering it is the host's Forward — `onForward` asks the layer to
// reopen. Parked entries always sit above every armed one: parking only ever
// pops topmost entries, and any planted entry truncates the forward stack
// they live in (see plantEntry).
const parked: BackGuard[] = []
let nextGuardId = 0
// Pops this module caused itself (consuming a guard entry on release). The
// browser reports them through the same popstate as a user's Back — count
// them so they are never read as one and unwind another layer.
let swallow = 0

function currentGuardId(): number | undefined {
  const state: unknown = history.state
  if (typeof state !== 'object' || state === null) return undefined
  const id = (state as Record<string, unknown>)[STATE_KEY]
  return typeof id === 'number' ? id : undefined
}

function isArmed(id: number): boolean {
  for (const guard of guards) if (guard.id === id) return true
  return false
}

function parkedIndex(id: number): number {
  for (let index = 0; index < parked.length; index++) {
    if ((parked[index] as BackGuard).id === id) return index
  }
  return -1
}

// Every planted entry truncates the forward stack, taking every parked entry
// with it — the guards watching them have nothing left to hear.
function plantEntry(id: number): void {
  parked.length = 0
  history.pushState({ [STATE_KEY]: id }, '')
}

// The listener detaches only when nothing is left to hear: an in-flight
// self-caused pop (swallow) still needs it even with every guard released.
function detachWhenIdle(): void {
  if (guards.length === 0 && parked.length === 0 && swallow === 0) {
    window.removeEventListener('popstate', onPopState)
  }
}

function onPopState(): void {
  if (swallow > 0) {
    swallow--
    // Self-heal: if our own pop consumed an entry a live guard still needs
    // (it adopted the entry while the traversal was in flight), re-arm it.
    const top = guards[guards.length - 1]
    if (top !== undefined && top.id !== currentGuardId()) {
      plantEntry(top.id)
    }
    detachWhenIdle()
    return
  }
  const current = currentGuardId()
  // A marked entry with no armed owner is forward residue — ground above
  // every armed entry (a plant would have truncated it anywhere else), so
  // nothing may unwind here whichever way the traversal ran. A parked owner
  // means the host re-entered "layer open" ground: offer every crossed guard
  // a reopen, lowest first. A decline — vetoed, or a controlled layer that
  // hasn't followed — stays parked, so a later landing offers again. No
  // owner at all is a dead entry; nothing to do.
  if (current !== undefined && !isArmed(current)) {
    const landed = parkedIndex(current)
    if (landed !== -1) {
      for (let index = parked.length - 1; index >= landed; index--) {
        const guard = parked[index] as BackGuard
        if (guard.onForward?.() === true) {
          // Reopened: re-arm on the entry in place — it is already current,
          // and planting another would truncate the rest of the way forward.
          parked.splice(index, 1)
          guards.push(guard)
        }
      }
    }
    detachWhenIdle()
    return
  }
  // Unwind every guard the traversal jumped over, topmost first — a Back
  // press covers one; a multi-entry jump (history.go(-n)) covers several.
  while (guards.length > 0) {
    const top = guards[guards.length - 1] as BackGuard
    if (top.id === current) break
    if (top.onBack()) {
      guards.pop()
      // The popped entry lives on in the forward stack: park the guard so
      // the host's Forward can reopen the layer.
      if (top.onForward !== undefined) parked.push(top)
      continue
    }
    // Declined — vetoed, or a controlled layer that hasn't followed yet:
    // re-arm the guard entry so the next Back reaches this layer again.
    plantEntry(top.id)
    break
  }
  detachWhenIdle()
}

/**
 * Plants a guard entry in the session history so the host's Back dismisses a
 * layer (a dialog, drawer, sheet — anything overlaid) instead of leaving the
 * page. `onBack` fires when the user pops the entry and returns whether the
 * layer actually closed — a decline re-arms the guard. The returned release
 * (for a layer closed by any other means, or gone for good) consumes a
 * still-current guard entry so it can't swallow the next Back; an entry
 * buried under later navigation is unreachable and left alone.
 *
 * With `onForward`, a Back-closed layer keeps a way back: its popped entry
 * survives in the forward stack, and a traversal re-entering it fires
 * `onForward`, which returns whether the layer actually reopened — the guard
 * re-arms on the entry in place. A decline keeps the watch for a later
 * landing; the watch ends when the layer releases, when a newly planted
 * entry truncates the forward stack, or when a new registration adopts the
 * entry.
 *
 * Consumption is deferred a microtask so a release immediately followed by a
 * re-register in the same synchronous turn nets out to zero traversals: the
 * re-register finds the entry still current but no longer owned and adopts it
 * in place (rewrites the marker), so when the deferred consumption runs the
 * entry is no longer this guard's and no `history.back()` is queued. That
 * matters because a traversal queued by `history.back()` is not reliably
 * delivered once another entry is pushed before it lands; not queuing one in
 * that window removes the race instead of compensating for it. The same
 * adoption is how a layer reopened by Forward re-registers on its own spent
 * entry without a traversal.
 */
export function interceptBackNavigation(
  onBack: () => boolean,
  onForward?: () => boolean,
): () => void {
  const guard: BackGuard = { id: ++nextGuardId, onBack, onForward }
  // Identical (type, listener) pairs dedupe, so attaching is idempotent.
  window.addEventListener('popstate', onPopState)
  const current = currentGuardId()
  guards.push(guard)
  if (current !== undefined && !isArmed(current)) {
    // Adoption steals the entry from a parked watcher too — the ground now
    // belongs to this registration.
    const stale = parkedIndex(current)
    if (stale !== -1) parked.splice(stale, 1)
    history.replaceState({ [STATE_KEY]: guard.id }, '')
  } else {
    plantEntry(guard.id)
  }

  return () => {
    const rest = parked.indexOf(guard)
    if (rest !== -1) {
      parked.splice(rest, 1)
    } else {
      const index = guards.indexOf(guard)
      if (index === -1) return // already unwound by the Back press itself
      guards.splice(index, 1)
    }
    queueMicrotask(() => {
      // Still ours and still current: nobody adopted it and no Back popped
      // it — consume the entry. The listener stays until the pop lands.
      if (currentGuardId() === guard.id) {
        swallow++
        history.back()
      } else {
        detachWhenIdle()
      }
    })
  }
}
