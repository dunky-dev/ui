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

export interface ReleaseOptions {
  /** The layer is being torn down, not closed — keep its entry claimable so
   * the layer that takes its place may reopen from it. @default false */
  keepClaim?: boolean
}

// One shared registry + one popstate listener: a Back pops exactly one entry,
// so only the guard whose entry vanished answers — stacked layers unwind one
// per press with no cross-layer bookkeeping. The registry is anchored on a
// realm-global keyed by `Symbol.for` rather than module-level variables: a
// monorepo or micro-frontend can load more than one copy of this module into
// the same page, and forked registries sharing the one real session history
// would answer pops from the wrong copy (the same duplicate-singleton class
// of bug as Radix's focus-scope stack, radix-ui/primitives#2815). Resolved
// lazily on first use so the module keeps its `sideEffects: false` contract.
const STORE_KEY = Symbol.for('@dunky.dev/browser-navigation#navigation-store')

interface NavigationStore {
  guards: BackGuard[]
  // Guards whose entry a Back press popped, kept so the host's Forward can
  // reopen the layer. Parked entries always sit above every armed one.
  parked: BackGuard[]
  watchers: ClaimWatcher[]
  // Entries whose layer closed rather than being torn down: given up on
  // purpose, so no later layer may claim them — Forward must not undo a
  // deliberate close.
  abandoned: Set<number>
  // Entries whose guards released but whose consumption hasn't happened yet.
  // Sibling releases from one turn all land here; consumption then chains one
  // traversal at a time (each pop surfaces the next spent entry) instead of
  // one history.go(-n) jump, because entries below the current one are opaque
  // — a multi-step jump could cross navigation this module doesn't own.
  pendingConsumption: Set<number>
  nextGuardId: number
  // Pops this module caused itself — counted so they are never read as a
  // user's Back and unwind another layer.
  swallow: number
  consumptionScheduled: boolean
  // The attached popstate listener. Each module copy has its own listener
  // function, so the browser's (type, listener) dedupe can't span copies —
  // the store remembers the attached one instead. Any copy's listener
  // behaves identically: all state lives here.
  listener?: () => void
}

function getStore(): NavigationStore {
  const scope = globalThis as unknown as Record<symbol, NavigationStore | undefined>
  let store = scope[STORE_KEY]
  if (store === undefined) {
    store = {
      guards: [],
      parked: [],
      watchers: [],
      abandoned: new Set(),
      pendingConsumption: new Set(),
      nextGuardId: 0,
      swallow: 0,
      consumptionScheduled: false,
    }
    scope[STORE_KEY] = store
  }
  return store
}

function attachListener(store: NavigationStore): void {
  if (store.listener !== undefined) return
  store.listener = onPopState
  window.addEventListener('popstate', onPopState)
}

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
function resolveClaim(store: NavigationStore): void {
  const id = currentGuardId()
  if (id !== undefined && store.abandoned.has(id)) return
  const claim = currentClaim()
  if (claim === undefined) return
  let candidate: ClaimWatcher | undefined
  for (const watcher of store.watchers) {
    if (watcher.claim !== claim) continue
    if (candidate !== undefined) return
    candidate = watcher
  }
  candidate?.reopen()
}

function isArmed(store: NavigationStore, id: number): boolean {
  for (const guard of store.guards) if (guard.id === id) return true
  return false
}

function parkedIndex(store: NavigationStore, id: number): number {
  for (let index = 0; index < store.parked.length; index++) {
    if ((store.parked[index] as BackGuard).id === id) return index
  }
  return -1
}

// Every planted entry truncates the forward stack, taking every parked entry
// with it — the guards watching them have nothing left to hear.
function plantEntry(store: NavigationStore, guard: BackGuard): void {
  store.parked.length = 0
  history.pushState({ [STATE_KEY]: guard.id, [CLAIM_KEY]: guard.claim }, '')
}

// Consume the current entry if its guard released: one history.back() whose
// pop re-enters onPopState and continues the chain from there.
function consumeCurrentIfPending(store: NavigationStore): void {
  const current = currentGuardId()
  if (current !== undefined && store.pendingConsumption.delete(current)) {
    store.swallow++
    history.back()
  }
}

// Detach only when nothing is left to hear — parked guards, claim watchers,
// in-flight self-caused pops, and a scheduled consumption pass all still need
// it. Entries still pending at that point are buried under navigation this
// module doesn't own — unreachable for good.
function detachWhenIdle(store: NavigationStore): void {
  if (
    store.guards.length === 0 &&
    store.parked.length === 0 &&
    store.watchers.length === 0 &&
    store.swallow === 0 &&
    !store.consumptionScheduled
  ) {
    store.pendingConsumption.clear()
    if (store.listener !== undefined) {
      window.removeEventListener('popstate', store.listener)
      store.listener = undefined
    }
  }
}

