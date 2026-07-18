import {
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type {
  AccordionContext,
  AccordionItemOptions,
  AccordionMachineEvent,
  AccordionOptions,
  AccordionStateName,
} from './types'

/** The running accordion machine — what a substrate holds and sends events to. */
export type AccordionMachine = Machine<AccordionStateName, AccordionContext, AccordionMachineEvent>

type AccordionAction = Action<AccordionContext, AccordionMachineEvent>
type AccordionGuard = Guard<AccordionContext, AccordionMachineEvent>

function isItemDisabled(context: AccordionContext, value: string): boolean {
  if (context.disabled) return true
  for (const item of context.items) {
    if (item.value === value) return item.disabled === true
  }
  return false
}

// Single mode holds at most one entry, whatever a driver sent through setValue.
function clampToMode(context: AccordionContext, value: string[]): string[] {
  return context.type === 'single' && value.length > 1 ? value.slice(0, 1) : value
}

function sameValue(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) return false
  }
  return true
}

const canToggle: AccordionGuard = ({ context, event }) => {
  if (event.type !== 'toggle') return false
  if (isItemDisabled(context, event.value)) return false
  // Single non-collapsible: the open item cannot be closed by re-pressing.
  return !context.value.includes(event.value) || context.collapsible
}

// Dedupe here so drivers can re-send the controlled value every render without
// firing spurious onValueChange reactions.
const valueChanged: AccordionGuard = ({ context, event }) => {
  if (event.type !== 'value.set') return false
  return !sameValue(context.value, clampToMode(context, event.value))
}

function nextToggleValue(context: AccordionContext, value: string): string[] {
  if (context.value.includes(value)) return context.value.filter(open => open !== value)
  if (context.type === 'single') return [value]
  return [...context.value, value]
}

const toggleValue: AccordionAction = ({ context, event, setContext }) => {
  if (event.type !== 'toggle') return
  const next = nextToggleValue(context, event.value)
  // A controlled value is authoritative: the toggle only reports intent (a
  // fresh mailbox token per press); the open set moves when the driver
  // re-syncs the prop through value.set.
  if (context.controlled) setContext({ valueIntent: { value: next } })
  else setContext({ value: next })
}

const setValue: AccordionAction = ({ context, event, setContext }) => {
  if (event.type !== 'value.set') return
  // Copy at the boundary — the sender keeps ownership of the array it passed.
  setContext({ value: clampToMode(context, event.value).slice() })
}

const registerItem: AccordionAction = ({ context, event, setContext }) => {
  if (event.type !== 'item.register') return
  const disabled = event.disabled === true
  const items = context.items
  const index = items.findIndex(item => item.value === event.value)
  if (index === -1) {
    setContext({ items: [...items, { value: event.value, disabled }] })
  } else if (items[index].disabled !== disabled) {
    // Update in place — a disabled flip must not move the item in the
    // navigation order.
    const next = items.slice()
    next[index] = { value: event.value, disabled }
    setContext({ items: next })
  }
}

const unregisterItem: AccordionAction = ({ context, event, setContext }) => {
  if (event.type !== 'item.unregister') return
  setContext({
    items: context.items.filter(item => item.value !== event.value),
    focusedValue: context.focusedValue === event.value ? null : context.focusedValue,
  })
}

const setFocusedValue: AccordionAction = ({ event, setContext }) => {
  if (event.type !== 'focus.set') return
  setContext({ focusedValue: event.value })
}

const clearFocusedValue: AccordionAction = ({ setContext }) => {
  setContext({ focusedValue: null })
}

const setDisabled: AccordionAction = ({ event, setContext }) => {
  if (event.type !== 'disabled.set') return
  setContext({ disabled: event.disabled })
}

const setOrientation: AccordionAction = ({ event, setContext }) => {
  if (event.type !== 'orientation.set') return
  setContext({ orientation: event.orientation })
}

