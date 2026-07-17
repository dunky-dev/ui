import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import type { __Name__Machine, __Name__Options } from '@dunky.dev/__name__'

// Substrate effects: prop-driven or platform work the machine can't own.
// useMachine runs one useEffect per entry, keyed on the listed prop deps.
type __Name__Effect = ComponentEffect<__Name__Machine, __Name__Options>

// Config that lives in machine context is synced through events, so guards keep
// working at runtime — the machine never reads props. Document listeners and
// platform APIs also belong here (see the dialog for an example).
const syncDisabled: __Name__Effect = [
  (machine, props) => {
    const disabled = props.disabled ?? false
    if (machine.context.disabled !== disabled) {
      machine.send({ type: 'SET_DISABLED', disabled })
    }
  },
  ['disabled'],
]

export const __camelName__Effects: __Name__Effect[] = [syncDisabled]
