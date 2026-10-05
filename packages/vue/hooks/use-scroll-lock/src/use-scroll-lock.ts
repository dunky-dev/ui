import {
  effectScope,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  onScopeDispose,
  toValue,
  watch,
  type EffectScope,
  type MaybeRefOrGetter,
} from 'vue'
import { lockScroll } from '@dunky.dev/dom-scroll-lock'

/**
 * Locks scrolling while the component is mounted and `locked` — the Vue
 * lifecycle around `lockScroll`. Targets the page body unless a `target` is
 * given. A `null` target means "no target yet" and locks nothing; pass a ref
 * or a getter and the lock engages once the element resolves. The lock is
 * shared per container: it restores when the last holder releases.
 */
export function useScrollLock(
  locked: MaybeRefOrGetter<boolean> = true,
  target?: MaybeRefOrGetter<HTMLElement | null | undefined>,
): void {
  // Held from mount; a <KeepAlive> deactivation releases it like an unmount,
  // as React's <Activity> runs the effect's cleanup. Mounted hooks never run
  // during server rendering, where there is no body to lock. Released by
  // hand rather than through the watcher's onCleanup, which Vue 3.6 also
  // runs when a source merely re-evaluates.
  let scope: EffectScope | undefined
  const hold = (): void => {
    if (scope !== undefined) return
    scope = effectScope()
    scope.run(() => {
      let unlock: (() => void) | undefined
      watch(
        [() => toValue(locked), () => (target === undefined ? undefined : toValue(target))],
        ([isLocked, container]) => {
          unlock?.()
          unlock = !isLocked || container === null ? undefined : lockScroll(container)
        },
        { immediate: true, flush: 'post' },
      )
      onScopeDispose(() => unlock?.())
    })
  }
  const drop = (): void => {
    scope?.stop()
    scope = undefined
  }
  onMounted(hold)
  // Also fires on a kept-alive first mount, right after `onMounted`.
  onActivated(hold)
  onDeactivated(drop)
  onBeforeUnmount(drop)
}
