import { isTopmostLayer } from '@dunky.dev/dom-overlay'

// The parts of a DOM press event the gates read — narrower than the host's
// synthetic event type, so every DOM host's event satisfies it.
interface PressTarget {
  target: EventTarget | null
  currentTarget: EventTarget | null
}

// Every DOM substrate would wrap the normalized part's press identically,
// so the wrap lives here: fire the consumer-visible press only when it is
// this dialog's outside interaction, swallow it otherwise.
function gate(
  bindings: Record<string, unknown>,
  accepts: (event: PressTarget) => boolean,
): Record<string, unknown> {
  // Svelte's normalize spells the press as the DOM attribute, `onclick`;
  // the other hosts camel-case it.
  const key = 'onclick' in bindings ? 'onclick' : 'onClick'
  const { [key]: press, ...rest } = bindings as Record<string, unknown>
  rest[key] = (event: PressTarget) => {
    if (accepts(event)) (press as ((event: PressTarget) => void) | undefined)?.(event)
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
