import { lockScroll } from '@dunky.dev/dom-scroll-lock'

/** A static value or a getter — for parameters that may be reactive. */
export type MaybeGetter<T> = T | (() => T)

function access<T>(value: MaybeGetter<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value
}

/**
 * Locks scrolling while the calling component lives and `locked` — the Svelte
 * lifecycle around `lockScroll`. Targets the page body unless a `target` is
 * given. A `null` target means "no target yet" and locks nothing; a getter over
 * `$state` engages the lock once the element resolves. The lock is shared per
 * container: it restores when the last holder releases.
 */
export function useScrollLock(
  locked: MaybeGetter<boolean> = true,
  target?: MaybeGetter<HTMLElement | null | undefined>,
): void {
  $effect(() => {
    const isLocked = access(locked)
    const container = target === undefined ? undefined : access(target)
    if (!isLocked || container === null) return
    return lockScroll(container)
  })
}
