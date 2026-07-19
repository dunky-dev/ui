// The ceiling on waiting for the exit visual: if the author styled no
// transition/animation for `data-state="closing"` (or it never ends on this
// element), the overlay must still reach `closed` rather than hang mid-exit.
const EXIT_FALLBACK_MS = 500

/**
 * Watches `element` for the end of its exit visual and reports it once —
 * the substrate forwards that to the machine as `exit.complete`. Completion
 * fires on the element's own `transitionend` / `animationend` (bubbled ends
 * from descendants don't count: the exit belongs to the element carrying
 * `data-state`), immediately when the user prefers reduced motion, or at a
 * fallback ceiling so a missing exit style can't hang the close. Returns a
 * cancel for the reopen interrupt.
 */
export function watchExitAnimation(element: HTMLElement, onComplete: () => void): () => void {
  // Reduced motion: the exit should not play — skip straight to done.
  // (`matchMedia` is feature-checked for non-browser DOM environments.)
  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    onComplete()
    return () => {}
  }

  let done = false
  const complete = (): void => {
    if (done) return
    done = true
    cancel()
    onComplete()
  }
  // A transition ends once per property — the first end on the element itself
  // is the completion signal, so the exit style should finish as one piece.
  const onEnd = (event: Event): void => {
    if (event.target === element) complete()
  }

  element.addEventListener('transitionend', onEnd)
  element.addEventListener('animationend', onEnd)
  const fallback = setTimeout(complete, EXIT_FALLBACK_MS)

  const cancel = (): void => {
    element.removeEventListener('transitionend', onEnd)
    element.removeEventListener('animationend', onEnd)
    clearTimeout(fallback)
  }
  return cancel
}
