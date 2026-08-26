/**
 * Whether an element is actually rendered — and so able to take focus, be
 * pressed, or be read out. Presence in the DOM is not enough: an element inside
 * a collapsed section still answers `querySelector`, but `focus()` on it does
 * nothing, and it does so silently.
 *
 * Deliberately out of scope: `opacity: 0` and `content-visibility`, which do
 * render. Whether something is *perceivable* is a different question from
 * whether it rendered at all, and only the latter decides focusability.
 */
export function isRendered(element: Element): boolean {
  // A detached element can't take focus, and computed style on one reports the
  // defaults rather than `none`, so the walk below would pass it.
  if (!element.isConnected) return false
  // The attribute check also covers hidden="until-found", which hides via
  // content-visibility instead of display.
  if (element.closest('[hidden]') !== null) return false
  // `visibility` inherits, so the element's own computed value suffices.
  const visibility = getComputedStyle(element).visibility
  if (visibility === 'hidden' || visibility === 'collapse') return false
  // `display` does not inherit — the computed `display` of a child of a
  // `display: none` parent is its own value — so ancestors must be walked.
  for (let node: Element | null = element; node !== null; node = node.parentElement) {
    if (getComputedStyle(node).display === 'none') return false
  }
  return true
}
