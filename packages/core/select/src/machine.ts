import {
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type {
  SelectContext,
  SelectItem,
  SelectMachineEvent,
  SelectOptions,
  SelectStateName,
} from './types'

/** The running select machine — what a substrate holds and sends events to. */
export type SelectMachine = Machine<SelectStateName, SelectContext, SelectMachineEvent>

type SelectAction = Action<SelectContext, SelectMachineEvent>
type SelectGuard = Guard<SelectContext, SelectMachineEvent>

const TYPEAHEAD_TIMEOUT_MS = 1000

function indexOfValue(items: SelectItem[], value: string): number {
  for (let i = 0; i < items.length; i++) if (items[i].value === value) return i
  return -1
}

/** First enabled option scanning from `start` in `step` direction; null if none. */
function enabledValueFrom(items: SelectItem[], start: number, step: 1 | -1): string | null {
  for (let i = start; i >= 0 && i < items.length; i += step) {
    if (!items[i].disabled) return items[i].value
  }
  return null
}

/** One highlight step from the current value; null means "no move". */
function stepHighlight(
  items: SelectItem[],
  fromValue: string | null,
  step: 1 | -1,
  loop: boolean,
): string | null {
  const count = items.length
  if (count === 0) return null
  const from = fromValue === null ? -1 : indexOfValue(items, fromValue)
  // No current highlight: start from the end the movement comes from.
  if (from === -1) {
    return step === 1 ? enabledValueFrom(items, 0, 1) : enabledValueFrom(items, count - 1, -1)
  }
  if (!loop) return enabledValueFrom(items, from + step, step)
  for (let taken = 1; taken <= count; taken++) {
    const index = (((from + step * taken) % count) + count) % count
    if (!items[index].disabled) return items[index].value
  }
  return null
}

/** The highlight an open starts from: the enabled selection, else the first
 * enabled option. */
function openingHighlight(items: SelectItem[], value: string | null): string | null {
  if (value !== null) {
    const index = indexOfValue(items, value)
    if (index !== -1 && !items[index].disabled) return value
  }
  return enabledValueFrom(items, 0, 1)
}

/**
 * The APG typeahead: candidates are scanned in wrapped order starting after
 * the current highlight; the first enabled label matching the buffer wins. A
 * buffer of one repeated character degrades to cycling through the options
 * starting with that character.
 */
function findTypeaheadMatch(
  items: SelectItem[],
  fromValue: string | null,
  buffer: string,
): string | null {
  const count = items.length
  if (count === 0) return null
  const query = buffer.toLowerCase()
  const start = (fromValue === null ? -1 : indexOfValue(items, fromValue)) + 1

  let repeatedChar = query.length > 1
  for (let i = 1; i < query.length; i++) {
    if (query[i] !== query[0]) {
      repeatedChar = false
      break
    }
  }

  let cycleFallback: string | null = null
  for (let scanned = 0; scanned < count; scanned++) {
    const item = items[(start + scanned) % count]
    if (item.disabled) continue
    const label = item.label.toLowerCase()
    if (label.startsWith(query)) return item.value
    if (repeatedChar && cycleFallback === null && label.startsWith(query[0])) {
      cycleFallback = item.value
    }
  }
  return cycleFallback
}

const canOpen: SelectGuard = ({ context }) => !context.disabled

// A `select` targeting an unregistered or disabled option — named explicitly
// (item press) or resolved from the highlight (Enter/Space) — must not commit
// OR close: pressing a disabled option does nothing. No target at all still
// falls through — closing without selecting is legal.
const selectsUnavailableItem: SelectGuard = ({ context, event }) => {
  if (event.type !== 'select') return false
  const value = event.value !== undefined ? event.value : context.highlightedValue
  if (value === null) return false
  const index = indexOfValue(context.items, value)
  return index === -1 || context.items[index].disabled
}

const canHighlightTarget: SelectGuard = ({ context, event }) => {
  if (event.type !== 'highlight.set') return false
  const index = indexOfValue(context.items, event.value)
  return index !== -1 && !context.items[index].disabled
}

// Space commits (like Enter) unless a typeahead is in progress, in which case
// it joins the buffer — multi-word labels stay searchable.
const spaceCommits: SelectGuard = ({ context, event }) =>
  event.type === 'typeahead' &&
  event.char === ' ' &&
  (context.typeaheadBuffer === '' || Date.now() - context.typeaheadTime > TYPEAHEAD_TIMEOUT_MS)

const highlightOnOpen: SelectAction = ({ context, setContext }) => {
  setContext({ highlightedValue: openingHighlight(context.items, context.value) })
}

// Closing clears the transient interaction state — the highlight and the
// typeahead buffer — so a reopen starts fresh.
const clearHighlight: SelectAction = ({ setContext }) => {
  setContext({ highlightedValue: null, typeaheadBuffer: '', typeaheadTime: 0 })
}

// Commits the explicit value (item press) or the highlighted one (Enter/Space);
// with neither, the transition just closes.
const applySelection: SelectAction = ({ event, context, setContext }) => {
  const value =
    event.type === 'select' && event.value !== undefined ? event.value : context.highlightedValue
  if (value !== null) setContext({ value })
}

const highlightNext: SelectAction = ({ context, setContext }) => {
  const next = stepHighlight(context.items, context.highlightedValue, 1, context.loop)
  if (next !== null) setContext({ highlightedValue: next })
}

const highlightPrevious: SelectAction = ({ context, setContext }) => {
  const previous = stepHighlight(context.items, context.highlightedValue, -1, context.loop)
  if (previous !== null) setContext({ highlightedValue: previous })
}

const highlightFirst: SelectAction = ({ context, setContext }) => {
  const first = enabledValueFrom(context.items, 0, 1)
  if (first !== null) setContext({ highlightedValue: first })
}

const highlightLast: SelectAction = ({ context, setContext }) => {
  const last = enabledValueFrom(context.items, context.items.length - 1, -1)
  if (last !== null) setContext({ highlightedValue: last })
}

const setHighlight: SelectAction = ({ event, setContext }) => {
  if (event.type !== 'highlight.set') return
  setContext({ highlightedValue: event.value })
}

const applyTypeahead: SelectAction = ({ event, context, setContext }) => {
  if (event.type !== 'typeahead') return
  const now = Date.now()
  const buffer =
    now - context.typeaheadTime > TYPEAHEAD_TIMEOUT_MS
      ? event.char
      : context.typeaheadBuffer + event.char
  const match = findTypeaheadMatch(context.items, context.highlightedValue, buffer)
  const patch: Partial<SelectContext> = { typeaheadBuffer: buffer, typeaheadTime: now }
  if (match !== null) patch.highlightedValue = match
  setContext(patch)
}

// Registration keeps the context list mirroring the rendered options: a known
// value updates in place (label/disabled changed), a new one joins at the end.
function upsertItem(items: SelectItem[], item: SelectItem): SelectItem[] {
  const next = items.slice()
  const index = indexOfValue(next, item.value)
  if (index === -1) next.push(item)
  else next[index] = item
  return next
}

const registerItem: SelectAction = ({ event, context, setContext }) => {
  if (event.type !== 'item.register') return
  setContext({ items: upsertItem(context.items, event.item) })
}

const unregisterItem: SelectAction = ({ event, context, setContext }) => {
  if (event.type !== 'item.unregister') return
  const index = indexOfValue(context.items, event.value)
  if (index === -1) return
  const items = context.items.slice()
  items.splice(index, 1)
  const patch: Partial<SelectContext> = { items }
  if (context.highlightedValue === event.value) patch.highlightedValue = null
  setContext(patch)
}

// Registration while open also curates the highlight: an option registering
// into a list with no highlight supplies it — a list whose options mount after
// the machine opened (defaultOpen) still starts from the selection — and the
// selected option mounting late takes it. An update in place never steals the
// user's highlight, but disabling the highlighted option forfeits it, like
// unregistering it does.
const registerItemWhileOpen: SelectAction = ({ event, context, setContext }) => {
  if (event.type !== 'item.register') return
  const item = event.item
  const isNew = indexOfValue(context.items, item.value) === -1
  const items = upsertItem(context.items, item)
  const patch: Partial<SelectContext> = { items }
  if (context.highlightedValue === null) {
    const next = openingHighlight(items, context.value)
    if (next !== null) patch.highlightedValue = next
  } else if (item.disabled && context.highlightedValue === item.value) {
    patch.highlightedValue = null
  } else if (isNew && !item.disabled && item.value === context.value) {
    patch.highlightedValue = item.value
  }
  setContext(patch)
}

const setValue: SelectAction = ({ event, setContext }) => {
  if (event.type !== 'value.set') return
  setContext({ value: event.value })
}

const setDisabled: SelectAction = ({ event, setContext }) => {
  if (event.type !== 'disabled.set') return
  setContext({ disabled: event.disabled })
}

export function selectMachine(
  options: SelectOptions,
): TransitionConfig<SelectStateName, SelectContext, SelectMachineEvent> {
  // Annotated so createMachine infers Context as SelectContext, not the
  // narrowed literal.
  const context: SelectContext = {
    disabled: options.disabled ?? false,
    loop: options.loop ?? false,
    // The substrate supplies a unique id; `select` is only a bare fallback.
    id: options.id ?? 'select',
    value: options.value !== undefined ? options.value : (options.defaultValue ?? null),
    highlightedValue: null,
    items: [],
    typeaheadBuffer: '',
    typeaheadTime: 0,
  }

  return setup.as<SelectContext, SelectMachineEvent>().createMachine({
    initial: (options.open ?? options.defaultOpen) === true ? 'open' : 'closed',
    context,
    // Top-level: registration and controlled sync work from any state.
    on: {
      'item.register': { actions: registerItem },
      'item.unregister': { actions: unregisterItem },
      'value.set': { actions: setValue },
      'disabled.set': { actions: setDisabled },
    },
    states: {
      closed: {
        on: {
          open: { target: 'open', guard: canOpen, actions: highlightOnOpen },
          toggle: { target: 'open', guard: canOpen, actions: highlightOnOpen },
          // The APG closed-combobox Home/End: open with the highlight pinned
          // to an end instead of the selection.
          'highlight.first': { target: 'open', guard: canOpen, actions: highlightFirst },
          'highlight.last': { target: 'open', guard: canOpen, actions: highlightLast },
        },
      },
      open: {
        on: {
          close: { target: 'closed', actions: clearHighlight },
          toggle: { target: 'closed', actions: clearHighlight },
          select: [
            { guard: selectsUnavailableItem }, // swallow: a disabled option does nothing
            { target: 'closed', actions: [applySelection, clearHighlight] },
          ],
          'highlight.next': { actions: highlightNext },
          'highlight.prev': { actions: highlightPrevious },
          'highlight.first': { actions: highlightFirst },
          'highlight.last': { actions: highlightLast },
          'highlight.set': { guard: canHighlightTarget, actions: setHighlight },
          typeahead: [
            { guard: spaceCommits, target: 'closed', actions: [applySelection, clearHighlight] },
            { actions: applyTypeahead },
          ],
          // Overrides the top-level entry: while open, registration also
          // curates the highlight.
          'item.register': { actions: registerItemWhileOpen },
        },
      },
    },
  })
}
