import { createHideTracker } from './hide-tracker'

// Never hide these: they carry no rendered content, or must stay announced.
const HIDE_SKIP = /^(SCRIPT|STYLE|LINK|TEMPLATE)$/

const NOOP = (): void => {}

/**
 * The containment trick: descends from the body and marks everything outside
 * the target `aria-hidden` + `inert`, so assistive tech sees only the target's
 * subtree and nothing outside it can be reached — by pointer, find-in-page, or
 * programmatic focus. The target plus `exclude` are the *retained roots*, left
 * wholly reachable: `exclude` names the elements rendered outside the target's
 * subtree that must stay so — the layer's own backdrop (portalled alongside its
 * viewport, and it must stay pressable) and the layers stacked above the
 * target. A branch holding a retained root is descended into rather than
 * spared whole: where a layer sits is the consumer's choice — every overlay
 * exposes `container` on its Portal part — so it can land on an app branch that
 * holds page content beside it, and sparing the branch would leave that content
 * reachable. A target at or above the body is a no-op: nothing sits outside it.
 * Returns a function that removes exactly what it added. Callers hide one
 * target at a time.
 */
export function hideOutside(target: HTMLElement, exclude?: readonly Element[]): () => void {
  // Without this the descent would hide the page itself rather than no-op.
  // Covers `document.body` and `document.documentElement`.
  if (target.contains(document.body)) return NOOP

  const roots: Element[] = [target]
  if (exclude !== undefined) {
    for (const element of exclude) roots.push(element)
  }

  // Hoisted out of the walk: hot path, and the closure a `.some()` would
  // allocate per node buys nothing here.
  function isRoot(node: Element): boolean {
    for (const root of roots) {
      if (root === node) return true
    }
    return false
  }

  // `Node.contains` is true of a node itself, so this only means "an ancestor
  // of a root" because `isRoot` is always tested first.
  function retainsRoot(node: Element): boolean {
    for (const root of roots) {
      if (node.contains(root)) return true
    }
    return false
  }

  const tracker = createHideTracker()

  function hideOutsideOf(parent: Element): void {
    for (const child of Array.from(parent.children)) {
      // A retained root and its subtree stay wholly reachable.
      if (isRoot(child)) continue
      // Page content can sit beside a retained root, so descend rather than
      // skip the whole branch.
      if (retainsRoot(child)) {
        hideOutsideOf(child)
        continue
      }
      // Content-less tags never need hiding; author-hidden elements are the
      // tracker's own skip.
      if (HIDE_SKIP.test(child.tagName)) continue
      tracker.hide(child)
    }
  }

  hideOutsideOf(document.body)

  return tracker.undo
}
