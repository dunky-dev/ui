import { isTopmostLayer } from './stack'

export interface WatchOutsidePressOptions {
  /** The layer's element; a press landing inside it is never outside. */
  element: HTMLElement
  /** The trigger that opened this layer, excepted so its own press stays a
   * plain toggle — counting it as outside would close and immediately
   * reopen. */
  trigger: Element | null
  /** Whether the gesture that produced this click began inside `element` —
   * see `trackPressOrigin` in `@dunky.dev/dom-press-origin`. A
   * text-selection drag starting inside and releasing outside must not read
   * as an outside press either. */
  startedInside: () => boolean
  onOutsidePress: (event: MouseEvent) => void
}

/**
 * The outside-press watch for a layer whose own surfaces can't detect one —
 * a non-modal layer has no backdrop, and a viewport that lets presses fall
 * through to the page (`pointer-events: none`) never receives them itself.
 * The document is the only vantage point left that can see both the layer
 * (portaled out of the page's own subtree) and the page.
 */
export function watchOutsidePress(id: string, options: WatchOutsidePressOptions): () => void {
  const onClick = (event: MouseEvent): void => {
    if (!isTopmostLayer(id)) return
    if (options.startedInside()) return
    const target = event.target
    if (!(target instanceof Node)) return
    if (options.element.contains(target)) return
    if (options.trigger?.contains(target) === true) return
    options.onOutsidePress(event)
  }
  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
