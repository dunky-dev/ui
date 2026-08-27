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
 * at a time, the same rule Escape follows. `startedInside` (see
 * `trackPressOrigin` in `@dunky.dev/dom-press-origin`) refuses a press whose gesture began inside the
 * window: a text-selection drag that starts inside and releases on the
 * backdrop must not read as an outside press.
 */
export function acceptsBackdropPress(id: string, startedInside: boolean): boolean {
  if (startedInside) return false
  return isTopmostLayer(id)
}

/**
 * Whether a viewport press is this dialog's outside interaction. Content
 * presses bubble up to the viewport, so only a press that started on the
 * viewport itself counts — and then only for the topmost dialog.
 * `startedInside` catches what the bubble check can't: a text-selection drag
 * starting inside the window and releasing on the viewport's own background
 * collapses the click's target to the viewport, passing the bubble check —
 * see `trackPressOrigin`.
 */
export function acceptsViewportPress(
  id: string,
  event: PressTarget,
  startedInside: boolean,
): boolean {
  if (startedInside) return false
  if (event.target !== event.currentTarget) return false
  return isTopmostLayer(id)
}
