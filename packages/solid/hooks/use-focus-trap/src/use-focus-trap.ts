import { createEffect, untrack } from 'solid-js'
import { trapFocus } from '@dunky.dev/dom-focus-trap'
import type { TrapFocusOptions } from '@dunky.dev/dom-focus-trap'

export interface UseFocusTrapOptions extends TrapFocusOptions {}

/**
 * Traps Tab / Shift+Tab within `target` while it holds an element — the Solid
 * lifecycle around `trapFocus`. Arms when the target yields an element,
 * releases on dispose, re-arms when a reactive accessor yields a new one.
 */
export function useFocusTrap(
  target: () => HTMLElement | null | undefined,
  options: UseFocusTrapOptions = {},
): void {
  // The compute tracks a reactive target; the apply re-reads it fresh —
  // compute runs eagerly at creation, before a plain ref variable fills.
  // Options are read per Tab press, so inline `enabled` / `last` stay live
  // without re-binding the listener.
  createEffect(
    () => target(),
    () => {
      const container = untrack(target)
      if (container == null) return
      return trapFocus(container, {
        enabled: () => options.enabled?.() !== false,
        last: () => options.last?.() ?? null,
      })
    },
  )
}
