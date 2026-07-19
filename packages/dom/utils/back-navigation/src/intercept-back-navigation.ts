// Marks a layer's guard entry in the session history; the value says which
// interceptor owns the entry.
const STATE_KEY = 'dunky.back'

interface BackGuard {
  id: number
  onBack: () => boolean
}

// One shared registry + one popstate listener across every layer: a Back
// press pops exactly one entry, so only the interceptor whose guard entry
// vanished may answer — the ones beneath see their entry still current and
// stay armed. That ordering is what makes stacked layers (nested dialogs,
// a drawer under a sheet) unwind one per press with no cross-layer
// bookkeeping.
const guards: BackGuard[] = []
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

function isRegistered(id: number): boolean {
  for (const guard of guards) if (guard.id === id) return true
  return false
}

// The listener detaches only when nothing is left to hear: an in-flight
// self-caused pop (swallow) still needs it even with every guard released.
function detachWhenIdle(): void {
  if (guards.length === 0 && swallow === 0) {
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
      history.pushState({ [STATE_KEY]: top.id }, '')
    }
    detachWhenIdle()
    return
  }
  // Unwind every guard the traversal jumped over, topmost first — a Back
  // press covers one; a multi-entry jump (history.go(-n)) covers several.
  const current = currentGuardId()
  while (guards.length > 0) {
    const top = guards[guards.length - 1] as BackGuard
    if (top.id === current) break
    if (top.onBack()) {
      guards.pop()
      continue
    }
    // Declined — vetoed, or a controlled layer that hasn't followed yet:
    // re-arm the guard entry so the next Back reaches this layer again.
    history.pushState({ [STATE_KEY]: top.id }, '')
    break
  }
  detachWhenIdle()
}

/**
 * Plants a guard entry in the session history so the host's Back dismisses a
 * layer (a dialog, drawer, sheet — anything overlaid) instead of leaving the
 * page. `onBack` fires when the user pops the entry and returns whether the
 * layer actually closed — a decline re-arms the guard. The returned release
 * (for a layer closed by any other means) consumes a still-current guard
 * entry so it can't swallow the next Back; an entry buried under later
 * navigation is unreachable and left alone.
 *
 * Consumption is deferred a microtask and an orphaned-but-current entry is
 * adopted (rewritten in place) by the next interceptor: a synchronous
 * release -> re-register — StrictMode's double-invoked effect, a reopen in
 * the same commit — nets out to zero traversals. That matters because a
 * traversal queued by `history.back()` is not reliably delivered once
 * another entry is pushed before it lands; never queuing one in that window
 * removes the race instead of compensating for it.
 */
export function interceptBackNavigation(onBack: () => boolean): () => void {
  const guard: BackGuard = { id: ++nextGuardId, onBack }
  // Identical (type, listener) pairs dedupe, so attaching is idempotent.
  window.addEventListener('popstate', onPopState)
  const current = currentGuardId()
  const adoptable = current !== undefined && !isRegistered(current)
  guards.push(guard)
  if (adoptable) history.replaceState({ [STATE_KEY]: guard.id }, '')
  else history.pushState({ [STATE_KEY]: guard.id }, '')

  return () => {
    const index = guards.indexOf(guard)
    if (index === -1) return // already unwound by the Back press itself
    guards.splice(index, 1)
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