function onPopState(): void {
  const store = getStore()
  if (store.swallow > 0) {
    store.swallow--
    // Self-heal: if our own pop consumed an entry a live guard still needs
    // (it adopted the entry while the traversal was in flight), re-arm it.
    const top = store.guards[store.guards.length - 1]
    if (top !== undefined && top.id !== currentGuardId()) {
      plantEntry(store, top)
    } else {
      // The pop may have surfaced the next spent sibling entry — continue.
      consumeCurrentIfPending(store)
    }
    detachWhenIdle(store)
    return
  }
  const current = currentGuardId()
  // A marked entry with no armed owner and no pending consumption is forward
  // residue and never unwinds anything. A parked owner reopens (every crossed
  // guard, lowest first; a decline stays parked). No owner at all: offer the
  // entry's claim to the layer that took the planter's place. An entry
  // pending consumption is the opposite of residue — a dead entry a user's
  // Back just surfaced — so it falls through to the unwind below.
  if (current !== undefined && !isArmed(store, current) && !store.pendingConsumption.has(current)) {
    const landed = parkedIndex(store, current)
    if (landed !== -1) {
      for (let index = store.parked.length - 1; index >= landed; index--) {
        const guard = store.parked[index] as BackGuard
        if (guard.onForward?.() === true) {
          // Reopened: re-arm on the entry in place — it is already current,
          // and planting another would truncate the rest of the way forward.
          store.parked.splice(index, 1)
          store.guards.push(guard)
        }
      }
    } else {
      resolveClaim(store)
    }
    detachWhenIdle(store)
    return
  }
  // Unwind every guard the traversal jumped over, topmost first — a Back
  // press covers one; a multi-entry jump (history.go(-n)) covers several.
  while (store.guards.length > 0) {
    const top = store.guards[store.guards.length - 1] as BackGuard
    if (top.id === current) break
    let closed = false
    try {
      closed = top.onBack()
    } finally {
      // Declined — vetoed, a controlled layer that hasn't followed yet, or
      // onBack threw: re-arm the guard entry so the next Back reaches this
      // layer again, even as the error propagates.
      if (!closed) plantEntry(store, top)
    }
    if (!closed) break
    // By identity, not position: onBack may have released this guard
    // itself, and a positional pop would evict the guard beneath.
    const index = store.guards.indexOf(top)
    if (index !== -1) {
      store.guards.splice(index, 1)
      // Park for the way back — unless the guard released itself in onBack:
      // gone for good, nothing left to reopen.
      if (top.onForward !== undefined) store.parked.push(top)
    }
  }
  // The unwind may have landed on an entry whose guard already released (a
  // mid-stack release buried beneath a live layer) — consume it.
  consumeCurrentIfPending(store)
  detachWhenIdle(store)
}

/**
 * Plants a guard entry so the host's Back dismisses a layer instead of leaving
 * the page. `onBack` returns whether the layer closed — a decline re-arms. The
 * returned release consumes a still-current entry (a buried one is left
 * alone); with `onForward`, Forward reopens what Back closed, re-armed on the
 * entry in place.
 *
 * Consumption is deferred a microtask so a same-turn release + re-register
 * adopts the entry in place (rewrites the marker and withdraws it from pending
 * consumption), so the deferred pass finds nothing to spend and queues no
 * traversal — a queued `history.back()` is not reliably delivered once another
 * push lands first, so not queuing one removes the race. See SPEC.md for the
 * full contract.
 */
export function interceptBackNavigation(
  onBack: () => boolean,
  options: BackNavigationOptions = {},
): (releaseOptions?: ReleaseOptions) => void {
  const store = getStore()
  const guard: BackGuard = {
    id: ++store.nextGuardId,
    claim: options.claim,
    onBack,
    onForward: options.onForward,
  }
  attachListener(store)
  const current = currentGuardId()
  store.guards.push(guard)
  if (current !== undefined && !isArmed(store, current)) {
    // Adoption steals the entry from a parked watcher too, and withdraws it
    // from any pending consumption — the ground now belongs to this
    // registration, so no traversal may spend it.
    const stale = parkedIndex(store, current)
    if (stale !== -1) store.parked.splice(stale, 1)
    store.pendingConsumption.delete(current)
    history.replaceState({ [STATE_KEY]: guard.id, [CLAIM_KEY]: guard.claim }, '')
  } else {
    plantEntry(store, guard)
  }

  return (releaseOptions: ReleaseOptions = {}) => {
    if (releaseOptions.keepClaim !== true) store.abandoned.add(guard.id)

    const rest = store.parked.indexOf(guard)
    if (rest !== -1) {
      store.parked.splice(rest, 1)
      // A parked guard's entry sits in the forward stack — not the chain's to
      // spend — unless a declined reopen left it current: consume that one,
      // or it swallows the next Back.
      if (currentGuardId() === guard.id) {
        store.pendingConsumption.add(guard.id)
        scheduleConsumption(store)
      } else {
        detachWhenIdle(store)
      }
      return
    }
    const index = store.guards.indexOf(guard)
    if (index === -1) return // already unwound by the Back press itself
    store.guards.splice(index, 1)
    store.pendingConsumption.add(guard.id)
    scheduleConsumption(store)
  }
}

// One deferred pass per turn, shared by every sibling release; it starts the
// consumption chain, and each landing pop continues it.
function scheduleConsumption(store: NavigationStore): void {
  if (store.consumptionScheduled) return
  store.consumptionScheduled = true
  queueMicrotask(() => {
    store.consumptionScheduled = false
    consumeCurrentIfPending(store)
    detachWhenIdle(store)
  })
}

/**
 * Reopens a layer whose guard is gone (unmounted, or reloaded): landing on a
 * spent entry with a matching `claim` asks `reopen`. If two watchers share a
 * claim, neither answers.
 */
export function watchSpentEntry(claim: string, reopen: () => boolean): () => void {
  const store = getStore()
  const watcher: ClaimWatcher = { claim, reopen }
  attachListener(store)
  store.watchers.push(watcher)
  return () => {
    const index = store.watchers.indexOf(watcher)
    if (index === -1) return
    store.watchers.splice(index, 1)
    detachWhenIdle(store)
  }
}
