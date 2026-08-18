import { createEffect } from 'solid-js'
import { lockScroll } from '@dunky.dev/dom-scroll-lock'

/** A static value or an accessor — for parameters that may be reactive. */
export type MaybeAccessor<T> = T | (() => T)

function access<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value
}

/**
 * Locks scrolling while the owner lives and `locked` — the Solid lifecycle
 * around `lockScroll`. Targets the page body unless a `target` is given. The
 * lock is shared per container: it restores when the last holder releases.
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
