import { createHideTracker } from './hide-tracker'

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

  const tracker = createHideTracker()
  tracker.hide(root)
  if (backdrop != null && !root.contains(backdrop)) tracker.hide(backdrop)

  return tracker.undo
}
