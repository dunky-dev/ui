export interface PressOriginTracker {
  /** Whether the most recently observed press began inside the tracked
   * element. */
  startedInside: () => boolean
  /** Stops tracking. */
  dispose: () => void
}

/**
 * Tracks whether the most recent pointer press began inside `content`. A
 * click's own target can't answer that once the browser has collapsed it: a
 * mousedown inside the window and a mouseup outside it fires `click` on
 * their common ancestor, not on where the press actually started — a
 * text-selection drag then reads as a fresh press on whatever sits above
 * that ancestor. Capturing at pointerdown, before the collapse, is the only
 * way to recover it.
 */
export function trackPressOrigin(content: HTMLElement): PressOriginTracker {
  let insideContent = false
  const onPointerDown = (event: PointerEvent): void => {
    insideContent = event.target instanceof Node && content.contains(event.target)
  }
  document.addEventListener('pointerdown', onPointerDown, true)
  return {
    startedInside: () => insideContent,
    dispose: () => document.removeEventListener('pointerdown', onPointerDown, true),
  }
}
