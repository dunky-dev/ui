import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { connector, machine } from '@dunky.dev/state-machine'
import { createDialogConfig, dialogConnect } from '@dunky.dev/dialog'
import type { DialogApi, DialogOptions } from '@dunky.dev/dialog'

import type { DialogContextValue, DialogService } from './context'
import { isTopmostDialog } from './stack'

/**
 * Owns one dialog machine for the <Dialog> root: created once per component
 * (StrictMode-safe — stop/start restarts it), options re-synced every render so
 * inline callbacks stay fresh, snapshot read through useSyncExternalStore.
 */
export function useDialog(options: DialogOptions): DialogContextValue {
  const contentId = useId()
  const titleId = useId()
  const descriptionId = useId()

  const [instance] = useState(() => {
    const ids = { content: contentId, title: titleId, description: descriptionId }
    const service: DialogService = machine(createDialogConfig(options, ids))
    const connection = connector(service, dialogConnect, options)
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

  // Controlled open: follow the `open` prop in both directions.
  useEffect(() => {
    if (options.open === undefined) return
    if (options.open !== instance.service.matches('open')) {
      instance.service.send({ type: options.open ? 'open' : 'close' })
    }
  }, [instance, options.open])

  // Escape is a document-level concern, not a part's: it must work wherever
  // focus is. Options are read through a ref so an inline handler doesn't
  // re-bind the listener every render.
  const optionsRef = useRef(options)
  optionsRef.current = options
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || !instance.service.matches('open')) return
      // Only the topmost dialog answers Escape — a nested stack closes one
      // layer at a time.
      if (!isTopmostDialog(instance.service.context.ids.content)) return
      optionsRef.current.onEscapeKeyDown?.(event)
      if (!event.defaultPrevented) instance.service.send({ type: 'escape' })
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [instance])

  const api: DialogApi = useSyncExternalStore(
    instance.connection.subscribe,
    () => instance.connection.snapshot,
    () => instance.connection.snapshot,
  )

  return { api, service: instance.service }
}
