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

  const targets: Element[] = [root]
  if (backdrop != null && !root.contains(backdrop)) targets.push(backdrop)

  const hidden: Element[] = []
  for (const element of targets) {
    if (element.hasAttribute('aria-hidden') || element.hasAttribute('inert')) continue
    element.setAttribute('aria-hidden', 'true')
    element.setAttribute('inert', '')
    hidden.push(element)
  }

  return () => {
    for (const element of hidden) {
      element.removeAttribute('aria-hidden')
      element.removeAttribute('inert')
    }
  }
}
