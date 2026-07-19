import { getFocusables } from './get-focusables'

export interface TrapFocusOptions {
  /**
   * Re-evaluated on every Tab press, so trapping can follow runtime state —
   * e.g. only the topmost layer of a stack traps. @default always enabled
   */
  enabled?: () => boolean
  /**
   * Resolves the cycle's last stop: the element is sorted after everything
   * else, wherever it renders (e.g. a dialog's close button that sits first
   * in the DOM but must not interrupt the content's order). Re-evaluated on
   * every Tab press. @default DOM order decides
   */
  last?: () => HTMLElement | null
}

/**
 * Traps Tab / Shift+Tab within `container`: every press steps focus through
 * the cycle (DOM order, the `last` element at the end), wrapping at both
 * ends — including from the container itself, and never tabbing out. The
 * trap steps focus itself rather than only guarding the edges: a logical
 * order can diverge from DOM order, so native tabbing can't be trusted
 * mid-cycle. With no focusables inside, Tab is a no-op. Returns a release
 * that removes the listener.
 */
export function trapFocus(container: HTMLElement, options: TrapFocusOptions = {}): () => void {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return
    if (options.enabled?.() === false) return

    event.preventDefault()
    const focusables = getFocusables(container)
    if (focusables.length === 0) return

    const last = options.last?.()
    if (last) {
      const at = focusables.indexOf(last)
      if (at !== -1 && at !== focusables.length - 1) {
        focusables.splice(at, 1)
        focusables.push(last)
      }
    }

    const active = document.activeElement
    const index = active instanceof HTMLElement ? focusables.indexOf(active) : -1
    const lastIndex = focusables.length - 1
    // Off-cycle focus (the container, or a scripted tabindex=-1 target)
    // re-enters at the edge the direction implies.
    const next = event.shiftKey
      ? index <= 0
        ? lastIndex
        : index - 1
      : index === -1 || index === lastIndex
        ? 0
        : index + 1
    focusables[next]?.focus()
  }

  container.addEventListener('keydown', onKeyDown)
  return () => container.removeEventListener('keydown', onKeyDown)
}
