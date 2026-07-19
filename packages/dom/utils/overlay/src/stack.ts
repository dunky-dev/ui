import { createLayerStack, type OverlayLayer } from '@dunky.dev/overlay'
import { hideOutside } from './hide-outside'

// The DOM realization of the shared layer stack: each layer carries its
// element and modality, and the module-level instance keeps assistive-tech
// containment in sync as the stack shifts.
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

const stack = createLayerStack<Layer>()
let undoHide: (() => void) | undefined

// Keep the assistive-tech view in sync: only the topmost modal layer stays
// reachable; everything else is hidden. Re-runs whenever the stack changes so a
// nested layer hides the one beneath it, and closing it restores the layer.
function syncContainment(): void {
  undoHide?.()
  undoHide = undefined
  const top = stack.topmost()
  if (top?.modal !== true) return
  // `isConnected` guards teardown, when the content is already detached.
  if (top.element.isConnected) undoHide = hideOutside(top.element, top.backdrop?.() ?? null)
}

export function registerLayer(layer: Layer): () => void {
  const unregister = stack.register(layer)
  syncContainment()
  return () => {
    unregister()
    syncContainment()
  }
}

export function isTopmostLayer(id: string): boolean {
  return stack.isTopmost(id)
}
