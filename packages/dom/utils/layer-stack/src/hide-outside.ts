// Never hide these: they carry no rendered content, or must stay announced.
const HIDE_SKIP = /^(SCRIPT|STYLE|LINK|TEMPLATE)$/

// The containment trick, generalized to several kept subtrees: walk from each
// target up to the document root and mark every sibling off the kept paths
// `aria-hidden` + `inert`, so assistive tech sees only the targets' subtrees
// and nothing outside them can be reached — by pointer, find-in-page, or
// programmatic focus. Returns a function that removes exactly what it added.
// Internal to the layer stack: standalone use would fight the registry's sync.
export function hideOutside(targets: HTMLElement[]): () => void {
  // A target inside another target's subtree is already kept whole — walking
  // up from it would wrongly hide its siblings within that subtree.
  const roots: HTMLElement[] = []
  for (const target of targets) {
    let contained = false
    for (const other of targets) {
      if (other !== target && other.contains(target)) {
        contained = true
        break
      }
    }
    if (!contained) roots.push(target)
  }

  // Every root and its ancestors form the kept paths — a sibling that carries
  // another root's subtree must stay visible.
  const keep = new Set<Element>()
  for (const root of roots) {
    let node: Element | null = root
    while (node !== null) {
      keep.add(node)
      node = node.parentElement
    }
  }

  const hidden: Element[] = []
  for (const root of roots) {
    let node: HTMLElement | null = root
    while (node !== null && node !== document.body && node.parentElement !== null) {
      for (const sibling of Array.from(node.parentElement.children)) {
        // Skip the kept paths, content-less tags, and anything the author
        // already controls — an existing `aria-hidden` (any value) or `inert`
        // is theirs. Elements this walk already hid carry both attributes, so
        // overlapping walks never double-hide.
        if (
          keep.has(sibling) ||
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
  }

  return () => {
    for (const element of hidden) {
      element.removeAttribute('aria-hidden')
      element.removeAttribute('inert')
    }
  }
}
