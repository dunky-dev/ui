import { isTopmostLayer } from '@dunky.dev/dom-layer-stack'
import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import type { PopoverMachine, PopoverOptions } from '@dunky.dev/popover'

// Substrate effects: prop-driven or document-level work the machine can't own.
// useMachine runs one useEffect per entry, keyed on the listed prop deps.
type PopoverEffect = ComponentEffect<PopoverMachine, PopoverOptions>

// Controlled open: the machine never moves on its own when controlled — this
// echo of the `open` prop is the only thing that transitions it.
const syncControlledOpen: PopoverEffect = [
  (machine, props) => {
    if (props.open === undefined) return
    if (props.open !== machine.matches('open')) {
      machine.send({ type: 'controlled.sync', open: props.open })
    }
  },
  ['open'],
]

// Escape is a document-level concern, not a part's — it must work wherever
// focus is.
const trackEscape: PopoverEffect = [
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

export const popoverEffects: PopoverEffect[] = [syncControlledOpen, trackEscape]
