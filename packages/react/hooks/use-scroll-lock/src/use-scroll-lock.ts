import { useEffect } from 'react'
import { lockBodyScroll } from '@dunky.dev/scroll-lock'

/**
 * Locks body scrolling while mounted and `locked` — the React lifecycle around
 * `lockBodyScroll`. The lock is shared: with several holders (e.g. nested
 * modal layers), the body is restored only when the last one releases.
 */
export function useScrollLock(locked = true): void {
  useEffect(() => {
    if (!locked) return
    return lockBodyScroll()
  }, [locked])
}
