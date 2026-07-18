import { useCallback, useEffect, useState } from 'react'
import { connector, machine } from '@dunky.dev/state-machine'
import {
  create__Name__Config,
  __camelName__Connect,
  type __Name__Options,
} from '@dunky.dev/__name__'

export interface Use__Name__Result {
  /** Attach to the element: `<button ref={ref}>`. */
  ref: (element: HTMLElement | null) => void
}

// The hook drives the agnostic __name__ machine directly: it owns the element
// listeners and translates DOM events into machine events. Created once per hook
// instance and restarted across attach/detach, so it is StrictMode-safe.
interface __Name__Binding {
  attach: (element: HTMLElement) => void
  detach: () => void
  setOptions: (options: __Name__Options) => void
}

function create__Name__Binding(initialOptions: __Name__Options): __Name__Binding {
  let options = initialOptions
  const service = machine(create__Name__Config(options))
  const connection = connector(service, __camelName__Connect, options)

  let element: HTMLElement | null = null
  const elementCleanups: Array<() => void> = []

  function listen<K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
  ): () => void {
    target.addEventListener(type, handler as EventListener)
    return () => target.removeEventListener(type, handler as EventListener)
  }

  // TODO(spec): translate the real substrate events into machine events. This
  // placeholder activates on a plain click — enough to drive the skeleton.
  const onClick = () => {
    if (options.disabled) return
    service.send({ type: 'ACTIVATE' })
  }

  function detach() {
    if (!element) return
    for (const cleanup of elementCleanups) cleanup()
    elementCleanups.length = 0
    element = null
    service.stop()
  }

  function attach(next: HTMLElement) {
    if (element === next) return
    if (element) detach()
    element = next
    elementCleanups.push(listen(next, 'click', onClick))
    service.start()
  }

  return {
    attach,
    detach,
    setOptions(next) {
      const wasDisabled = options.disabled ?? false
      options = next
      connection.setProps(next)
      const isDisabled = next.disabled ?? false
      if (wasDisabled !== isDisabled) service.send({ type: 'SET_DISABLED', disabled: isDisabled })
    },
  }
}

/**
 * React binding for the __name__ primitive. The binding is created once and
 * survives StrictMode remounts (attach/detach restart the machine); options are
 * re-synced after every render so inline callbacks stay fresh.
 */
export function use__Name__(options: __Name__Options = {}): Use__Name__Result {
  const [binding] = useState<__Name__Binding>(() => create__Name__Binding(options))

  useEffect(() => {
    binding.setOptions(options)
  })

  const ref = useCallback(
    (element: HTMLElement | null) => {
      // Statement form on purpose: returning attach's cleanup would make React 19
      // treat it as a ref cleanup while React 18 ignores it — keep both identical.
      if (element) {
        binding.attach(element)
      } else {
        binding.detach()
      }
    },
    [binding],
  )

  return { ref }
}
