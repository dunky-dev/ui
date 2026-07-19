import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import type { DialogMachine, DialogOptions } from '@dunky.dev/dialog'
import { dialogEffects } from '@dunky.dev/dialog'
import { isTopmostLayer } from '@dunky.dev/dom-overlay'

// Substrate effects: the core's substrate-free list (the controlled-open
// echo) plus the document-level work only this host can own.
type DialogEffect = ComponentEffect<DialogMachine, DialogOptions>

// Escape is a document-level concern, not a part's — it must work wherever
// focus is.
const trackEscape: DialogEffect = [
  (machine, props) => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || !machine.matches('open')) return
      // Only the topmost dialog answers Escape — a nested stack closes one
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

export const reactDialogEffects: DialogEffect[] = [...dialogEffects, trackEscape]
