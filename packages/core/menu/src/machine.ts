import {
  and,
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type { MenuContext, MenuItem, MenuMachineEvent, MenuOptions, MenuStateName } from './types'

/** The running menu machine — what a substrate holds and sends events to. */
export type MenuMachine = Machine<MenuStateName, MenuContext, MenuMachineEvent>

type MenuAction = Action<MenuContext, MenuMachineEvent>
type MenuGuard = Guard<MenuContext, MenuMachineEvent>

/** Pause after which the typeahead query starts over. */
const TYPEAHEAD_RESET_MS = 1000

// Registry lookups
// -----------------------------------------------------------------------------

function indexOfValue(items: MenuItem[], value: string | null): number {
  if (value !== null) {
    for (let index = 0; index < items.length; index++) {
      if (items[index].value === value) return index
    }
  }
  return -1
}

function findItem(items: MenuItem[], value: string | null): MenuItem | undefined {
  const index = indexOfValue(items, value)
  return index === -1 ? undefined : items[index]
}

function firstEnabled(items: MenuItem[]): string | null {
  for (let index = 0; index < items.length; index++) {
    if (!items[index].disabled) return items[index].value
  }
  return null
}

function lastEnabled(items: MenuItem[]): string | null {
  for (let index = items.length - 1; index >= 0; index--) {
    if (!items[index].disabled) return items[index].value
  }
  return null
}

/** The next/previous enabled item from `from`, wrapping past either end. */
function stepEnabled(items: MenuItem[], from: number, delta: 1 | -1): string | null {
  const count = items.length
  for (let step = 1; step <= count; step++) {
    const index = (((from + delta * step) % count) + count) % count
    if (!items[index].disabled) return items[index].value
  }
  return null
}

/**
 * The next enabled typeahead match: forward from the item after the current
 * highlight, wrapping. A repeated character collapses to its first character
 * and excludes the current item, so it cycles; a growing query keeps the
 * current item eligible so extending the match never jumps away.
 */
function findTypeaheadMatch(
  items: MenuItem[],
  highlightedValue: string | null,
  query: string,
): string | null {
  const lowered = query.toLowerCase()
  let repeated = lowered.length > 1
  for (let index = 1; index < lowered.length; index++) {
    if (lowered[index] !== lowered[0]) {
      repeated = false
      break
    }
  }
  const search = repeated ? lowered[0] : lowered

  const count = items.length
  const start = indexOfValue(items, highlightedValue)
  for (let step = 1; step <= count; step++) {
    // With no highlight the scan is plain document order; step==count lands
    // back on the current item — allowed only while the query is extending.
    const index = start === -1 ? step - 1 : (start + step) % count
    if (start !== -1 && step === count && search.length === 1) break
    const item = items[index]
    if (!item.disabled && item.label.toLowerCase().startsWith(search)) return item.value
  }
  return null
}

// Actions
// -----------------------------------------------------------------------------

/**
 * Re-derive the highlight after a registry change: a pending keyboard aim
 * resolves against what is registered so far, and a highlight whose item
 * disappeared or became disabled is dropped — activedescendant never goes
 * stale (see SPEC constraints).
 */
function reconcileHighlight(items: MenuItem[], context: MenuContext): Partial<MenuContext> {
  if (context.pendingHighlight !== null) {
    const aimed = context.pendingHighlight === 'first' ? firstEnabled(items) : lastEnabled(items)
    if (aimed !== null) return { highlightedValue: aimed }
    // No enabled item to aim at — fall through so a highlight whose item
    // disappeared or got disabled is still dropped rather than left stale.
  }
  const current = findItem(items, context.highlightedValue)
  if (context.highlightedValue !== null && (current === undefined || current.disabled)) {
    return { highlightedValue: null }
  }
  return {}
}

// Re-registering a value updates the item in place so a prop change (e.g.
// disabled flipping) never moves the item to the end of the order.
const registerItem: MenuAction = ({ event, context, setContext }) => {
  if (event.type !== 'item.register') return
  const items = [...context.items]
  const index = indexOfValue(items, event.item.value)
  if (index === -1) items.push(event.item)
  else items[index] = event.item
  setContext({ items, ...reconcileHighlight(items, context) })
}

const unregisterItem: MenuAction = ({ event, context, setContext }) => {
  if (event.type !== 'item.unregister') return
  const index = indexOfValue(context.items, event.value)
  if (index === -1) return
  const items = [...context.items]
  items.splice(index, 1)
  setContext({ items, ...reconcileHighlight(items, context) })
}

// An explicit highlight change cancels a pending keyboard aim.
const setHighlight: MenuAction = ({ event, context, setContext }) => {
  if (event.type !== 'highlight.set') return
  if (event.value === null) {
    setContext({ highlightedValue: null, pendingHighlight: null })
    return
  }
  const item = findItem(context.items, event.value)
  if (item === undefined || item.disabled) return
  setContext({ highlightedValue: event.value, pendingHighlight: null })
}

const moveHighlight: MenuAction = ({ event, context, setContext }) => {
  if (event.type !== 'highlight.move') return
  const items = context.items
  const current = indexOfValue(items, context.highlightedValue)
  let next: string | null
  if (event.to === 'first') next = firstEnabled(items)
  else if (event.to === 'last') next = lastEnabled(items)
  else if (event.to === 'next') {
    next = current === -1 ? firstEnabled(items) : stepEnabled(items, current, 1)
  } else {
    next = current === -1 ? lastEnabled(items) : stepEnabled(items, current, -1)
  }
  setContext({ highlightedValue: next ?? context.highlightedValue, pendingHighlight: null })
}

const runTypeahead: MenuAction = ({ event, context, setContext }) => {
  if (event.type !== 'typeahead') return
  const now = Date.now()
  const query =
    now - context.typeaheadAt > TYPEAHEAD_RESET_MS ? event.key : context.typeaheadQuery + event.key
  const match = findTypeaheadMatch(context.items, context.highlightedValue, query)
  if (match === null) {
    setContext({ typeaheadQuery: query, typeaheadAt: now })
    return
  }
  setContext({
    typeaheadQuery: query,
    typeaheadAt: now,
    highlightedValue: match,
    pendingHighlight: null,
  })
}

// The aim belongs to the latest open intent: a keyboard open carries one, a
// press carries none. It is written even when a controlled machine stays put,
// so the aim survives until the prop echo opens — and a press overwrites a
// vetoed keyboard aim instead of inheriting it.
const aimHighlight: MenuAction = ({ event, setContext }) => {
  if (event.type === 'open') setContext({ pendingHighlight: event.highlight ?? null })
  else if (event.type === 'toggle') setContext({ pendingHighlight: null })
}

// Runs before the state switches to closed, so the selection is written — and
// observable through the mailbox — while the menu still reads as open.
const recordSelection: MenuAction = ({ event, context, setContext }) => {
  if (event.type !== 'item.activate') return
  const value = event.value ?? context.highlightedValue
  if (value === null) return
  setContext({ selection: { value } })
}

// Every close starts the next open fresh (see SPEC: Highlight).
const resetHighlight: MenuAction = ({ setContext }) => {
  setContext({ highlightedValue: null, pendingHighlight: null, typeaheadQuery: '' })
}

const setPartPresence: MenuAction = ({ event, context, setContext }) => {
  if (event.type !== 'part.presence') return
  setContext({ parts: { ...context.parts, [event.part]: event.present } })
}

const setGroupLabelPresence: MenuAction = ({ event, context, setContext }) => {
  if (event.type !== 'group.label.presence') return
  setContext({ groupLabels: { ...context.groupLabels, [event.group]: event.present } })
}

// Every open/close intent lands in the mailbox; the connect's reaction turns
// it into onOpenChange. Uncontrolled, the intent rides along with the
// transition; controlled, the intent IS the outcome — the machine stays put
// until `controlled.sync` echoes the prop back.
const requestOpen: MenuAction = ({ setContext }) => setContext({ openIntent: { open: true } })
const requestClose: MenuAction = ({ setContext }) => setContext({ openIntent: { open: false } })

// Guards
// -----------------------------------------------------------------------------

const isControlled: MenuGuard = ({ context }) => context.controlled
const syncOpens: MenuGuard = ({ event }) => event.type === 'controlled.sync' && event.open
const syncCloses: MenuGuard = ({ event }) => event.type === 'controlled.sync' && !event.open

// Only an enabled, registered item activates — a disabled press or an empty
// highlight leaves the menu open and the mailbox untouched.
const canActivate: MenuGuard = ({ context, event }) => {
  if (event.type !== 'item.activate') return false
  const item = findItem(context.items, event.value ?? context.highlightedValue)
  return item !== undefined && !item.disabled
}

export function menuMachine(
  options: MenuOptions,
): TransitionConfig<MenuStateName, MenuContext, MenuMachineEvent> {
  // Annotated so createMachine infers Context as MenuContext, not the narrowed literal.
  const context: MenuContext = {
    // The substrate supplies a unique id; `menu` is only a bare fallback.
    id: options.id ?? 'menu',
    controlled: options.open !== undefined,
    openIntent: null,
    items: [],
    highlightedValue: null,
    pendingHighlight: null,
    typeaheadQuery: '',
    typeaheadAt: 0,
    selection: null,
    parts: { trigger: false },
    groupLabels: {},
  }

  return setup.as<MenuContext, MenuMachineEvent>().createMachine({
    initial: (options.open ?? options.defaultOpen) === true ? 'open' : 'closed',
    context,
    // Top-level: parts and items report their presence from any state — close
    // unmounts the items, so their unregistrations arrive while closed.
    on: {
      'item.register': { actions: registerItem },
      'item.unregister': { actions: unregisterItem },
      'part.presence': { actions: setPartPresence },
      'group.label.presence': { actions: setGroupLabelPresence },
    },
    // Each open/close intent lists two candidates — first guard wins:
    // controlled only writes the mailbox; uncontrolled also takes the transition.
    states: {
      closed: {
        entry: [resetHighlight],
        on: {
          open: [
            { guard: isControlled, actions: [aimHighlight, requestOpen] },
            { target: 'open', actions: [aimHighlight, requestOpen] },
          ],
          toggle: [
            { guard: isControlled, actions: [aimHighlight, requestOpen] },
            { target: 'open', actions: [aimHighlight, requestOpen] },
          ],
          'controlled.sync': { target: 'open', guard: syncOpens },
        },
      },
      open: {
        on: {
          close: [
            { guard: isControlled, actions: requestClose },
            { target: 'closed', actions: requestClose },
          ],
          toggle: [
            { guard: isControlled, actions: requestClose },
            { target: 'closed', actions: requestClose },
          ],
          escape: [
            { guard: isControlled, actions: requestClose },
            { target: 'closed', actions: requestClose },
          ],
          tab: [
            { guard: isControlled, actions: requestClose },
            { target: 'closed', actions: requestClose },
          ],
          'interact.outside': [
            { guard: isControlled, actions: requestClose },
            { target: 'closed', actions: requestClose },
          ],
          'item.activate': [
            { guard: and(canActivate, isControlled), actions: [recordSelection, requestClose] },
            { guard: canActivate, target: 'closed', actions: [recordSelection, requestClose] },
          ],
          'controlled.sync': { target: 'closed', guard: syncCloses },
          'highlight.set': { actions: setHighlight },
          'highlight.move': { actions: moveHighlight },
          typeahead: { actions: runTypeahead },
        },
      },
    },
  })
}
