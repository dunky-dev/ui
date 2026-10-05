import { trapFocus, type TrapFocusOptions } from '@dunky.dev/dom-focus-trap'

export interface UseFocusTrapOptions extends TrapFocusOptions {}

/**
 * Traps Tab / Shift+Tab within `target` while the calling component lives and
 * the target yields an element — the Svelte lifecycle around `trapFocus`.
 * Arms after mount, once `bind:this` has filled; releases on destroy; re-arms
 * when a getter over `$state` yields a new element.
 */
export function useFocusTrap(
  target: () => HTMLElement | null | undefined,
  options: UseFocusTrapOptions = {},
): void {
  // The target is the only dependency: the trap reads `enabled` / `last` per
  // Tab press, so inline getters stay live without re-binding the listener.
  $effect(() => {
    const container = target()
    if (container == null) return
    return trapFocus(container, options)
  })
}
