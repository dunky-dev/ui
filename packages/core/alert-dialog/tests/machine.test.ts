// The agnostic core of the AlertDialog — machine + connect, no DOM, no framework.
import { describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { alertDialogMachine, alertDialogConnect } from '@dunky.dev/alert-dialog'
import type {
  AlertDialogApi,
  AlertDialogContext,
  AlertDialogIds,
  AlertDialogMachineEvent,
  AlertDialogOptions,
  AlertDialogStateName,
} from '@dunky.dev/alert-dialog'

// The per-part ids the connect derives from a base id of `alert`.
const ids: AlertDialogIds = {
  content: 'alert-content',
  title: 'alert-title',
  description: 'alert-description',
  cancel: 'alert-cancel',
}

interface Harness {
  service: Machine<AlertDialogStateName, AlertDialogContext, AlertDialogMachineEvent>
  connection: Connector<
    AlertDialogStateName,
    AlertDialogContext,
    AlertDialogApi,
    AlertDialogOptions
  >
}

const build = (options: AlertDialogOptions = {}): Harness => {
  const service = machine(alertDialogMachine({ id: 'alert', ...options }))
  const connection = connector(service, alertDialogConnect, options)
  service.start()
  return { service, connection }
}

describe('alert-dialog machine — open/close', () => {
  it('starts closed by default', () => {
    const { service } = build()
    expect(service.state).toBe('closed')
  })

  it('starts open when defaultOpen', () => {
    const { service } = build({ defaultOpen: true })
    expect(service.state).toBe('open')
  })

  it('starts open when controlled open=true', () => {
    const { service } = build({ open: true })
    expect(service.state).toBe('open')
  })

  it('toggle flips closed -> open -> closed', () => {
    const { service } = build()
    service.send({ type: 'toggle' })
    expect(service.state).toBe('open')
    service.send({ type: 'toggle' })
    expect(service.state).toBe('closed')
  })

  it('open/close events are one-directional (open while open is a no-op)', () => {
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'open' })
    expect(service.state).toBe('open')
    service.send({ type: 'close' })
    expect(service.state).toBe('closed')
    service.send({ type: 'close' })
    expect(service.state).toBe('closed')
  })

  it('escape closes — there is no gating option', () => {
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'escape' })
    expect(service.state).toBe('closed')
  })
})

describe('alert-dialog machine — part registration', () => {
  it('tracks title/description presence in context', () => {
    const { service } = build({ defaultOpen: true })
    expect(service.context.parts.title).toBe(false)
    expect(service.context.parts.description).toBe(false)

    service.send({ type: 'part.presence', part: 'title', present: true })
    service.send({ type: 'part.presence', part: 'description', present: true })
    expect(service.context.parts.title).toBe(true)
    expect(service.context.parts.description).toBe(true)

    service.send({ type: 'part.presence', part: 'title', present: false })
    expect(service.context.parts.title).toBe(false)
    expect(service.context.parts.description).toBe(true)
  })

  it('registration works in any state (top-level events)', () => {
    const { service } = build()
    service.send({ type: 'part.presence', part: 'title', present: true })
    expect(service.state).toBe('closed')
    expect(service.context.parts.title).toBe(true)
  })
})

describe('alert-dialog connect — logical bindings', () => {
  it('trigger carries the popup relationship and toggles', () => {
    const { service, connection } = build()
    const trigger = connection.snapshot.parts.trigger
    expect(trigger.hasPopup).toBe('dialog')
    expect(trigger.expanded).toBe(false)
    expect(trigger.controls).toBeUndefined() // nothing to control while closed

    trigger.onPress?.()
    expect(service.state).toBe('open')

    const openTrigger = connection.snapshot.parts.trigger
    expect(openTrigger.expanded).toBe(true)
    expect(openTrigger.controls).toBe(ids.content)

    openTrigger.onPress?.()
    expect(service.state).toBe('closed')
  })

  it('content is always a modal alertdialog', () => {
    const { connection } = build({ defaultOpen: true })
    const content = connection.snapshot.parts.content
    expect(content.role).toBe('alertdialog')
    expect(content.modal).toBe(true)
    expect(content.id).toBe(ids.content)
    expect(content.focusable).toBe(false) // the focus fallback target: tabIndex -1
  })

  it('labelledBy/describedBy only reference rendered parts', () => {
    const { service, connection } = build({ defaultOpen: true })
    expect(connection.snapshot.parts.content.labelledBy).toBeUndefined()
    expect(connection.snapshot.parts.content.describedBy).toBeUndefined()

    service.send({ type: 'part.presence', part: 'title', present: true })
    service.send({ type: 'part.presence', part: 'description', present: true })
    expect(connection.snapshot.parts.content.labelledBy).toBe(ids.title)
    expect(connection.snapshot.parts.content.describedBy).toBe(ids.description)

    expect(connection.snapshot.parts.title.id).toBe(ids.title)
    expect(connection.snapshot.parts.description.id).toBe(ids.description)
  })

  it('backdrop and viewport carry no press behavior — outside never dismisses', () => {
    const { connection } = build({ defaultOpen: true })
    expect(connection.snapshot.parts.backdrop.onPress).toBeUndefined()
    expect(connection.snapshot.parts.viewport.onPress).toBeUndefined()
  })

  it('cancel closes and carries the initial-focus id', () => {
    const { service, connection } = build({ defaultOpen: true })
    expect(connection.snapshot.parts.cancel.id).toBe(ids.cancel)
    connection.snapshot.parts.cancel.onPress?.()
    expect(service.state).toBe('closed')
  })

  it('action closes', () => {
    const { service, connection } = build({ defaultOpen: true })
    connection.snapshot.parts.action.onPress?.()
    expect(service.state).toBe('closed')
  })

  it('setOpen drives both directions', () => {
    const { service, connection } = build()
    connection.snapshot.setOpen(true)
    expect(service.state).toBe('open')
    connection.snapshot.setOpen(false)
    expect(service.state).toBe('closed')
  })

  it('parts expose data-state for styling/animation', () => {
    const { connection } = build({ defaultOpen: true })
    expect(connection.snapshot.parts.content['data-state']).toBe('open')
    expect(connection.snapshot.parts.trigger['data-state']).toBe('open')
    expect(connection.snapshot.parts.backdrop['data-state']).toBe('open')
    connection.snapshot.setOpen(false)
    expect(connection.snapshot.parts.content['data-state']).toBe('closed')
  })
})

describe('alert-dialog connect — reactions', () => {
  it('fires onOpenChange on every flip, not on subscribe', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ onOpenChange })
    expect(onOpenChange).not.toHaveBeenCalled()

    service.send({ type: 'toggle' })
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    service.send({ type: 'escape' })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })
})

describe('alert-dialog machine — controlled', () => {
  it('reports dismissal intents without moving the machine', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ open: true, onOpenChange })
    service.send({ type: 'escape' })
    expect(service.state).toBe('open')
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('moves only on controlled.sync, and the prop echo is not reported back', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ open: true, onOpenChange })
    service.send({ type: 'controlled.sync', open: false })
    expect(service.state).toBe('closed')
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
