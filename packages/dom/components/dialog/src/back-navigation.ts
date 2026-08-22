import { interceptBackNavigation } from '@dunky.dev/dom-navigation'

export interface BackNavigationGuardOptions {
  /** The api's `backNavigate` — every decision (gate, veto, controlled) is the core's. */
  backNavigate: () => void
  /** The api's `forwardNavigate` — the reopen half, gated by the same `closeOnBack`. */
  forwardNavigate: () => void
  /** Whether the machine is open, read back after a navigation ran. */
  isOpen: () => boolean
}

export interface BackNavigationGuard {
  /**
   * The dialog's open state, reported on every change: an open edge (re)arms
   * the guard, a close either parks it — the Back press itself closed the
   * dialog, so Forward may still reopen it — or releases it.
   */
  sync: (open: boolean) => void
  /** The dialog is gone for good; ends the episode in whichever phase it is. */
  release: () => void
}

/**
 * closeOnBack: while open, a guard entry in the session history turns the
 * host's Back into a dismissal instead of a navigation — and the entry a Back
 * press pops survives in the forward stack, so the host's Forward reopens what
 * Back closed. This only wires the web mechanics: whether the dialog actually
 * closed (or reopened) is the machine's answer, read back through `isOpen`, and
 * a decline leaves the guard armed.
 *
 * One registration spans the whole episode rather than the open state alone —
 * releasing on a Back-close would end the Forward watch along with it.
 */
export function guardBackNavigation(options: BackNavigationGuardOptions): BackNavigationGuard {
  let releaseIntercept: (() => void) | null = null
  let closedByBack = false

  const release = (): void => {
    releaseIntercept?.()
    releaseIntercept = null
  }

  return {
    sync(open) {
      if (open) {
        // (Re)arm on every open edge. Reopened by Forward, release +
        // re-register adopts the re-entered entry in place; opened any other
        // way it plants a fresh entry, truncating a stale Forward leftover
        // exactly like the browser does for any navigation after a Back.
        release()
        releaseIntercept = interceptBackNavigation(
          () => {
            options.backNavigate()
            closedByBack = !options.isOpen()
            return closedByBack
          },
          () => {
            options.forwardNavigate()
            return options.isOpen()
          },
        )
      } else if (closedByBack) {
        // The registration stays parked in the util, watching the spent entry.
        closedByBack = false
      } else {
        release()
      }
    },
    release,
  }
}
