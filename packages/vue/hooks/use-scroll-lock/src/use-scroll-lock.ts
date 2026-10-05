import {
  effectScope,
  getCurrentInstance,
  onActivated,
  onDeactivated,
  onMounted,
  onScopeDispose,
  onUnmounted,
  toValue,
  watch,
  type ComponentPublicInstance,
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

// Whether the component sits in a deactivated <KeepAlive> view — it mounted
// into a cached view after the user left it, and waits for the return.
function inDeactivatedView(instance: InstanceNode | null): boolean {
  for (let node = instance; node !== null; node = node.parent) {
    if (node.isDeactivated) return true
  }
  return false
}

// A template ref on a component holds its instance; the element is its `$el`.
function toElement(
  target: HTMLElement | ComponentPublicInstance | null | undefined,
): HTMLElement | null {
  const element = target instanceof HTMLElement ? target : target?.$el
  return element instanceof HTMLElement ? element : null
}

/**
 * Locks scrolling while the component is mounted and `locked` — the Vue
 * lifecycle around `lockScroll`. Targets the page body unless a `target` is
 * given. A target that resolves to nothing — a template ref before its
 * element renders — means "no target yet" and locks nothing; the lock engages
 * once the element resolves. A component counts as its root element (`$el`).
 * The lock is shared per container: it restores when the last holder
 * releases.
 */
export function useScrollLock(
  locked: MaybeRefOrGetter<boolean> = true,
  target?: MaybeRefOrGetter<HTMLElement | ComponentPublicInstance | null | undefined>,
): void {
  // Held from mount — never during server rendering, where there is no body
  // — and released after the DOM is gone, as React runs an effect's cleanup
  // after commit. A <KeepAlive> deactivation releases it too, as React's
  // <Activity> does. Released by hand: Vue 3.6 also runs a watcher's
  // onCleanup when its source merely re-evaluates.
  const instance = getCurrentInstance()
  let scope: EffectScope | undefined
  const hold = (): void => {
    if (scope !== undefined) return
    // Detached: the component scope stops before the DOM is removed.
    scope = effectScope(true)
    scope.run(() => {
      let unlock: (() => void) | undefined
      watch(
        [
          () => toValue(locked),
          () => (target === undefined ? document.body : toElement(toValue(target))),
        ],
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
  onMounted(() => {
    if (!inDeactivatedView(instance)) hold()
  })
  // Also fires on a kept-alive first mount, right after `onMounted`.
  onActivated(hold)
  onDeactivated(drop)
  onUnmounted(drop)
}
