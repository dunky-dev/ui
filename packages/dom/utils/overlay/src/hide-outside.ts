// Never hide these: they carry no rendered content, or must stay announced.
const HIDE_SKIP = /^(SCRIPT|STYLE|LINK|TEMPLATE)$/

/**
 * The containment trick: walks from `target` up to the document root and marks
 * every sibling along the way `aria-hidden` + `inert`, so assistive tech sees
 * only the target's subtree and nothing outside it can be reached — by pointer,
 * find-in-page, or programmatic focus. `exclude` names the elements rendered
 * outside the target's subtree that must stay reachable: the layer's own
 * backdrop (portalled alongside its viewport, and it must stay pressable) and
 * the layers stacked above the target. A match is by containment, not
 * identity — an excluded element is usually nested inside its own portal
 * wrapper, and it is the wrapper that turns up as the sibling on the walk.
 * Returns a function that removes exactly what it added. Callers hide one
 * target at a time.
 */
export function hideOutside(target: HTMLElement, exclude?: readonly Element[]): () => void {
  const hidden: Array<[Element, string | null]> = []

  // Hoisted out of the sibling loop: hot path, and the closure a `.some()`
  // would allocate per sibling buys nothing here. `Node.contains` returns true
  // for the node itself, so this also covers the direct-sibling backdrop case.
  function isExcluded(sibling: Element): boolean {
    if (exclude === undefined) return false
    for (const element of exclude) {
      if (sibling.contains(element)) return true
    }
    return false
  }

  let node: HTMLElement | null = target
  while (node !== null && node !== document.body && node.parentElement !== null) {
    for (const sibling of Array.from(node.parentElement.children)) {
      // Skip the path itself, the excluded elements, content-less tags, and
      // anything the author already hides — an existing `inert` or a truthy
      // `aria-hidden` is theirs. `aria-hidden="false"` asserts visible, the
      // opposite of author-hidden, so it doesn't count.
      const ariaHidden = sibling.getAttribute('aria-hidden')
      if (
        sibling === node ||
        isExcluded(sibling) ||
        HIDE_SKIP.test(sibling.tagName) ||
        (ariaHidden !== null && ariaHidden !== 'false') ||
        sibling.hasAttribute('inert')
      ) {
        continue
      }
      sibling.setAttribute('aria-hidden', 'true')
      sibling.setAttribute('inert', '')
      hidden.push([sibling, ariaHidden])
    }
    node = node.parentElement
  }

  return () => {
    for (const [element, previousAriaHidden] of hidden) {
      if (previousAriaHidden === null) element.removeAttribute('aria-hidden')
      else element.setAttribute('aria-hidden', previousAriaHidden)
      element.removeAttribute('inert')
    }
  }
}
