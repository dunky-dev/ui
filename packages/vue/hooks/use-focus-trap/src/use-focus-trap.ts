import { watch, type Ref } from 'vue'
import { trapFocus } from '@dunky.dev/dom-focus-trap'
import type { TrapFocusOptions } from '@dunky.dev/dom-focus-trap'

export interface UseFocusTrapOptions extends TrapFocusOptions {}

/**
 * Traps Tab / Shift+Tab within `target` while it holds an element — the Vue
 * lifecycle around `trapFocus`. The trap follows the ref: a template ref only
 * fills after setup, so the binding arms when the element appears, releases
 * when it clears or the component unmounts, and re-arms on a new element.
 */
export function useFocusTrap(
  target: Ref<HTMLElement | null>,
  options: UseFocusTrapOptions = {},
): void {
  // Options are read through the closure on each Tab press, so inline
  // `enabled` / `last` see the latest state without re-binding the listener.
  watch(
    target,
    (container, _previous, onCleanup) => {
      if (container === null) return
      onCleanup(
        trapFocus(container, {
          enabled: () => options.enabled?.() !== false,
          last: () => options.last?.() ?? null,
        }),
      )
    },
    { immediate: true, flush: 'post' },
  )
}
