import { getLayer, layerContaining } from './stack'

// A popup can hold focus inside a layer without ever joining the stack — a
// listbox or menu from another library, a combobox's list — so the stack still
// names the layer topmost while the popup owns the keyboard. Ownership is read
// from ARIA instead: the popup roles (`aria-haspopup`'s values) mark the layer
// focus sits in, and the stack tells a registered layer from a popup that
// never registered. No cooperation is required — any well-formed ARIA popup
// works.
const POPUP_SELECTOR =
  '[role="listbox"], [role="menu"], [role="tree"], [role="grid"], [role="dialog"], [role="alertdialog"]'

/**
 * Whether focus sits in a popup that is neither the layer's own window nor a
 * registered layer — wherever it renders, inside the window or portalled
 * beside it. Outside every registered window and in no popup role counts too:
 * the page is inert while a modal layer is open, so whatever holds focus out
 * there is a layer. The body (focus in browser chrome, or nowhere) doesn't: the
 * layer re-enters from there.
 */
export function foreignPopupHoldsFocus(id: string): boolean {
  const layer = getLayer(id)
  if (layer === undefined) return false
  const active = document.activeElement
  if (active === null || active === document.body) return false
  const popup = active.closest(POPUP_SELECTOR)
  if (popup === null) return layerContaining(active) === undefined
  return popup !== layer.element && layerContaining(popup)?.element !== popup
}

/**
 * Whether focus sits on a control inside the layer's window whose popup is
 * expanded — a combobox keeps focus on its input while its list is open — so
 * the popup owns Escape. `aria-expanded` alone isn't enough: a disclosure or
 * accordion trigger is expanded too and has no popup to close, so
 * `aria-haspopup` must name one.
 */
export function expandedPopupControlHoldsFocus(id: string): boolean {
  const layer = getLayer(id)
  if (layer === undefined) return false
  const active = document.activeElement
  if (active === null || !layer.element.contains(active)) return false
  if (active.getAttribute('aria-expanded') !== 'true') return false
  const popup = active.getAttribute('aria-haspopup')
  return popup !== null && popup !== 'false'
}
