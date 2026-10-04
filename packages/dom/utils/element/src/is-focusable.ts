/**
 * Whether an element can take focus at all — not barred by disabling or
 * inertness. A focusability selector only sees an element's own attributes,
 * but both bars also arrive from ancestors: a control inside a
 * `fieldset[disabled]` subtree, or anything inside an `[inert]` one, refuses
 * `focus()` — and refuses it silently.
 *
 * A deliberately narrow facet: renderedness is `isRendered`'s question, and
 * the tab order is the caller's. The three compose.
 */
export function isFocusable(element: Element): boolean {
  // `:disabled` resolves fieldset ancestry — including the native exception
  // that controls in a disabled fieldset's first `legend` stay enabled —
  // where the `disabled` IDL property reflects only the element's own
  // attribute.
  return !element.matches(':disabled') && element.closest('[inert]') === null
}
