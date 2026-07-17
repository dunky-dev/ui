import { useEffect, type RefObject } from 'react'
import { lockScroll } from '@dunky.dev/scroll-lock'

/**
 * Locks scrolling while mounted and `locked` — the React lifecycle around
 * `lockScroll`. Targets the page body unless a `target` ref is given. The lock
 * is shared per container: with several holders (e.g. nested modal layers),
 * the container is restored only when the last one releases.
 */
export function useScrollLock(locked = true, target?: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!locked) return
    return lockScroll(target?.current ?? undefined)
  }, [locked, target])
}
