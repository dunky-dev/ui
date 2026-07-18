import {
  setup,
  type Action,
  type Guard,
  type Machine,
  type TransitionConfig,
} from '@dunky.dev/state-machine'
import type {
  RadioContext,
  RadioItem,
  RadioMachineEvent,
  RadioOptions,
  RadioStateName,
} from './types'

/** The running radio machine — what a substrate holds and sends events to. */
export type RadioMachine = Machine<RadioStateName, RadioContext, RadioMachineEvent>

type RadioAction = Action<RadioContext, RadioMachineEvent>
type RadioGuard = Guard<RadioContext, RadioMachineEvent>

export function findItem(items: RadioItem[], value: string): RadioItem | undefined {
  for (const item of items) {
    if (item.value === value) return item
  }
  return undefined
}

// Interaction never selects through a disabled group or item; only the
// consumer's `value.set` (controlled sync / setValue) bypasses this.
const canSelect: RadioGuard = ({ context, event }) => {
  if (event.type !== 'select' || context.disabled) return false
  const item = findItem(context.items, event.value)
  return item !== undefined && !item.disabled
}

const canNavigate: RadioGuard = ({ context }) => !context.disabled

const select: RadioAction = ({ event, setContext }) => {
  if (event.type !== 'select') return
  // Presses ask for focus (`focus: true`); Space needs no token — a keydown
  // already targets the focused item.
  setContext(
    event.focus === true
      ? { value: event.value, focus: { value: event.value } }
      : { value: event.value },
  )
}

// Walk from the origin in `direction`, wrapping, to the first enabled item —
// the origin itself is the last candidate, so a lone enabled item still
// selects on an arrow press. Selection follows focus, in one write.
const navigate: RadioAction = ({ context, event, setContext }) => {
  if (event.type !== 'navigate') return
  const items = context.items
  const count = items.length
  let origin = -1
  for (let index = 0; index < count; index++) {
    if (items[index].value === event.from) {
      origin = index
      break
    }
  }
  if (origin === -1) return
  for (let step = 1; step <= count; step++) {
    const candidate = items[(((origin + event.direction * step) % count) + count) % count]
    if (candidate.disabled) continue
    setContext({ value: candidate.value, focus: { value: candidate.value } })
    return
  }
}

const setValue: RadioAction = ({ event, setContext }) => {
  if (event.type !== 'value.set') return
  setContext({ value: event.value })
}

const setDisabled: RadioAction = ({ event, setContext }) => {
  if (event.type !== 'disabled.set') return
  setContext({ disabled: event.disabled })
}

const setOrientation: RadioAction = ({ event, setContext }) => {
  if (event.type !== 'orientation.set') return
  setContext({ orientation: event.orientation })
}

// Upsert: a re-register updates `disabled` in place so the entry never moves —
// registration order is the navigation order.
const registerItem: RadioAction = ({ context, event, setContext }) => {
  if (event.type !== 'item.register') return
  const items = context.items
  for (let index = 0; index < items.length; index++) {
    if (items[index].value !== event.value) continue
    if (items[index].disabled === event.disabled) return
    const next = items.slice()
    next[index] = { value: event.value, disabled: event.disabled }
    setContext({ items: next })
    return
  }
  setContext({ items: [...items, { value: event.value, disabled: event.disabled }] })
}

const unregisterItem: RadioAction = ({ context, event, setContext }) => {
  if (event.type !== 'item.unregister') return
  setContext({ items: context.items.filter(item => item.value !== event.value) })
}

const setLabelPresence: RadioAction = ({ context, event, setContext }) => {
  if (event.type !== 'label.presence') return
  setContext({ labels: { ...context.labels, [event.value]: event.present } })
}

export function radioMachine(
  options: RadioOptions,
): TransitionConfig<RadioStateName, RadioContext, RadioMachineEvent> {
  // Annotated so createMachine infers Context as RadioContext, not the narrowed literal.
  const context: RadioContext = {
    value: options.value !== undefined ? options.value : (options.defaultValue ?? null),
    disabled: options.disabled ?? false,
    orientation: options.orientation,
    // The substrate supplies a unique id; `radio` is only a bare fallback.
    id: options.id ?? 'radio',
    items: [],
    labels: {},
    focus: null,
  }

  return setup.as<RadioContext, RadioMachineEvent>().createMachine({
    initial: 'idle',
    context,
    // Top-level: registration and prop-sync land from any state.
    on: {
      'item.register': { actions: registerItem },
      'item.unregister': { actions: unregisterItem },
      'label.presence': { actions: setLabelPresence },
      'value.set': { actions: setValue },
      'disabled.set': { actions: setDisabled },
      'orientation.set': { actions: setOrientation },
    },
    states: {
      idle: {
        on: {
          select: { guard: canSelect, actions: select },
          navigate: { guard: canNavigate, actions: navigate },
        },
      },
    },
  })
}
