import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import { checkboxStateOf } from '@dunky.dev/checkbox'
import type { CheckboxMachine, CheckboxOptions } from '@dunky.dev/checkbox'

// Substrate effects: prop-driven work the machine can't own. useMachine runs
// one useEffect per entry, keyed on the listed prop deps.
type CheckboxEffect = ComponentEffect<CheckboxMachine, CheckboxOptions>

// Controlled checked: follow the `checked` prop in every direction — through
// the silent sync event, so the prop write is never echoed via onCheckedChange.
const syncControlledChecked: CheckboxEffect = [
  (machine, props) => {
    if (props.checked === undefined) return
    if (machine.state !== checkboxStateOf(props.checked)) {
      machine.send({ type: 'sync.checked', checked: props.checked })
    }
  },
  ['checked'],
]

// `disabled` lives in machine context so the toggle guard keeps working at
// runtime — synced through an event; the machine never reads props.
const syncDisabled: CheckboxEffect = [
  (machine, props) => {
    const disabled = props.disabled ?? false
    if (machine.context.disabled !== disabled) {
      machine.send({ type: 'set.disabled', disabled })
    }
  },
  ['disabled'],
]

export const checkboxEffects: CheckboxEffect[] = [syncControlledChecked, syncDisabled]
