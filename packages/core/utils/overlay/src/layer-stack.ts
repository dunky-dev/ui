// The overlay family — dialog, drawer, popover, menu, combobox — shares one
// coordination problem: when overlays stack, which layer is topmost? The
// topmost owns Escape and the focus trap; assistive-tech containment follows
// the topmost modal layer, which is not always the same one. This is the
// agnostic half of the answer: the registry and the ranking decision, with no
// host assumptions. A host realization (DOM, native) gives each layer a
// payload — the element or view — and applies its own containment when the
// stack shifts.

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
  // Every layer, topmost first. A host that treats layers differently by kind
  // — containment follows the topmost *modal* layer, not the topmost layer —
  // needs to look past the top of the stack; the kind itself stays the host's
  // concern, so this orders and the host decides.
  ordered: () => T[]
  isTopmost: (id: string) => boolean
  // The layers stacked beneath `id`, topmost first — the unwinding order for a
  // dismissal scoped to the whole stack rather than one layer. An id that
  // isn't registered has nothing beneath it.
  below: (id: string) => T[]
}

// One stack per running host: a browser page or a native app is one or the
// other, never both, so each host binding creates a single instance every
// primitive registers into — that shared instance is what makes one Escape
// close exactly one layer, even across different primitives.
export function createLayerStack<T extends OverlayLayer>(): LayerStack<T> {
  const layers: Array<T & { order: number }> = []
  let nextOrder = 0

  // Topmost first: deeper nesting wins, open order breaks ties at equal depth.
  const isAbove = (layer: T & { order: number }, other: T & { order: number }): boolean =>
    layer.depth > other.depth || (layer.depth === other.depth && layer.order > other.order)

  const topmost = (): T | undefined => {
    let top: (T & { order: number }) | undefined
    for (const layer of layers) {
      if (top === undefined || isAbove(layer, top)) top = layer
    }
    return top
  }

  const ordered = (): T[] => {
    // Copy before sorting: the registry's own order is identity, not rank.
    // The comparator never returns 0, which is fine — `order` is unique per
    // layer, so `isAbove` is a strict total order over distinct layers.
    const sorted = layers.slice()
    sorted.sort((a, b) => (isAbove(a, b) ? -1 : 1))
    return sorted
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
    ordered,
    isTopmost(id) {
      return topmost()?.id === id
    },
    below(id) {
      // "Beneath" is the same ranking `ordered` already answers: everything
      // after the layer in topmost-first order.
      const ranked = ordered()
      const at = ranked.findIndex(layer => layer.id === id)
      return at === -1 ? [] : ranked.slice(at + 1)
    },
  }
}
