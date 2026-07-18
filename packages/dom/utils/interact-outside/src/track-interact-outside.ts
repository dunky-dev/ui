export interface TrackInteractOutsideOptions {
  /** Fired when a press or focus lands outside the container's subtree. */
  onInteractOutside: (event: PointerEvent | FocusEvent) => void
  /**
   * Excuses a target that should never count as outside — e.g. a nested
   * layer's subtree, or the overlay's trigger/anchor.
   */
  ignore?: (target: Node) => boolean
}

/**
 * Watches document-level `pointerdown` and `focusin` — capture phase, so a
 * `stopPropagation` out on the page can't mask them — and fires
 * `onInteractOutside` when the event target falls outside `container` and
 * isn't excused by `ignore`. One gesture, one call: the focus a press moves
 * is part of that press, so a press on a focusable outside element doesn't
 * report twice. Pure detection: what to do about it stays the caller's
 * decision. Returns a release that removes the listeners.
 */
export function trackInteractOutside(
  container: HTMLElement,
  options: TrackInteractOutsideOptions,
): () => void {
  const onEvent = (event: PointerEvent | FocusEvent): void => {
    const target = event.target
    if (!(target instanceof Node)) return
    if (container.contains(target)) return
    if (options.ignore?.(target) === true) return
    options.onInteractOutside(event)
  }

  // A press on a focusable element also dispatches `focusin` as its default
  // action — same gesture, so it must not report a second time. The flag lifts
  // a task after the pointer lifts, not at `pointerup` itself, because touch
  // focuses late: its compatibility `mousedown`/`focusin` fire after
  // `pointerup`, in the same turn.
  let pressing = false
  const onPointerDown = (event: PointerEvent): void => {
    pressing = true
    onEvent(event)
  }
  const onFocusIn = (event: FocusEvent): void => {
    if (pressing) return
    onEvent(event)
  }
  const onPointerLift = (): void => {
    setTimeout(() => {
      pressing = false
    }, 0)
  }

  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('focusin', onFocusIn, true)
  document.addEventListener('pointerup', onPointerLift, true)
  document.addEventListener('pointercancel', onPointerLift, true)
  return () => {
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('focusin', onFocusIn, true)
    document.removeEventListener('pointerup', onPointerLift, true)
    document.removeEventListener('pointercancel', onPointerLift, true)
  }
}
