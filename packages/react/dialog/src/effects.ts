import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import type { DialogMachine, DialogOptions } from '@dunky.dev/dialog'

import { isTopmostDialog } from './utils/stack'

// Substrate effects: prop-driven or document-level work the machine can't own.
// useMachine runs one useEffect per entry, keyed on the listed prop deps.
type DialogEffect = ComponentEffect<DialogMachine, DialogOptions>

// Controlled open: follow the `open` prop in both directions.
const syncControlledOpen: DialogEffect = [
  (machine, props) => {
    if (props.open === undefined) return
    if (props.open !== machine.matches('open')) {
      machine.send({ type: props.open ? 'open' : 'close' })
    }
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
      if (!isTopmostDialog(machine.context.ids.content)) return
      props.onEscapeKeyDown?.(event)
      if (!event.defaultPrevented) machine.send({ type: 'escape' })
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  },
  ['onEscapeKeyDown'],
]

export const dialogEffects: DialogEffect[] = [syncControlledOpen, trackEscape]
