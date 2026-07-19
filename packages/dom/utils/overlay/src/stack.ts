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

// Keep the assistive-tech view in sync: only the topmost modal layer stays
// reachable; everything else is hidden. Re-runs whenever the stack changes so a
// nested layer hides the one beneath it, and closing it restores the layer.
function syncContainment(store: OverlayStore): void {
  store.undoHide?.()
  store.undoHide = undefined
  const top = store.stack.topmost()
  if (top?.modal !== true) return
  // `isConnected` guards teardown, when the content is already detached.
  if (top.element.isConnected) store.undoHide = hideOutside(top.element, top.backdrop?.() ?? null)
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
