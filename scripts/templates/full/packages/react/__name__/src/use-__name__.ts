import { useCallback, useEffect, useState } from 'react'
import { create__Name__, type __Name__Instance } from '@dunky.dev/dom-__name__'
import type { __Name__Options } from '@dunky.dev/__name__'

export interface Use__Name__Result {
  /** Attach to the element: `<button ref={ref}>`. */
  ref: (element: HTMLElement | null) => void
}

/**
 * React binding for the __name__ primitive. The instance is created once and
 * survives StrictMode remounts (attach/detach restart the machine); options are
 * re-synced after every render so inline callbacks stay fresh.
 */
export function use__Name__(options: __Name__Options = {}): Use__Name__Result {
  const [instance] = useState<__Name__Instance>(() => create__Name__(options))

  useEffect(() => {
    instance.setOptions(options)
  })

  const ref = useCallback(
    (element: HTMLElement | null) => {
      // Statement form on purpose: returning attach's cleanup would make React 19
      // treat it as a ref cleanup while React 18 ignores it — keep both identical.
      if (element) {
        instance.attach(element)
      } else {
        instance.detach()
      }
    },
    [instance],
  )

  return { ref }
}
