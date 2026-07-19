// Never hide these: they carry no rendered content, or must stay announced.
const HIDE_SKIP = /^(SCRIPT|STYLE|LINK|TEMPLATE)$/

/**
 * The containment trick: walks from `target` up to the document root and marks
 * every sibling along the way `aria-hidden` + `inert`, so assistive tech sees
 * only the target's subtree and nothing outside it can be reached — by pointer,
 * find-in-page, or programmatic focus. `exclude` names the one same-layer
 * element rendered outside the target's subtree (the dialog's own backdrop,
 * portalled alongside its viewport) that must stay pressable. Returns a
 * function that removes exactly what it added. Callers hide one target at a
 * time.
 */
export function hideOutside(target: HTMLElement, exclude?: Element | null): () => void {
  const hidden: Element[] = []

  let node: HTMLElement | null = target
  while (node !== null && node !== document.body && node.parentElement !== null) {
    for (const sibling of Array.from(node.parentElement.children)) {
      // Skip the path itself, the layer's own excluded element, content-less
      // tags, and anything the author already controls — an existing
      // `aria-hidden` (any value) or `inert` is theirs.
      if (
        sibling === node ||
        sibling === exclude ||
        HIDE_SKIP.test(sibling.tagName) ||
        sibling.hasAttribute('aria-hidden') ||
        sibling.hasAttribute('inert')
      ) {
        continue
      }
      sibling.setAttribute('aria-hidden', 'true')
      sibling.setAttribute('inert', '')
      hidden.push(sibling)
    }
    node = node.parentElement
  }

  return () => {
    for (const element of hidden) {
      element.removeAttribute('aria-hidden')
      element.removeAttribute('inert')
    }
  }
}
