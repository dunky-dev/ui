import { isTopmostLayer } from '@dunky.dev/dom-layer-stack'
import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import type { ComboboxMachine, ComboboxOptions } from '@dunky.dev/combobox'

// Substrate effects: prop-driven or document-level work the machine can't own.
// useMachine runs one useEffect per entry, keyed on the listed prop deps.
type ComboboxEffect = ComponentEffect<ComboboxMachine, ComboboxOptions>

// Controlled open: follow the `open` prop in both directions.
const syncControlledOpen: ComboboxEffect = [
  (machine, props) => {
    if (props.open === undefined) return
    if (props.open !== machine.matches('open')) {
      machine.send({ type: props.open ? 'open' : 'close' })
    }
  },
  ['open'],
]

// Controlled value: follow the `value` prop in both directions (null included).
const syncControlledValue: ComboboxEffect = [
  (machine, props) => {
    if (props.value === undefined) return
    if (props.value !== machine.context.value) {
      machine.send({ type: 'value.set', value: props.value })
    }
  },
  ['value'],
]

// Controlled input text: follow the `inputValue` prop.
const syncControlledInputValue: ComboboxEffect = [
  (machine, props) => {
    if (props.inputValue === undefined) return
    if (props.inputValue !== machine.context.inputValue) {
      machine.send({ type: 'inputValue.set', value: props.inputValue })
    }
  },
  ['inputValue'],
]

// `disabled` gates transitions at runtime (the open guard), so it must live in
// context and re-sync when the prop changes — the machine never reads props.
const syncDisabled: ComboboxEffect = [
  (machine, props) => {
    const disabled = props.disabled ?? false
    if (machine.context.disabled !== disabled) {
      machine.send({ type: 'disabled.set', disabled })
    }
  },
  ['disabled'],
]

// Escape is a document-level concern, not a part's — it must work wherever
// focus is.
const trackEscape: ComboboxEffect = [
  (machine, props) => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || !machine.matches('open')) return
      // Only the topmost layer answers Escape — a nested stack closes one
      // layer at a time.
      if (!isTopmostLayer(machine.context.id)) return
      props.onEscapeKeyDown?.(event)
      if (!event.defaultPrevented) machine.send({ type: 'escape' })
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  },
  ['onEscapeKeyDown'],
]

export const comboboxEffects: ComboboxEffect[] = [
  syncControlledOpen,
  syncControlledValue,
  syncControlledInputValue,
  syncDisabled,
  trackEscape,
]
