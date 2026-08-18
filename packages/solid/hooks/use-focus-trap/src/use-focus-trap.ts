import { createEffect, untrack } from 'solid-js'
import { trapFocus } from '@dunky.dev/dom-focus-trap'
import type { TrapFocusOptions } from '@dunky.dev/dom-focus-trap'

export interface UseFocusTrapOptions extends TrapFocusOptions {}

/**
 * Traps Tab / Shift+Tab within `target` while it holds an element — the Solid
 * lifecycle around `trapFocus`. The trap follows the accessor: it arms when
 * the target first yields an element, releases when it clears or the owner is
 * disposed, and re-arms on a new element when the accessor is reactive.
 */
export function useFocusTrap(
  target: () => HTMLElement | null | undefined,
  options: UseFocusTrapOptions = {},
): void {
  // The compute tracks a reactive target (re-arm on a new element); the apply
  // re-reads it fresh — compute runs eagerly at creation, before a plain ref
  // variable fills, so binding off the computed value would arm on nothing.
  // Options are read through the closure on each Tab press, so inline
  // `enabled` / `last` see the latest state without re-binding the listener.
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
