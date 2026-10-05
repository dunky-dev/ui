import {
  effectScope,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  toValue,
  watch,
  type EffectScope,
  type MaybeRefOrGetter,
} from 'vue'
import { trapFocus } from '@dunky.dev/dom-focus-trap'
import type { TrapFocusOptions } from '@dunky.dev/dom-focus-trap'

export interface UseFocusTrapOptions extends TrapFocusOptions {}

/**
 * Traps Tab / Shift+Tab within `target` while the component is mounted and
 * the target holds an element — the Vue lifecycle around `trapFocus`. Arms on
 * mount, re-arms when the target yields a new element, releases on unmount.
 */
export function useFocusTrap(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseFocusTrapOptions = {},
): void {
  // Armed from mount, when a template ref has filled; a <KeepAlive>
  // deactivation releases it like an unmount, as React's <Activity> runs the
  // effect's cleanup. Mounted hooks never run during server rendering. The
  // trap reads the options object per Tab press, so `enabled` / `last` stay
  // live without re-binding.
  let scope: EffectScope | undefined
  const arm = (): void => {
    if (scope !== undefined) return
    scope = effectScope()
    scope.run(() =>
      watch(
        () => toValue(target),
        (container, _previous, onCleanup) => {
          if (container == null) return
          onCleanup(trapFocus(container, options))
        },
        { immediate: true, flush: 'post' },
      ),
    )
  }
  const release = (): void => {
    scope?.stop()
    scope = undefined
  }
  onMounted(arm)
  // Also fires on a kept-alive first mount, right after `onMounted`.
  onActivated(arm)
  onDeactivated(release)
  onBeforeUnmount(release)
}
