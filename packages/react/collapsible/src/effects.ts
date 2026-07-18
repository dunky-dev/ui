import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import type { CollapsibleMachine, CollapsibleOptions } from '@dunky.dev/collapsible'

// Substrate effects: prop-driven work the machine can't own.
// useMachine runs one useEffect per entry, keyed on the listed prop deps.
type CollapsibleEffect = ComponentEffect<CollapsibleMachine, CollapsibleOptions>

// Controlled open: follow the `open` prop in both directions.
const syncControlledOpen: CollapsibleEffect = [
  (machine, props) => {
    if (props.open === undefined) return
    if (props.open !== machine.matches('open')) {
      machine.send({ type: props.open ? 'open' : 'close' })
    }
  },
  ['open'],
]

// Disabled lives in machine context so the toggle guard keeps working at
// runtime — the machine never reads props, so prop changes are forwarded as
// events.
const syncDisabled: CollapsibleEffect = [
  (machine, props) => {
    const disabled = props.disabled ?? false
    if (machine.context.disabled !== disabled) {
      machine.send({ type: 'disabled.set', disabled })
    }
  },
  ['disabled'],
]

export const collapsibleEffects: CollapsibleEffect[] = [syncControlledOpen, syncDisabled]
