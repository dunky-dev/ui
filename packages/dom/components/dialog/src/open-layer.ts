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
  // The whole chain — designated, then first form field, then the window —
  // resolves in one call so each step is filtered for renderedness; a `??`
  // here would spend the designated element on a candidate that can't take
  // focus and skip the field step entirely.
  const target = getInitialFocus(content, options.initialFocus)
  target.focus({ preventScroll: true })
  // A target that can't take focus (disabled, no tabindex) falls back to the
  // panel.
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

  // The window's own attributes are the reliable read: a consumer's label may
  // arrive through a prop spread rather than a typed prop, and the DOM is
  // where it lands either way. Deferred a macrotask: a rendered Title
  // registers presence through its own effect, and the canonical nesting
  // (Title inside Content) settles before this call's own effect runs — but
  // nothing requires that arrangement, so a Title rendered as a later
  // sibling still gets a chance to register first. Cleared on close: a
  // dialog that closes before the check fires must not warn about a window
  // that no longer exists.
  const nameCheck = setTimeout(() => {
    if (!content.hasAttribute('aria-label') && !content.hasAttribute('aria-labelledby')) {
      console.warn(
        '[openDialogLayer] the dialog has no accessible name: render a <Dialog.Title>, ' +
          'or pass aria-label / aria-labelledby to Content.',
      )
    }
  })

  return () => {
    clearTimeout(nameCheck)
    unregister()
    if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
  }
}
