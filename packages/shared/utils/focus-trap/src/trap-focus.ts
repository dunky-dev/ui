import { getFocusables } from './get-focusables'

export interface TrapFocusOptions {
  /**
   * Re-evaluated on every Tab press, so trapping can follow runtime state —
   * e.g. only the topmost layer of a stack traps. @default always enabled
   */
  enabled?: () => boolean
}

/**
 * Traps Tab / Shift+Tab within `container`: focus wraps from the last focusable
 * back to the first (and the reverse with Shift+Tab, including from the
 * container itself) and never tabs out. With no focusables inside, Tab is a
 * no-op. Returns a release that removes the listener.
 */
export function trapFocus(container: HTMLElement, options: TrapFocusOptions = {}): () => void {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return
    if (options.enabled?.() === false) return

    const focusables = getFocusables(container)
    if (focusables.length === 0) {
      event.preventDefault()
      return
    }

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement

    if (event.shiftKey && (active === first || active === container)) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  container.addEventListener('keydown', onKeyDown)
  return () => container.removeEventListener('keydown', onKeyDown)
}
