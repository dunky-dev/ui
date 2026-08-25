// Marks a layer's guard entry in the session history; the value says which
// interceptor owns the entry.
const STATE_KEY = '@dunky.back'
// The layer's name for its ground — outlives the registration (and a reload),
// so a layer that comes back can recognize its entry (see `watchSpentEntry`).
const CLAIM_KEY = '@dunky.claim'

interface BackGuard {
  id: number
  claim: string | undefined
  onBack: () => boolean
  onForward: (() => boolean) | undefined
}

export interface BackNavigationOptions {
  /** Fires when a traversal re-enters the entry a Back press spent; returns
   * whether the layer actually reopened. */
  onForward?: () => boolean
  /** Stamped into the entry; see `watchSpentEntry`. */
  claim?: string
}

// Closed layers waiting for a landing on a spent entry bearing their claim —
// the way back when the registration that planted the entry didn't survive.
interface ClaimWatcher {
  claim: string
  reopen: () => boolean
}

const watchers: ClaimWatcher[] = []
// Entries whose layer closed rather than being torn down: given up on purpose,
// so no later layer may claim them — Forward must not undo a deliberate close.
const abandoned = new Set<number>()

export interface ReleaseOptions {
  /** The layer is being torn down, not closed — keep its entry claimable so
   * the layer that takes its place may reopen from it. @default false */
  keepClaim?: boolean
}

// One shared registry + one popstate listener: a Back pops exactly one entry,
// so only the guard whose entry vanished answers — stacked layers unwind one
// per press with no cross-layer bookkeeping.
const guards: BackGuard[] = []
// Guards whose entry a Back press popped, kept so the host's Forward can
// reopen the layer. Parked entries always sit above every armed one.
const parked: BackGuard[] = []
let nextGuardId = 0
// Pops this module caused itself — counted so they are never read as a user's
// Back and unwind another layer.
let swallow = 0
// Releases whose deferred consumption hasn't run — the listener must outlive
// them, or one release's idle check could detach it under a sibling's pop.
let pendingReleases = 0
// A turn's releases, consumed together: a stack closing at once has only its
// topmost entry current, so one-at-a-time would strand every entry beneath.
// `order` snapshots the entry order before the first release splices.
let batch: Set<number> | null = null
let order: number[] | null = null

function currentGuardId(): number | undefined {
  const state: unknown = history.state
  if (typeof state !== 'object' || state === null) return undefined
  const id = (state as Record<string, unknown>)[STATE_KEY]
  return typeof id === 'number' ? id : undefined
}

function currentClaim(): string | undefined {
  const state: unknown = history.state
  if (typeof state !== 'object' || state === null) return undefined
  const claim = (state as Record<string, unknown>)[CLAIM_KEY]
  return typeof claim === 'string' ? claim : undefined
}

// Offers a spent entry to the layer that has taken the planter's place. Only a
// sole candidate may answer: two layers claiming the same ground can't be told
// apart, and reopening the wrong one is worse than reopening none.
function offerToClaimant(): void {
  const id = currentGuardId()
  if (id !== undefined && abandoned.has(id)) return
  const claim = currentClaim()
  if (claim === undefined) return
  let candidate: ClaimWatcher | undefined
  for (const watcher of watchers) {
    if (watcher.claim !== claim) continue
    if (candidate !== undefined) return
    candidate = watcher
  }
  candidate?.reopen()
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
function plantEntry(guard: BackGuard): void {
  parked.length = 0
  history.pushState({ [STATE_KEY]: guard.id, [CLAIM_KEY]: guard.claim }, '')
}

// Once per turn, after every release in it: consume the freed run of entries —
// current one down, while contiguous — in a single traversal.
function consumeBatch(): void {
  const released = batch as Set<number>
  const entryOrder = order as number[]
  batch = null
  order = null
  pendingReleases = 0

  const current = currentGuardId()
  // Nothing of ours is current: buried under later navigation, or adopted by a
  // same-turn re-register. Unreachable entries are left alone.
  if (current === undefined || !released.has(current)) {
    detachWhenIdle()
    return
  }
  // A guard that both registered and released inside this turn isn't in the
  // snapshot; its own entry is still the one to consume.
  const top = entryOrder.indexOf(current)
  let count = 1
  for (let index = top - 1; index >= 0 && released.has(entryOrder[index] as number); index--) {
    count++
  }
  swallow++
  history.go(-count)
}

// Detach only when nothing is left to hear — parked guards, claim watchers,
// in-flight self-caused pops, and undecided releases all still need it.
function detachWhenIdle(): void {
  if (
    guards.length === 0 &&
    parked.length === 0 &&
    watchers.length === 0 &&
    swallow === 0 &&
    pendingReleases === 0
  ) {
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
      plantEntry(top)
    }
    detachWhenIdle()
    return
  }
  const current = currentGuardId()
  // A marked entry with no armed owner is forward residue and never unwinds
  // anything. A parked owner reopens (every crossed guard, lowest first; a
  // decline stays parked). No owner at all: offer the entry's claim to the
  // layer that took the planter's place.
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
    } else {
      offerToClaimant()
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
      // By identity, not position: onBack may have released this guard
      // itself, and a positional pop would evict the guard beneath.
      const index = guards.indexOf(top)
      if (index !== -1) {
        guards.splice(index, 1)
        // Park for the way back — unless the guard released itself in onBack:
        // gone for good, nothing left to reopen.
        if (top.onForward !== undefined) parked.push(top)
      }
      continue
    }
    // Declined — vetoed, or a controlled layer that hasn't followed yet:
    // re-arm the guard entry so the next Back reaches this layer again.
    plantEntry(top)
    break
  }
  detachWhenIdle()
}

