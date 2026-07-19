import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import type { DialogMachine, DialogOptions } from '@dunky.dev/dialog'
import { isTopmostDialog } from '@dunky.dev/dom-dialog'

// Substrate effects: prop-driven or document-level work the machine can't own.
// useMachine runs one useEffect per entry, keyed on the listed prop deps.
type DialogEffect = ComponentEffect<DialogMachine, DialogOptions>

// Controlled open: the machine never moves on its own when controlled — this
// echo of the `open` prop is the only thing that transitions it. It carries
// the prop verbatim: `undefined` hands the state back to the machine
// (uncontrolled again), a value (re)takes control. The mount echo no-ops.
const syncControlledOpen: DialogEffect = [
  (machine, props) => {
    machine.send({ type: 'controlled.sync', value: props.open })
  },
  ['open'],
]

// Escape is a document-level concern, not a part's — it must work wherever
// focus is.
const trackEscape: DialogEffect = [
  (machine, props) => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || !machine.matches('open')) return
      // Only the topmost dialog answers Escape — a nested stack closes one
      // layer at a time.
      if (!isTopmostDialog(machine.context.id)) return
      props.onEscapeKeyDown?.(event)
      if (!event.defaultPrevented) machine.send({ type: 'escape' })
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  },
  ['onEscapeKeyDown'],
]

export const dialogEffects: DialogEffect[] = [syncControlledOpen, trackEscape]
