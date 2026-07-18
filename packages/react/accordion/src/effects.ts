import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import { accordionIds } from '@dunky.dev/accordion'
import type { AccordionMachine, AccordionOptions } from '@dunky.dev/accordion'

// Substrate effects: prop-driven or document-level work the machine can't own.
// useMachine runs one useEffect per entry, keyed on the listed prop deps.
type AccordionEffect = ComponentEffect<AccordionMachine, AccordionOptions>

// Controlled value: follow the `value` prop, translated to the canonical array
// shape. The machine dedupes, so a same-content array is a no-op.
const syncControlledValue: AccordionEffect = [
  (machine, props) => {
    if (props.value === undefined) return
    const value =
      props.type === 'multiple' ? props.value : props.value === null ? [] : [props.value]
    machine.send({ type: 'value.set', value })
  },
  ['value'],
]

// Config that lives in machine context is synced through events, so guards
// keep working at runtime — the machine never reads props.
const syncDisabled: AccordionEffect = [
  (machine, props) => {
    const disabled = props.disabled ?? false
    if (machine.context.disabled !== disabled) {
      machine.send({ type: 'disabled.set', disabled })
    }
  },
  ['disabled'],
]

const syncOrientation: AccordionEffect = [
  (machine, props) => {
    const orientation = props.orientation ?? 'vertical'
    if (machine.context.orientation !== orientation) {
      machine.send({ type: 'orientation.set', orientation })
    }
  },
  ['orientation'],
]

// The machine decides which trigger holds focus; carrying that decision to the
// DOM is substrate work. Every mailbox token is fresh, so every move fires —
// even one that lands on the same trigger.
const moveDomFocus: AccordionEffect = [
  machine => {
    const ids = accordionIds(machine.context.id)
    return machine.select.context('focusTarget').subscribe(target => {
      if (target !== null) document.getElementById(ids.trigger(target.value))?.focus()
    })
  },
  [],
]

export const accordionEffects: AccordionEffect[] = [
  syncControlledValue,
  syncDisabled,
  syncOrientation,
  moveDomFocus,
]
