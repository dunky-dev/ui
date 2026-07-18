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
 * report twice. A touch press reports only once its `click` confirms a tap,
 * so a scroll or pan that starts outside never reports. Pure detection: what
 * to do about it stays the caller's decision. Returns a release that removes
 * the listeners.
 */
export function trackInteractOutside(
  container: HTMLElement,
  options: TrackInteractOutsideOptions,
): () => void {
  const isOutside = (target: EventTarget | null): boolean =>
    target instanceof Node && !container.contains(target) && options.ignore?.(target) !== true

  // A press on a focusable element also dispatches `focusin` as its default
  // action — same gesture, so it must not report a second time. The flag lifts
  // a task after the pointer lifts, not at `pointerup` itself, because touch
  // focuses late: its compatibility `mousedown`/`focusin` fire after
  // `pointerup`, in the same turn.
  let pressing = false

  // A touch landing outside may be starting a scroll, not tapping to dismiss.
  // The browser raises `click` only when the gesture settles as a tap, so the
  // report waits for it: a pan or a cancelled press never clicks, and the
  // next press re-arms or clears the wait.
  let reportTap: (() => void) | undefined
  const cancelTapReport = (): void => {
    if (reportTap === undefined) return
    document.removeEventListener('click', reportTap, true)
    reportTap = undefined
  }

  const onPointerDown = (event: PointerEvent): void => {
    pressing = true
    cancelTapReport()
    if (!isOutside(event.target)) return
    if (event.pointerType === 'touch') {
      reportTap = () => {
        reportTap = undefined
        options.onInteractOutside(event)
      }
      document.addEventListener('click', reportTap, { capture: true, once: true })
    } else {
      options.onInteractOutside(event)
    }
  }

  const onFocusIn = (event: FocusEvent): void => {
    if (!pressing && isOutside(event.target)) options.onInteractOutside(event)
  }

  const onPointerUp = (): void => {
    setTimeout(() => {
      pressing = false
    }, 0)
  }

  const onPointerCancel = (): void => {
    cancelTapReport()
    onPointerUp()
  }

  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('focusin', onFocusIn, true)
  document.addEventListener('pointerup', onPointerUp, true)
  document.addEventListener('pointercancel', onPointerCancel, true)
  return () => {
    cancelTapReport()
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('focusin', onFocusIn, true)
    document.removeEventListener('pointerup', onPointerUp, true)
    document.removeEventListener('pointercancel', onPointerCancel, true)
  }
}