// Records the decision: focusedValue is the new anchor, and the mailbox gets a
// fresh token so the substrate reacts to every move, even a repeated target.
function focusItem(
  setContext: (patch: Partial<AccordionContext>) => void,
  item: AccordionItemOptions,
): void {
  setContext({ focusedValue: item.value, focusTarget: { value: item.value } })
}

// Scan from the focused anchor in `direction`, wrapping and skipping disabled
// items. A full cycle may land back on the anchor itself — focus stays put.
function moveFocus(context: AccordionContext, direction: 1 | -1): AccordionItemOptions | null {
  const items = context.items
  const count = items.length
  if (context.disabled || count === 0) return null
  let anchor = items.findIndex(item => item.value === context.focusedValue)
  // No anchor (the focused item unregistered): enter from the matching edge.
  if (anchor === -1) anchor = direction === 1 ? -1 : 0
  for (let step = 1; step <= count; step++) {
    const index = (((anchor + direction * step) % count) + count) % count
    if (items[index].disabled !== true) return items[index]
  }
  return null
}

function edgeFocus(context: AccordionContext, direction: 1 | -1): AccordionItemOptions | null {
  const items = context.items
  if (context.disabled) return null
  const start = direction === 1 ? 0 : items.length - 1
  for (let index = start; index >= 0 && index < items.length; index += direction) {
    if (items[index].disabled !== true) return items[index]
  }
  return null
}

const focusNext: AccordionAction = ({ context, setContext }) => {
  const item = moveFocus(context, 1)
  if (item !== null) focusItem(setContext, item)
}

const focusPrevious: AccordionAction = ({ context, setContext }) => {
  const item = moveFocus(context, -1)
  if (item !== null) focusItem(setContext, item)
}

const focusFirst: AccordionAction = ({ context, setContext }) => {
  const item = edgeFocus(context, 1)
  if (item !== null) focusItem(setContext, item)
}

const focusLast: AccordionAction = ({ context, setContext }) => {
  const item = edgeFocus(context, -1)
  if (item !== null) focusItem(setContext, item)
}

// The controlled `value` takes precedence over `defaultValue`; `null` is a
// meaningful controlled value (all closed), so the checks are on undefined.
function seedValue(options: AccordionOptions): string[] {
  if (options.type === 'multiple') {
    return [...(options.value !== undefined ? options.value : (options.defaultValue ?? []))]
  }
  const seed = options.value !== undefined ? options.value : (options.defaultValue ?? null)
  return seed === null ? [] : [seed]
}

export function accordionMachine(
  options: AccordionOptions,
): TransitionConfig<AccordionStateName, AccordionContext, AccordionMachineEvent> {
  const context: AccordionContext = {
    type: options.type,
    // Multiple mode is inherently collapsible; single opts in.
    collapsible: options.type === 'multiple' || options.collapsible === true,
    controlled: options.value !== undefined,
    disabled: options.disabled ?? false,
    orientation: options.orientation ?? 'vertical',
    // The substrate supplies a unique id; `accordion` is only a bare fallback.
    id: options.id ?? 'accordion',
    value: seedValue(options),
    items: [],
    focusedValue: null,
    focusTarget: null,
    valueIntent: null,
  }

  return setup.as<AccordionContext, AccordionMachineEvent>().createMachine({
    initial: 'idle',
    context,
    // Top-level: registration, toggling, and option sync work from any state.
    on: {
      'item.register': { actions: registerItem },
      'item.unregister': { actions: unregisterItem },
      toggle: { guard: canToggle, actions: toggleValue },
      'value.set': { guard: valueChanged, actions: setValue },
      'disabled.set': { actions: setDisabled },
      'orientation.set': { actions: setOrientation },
    },
    states: {
      idle: {
        on: {
          'focus.set': { target: 'focused', actions: setFocusedValue },
        },
      },
      focused: {
        on: {
          'focus.set': { actions: setFocusedValue },
          'focus.clear': { target: 'idle', actions: clearFocusedValue },
          'focus.next': focusNext,
          'focus.previous': focusPrevious,
          'focus.first': focusFirst,
          'focus.last': focusLast,
        },
      },
    },
  })
}
