import {
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type {
  ComboboxContext,
  ComboboxItem,
  ComboboxMachineEvent,
  ComboboxOptions,
  ComboboxStateName,
} from './types'

/** The running combobox machine — what a substrate holds and sends events to. */
export type ComboboxMachine = Machine<ComboboxStateName, ComboboxContext, ComboboxMachineEvent>

type ComboboxAction = Action<ComboboxContext, ComboboxMachineEvent>
type ComboboxGuard = Guard<ComboboxContext, ComboboxMachineEvent>

function indexOfValue(items: ComboboxItem[], value: string): number {
  for (let i = 0; i < items.length; i++) if (items[i].value === value) return i
  return -1
}

/** First enabled suggestion scanning from `start` in `step` direction; null if none. */
function enabledValueFrom(items: ComboboxItem[], start: number, step: 1 | -1): string | null {
  for (let i = start; i >= 0 && i < items.length; i += step) {
    if (!items[i].disabled) return items[i].value
  }
  return null
}

/** One highlight step from the current value; null means "no move". */
function stepHighlight(
  items: ComboboxItem[],
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

/** The highlight an arrow-key open starts from: the enabled selection, else
 * the first (ArrowDown) / last (ArrowUp) enabled suggestion. */
function openingHighlight(
  items: ComboboxItem[],
  value: string | null,
  step: 1 | -1,
): string | null {
  if (value !== null) {
    const index = indexOfValue(items, value)
    if (index !== -1 && !items[index].disabled) return value
  }
  return step === 1 ? enabledValueFrom(items, 0, 1) : enabledValueFrom(items, items.length - 1, -1)
}

const canOpen: ComboboxGuard = ({ context }) => !context.disabled

// A `select` targeting an unregistered or disabled suggestion — named
// explicitly (item press) or resolved from the highlight (Enter) — must not
// commit OR close: pressing a disabled suggestion does nothing. No target at
// all still falls through — closing without selecting is legal.
const selectsUnavailableItem: ComboboxGuard = ({ context, event }) => {
  if (event.type !== 'select') return false
  const value = event.value !== undefined ? event.value : context.highlightedValue
  if (value === null) return false
  const index = indexOfValue(context.items, value)
  return index === -1 || context.items[index].disabled
}

const canHighlightTarget: ComboboxGuard = ({ context, event }) => {
  if (event.type !== 'highlight.set') return false
  const index = indexOfValue(context.items, event.value)
  return index !== -1 && !context.items[index].disabled
}

// Typing invalidates the highlight: the consumer is about to re-filter the
// suggestions, so the old highlight points at a stale set.
const setInputValue: ComboboxAction = ({ event, setContext }) => {
  if (event.type !== 'input') return
  setContext({ inputValue: event.value, highlightedValue: null })
}

const clearHighlight: ComboboxAction = ({ setContext }) => {
  setContext({ highlightedValue: null })
}

// Commits the explicit value (item press) or the highlighted one (Enter) in
// one write: the value and the input text move together, so their callbacks
// fire once each. With neither, the transition just closes.
const applySelection: ComboboxAction = ({ event, context, setContext }) => {
  const value =
    event.type === 'select' && event.value !== undefined ? event.value : context.highlightedValue
  if (value === null) return
  const index = indexOfValue(context.items, value)
  if (index === -1) return
  setContext({ value, inputValue: context.items[index].label })
}

const highlightNext: ComboboxAction = ({ context, setContext }) => {
  const next = stepHighlight(context.items, context.highlightedValue, 1, context.loop)
  if (next !== null) setContext({ highlightedValue: next })
}

const highlightPrevious: ComboboxAction = ({ context, setContext }) => {
  const previous = stepHighlight(context.items, context.highlightedValue, -1, context.loop)
  if (previous !== null) setContext({ highlightedValue: previous })
}

const highlightOnOpenNext: ComboboxAction = ({ context, setContext }) => {
  setContext({ highlightedValue: openingHighlight(context.items, context.value, 1) })
}

const highlightOnOpenPrevious: ComboboxAction = ({ context, setContext }) => {
  setContext({ highlightedValue: openingHighlight(context.items, context.value, -1) })
}

const setHighlight: ComboboxAction = ({ event, setContext }) => {
  if (event.type !== 'highlight.set') return
  setContext({ highlightedValue: event.value })
}

// Registration keeps the context list mirroring the rendered suggestions: a
// new value joins at its reported rendered position (append as the fallback);
// a known one updates in place and moves when its reported position changed —
// a keyed re-sort reorders the rendered list without unmounting anything. The
// substrate re-reports after every render, so a report that changes nothing
// must be ignored — that idempotence is what keeps the report loop-free. An
// update that disables the highlighted suggestion forfeits the highlight,
// like unregistering it does.
const registerItem: ComboboxAction = ({ event, context, setContext }) => {
  if (event.type !== 'item.register') return
  const item = event.item
  const reported = event.index
  const existing = indexOfValue(context.items, item.value)

  if (existing === -1) {
    const items = context.items.slice()
    if (reported === undefined || reported < 0 || reported > items.length) items.push(item)
    else items.splice(reported, 0, item)
    setContext({ items })
    return
  }

  const current = context.items[existing]
  const moved =
    reported !== undefined &&
    reported !== existing &&
    reported >= 0 &&
    reported < context.items.length
  const changed = current.label !== item.label || current.disabled !== item.disabled
  if (!moved && !changed) return

  const items = context.items.slice()
  items.splice(existing, 1)
  items.splice(moved ? reported : existing, 0, item)
  const patch: Partial<ComboboxContext> = { items }
  if (item.disabled && context.highlightedValue === item.value) patch.highlightedValue = null
  setContext(patch)
}

const unregisterItem: ComboboxAction = ({ event, context, setContext }) => {
  if (event.type !== 'item.unregister') return
  const index = indexOfValue(context.items, event.value)
  if (index === -1) return
  const items = context.items.slice()
  items.splice(index, 1)
  const patch: Partial<ComboboxContext> = { items }
  if (context.highlightedValue === event.value) patch.highlightedValue = null
  setContext(patch)
}

const setValue: ComboboxAction = ({ event, setContext }) => {
  if (event.type !== 'value.set') return
  setContext({ value: event.value })
}

const syncInputValue: ComboboxAction = ({ event, setContext }) => {
  if (event.type !== 'inputValue.set') return
  setContext({ inputValue: event.value })
}

const setDisabled: ComboboxAction = ({ event, setContext }) => {
  if (event.type !== 'disabled.set') return
  setContext({ disabled: event.disabled })
}

export function comboboxMachine(
  options: ComboboxOptions,
): TransitionConfig<ComboboxStateName, ComboboxContext, ComboboxMachineEvent> {
  // Annotated so createMachine infers Context as ComboboxContext, not the
  // narrowed literal.
  const context: ComboboxContext = {
    disabled: options.disabled ?? false,
    loop: options.loop ?? false,
    // The substrate supplies a unique id; `combobox` is only a bare fallback.
    id: options.id ?? 'combobox',
    value: options.value !== undefined ? options.value : (options.defaultValue ?? null),
    inputValue:
      options.inputValue !== undefined ? options.inputValue : (options.defaultInputValue ?? ''),
    highlightedValue: null,
    items: [],
  }

  return setup.as<ComboboxContext, ComboboxMachineEvent>().createMachine({
    initial: (options.open ?? options.defaultOpen) === true ? 'open' : 'closed',
    context,
    // Top-level: registration and controlled sync work from any state.
    on: {
      'item.register': { actions: registerItem },
      'item.unregister': { actions: unregisterItem },
      'value.set': { actions: setValue },
      'inputValue.set': { actions: syncInputValue },
      'disabled.set': { actions: setDisabled },
    },
    states: {
      closed: {
        on: {
          open: { target: 'open', guard: canOpen },
          toggle: { target: 'open', guard: canOpen },
          // Typing opens: the user is asking for suggestions.
          input: { target: 'open', guard: canOpen, actions: setInputValue },
          // The arrow keys open with a seeded highlight: the selection when it
          // is rendered and enabled, else the first / last enabled suggestion.
          'highlight.next': { target: 'open', guard: canOpen, actions: highlightOnOpenNext },
          'highlight.prev': { target: 'open', guard: canOpen, actions: highlightOnOpenPrevious },
        },
      },
      open: {
        on: {
          close: { target: 'closed', actions: clearHighlight },
          toggle: { target: 'closed', actions: clearHighlight },
          escape: { target: 'closed', actions: clearHighlight },
          'interact.outside': { target: 'closed', actions: clearHighlight },
          input: { actions: setInputValue },
          select: [
            { guard: selectsUnavailableItem }, // swallow: a disabled suggestion does nothing
            { target: 'closed', actions: [applySelection, clearHighlight] },
          ],
          'highlight.next': { actions: highlightNext },
          'highlight.prev': { actions: highlightPrevious },
          'highlight.set': { guard: canHighlightTarget, actions: setHighlight },
        },
      },
    },
  })
}