/**
 * Plants a guard entry so the host's Back dismisses a layer instead of leaving
 * the page. `onBack` returns whether the layer closed — a decline re-arms. The
 * returned release consumes a still-current entry (a buried one is left
 * alone); with `onForward`, Forward reopens what Back closed, re-armed on the
 * entry in place.
 *
 * Consumption is deferred a microtask so a same-turn release + re-register
 * adopts the entry in place with zero traversals — a queued `history.back()`
 * is not reliably delivered once another push lands first, so not queuing one
 * removes the race. See SPEC.md for the full contract.
 */
export function interceptBackNavigation(
  onBack: () => boolean,
  options: BackNavigationOptions = {},
): (releaseOptions?: ReleaseOptions) => void {
  const guard: BackGuard = {
    id: ++nextGuardId,
    claim: options.claim,
    onBack,
    onForward: options.onForward,
  }
  // Identical (type, listener) pairs dedupe, so attaching is idempotent.
  window.addEventListener('popstate', onPopState)
  const current = currentGuardId()
  guards.push(guard)
  if (current !== undefined && !isArmed(current)) {
    // Adoption steals the entry from a parked watcher too — the ground now
    // belongs to this registration.
    const stale = parkedIndex(current)
    if (stale !== -1) parked.splice(stale, 1)
    history.replaceState({ [STATE_KEY]: guard.id, [CLAIM_KEY]: guard.claim }, '')
  } else {
    plantEntry(guard)
  }

  return (releaseOptions: ReleaseOptions = {}) => {
    if (releaseOptions.keepClaim !== true) abandoned.add(guard.id)
    // Snapshot the entry order before this turn's first release splices it.
    if (batch === null) {
      batch = new Set()
      order = [...guards.map(entry => entry.id), ...parked.map(entry => entry.id)]
      queueMicrotask(consumeBatch)
    }

    const rest = parked.indexOf(guard)
    if (rest !== -1) {
      parked.splice(rest, 1)
    } else {
      const index = guards.indexOf(guard)
      if (index === -1) return // already unwound by the Back press itself
      guards.splice(index, 1)
    }
    batch.add(guard.id)
    pendingReleases++
  }
}

/**
 * Reopens a layer whose guard is gone (unmounted, or reloaded): landing on a
 * spent entry with a matching `claim` asks `reopen`. If two watchers share a
 * claim, neither answers.
 */
export function watchSpentEntry(claim: string, reopen: () => boolean): () => void {
  const watcher: ClaimWatcher = { claim, reopen }
  // Identical (type, listener) pairs dedupe, so attaching is idempotent.
  window.addEventListener('popstate', onPopState)
  watchers.push(watcher)
  return () => {
    const index = watchers.indexOf(watcher)
    if (index === -1) return
    watchers.splice(index, 1)
    detachWhenIdle()
  }
}
