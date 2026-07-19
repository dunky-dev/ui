// The overlay family — dialog, drawer, popover, menu, combobox — shares one
// coordination problem: when overlays stack, which layer is topmost? The
// topmost owns Escape, the focus trap, and (when modal) assistive-tech
// containment. This is the agnostic half of the answer: the registry and the
// topmost decision, with no host assumptions. A host realization (DOM, native)
// gives each layer a payload — the element or view — and applies its own
// containment when the stack shifts.

export interface OverlayLayer {
  id: string
  // Nesting depth (1 = top-level). The deepest layer is topmost; open order
  // breaks ties between layers at the same depth. Depth — not registration or
  // document order — decides it, because a host may insert a nested layer
  // before its parent (React portals do), inverting document order relative to
  // nesting.
  depth: number
}

export interface LayerStack<T extends OverlayLayer> {
  // Joins the layer to the stack; the returned disposer removes it.
  register: (layer: T) => () => void
  // The topmost layer, or undefined when the stack is empty.
  topmost: () => T | undefined
  isTopmost: (id: string) => boolean
}

// One stack per running host: a browser page or a native app is one or the
// other, never both, so each host binding creates a single instance every
// primitive registers into — that shared instance is what makes one Escape
// close exactly one layer, even across different primitives.
export function createLayerStack<T extends OverlayLayer>(): LayerStack<T> {
  const layers: Array<T & { order: number }> = []
  let nextOrder = 0

  const topmost = (): T | undefined => {
    let top: (T & { order: number }) | undefined
    for (const layer of layers) {
      if (
        top === undefined ||
        layer.depth > top.depth ||
        (layer.depth === top.depth && layer.order > top.order)
      ) {
        top = layer
      }
    }
    return top
  }

  return {
    register(layer) {
      const entry = { ...layer, order: nextOrder++ }
      layers.push(entry)
      return () => {
        const index = layers.indexOf(entry)
        if (index !== -1) layers.splice(index, 1)
      }
    },
    topmost,
    isTopmost(id) {
      return topmost()?.id === id
    },
  }
}
