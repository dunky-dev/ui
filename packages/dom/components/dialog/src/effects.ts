import { dialogEffects, type DialogEffect } from '@dunky.dev/dialog'
import { isTopmostLayer } from '@dunky.dev/dom-overlay'

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

/**
 * The core's substrate-free effects plus the document-level work every DOM
 * host owns. A DOM substrate passes this list to its adapter's `useMachine`
 * as-is; the tuple shape is structurally the adapter's `ComponentEffect`.
 */
export const domDialogEffects: DialogEffect[] = [...dialogEffects, trackEscape]
