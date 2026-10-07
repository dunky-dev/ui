import { hideExitingLayer, watchExitAnimation } from '@dunky.dev/dom-overlay'

export interface ExitWindowOptions {
  /** The portal container the layer sits in; `null` means the page body. */
  container?: HTMLElement | null
  /** The layer's backdrop, portalled alongside the content. */
  backdrop?: Element | null
  /**
   * The layer renders in place, without a portal, so it sits in the page's
   * own branch rather than a container of its own: the exit hides the layer
   * alone — from its `viewport` down, or the content when it has none —
   * instead of the content's outermost ancestor below `container`.
   * @default false
   */
  inPlace?: boolean
  /** The layer's viewport: what an `inPlace` exit hides along with the content. */
  viewport?: Element | null
  /** Forwarded to the machine as `exit.complete`. */
  onComplete: () => void
}

/**
 * The exit window: a dialog rendered while not open is `closing`. It has
 * already left the stack, so hide the still-painting layer from interaction
 * and report when its visual is done. The returned disposer is the reopen
 * interrupt (and the final unmount) undoing both.
 */
export function startExitWindow(content: HTMLElement, options: ExitWindowOptions): () => void {
  // In place, the layer's own parent bounds the walk, so it stops at the
  // layer instead of climbing into the page around it.
  const boundary = options.inPlace
    ? ((options.viewport ?? content).parentElement ?? document.body)
    : (options.container ?? document.body)
  const undoHide = hideExitingLayer(content, boundary, options.backdrop ?? null)
  const cancelWatch = watchExitAnimation(content, options.onComplete)
  return () => {
    cancelWatch()
    undoHide()
  }
}
