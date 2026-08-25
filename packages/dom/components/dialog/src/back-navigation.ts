import {
  interceptBackNavigation,
  watchSpentEntry,
  type ReleaseOptions,
} from '@dunky.dev/browser-navigation'

export interface BackNavigationGuardOptions {
  /** The api's `backNavigate` — every decision (gate, veto, controlled) is the core's. */
  backNavigate: () => void
  /** The api's `forwardNavigate` — the reopen half, gated by the same `closeOnBack`. */
  forwardNavigate: () => void
  /** Whether the machine is open, read back after a navigation ran. */
  isOpen: () => boolean
  /**
   * The dialog's nesting depth (1 = top-level). It is what a returning dialog
   * recognizes its own spent entry by: the machine is new after a remount, but
   * the position in the stack is the same.
   */
  depth: number
}

export interface BackNavigationGuard {
  /**
   * The dialog's open state, reported on every change: an open edge (re)arms
   * the guard, a close either parks it — the Back press itself closed the
   * dialog, so Forward may still reopen it — or releases it and watches for
   * the dialog's own ground to be re-entered.
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
 * releasing on a Back-close would end the Forward watch along with it. A closed
 * dialog keeps the weaker watch instead: not on an entry it owns, but on its
 * own ground being re-entered, which is the only way back for a nested dialog
 * that was unmounted with the parent it was opened from.
 */
export function guardBackNavigation(options: BackNavigationGuardOptions): BackNavigationGuard {
  const claim = `dialog:${options.depth}`
  let releaseIntercept: ((options?: ReleaseOptions) => void) | null = null
  let releaseWatch: (() => void) | null = null
  let closedByBack = false

  // Torn down (unmounted) rather than closed: the dialog's ground stays its
  // own, so the instance that takes its place can reopen from it. A close is
  // the opposite — see `sync`.
  const release = (): void => {
    releaseIntercept?.({ keepClaim: true })
    releaseIntercept = null
    releaseWatch?.()
    releaseWatch = null
  }

  const reopen = (): boolean => {
    options.forwardNavigate()
    return options.isOpen()
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
          { onForward: reopen, claim },
        )
      } else if (closedByBack) {
        // The registration stays parked in the util, watching the spent entry
        // it still owns — a stronger claim than the one below.
        closedByBack = false
      } else {
        // Closed by something other than Back: this dialog is done with its
        // entry, and Forward must not bring it back. It still watches for its
        // own ground to be re-entered — ground a previous instance of this
        // dialog lost when it was torn down mid-episode.
        releaseIntercept?.()
        releaseIntercept = null
        releaseWatch?.()
        releaseWatch = watchSpentEntry(claim, reopen)
      }
    },
    release,
  }
}
