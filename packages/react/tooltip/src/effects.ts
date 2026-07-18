import type { ComponentEffect } from '@dunky.dev/react-state-machine'
import type { TooltipMachine, TooltipOptions } from '@dunky.dev/tooltip'

// Substrate effects: prop-driven or document-level work the machine can't own.
// useMachine runs one useEffect per entry, keyed on the listed prop deps.
type TooltipEffect = ComponentEffect<TooltipMachine, TooltipOptions>

// Controlled open: follow the `open` prop in both directions. The imperative
// events are immediate, so a prop change also overrides a running delay.
const syncControlledOpen: TooltipEffect = [
  (machine, props) => {
    if (props.open === undefined) return
    if (!machine.matches(props.open ? 'open' : 'closed')) {
      machine.send({ type: props.open ? 'open' : 'close' })
    }
  },
  ['open'],
]

// Escape is a document-level concern, not a part's — it must work wherever
// focus is. The machine decides what it means in each state; the listener is
// only attached while the tooltip is up, because a page can carry hundreds of
// tooltips and a closed one must not cost a document handler per keystroke
// (Escape in `closed` is a no-op in the machine anyway).
const trackEscape: TooltipEffect = [
  machine => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') machine.send({ type: 'escape' })
    }
    const toggle = (up: boolean): void => {
      if (up) document.addEventListener('keydown', onKeyDown, true)
      else document.removeEventListener('keydown', onKeyDown, true)
    }
    const up = machine.select(() => !machine.matches('closed'))
    const unsubscribe = up.subscribe(toggle)
    toggle(up.value)
    return () => {
      unsubscribe()
      toggle(false)
    }
  },
  [],
]

export const tooltipEffects: TooltipEffect[] = [syncControlledOpen, trackEscape]
