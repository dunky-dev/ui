import { createEffect } from 'solid-js'
import { lockScroll } from '@dunky.dev/dom-scroll-lock'

/** A static value or an accessor — the Solid idiom for a parameter that may
 * be reactive; resolved fresh inside the tracking scope that reads it. */
export type MaybeAccessor<T> = T | (() => T)

function access<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value
}

/**
 * Locks scrolling while the owner lives and `locked` — the Solid lifecycle
 * around `lockScroll`. Targets the page body unless a `target` element is
 * given (e.g. a scoped/portaled surface locks its own container, not the
 * page). The lock is shared per container: with several holders (e.g. nested
 * modal layers), the container is restored only when the last one releases.
 */
export function useScrollLock(
  locked: MaybeAccessor<boolean> = true,
  target?: MaybeAccessor<HTMLElement | null | undefined>,
): void {
  createEffect(
    () => [access(locked), target === undefined ? undefined : access(target)] as const,
    ([isLocked, container]) => {
      if (!isLocked) return
      return lockScroll(container ?? undefined)
    },
  )
}
