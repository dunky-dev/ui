import { useEffect, useState, useSyncExternalStore } from 'react'
import { connector, machine } from '@dunky.dev/state-machine'
import { create__Name__Config, __camelName__Connect } from '@dunky.dev/__name__'
import type { __Name__Api, __Name__Options } from '@dunky.dev/__name__'

import type { __Name__ContextValue, __Name__Service } from './context'

/**
 * Owns one __name__ machine for the <__Name__> root: created once per
 * component (StrictMode-safe — stop/start restarts it), options re-synced
 * every render so inline callbacks stay fresh, snapshot read through
 * useSyncExternalStore. Substrate effects (document listeners, platform APIs)
 * also belong here — see the dialog for an example.
 */
export function use__Name__(options: __Name__Options): __Name__ContextValue {
  const [instance] = useState(() => {
    const service: __Name__Service = machine(create__Name__Config(options))
    const connection = connector(service, __camelName__Connect, options)
    return { service, connection }
  })

  useEffect(() => {
    instance.service.start()
    return () => instance.service.stop()
  }, [instance])

  // Re-sync options every render so inline callbacks stay fresh.
  useEffect(() => {
    instance.connection.setProps(options)
  })

  // Config that lives in machine context is synced through events, so guards
  // keep working at runtime — the machine never reads props.
  useEffect(() => {
    const disabled = options.disabled ?? false
    if (instance.service.context.disabled !== disabled) {
      instance.service.send({ type: 'SET_DISABLED', disabled })
    }
  }, [instance, options.disabled])

  const api: __Name__Api = useSyncExternalStore(
    instance.connection.subscribe,
    () => instance.connection.snapshot,
    () => instance.connection.snapshot,
  )

  return { api, service: instance.service }
}
