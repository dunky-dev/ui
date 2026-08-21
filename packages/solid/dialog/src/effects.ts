import type { ComponentEffect } from '@dunky.dev/solid-state-machine'
import type { DialogMachine, DialogOptions } from '@dunky.dev/dialog'
import { dialogEffects } from '@dunky.dev/dialog'
import { isTopmostLayer } from '@dunky.dev/dom-overlay'

type DialogEffect = ComponentEffect<DialogMachine, DialogOptions>

// Escape is a document-level concern — it must work wherever focus is.
const trackEscape: DialogEffect = [
  (machine, props) => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || !machine.matches('open')) return
      // Only the topmost dialog answers Escape — one layer per press.
      if (!isTopmostLayer(machine.context.id)) return
      props.onEscapeKeyDown?.(event)
      if (!event.defaultPrevented) machine.send({ type: 'escape' })
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  },
  ['onEscapeKeyDown'],
]

// The core's substrate-free effects plus the document-level work of this host.
export const solidDialogEffects: DialogEffect[] = [...dialogEffects, trackEscape]
