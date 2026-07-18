import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import { selectIds } from '@dunky.dev/select'
import type { SelectMachine, SelectOptions } from '@dunky.dev/select'

// Substrate effects: prop-driven or document-level work the machine can't own.
// useMachine runs one useEffect per entry, keyed on the listed prop deps.
type SelectEffect = ComponentEffect<SelectMachine, SelectOptions>

// Controlled value: follow the `value` prop in both directions (null included).
const syncControlledValue: SelectEffect = [
  (machine, props) => {
    if (props.value === undefined) return
    if (props.value !== machine.context.value) {
      machine.send({ type: 'value.set', value: props.value })
    }
  },
  ['value'],
]

// Controlled open: follow the `open` prop in both directions.
const syncControlledOpen: SelectEffect = [
  (machine, props) => {
    if (props.open === undefined) return
    if (props.open !== machine.matches('open')) {
      machine.send({ type: props.open ? 'open' : 'close' })
    }
  },
  ['open'],
]

// `disabled` gates transitions at runtime (the open guard), so it must live in
// context and re-sync when the prop changes — the machine never reads props.
const syncDisabled: SelectEffect = [
  (machine, props) => {
    const disabled = props.disabled ?? false
    if (machine.context.disabled !== disabled) {
      machine.send({ type: 'disabled.set', disabled })
    }
  },
  ['disabled'],
]

// An outside interaction is a document-level concern — it must close the list
// wherever it lands. The trigger and listbox are found by their derived ids so
// the effect needs no refs from the parts.
const trackInteractOutside: SelectEffect = [
  machine => {
    const onPointerDown = (event: PointerEvent): void => {
      if (!machine.matches('open')) return
      const target = event.target
      if (!(target instanceof Node)) return
      const ids = selectIds(machine.context.id)
      if (document.getElementById(ids.trigger)?.contains(target) === true) return
      if (document.getElementById(ids.listbox)?.contains(target) === true) return
      machine.send({ type: 'close' })
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  },
  [],
]

export const selectEffects: SelectEffect[] = [
  syncControlledValue,
  syncControlledOpen,
  syncDisabled,
  trackInteractOutside,
]
