import { getInitialFocus, registerLayer } from '@dunky.dev/dom-overlay'

export interface OpenDialogLayerOptions {
  /** The machine's layer id — what the stack and the press gating key on. */
  id: string
  depth: number
  modal: boolean
  /** Resolves the layer's own backdrop; see `Layer.backdrop` in dom-overlay. */
  backdrop: () => Element | null
  /** The consumer's `initialFocus`, already resolved. @default the window */
  initialFocus?: HTMLElement | null
  /** Closes this dialog when a layer above unwinds the whole stack; see
   * `Layer.dismiss` in dom-overlay. */
  dismiss?: () => void
}

/**
 * The open edge of a dialog: join the stack, then move focus in. The returned
 * disposer is the close edge — release the stack, then move focus back.
 *
 * The order matters in both directions and is the reason this is one call
 * rather than two: the stack must join before focus moves in, and on close it
 * must release the layers beneath (un-inert them) before focus can move back
 * out to one of them.
 */
export function openDialogLayer(content: HTMLElement, options: OpenDialogLayerOptions): () => void {
  const previous = document.activeElement
  const unregister = registerLayer({
    id: options.id,
    depth: options.depth,
    element: content,
    modal: options.modal,
    backdrop: options.backdrop,
    dismiss: options.dismiss,
  })

  // preventScroll everywhere: the scroll lock already froze the surface, so
  // moving focus must not scroll it — otherwise opening jumps the (top-of-
  // container) dialog into view and closing jumps back to the trigger.
  const target = options.initialFocus ?? getInitialFocus(content)
  target.focus({ preventScroll: true })
  // A target that can't take focus (disabled, hidden) falls back to the panel.
  if (document.activeElement !== target) {
    content.focus({ preventScroll: true })
    // Focus still outside the layer breaks the APG modal pattern — a window
    // without tabindex can't take the fallback. Make the miss loud.
    if (!content.contains(document.activeElement)) {
      console.warn(
        '[openDialogLayer] focus could not move into the dialog: neither the ' +
          'initial focus target nor the dialog window can take focus. ' +
          'Give the dialog window tabindex="-1".',
      )
    }
  }

  return () => {
    unregister()
    if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
  }
}
