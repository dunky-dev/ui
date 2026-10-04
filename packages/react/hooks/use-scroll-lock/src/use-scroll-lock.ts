import { useEffect } from 'react'
import { lockScroll } from '@dunky.dev/dom-scroll-lock'

/**
 * Locks scrolling while mounted and `locked` — the React lifecycle around
 * `lockScroll`. Targets the page body unless a `target` element is given (e.g.
 * a scoped/portaled surface locks its own container, not the page). A `null`
 * target means "no target yet" and locks nothing; since a ref populating
 * doesn't re-render, hold the node in state rather than passing `ref.current`.
 * The lock is shared per container: with several holders (e.g. nested modal
 * layers), the container is restored only when the last one releases.
 */
export function useScrollLock(locked = true, target?: HTMLElement | null): void {
  useEffect(() => {
    if (!locked || target === null) return
    return lockScroll(target)
  }, [locked, target])
}
