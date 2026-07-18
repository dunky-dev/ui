import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import type { TabsMachine, TabsOptions } from '@dunky.dev/tabs'

// Substrate effects: prop-driven or document-level work the machine can't own.
// useMachine runs one useEffect per entry, keyed on the listed prop deps.
type TabsEffect = ComponentEffect<TabsMachine, TabsOptions>

// Controlled value: follow the `value` prop whenever it changes.
const syncControlledValue: TabsEffect = [
  (machine, props) => {
    if (props.value === undefined) return
    if (props.value !== machine.context.selectedValue) {
      machine.send({ type: 'value.set', value: props.value })
    }
  },
  ['value'],
]

export const tabsEffects: TabsEffect[] = [syncControlledValue]
