import { isTopmostLayer } from '@dunky.dev/dom-overlay'

// The parts of a DOM press event these predicates read — narrower than the
// host's synthetic event type, so React and Solid both satisfy it.
interface PressTarget {
  target: EventTarget | null
  currentTarget: EventTarget | null
}

/**
 * Whether a backdrop press is this dialog's outside interaction. Only the
 * topmost dialog of a stack answers one — a nested stack dismisses one layer
 * at a time, the same rule Escape follows.
 */
export function acceptsBackdropPress(id: string): boolean {
  return isTopmostLayer(id)
}

/**
 * Whether a viewport press is this dialog's outside interaction. Content
 * presses bubble up to the viewport, so only a press that started on the
 * viewport itself counts — and then only for the topmost dialog.
 */
export function acceptsViewportPress(id: string, event: PressTarget): boolean {
  if (event.target !== event.currentTarget) return false
  return isTopmostLayer(id)
}
