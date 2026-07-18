import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import { radioIds } from '@dunky.dev/radio'
import type { RadioMachine, RadioOptions } from '@dunky.dev/radio'

// Substrate effects: prop-driven or document-level work the machine can't own.
// useMachine runs one useEffect per entry, keyed on the listed prop deps.
type RadioEffect = ComponentEffect<RadioMachine, RadioOptions>

// Controlled value: follow the `value` prop in both directions.
const syncControlledValue: RadioEffect = [
  (machine, props) => {
    if (props.value === undefined) return
    if (props.value !== machine.context.value) {
      machine.send({ type: 'value.set', value: props.value })
    }
  },
  ['value'],
]

// Group disabled lives in machine context so the guards keep gating at
// runtime — synced through an event.
const syncDisabled: RadioEffect = [
  (machine, props) => {
    const disabled = props.disabled ?? false
    if (machine.context.disabled !== disabled) {
      machine.send({ type: 'disabled.set', disabled })
    }
  },
  ['disabled'],
]

// Orientation is presentational, but a responsive layout can flip it at
// runtime — keep `aria-orientation` following the prop.
const syncOrientation: RadioEffect = [
  (machine, props) => {
    if (machine.context.orientation !== props.orientation) {
      machine.send({ type: 'orientation.set', orientation: props.orientation })
    }
  },
  ['orientation'],
]

// The machine decides which item holds focus (the mailbox token); moving real
// DOM focus is this substrate's translation of that decision.
const trackFocus: RadioEffect = [
  machine => {
    const ids = radioIds(machine.context.id)
    return machine.select.context('focus').subscribe(token => {
      if (token === null) return
      document.getElementById(ids.item(token.value))?.focus()
    })
  },
  [],
]

export const radioEffects: RadioEffect[] = [
  syncControlledValue,
  syncDisabled,
  syncOrientation,
  trackFocus,
]
