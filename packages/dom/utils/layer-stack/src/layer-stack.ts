import { hideOutside } from './hide-outside'

export interface LayerInit {
  /** The id `isTopmostLayer` / `layerContainsTarget` answer for. */
  id: string
  /**
   * The layer's nesting chain — every enclosing layer's id, outermost first,
   * ending with this layer's own `id`. Comes from the substrate's shared
   * layer-path context; its length is the nesting depth, its contents the
   * ancestry `layerContainsTarget` checks.
   */
  path: readonly string[]
  /** The layer's DOM subtree (its content panel). */
  element: HTMLElement
  /** Whether the layer hides everything outside itself from assistive tech. */
  modal: boolean
}

interface Layer extends LayerInit {
  order: number
}

// The shared registry of open overlay layers. One module-level instance on
// purpose: every primitive must agree on which layer is topmost, so one
// Escape press closes exactly one layer even across primitives. The topmost
// is the deepest-nested layer — the longest path — with open order breaking
// ties between siblings.
//
// Nesting (not DOM order) decides it: React inserts a nested layer's portal
// into the body *before* its parent's, so document order is the inverse of
// nesting.
const layers: Layer[] = []
let nextOrder = 0
let undoHide: (() => void) | undefined

function isAbove(layer: Layer, other: Layer): boolean {
  return (
    layer.path.length > other.path.length ||
    (layer.path.length === other.path.length && layer.order > other.order)
  )
}

function topmost(): Layer | undefined {
  let top: Layer | undefined
  for (const layer of layers) {
    if (top === undefined || isAbove(layer, top)) top = layer
  }
  return top
}

// Keep the assistive-tech view in sync: the topmost MODAL layer anchors the
// containment, and every layer stacked above it (e.g. a non-modal popover
// over a modal dialog) stays reachable too; everything else is hidden. With
// no modal layer, nothing is hidden. Re-runs whenever the stack changes so a
// new layer hides the ones beneath it, and closing it restores them.
function syncContainment(): void {
  undoHide?.()
  undoHide = undefined

  let anchor: Layer | undefined
  for (const layer of layers) {
    if (layer.modal && (anchor === undefined || isAbove(layer, anchor))) anchor = layer
  }
  if (anchor === undefined) return

  const visible: HTMLElement[] = []
  for (const layer of layers) {
    // `isConnected` guards teardown, when a content panel is already detached.
    if ((layer === anchor || isAbove(layer, anchor)) && layer.element.isConnected) {
      visible.push(layer.element)
    }
  }
  if (visible.length > 0) undoHide = hideOutside(visible)
}

export function registerLayer(layer: LayerInit): () => void {
  const entry: Layer = { ...layer, order: nextOrder++ }
  layers.push(entry)
  syncContainment()
  return () => {
    const index = layers.indexOf(entry)
    if (index !== -1) layers.splice(index, 1)
    syncContainment()
  }
}

export function isTopmostLayer(id: string): boolean {
  return topmost()?.id === id
}

/**
 * Whether `target` falls inside the layer's own subtree or a descendant
 * layer's — outside-press detection uses this so a press in a nested layer
 * never counts as outside the one beneath. Ancestry decides, not depth or
 * stack position: a layer counts only when the queried id is on its `path`,
 * so an independent layer — a sibling, or even a deeper layer of an unrelated
 * stack — is still outside, and pressing it dismisses this one.
 */
export function layerContainsTarget(id: string, target: Node): boolean {
  let base: Layer | undefined
  for (const layer of layers) {
    if (layer.id === id) {
      base = layer
      break
    }
  }
  if (base === undefined) return false
  for (const layer of layers) {
    if ((layer === base || layer.path.includes(id)) && layer.element.contains(target)) return true
  }
  return false
}
