import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { trackInteractOutside } from '@dunky.dev/dom-interact-outside'
import type { TrackInteractOutsideOptions } from '@dunky.dev/dom-interact-outside'

export interface UseInteractOutsideOptions extends TrackInteractOutsideOptions {}

/**
 * Fires `onInteractOutside` for presses and focus landing outside `target`
 * while mounted — the React lifecycle around `trackInteractOutside`. Call it
 * from the component that renders the container, so both mount together: the
 * detection binds once, when the target first exists.
 */
export function useInteractOutside(
  target: RefObject<HTMLElement | null>,
  options: UseInteractOutsideOptions,
): void {
  // Read through a ref so inline `onInteractOutside` / `ignore` closures don't
  // re-bind the document listeners on every render.
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const container = target.current
    if (container === null) return
    return trackInteractOutside(container, {
      onInteractOutside: event => optionsRef.current.onInteractOutside(event),
      ignore: node => optionsRef.current.ignore?.(node) === true,
    })
  }, [target])
}
