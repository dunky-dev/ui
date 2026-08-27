export interface PressOriginTracker {
  /** Whether the most recently observed press began inside the tracked
   * element. */
  startedInside: () => boolean
  /** Stops tracking. */
  dispose: () => void
}

/**
 * Tracks whether the most recent pointer press began inside `element`. A
 * click's own target can't answer that once the browser has collapsed it: a
 * mousedown inside the element and a mouseup outside it fires `click` on
 * their common ancestor, not on where the press actually started — a
 * text-selection drag then reads as a fresh press on whatever sits above
 * that ancestor. Capturing at pointerdown, before the collapse, is the only
 * way to recover it.
 */
export function trackPressOrigin(element: HTMLElement): PressOriginTracker {
  let insideElement = false
  const onPointerDown = (event: PointerEvent): void => {
    insideElement = event.target instanceof Node && element.contains(event.target)
  }
  document.addEventListener('pointerdown', onPointerDown, true)
  return {
    startedInside: () => insideElement,
    dispose: () => document.removeEventListener('pointerdown', onPointerDown, true),
  }
}
