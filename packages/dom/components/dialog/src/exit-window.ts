import { hideExitingLayer, watchExitAnimation } from '@dunky.dev/dom-overlay'

export interface ExitWindowOptions {
  /** The portal container the layer sits in; `null` means the page body. */
  container?: HTMLElement | null
  /** The layer's backdrop, portalled alongside the content. */
  backdrop?: Element | null
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
  const undoHide = hideExitingLayer(
    content,
    options.container ?? document.body,
    options.backdrop ?? null,
  )
  const cancelWatch = watchExitAnimation(content, options.onComplete)
  return () => {
    cancelWatch()
    undoHide()
  }
}
