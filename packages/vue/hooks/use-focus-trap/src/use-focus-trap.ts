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
import { trapFocus } from '@dunky.dev/dom-focus-trap'
import type { TrapFocusOptions } from '@dunky.dev/dom-focus-trap'

export interface UseFocusTrapOptions extends TrapFocusOptions {}

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
 * Traps Tab / Shift+Tab within `target` while the component is mounted and
 * the target holds an element — the Vue lifecycle around `trapFocus`. Arms on
 * mount, re-arms when the target yields a new element, releases on unmount.
 * A component counts as its root element (`$el`).
 */
export function useFocusTrap(
  target: MaybeRefOrGetter<HTMLElement | ComponentPublicInstance | null | undefined>,
  options: UseFocusTrapOptions = {},
): void {
  // Armed from mount, when a template ref has filled — never during server
  // rendering — and released after the DOM is gone, as React runs an
  // effect's cleanup after commit. A <KeepAlive> deactivation releases it
  // too, as React's <Activity> does. The trap reads the options per Tab
  // press, so `enabled` / `last` stay live without re-binding. Released by
  // hand: Vue 3.6 also runs a watcher's onCleanup when its source merely
  // re-evaluates.
  const instance = getCurrentInstance()
  let scope: EffectScope | undefined
  const arm = (): void => {
    if (scope !== undefined) return
    // Detached: the component scope stops before the DOM is removed.
    scope = effectScope(true)
    scope.run(() => {
      let untrap: (() => void) | undefined
      watch(
        () => toElement(toValue(target)),
        container => {
          untrap?.()
          untrap = container === null ? undefined : trapFocus(container, options)
        },
        { immediate: true, flush: 'post' },
      )
      onScopeDispose(() => untrap?.())
    })
  }
  const disarm = (): void => {
    scope?.stop()
    scope = undefined
  }
  onMounted(() => {
    if (!inDeactivatedView(instance)) arm()
  })
  // Also fires on a kept-alive first mount, right after `onMounted`.
  onActivated(arm)
  onDeactivated(disarm)
  onUnmounted(disarm)
}
