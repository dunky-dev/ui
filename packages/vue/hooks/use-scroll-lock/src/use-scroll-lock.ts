import {
  effectScope,
  getCurrentInstance,
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

// The instance fields the walk reads, structurally: Vue 3.6 types the chain
// as its Vapor-aware generic instance.
interface InstanceNode {
  isDeactivated: boolean
  parent: InstanceNode | null
}

// Whether the component sits in a <KeepAlive> view that is deactivated — it
// mounted into a cached view after the user left it, and waits for the return.
function inDeactivatedView(instance: InstanceNode | null): boolean {
  for (let node = instance; node !== null; node = node.parent) {
    if (node.isDeactivated) return true
  }
  return false
}

/**
 * Locks scrolling while the component is mounted and `locked` — the Vue
 * lifecycle around `lockScroll`. Targets the page body unless a `target` is
 * given. A target that resolves to nothing — a template ref before its
 * element renders — means "no target yet" and locks nothing; the lock engages
 * once the element resolves. The lock is shared per container: it restores
 * when the last holder releases.
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
  const instance = getCurrentInstance()
  let scope: EffectScope | undefined
  const hold = (): void => {
    if (scope !== undefined) return
    scope = effectScope()
    scope.run(() => {
      let unlock: (() => void) | undefined
      watch(
        [() => toValue(locked), () => (target === undefined ? document.body : toValue(target))],
        ([isLocked, container]) => {
          unlock?.()
          unlock = !isLocked || container == null ? undefined : lockScroll(container)
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
  onMounted(() => {
    if (!inDeactivatedView(instance)) hold()
  })
  // Also fires on a kept-alive first mount, right after `onMounted`.
  onActivated(hold)
  onDeactivated(drop)
  onBeforeUnmount(drop)
}
