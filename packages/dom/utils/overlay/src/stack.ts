import { createLayerStack, type LayerStack, type OverlayLayer } from '@dunky.dev/overlay'
import { hideOutside } from './hide-outside'

// The DOM realization of the shared layer stack: each layer carries its
// element and modality, and one instance keeps assistive-tech containment in
// sync as the stack shifts.
export interface Layer extends OverlayLayer {
  element: HTMLElement
  modal: boolean
  /**
   * Resolves the layer's own backdrop — rendered outside the content's subtree
   * yet part of the layer, so it must stay pressable while its layer is
   * topmost. A getter (not a snapshot) so a re-hide — when a layer above
   * closes — sees the element current at that moment.
   */
  backdrop?: () => Element | null
  /**
   * Closes this layer, for a dismissal scoped to the whole stack rather than
   * one layer: the layer that received the intent unwinds the ones beneath by
   * calling theirs. A layer that provides none opts out and stays open.
   */
  dismiss?: () => void
}

// One Escape closes exactly one layer only if every overlay shares a single
// stack — but a monorepo or micro-frontend can load more than one copy of this
// module into the same page, and a plain module-level `const` gives each copy
// its own stack, so their topmost decisions drift apart (Radix's focus-scope
// stack hit this exact class of bug: radix-ui/primitives#2815). Anchoring the
// mutable state on a realm-global keyed by `Symbol.for` makes every duplicate
// copy rendezvous on the same store. Resolved lazily on first use so the
// module keeps its `sideEffects: false` contract — no import-time global write.
const STORE_KEY = Symbol.for('@dunky.dev/dom-overlay#overlay-store')

interface OverlayStore {
  stack: LayerStack<Layer>
  undoHide?: () => void
}

function getStore(): OverlayStore {
  const scope = globalThis as unknown as Record<symbol, OverlayStore | undefined>
  let store = scope[STORE_KEY]
  if (store === undefined) {
    store = { stack: createLayerStack<Layer>() }
    scope[STORE_KEY] = store
  }
  return store
}

// Keep the assistive-tech view in sync: the topmost modal layer and the layers
// stacked above it stay reachable; everything else is hidden. Re-runs whenever
// the stack changes so a nested layer hides the one beneath it, and closing it
// restores the layer.
function syncContainment(store: OverlayStore): void {
  store.undoHide?.()
  store.undoHide = undefined

  // Containment follows the topmost *modal* layer, not the topmost layer: the
  // ordinary layers — a select menu, a combobox list, a tooltip — are
  // non-modal and live inside dialogs, and a modal layer's containment must
  // not lapse for as long as one of them is open on top of it.
  const ordered = store.stack.ordered()
  const index = ordered.findIndex(layer => layer.modal)
  if (index === -1) return

  const modal = ordered[index]
  // `isConnected` guards teardown, when the content is already detached.
  if (!modal.element.isConnected) return

  // The layers at or above the modal one are legitimately open and portalled
  // outside its subtree, so they'd be caught by its containment: hold them
  // out. For the modal layer itself only the backdrop needs it — its element
  // is the containment target.
  const exclude: Element[] = []
  for (let i = 0; i <= index; i++) {
    const layer = ordered[i]
    if (i !== index) exclude.push(layer.element)
    const backdrop = layer.backdrop?.()
    if (backdrop != null) exclude.push(backdrop)
  }

  store.undoHide = hideOutside(modal.element, exclude)
}

export function registerLayer(layer: Layer): () => void {
  const store = getStore()
  const unregister = store.stack.register(layer)
  syncContainment(store)
  return () => {
    unregister()
    syncContainment(store)
  }
}

export function isTopmostLayer(id: string): boolean {
  return getStore().stack.isTopmost(id)
}

// The layers beneath `id`, topmost first — the unwinding order for a
// stack-scoped dismissal. Read it before closing the layer that received the
// intent: leaving the stack takes the answer with it.
export function layersBelow(id: string): Layer[] {
  return getStore().stack.below(id)
}

export function getLayer(id: string): Layer | undefined {
  for (const layer of getStore().stack.ordered()) {
    if (layer.id === id) return layer
  }
  return undefined
}

// The registered layer whose window holds `node` — what tells a sibling in
// the stack from a popup that never registered.
export function layerContaining(node: Node): Layer | undefined {
  for (const layer of getStore().stack.ordered()) {
    if (layer.element.contains(node)) return layer
  }
  return undefined
}
