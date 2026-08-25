import { dialogEffects, type DialogEffect } from '@dunky.dev/dialog'
import { isTopmostLayer, layersBelow } from '@dunky.dev/dom-overlay'

// Escape is a document-level concern, not a part's — it must work wherever
// focus is.
const trackEscape: DialogEffect = [
  (machine, props) => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || !machine.matches('open')) return
      // Only the topmost dialog answers Escape — a nested stack closes one
      // layer at a time, unless this dialog's scope is the whole stack.
      if (!isTopmostLayer(machine.context.id)) return
      props.onEscapeKeyDown?.(event)
      if (event.defaultPrevented) return
      // Read the stack before the send: closing this layer releases it, and
      // the answer to "what was beneath me" goes with it.
      const beneath = machine.context.escapeScope === 'stack' ? layersBelow(machine.context.id) : []
      machine.send({ type: 'escape' })
      // Only an Escape this dialog actually allowed unwinds the rest — and the
      // layers beneath receive a plain close, their own dismissal settings not
      // consulted again, because the intent was gated and vetoed here.
      if (machine.matches('open')) return
      for (const layer of beneath) layer.dismiss?.()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  },
  ['onEscapeKeyDown'],
]

/**
 * The core's substrate-free effects plus the document-level work every DOM
 * host owns. A DOM substrate passes this list to its adapter's `useMachine`
 * as-is; the tuple shape is structurally the adapter's `ComponentEffect`.
 */
export const domDialogEffects: DialogEffect[] = [...dialogEffects, trackEscape]
