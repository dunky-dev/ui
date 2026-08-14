import { toValue, watchEffect, type MaybeRefOrGetter } from 'vue'
import { lockScroll } from '@dunky.dev/dom-scroll-lock'

/**
 * Locks scrolling while mounted and `locked` — the Vue lifecycle around
 * `lockScroll`. Targets the page body unless a `target` element is given (e.g.
 * a scoped/portaled surface locks its own container, not the page). The lock
 * is shared per container: with several holders (e.g. nested modal layers),
 * the container is restored only when the last one releases.
 */
export function useScrollLock(
  locked: MaybeRefOrGetter<boolean> = true,
  target?: MaybeRefOrGetter<HTMLElement | null | undefined>,
): void {
  watchEffect(onCleanup => {
    if (!toValue(locked)) return
    onCleanup(lockScroll(toValue(target) ?? undefined))
  })
}
