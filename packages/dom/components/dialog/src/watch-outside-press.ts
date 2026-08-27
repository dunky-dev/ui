import { isTopmostLayer } from '@dunky.dev/dom-overlay'

export interface WatchOutsidePressOptions {
  /** The dialog window; a press landing inside it is never outside. */
  content: HTMLElement
  /** The trigger that opened this dialog, excepted so its own press stays a
   * plain toggle — counting it as outside would close and immediately
   * reopen. */
  trigger: Element | null
  /** Whether the gesture that produced this click began inside `content` —
   * see `trackPressOrigin`. A text-selection drag starting inside and
   * releasing outside must not read as an outside press either. */
  startedInside: () => boolean
  onOutsidePress: (event: MouseEvent) => void
}

/**
 * The non-modal outside-press surface. A non-modal dialog has no Backdrop,
 * and its Viewport lets a press on the empty area fall through to the page
 * rather than swallow it (see the pointer-events split the substrate
 * bindings apply) — which means Viewport itself never receives that press
 * to detect it. The document is the only vantage point left that can see
 * both the dialog and the page.
 */
export function watchOutsidePress(id: string, options: WatchOutsidePressOptions): () => void {
  const onClick = (event: MouseEvent): void => {
    if (!isTopmostLayer(id)) return
    if (options.startedInside()) return
    const target = event.target
    if (!(target instanceof Node)) return
    if (options.content.contains(target)) return
    if (options.trigger?.contains(target) === true) return
    options.onOutsidePress(event)
  }
  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
