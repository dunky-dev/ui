import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { trapFocus } from '@dunky.dev/dom-focus-trap'
import type { TrapFocusOptions } from '@dunky.dev/dom-focus-trap'

export interface UseFocusTrapOptions extends TrapFocusOptions {}

/**
 * Traps Tab / Shift+Tab within `target` while mounted — the React lifecycle
 * around `trapFocus`. Call it from the component that renders the container,
 * so both mount together: the trap binds once, when the target first exists.
 */
export function useFocusTrap(
  target: RefObject<HTMLElement | null>,
  options: UseFocusTrapOptions = {},
): void {
  // Read through a ref so an inline `enabled` closure doesn't re-bind the
  // listener on every render.
  const enabledRef = useRef(options.enabled)
  enabledRef.current = options.enabled

  useEffect(() => {
    const container = target.current
    if (container === null) return
    return trapFocus(container, { enabled: () => enabledRef.current?.() !== false })
  }, [target])
}
