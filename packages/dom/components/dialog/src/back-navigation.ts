import { interceptBackNavigation } from '@dunky.dev/browser-navigation'

export interface BackNavigationGuardOptions {
  /** The api's `backNavigate` — every decision (gate, veto, controlled) is the core's. */
  backNavigate: () => void
  /** Whether the machine is still open after `backNavigate` ran. */
  isOpen: () => boolean
}

/**
 * closeOnBack: while open, a guard entry in the session history turns the
 * host's Back into a dismissal instead of a navigation. This only wires the
 * web mechanics — whether the dialog actually closed is the machine's answer,
 * and a decline re-arms the guard.
 */
export function guardBackNavigation(options: BackNavigationGuardOptions): () => void {
  return interceptBackNavigation(() => {
    options.backNavigate()
    return !options.isOpen()
  })
}
