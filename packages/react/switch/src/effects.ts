import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import type { SwitchMachine, SwitchOptions } from '@dunky.dev/switch'

// Substrate effects: prop-driven or platform work the machine can't own.
// useMachine runs one useEffect per entry, keyed on the listed prop deps.
type SwitchEffect = ComponentEffect<SwitchMachine, SwitchOptions>

// Controlled checked: follow the `checked` prop in both directions.
const syncControlledChecked: SwitchEffect = [
  (machine, props) => {
    if (props.checked === undefined) return
    if (props.checked !== machine.matches('checked')) {
      machine.send({ type: props.checked ? 'check' : 'uncheck' })
    }
  },
  ['checked'],
]

// Disabled lives in machine context so the toggle guard keeps working at
// runtime — the machine never reads props.
const syncDisabled: SwitchEffect = [
  (machine, props) => {
    const disabled = props.disabled ?? false
    if (machine.context.disabled !== disabled) {
      machine.send({ type: 'set.disabled', disabled })
    }
  },
  ['disabled'],
]

export const switchEffects: SwitchEffect[] = [syncControlledChecked, syncDisabled]
