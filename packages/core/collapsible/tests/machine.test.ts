// The agnostic core of the Collapsible — machine + connect, no DOM, no framework.
import { describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { collapsibleMachine, collapsibleConnect } from '@dunky.dev/collapsible'
import type {
  CollapsibleApi,
  CollapsibleContext,
  CollapsibleIds,
  CollapsibleMachineEvent,
  CollapsibleOptions,
  CollapsibleStateName,
} from '@dunky.dev/collapsible'

// The content id the connect derives from a base id of `clp`.
const ids: CollapsibleIds = { content: 'clp-content' }

interface Harness {
  service: Machine<CollapsibleStateName, CollapsibleContext, CollapsibleMachineEvent>
  connection: Connector<
    CollapsibleStateName,
    CollapsibleContext,
    CollapsibleApi,
    CollapsibleOptions
  >
}

const build = (options: CollapsibleOptions = {}): Harness => {
  const service = machine(collapsibleMachine({ id: 'clp', ...options }))
  const connection = connector(service, collapsibleConnect, options)
  service.start()
  return { service, connection }
}

describe('collapsible machine — open/close', () => {
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
})

describe('collapsible machine — disabled gating', () => {
  it('disabled (seeded from options) swallows toggle in either state', () => {
    const { service } = build({ disabled: true })
    service.send({ type: 'toggle' })
    expect(service.state).toBe('closed')

    const opened = build({ disabled: true, defaultOpen: true })
    opened.service.send({ type: 'toggle' })
    expect(opened.service.state).toBe('open')
  })

  it('disabled.set flips the gate at runtime', () => {
    const { service } = build()
    service.send({ type: 'disabled.set', disabled: true })
    service.send({ type: 'toggle' })
    expect(service.state).toBe('closed')

    service.send({ type: 'disabled.set', disabled: false })
    service.send({ type: 'toggle' })
    expect(service.state).toBe('open')
  })

  it('open/close are not gated while disabled', () => {
    const { service } = build({ disabled: true })
    service.send({ type: 'open' })
    expect(service.state).toBe('open')
    service.send({ type: 'close' })
    expect(service.state).toBe('closed')
  })
})

describe('collapsible connect — logical bindings', () => {
  it('trigger carries the disclosure relationship and toggles', () => {
    const { service, connection } = build()
    const trigger = connection.snapshot.parts.trigger
    expect(trigger.expanded).toBe(false)
    expect(trigger.controls).toBe(ids.content) // constant — the content is always rendered

    trigger.onPress?.()
    expect(service.state).toBe('open')

    const openTrigger = connection.snapshot.parts.trigger
    expect(openTrigger.expanded).toBe(true)
    expect(openTrigger.controls).toBe(ids.content)

    openTrigger.onPress?.()
    expect(service.state).toBe('closed')
  })

  it('content carries identity and is hidden only while closed', () => {
    const { connection } = build()
    expect(connection.snapshot.parts.content.id).toBe(ids.content)
    expect(connection.snapshot.parts.content.hidden).toBe(true)

    connection.snapshot.setOpen(true)
    expect(connection.snapshot.parts.content.hidden).toBeUndefined()
  })

  it('disabled marks both parts; the marks lift when re-enabled', () => {
    const { service, connection } = build({ disabled: true })
    expect(connection.snapshot.disabled).toBe(true)
    expect(connection.snapshot.parts.trigger.disabled).toBe(true)
    expect(connection.snapshot.parts.trigger['data-disabled']).toBe('')
    expect(connection.snapshot.parts.content['data-disabled']).toBe('')

    service.send({ type: 'disabled.set', disabled: false })
    expect(connection.snapshot.disabled).toBe(false)
    expect(connection.snapshot.parts.trigger.disabled).toBeUndefined()
    expect(connection.snapshot.parts.trigger['data-disabled']).toBeUndefined()
    expect(connection.snapshot.parts.content['data-disabled']).toBeUndefined()
  })

  it('setOpen drives both directions and the api reflects it', () => {
    const { connection } = build()
    expect(connection.snapshot.open).toBe(false)

    connection.snapshot.setOpen(true)
    expect(connection.snapshot.open).toBe(true)
    connection.snapshot.setOpen(false)
    expect(connection.snapshot.open).toBe(false)
  })

  it('parts expose data-state for styling/animation', () => {
    const { connection } = build()
    expect(connection.snapshot.parts.trigger['data-state']).toBe('closed')
    expect(connection.snapshot.parts.content['data-state']).toBe('closed')

    connection.snapshot.setOpen(true)
    expect(connection.snapshot.parts.trigger['data-state']).toBe('open')
    expect(connection.snapshot.parts.content['data-state']).toBe('open')
  })
})

describe('collapsible connect — reactions', () => {
  it('fires onOpenChange on every flip, not on subscribe', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ onOpenChange })
    expect(onOpenChange).not.toHaveBeenCalled()

    service.send({ type: 'toggle' })
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    service.send({ type: 'toggle' })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })
})
