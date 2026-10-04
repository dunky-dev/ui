import { isTopmostLayer } from '@dunky.dev/dom-overlay'

// The parts of a DOM press event the gates read — narrower than the host's
// synthetic event type, so React and Solid both satisfy it.
interface PressTarget {
  target: EventTarget | null
  currentTarget: EventTarget | null
}

// Every DOM substrate would wrap the normalized part's onClick identically,
// so the wrap lives here: fire the consumer-visible press only when it is
// this dialog's outside interaction, swallow it otherwise.
function gate(
  bindings: Record<string, unknown>,
  accepts: (event: PressTarget) => boolean,
): Record<string, unknown> {
  const { onClick, ...rest } = bindings as { onClick?: (event: PressTarget) => void } & Record<
    string,
    unknown
  >
  rest.onClick = (event: PressTarget) => {
    if (accepts(event)) onClick?.(event)
  }
  return rest
}

/**
 * The backdrop part's bindings with the press gated: only the topmost dialog
 * of a stack answers an outside interaction — a nested stack dismisses one
 * layer at a time, the same rule Escape follows.
 */
export function gateBackdropPress(
  id: string,
  bindings: Record<string, unknown>,
): Record<string, unknown> {
  return gate(bindings, () => isTopmostLayer(id))
}

/**
 * The viewport part's bindings with the press gated: content presses bubble
 * up to the viewport, so only a press that started on the viewport itself
 * counts — and then only for the topmost dialog.
 */
export function gateViewportPress(
  id: string,
  bindings: Record<string, unknown>,
): Record<string, unknown> {
  return gate(bindings, event => event.target === event.currentTarget && isTopmostLayer(id))
}
