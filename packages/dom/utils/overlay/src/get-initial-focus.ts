import { isFocusable, isRendered } from '@dunky.dev/dom-element'

// The strict rule is only that focus moves into the overlay: an overlay that
// collects input starts at its first form field; any other content keeps
// focus on the overlay window itself.
const FORM_FIELD_SELECTOR =
  'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'

/**
 * Resolves where focus lands: the consumer's designated element, then the
 * first form field, then the overlay window. Every candidate has to be one a
 * browser would actually focus — rendered, and not barred by an ancestor
 * `fieldset[disabled]` or `[inert]`, which the selector's own-attribute
 * checks can't see. A candidate that fails these still satisfies the
 * selector, and `focus()` on it does nothing without saying so, which spends
 * the candidate and drops focus to the window. Filtering each step keeps
 * every fallback a real one.
 */
export function getInitialFocus(
  content: HTMLElement,
  designated?: HTMLElement | null,
): HTMLElement {
  if (designated != null && isFocusable(designated) && isRendered(designated)) return designated

  const fields = content.querySelectorAll<HTMLElement>(FORM_FIELD_SELECTOR)
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]!
    if (isFocusable(field) && isRendered(field)) return field
  }

  return content
}
