import { connector, machine } from '@dunky.dev/state-machine'
import {
  create__Name__Config,
  __camelName__Connect,
  type __Name__Options,
} from '@dunky.dev/__name__'

/**
 * A live, framework-free __name__ binding. `attach` an element and the instance
 * wires its DOM listeners and drives the agnostic __name__ machine. One instance
 * per element; restartable across attach/detach (safe for React StrictMode remounts).
 */
export interface __Name__Instance {
  attach: (element: HTMLElement) => void
  detach: () => void
  /** Swap options/callbacks (fresh closures each render); `disabled` is synced into the machine. */
  setOptions: (options: __Name__Options) => void
}

export function create__Name__(initialOptions: __Name__Options = {}): __Name__Instance {
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
