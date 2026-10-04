/**
 * A closing overlay has already left the stack — the page beneath is live
 * again — but its layer keeps painting until the exit visual finishes. Take
 * the layer out of the page's interaction for that window (`inert` covers
 * pointer, tab order, and assistive tech): the content's outermost portalled
 * ancestor below `boundary` (the viewport, or the content itself when
 * portalled bare), plus the backdrop portalled alongside it. Elements the
 * author already hides stay theirs, mirroring the containment walk. Returns
 * an undo for the reopen interrupt.
 */
export function hideExitingLayer(
  content: HTMLElement,
  boundary: HTMLElement,
  backdrop?: Element | null,
): () => void {
  let root: HTMLElement = content
  while (root.parentElement !== null && root.parentElement !== boundary) {
    root = root.parentElement
  }
  // A `boundary` that isn't an ancestor exhausts the walk at the document
  // root — inerting <html> would take the whole page out. Scope the miss to
  // the content itself.
  if (root.parentElement === null) root = content

  const targets: Element[] = [root]
  if (backdrop != null && !root.contains(backdrop)) targets.push(backdrop)

  const hidden: Array<[Element, string | null]> = []
  for (const element of targets) {
    // `aria-hidden="false"` asserts visible — the opposite of author-hidden —
    // so only a truthy value counts as the author's.
    const ariaHidden = element.getAttribute('aria-hidden')
    if ((ariaHidden !== null && ariaHidden !== 'false') || element.hasAttribute('inert')) continue
    element.setAttribute('aria-hidden', 'true')
    element.setAttribute('inert', '')
    hidden.push([element, ariaHidden])
  }

  return () => {
    for (const [element, previousAriaHidden] of hidden) {
      if (previousAriaHidden === null) element.removeAttribute('aria-hidden')
      else element.setAttribute('aria-hidden', previousAriaHidden)
      element.removeAttribute('inert')
    }
  }
}
