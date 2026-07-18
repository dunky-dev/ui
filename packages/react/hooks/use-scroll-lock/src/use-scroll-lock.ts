import { useEffect } from 'react'
import { lockScroll } from '@dunky.dev/dom-scroll-lock'

/**
 * Locks scrolling while mounted and `locked` — the React lifecycle around
 * `lockScroll`. Targets the page body unless a `target` element is given (e.g.
 * a scoped/portaled surface locks its own container, not the page). The lock
 * is shared per container: with several holders (e.g. nested modal layers),
 * the container is restored only when the last one releases.
 */
export function useScrollLock(locked = true, target?: HTMLElement | null): void {
  useEffect(() => {
    if (!locked) return
    return lockScroll(target ?? undefined)
  }, [locked, target])
}
