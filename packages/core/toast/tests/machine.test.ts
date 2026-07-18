// The agnostic core of the Toast — machine + connect, no DOM, no framework.
import { describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { toastMachine, toastConnect } from '@dunky.dev/toast'
import type {
  ToastApi,
  ToastContext,
  ToastIds,
  ToastMachineEvent,
  ToastOptions,
  ToastStateName,
} from '@dunky.dev/toast'

// The per-part ids the connect derives from a base id of `toast`.
const ids: ToastIds = {
  root: 'toast-root',
  title: 'toast-title',
  description: 'toast-description',
}

interface Harness {
  service: Machine<ToastStateName, ToastContext, ToastMachineEvent>
  connection: Connector<ToastStateName, ToastContext, ToastApi, ToastOptions>
}

const build = (options: ToastOptions = {}): Harness => {
  const service = machine(toastMachine({ id: 'toast', ...options }))
  const connection = connector(service, toastConnect, options)
  service.start()
  return { service, connection }
}

describe('toast machine — open/close', () => {
  it('starts open by default — rendering a toast is the intent to show it', () => {
    const { service } = build()
    expect(service.state).toBe('open')
  })

  it('starts closed when defaultOpen=false', () => {
    const { service } = build({ defaultOpen: false })
    expect(service.state).toBe('closed')
  })

  it('starts closed when controlled open=false', () => {
    const { service } = build({ open: false })
    expect(service.state).toBe('closed')
  })

  it('open/close events are one-directional (close while closed is a no-op)', () => {
    const { service } = build({ defaultOpen: false })
    service.send({ type: 'open' })
    expect(service.state).toBe('open')
    service.send({ type: 'close' })
    expect(service.state).toBe('closed')
    service.send({ type: 'close' })
    expect(service.state).toBe('closed')
  })
})

describe('toast machine — timer states', () => {
  it('the timer elapsing dismisses an open toast', () => {
    const { service } = build()
    service.send({ type: 'timer.elapsed' })
    expect(service.state).toBe('closed')
  })

  it('pause suspends the timer; resume restarts it', () => {
    const { service } = build()
    service.send({ type: 'timer.pause' })
    expect(service.state).toBe('paused')
    service.send({ type: 'timer.resume' })
    expect(service.state).toBe('open')
  })

  it('a stray elapse never dismisses a paused toast', () => {
    const { service } = build()
    service.send({ type: 'timer.pause' })
    service.send({ type: 'timer.elapsed' })
    expect(service.state).toBe('paused')
  })

  it('pause is meaningless while closed', () => {
    const { service } = build({ defaultOpen: false })
    service.send({ type: 'timer.pause' })
    expect(service.state).toBe('closed')
  })

  it('close dismisses a paused toast', () => {
    const { service } = build()
    service.send({ type: 'timer.pause' })
    service.send({ type: 'close' })
    expect(service.state).toBe('closed')
  })
})

describe('toast machine — context seeding', () => {
  it('defaults to foreground type and a 5000ms duration', () => {
    const { service } = build()
    expect(service.context.type).toBe('foreground')
    expect(service.context.duration).toBe(5000)
  })

  it('seeds the duration override from options', () => {
    const { service } = build({ duration: 200 })
    expect(service.context.duration).toBe(200)
  })

  it('tracks title/description presence in context, in any state', () => {
    const { service } = build({ defaultOpen: false })
    service.send({ type: 'part.presence', part: 'title', present: true })
    service.send({ type: 'part.presence', part: 'description', present: true })
    expect(service.context.parts).toEqual({ title: true, description: true })

    service.send({ type: 'part.presence', part: 'title', present: false })
    expect(service.context.parts).toEqual({ title: false, description: true })
  })
})

describe('toast connect — logical bindings', () => {
  it('root is an assertive status live region for the default foreground type', () => {
    const { connection } = build()
    const root = connection.snapshot.parts.root
    expect(root.role).toBe('status')
    expect(root.live).toBe('assertive')
    expect(root.atomic).toBe(true)
    expect(root.id).toBe(ids.root)
  })

  it('background type announces politely', () => {
    const { connection } = build({ type: 'background' })
    expect(connection.snapshot.parts.root.live).toBe('polite')
  })

  it('labelledBy/describedBy only reference rendered parts', () => {
    const { service, connection } = build()
    expect(connection.snapshot.parts.root.labelledBy).toBeUndefined()
    expect(connection.snapshot.parts.root.describedBy).toBeUndefined()

    service.send({ type: 'part.presence', part: 'title', present: true })
    service.send({ type: 'part.presence', part: 'description', present: true })
    expect(connection.snapshot.parts.root.labelledBy).toBe(ids.title)
    expect(connection.snapshot.parts.root.describedBy).toBe(ids.description)

    expect(connection.snapshot.parts.title.id).toBe(ids.title)
    expect(connection.snapshot.parts.description.id).toBe(ids.description)
  })

  it('action press dismisses through the machine', () => {
    const { service, connection } = build()
    connection.snapshot.parts.action.onPress?.()
    expect(service.state).toBe('closed')
  })

  it('close press dismisses; setOpen drives both directions', () => {
    const { service, connection } = build()
    connection.snapshot.parts.close.onPress?.()
    expect(service.state).toBe('closed')

    connection.snapshot.setOpen(true)
    expect(service.state).toBe('open')
    connection.snapshot.setOpen(false)
    expect(service.state).toBe('closed')
  })

  it('data-state stays "open" while paused — pausing never disturbs styling', () => {
    const { service, connection } = build()
    expect(connection.snapshot.parts.root['data-state']).toBe('open')

    service.send({ type: 'timer.pause' })
    expect(connection.snapshot.parts.root['data-state']).toBe('open')
    expect(connection.snapshot.open).toBe(true)

    service.send({ type: 'close' })
    expect(connection.snapshot.parts.root['data-state']).toBe('closed')
  })
})

describe('toast connect — reactions', () => {
  it('fires onOpenChange on every open/close flip, not on subscribe', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ defaultOpen: false, onOpenChange })
    expect(onOpenChange).not.toHaveBeenCalled()

    service.send({ type: 'open' })
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    service.send({ type: 'timer.elapsed' })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })

  it('never reports pause/resume as an open/close change', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ onOpenChange })
    service.send({ type: 'timer.pause' })
    service.send({ type: 'timer.resume' })
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
