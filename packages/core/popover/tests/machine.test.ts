// The agnostic core of the popover — machine + connect, no DOM, no framework.
import { describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { popoverMachine, popoverConnect } from '@dunky.dev/popover'
import type {
  PopoverApi,
  PopoverContext,
  PopoverIds,
  PopoverMachineEvent,
  PopoverOptions,
  PopoverStateName,
  PointerPayload,
} from '@dunky.dev/popover'

// The per-part ids the connect derives from a base id of `pop`.
const ids: PopoverIds = {
  content: 'pop-content',
  title: 'pop-title',
  description: 'pop-description',
}

interface Harness {
  service: Machine<PopoverStateName, PopoverContext, PopoverMachineEvent>
  connection: Connector<PopoverStateName, PopoverContext, PopoverApi, PopoverOptions>
}

const build = (options: PopoverOptions = {}): Harness => {
  const service = machine(popoverMachine({ id: 'pop', ...options }))
  const connection = connector(service, popoverConnect, options)
  service.start()
  return { service, connection }
}

const vetoingPayload = (): PointerPayload => ({
  defaultPrevented: false,
  preventDefault() {
    this.defaultPrevented = true
  },
})

describe('popover machine — open/close', () => {
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

describe('popover machine — dismissal gating', () => {
  it('escape closes when closeOnEscape (the default)', () => {
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'escape' })
    expect(service.state).toBe('closed')
  })

  it('escape is ignored when closeOnEscape=false', () => {
    const { service } = build({ defaultOpen: true, closeOnEscape: false })
    service.send({ type: 'escape' })
    expect(service.state).toBe('open')
  })

  it('interact.outside closes when closeOnInteractOutside (the default)', () => {
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'interact.outside' })
    expect(service.state).toBe('closed')
  })

  it('interact.outside is ignored when closeOnInteractOutside=false', () => {
    const { service } = build({ defaultOpen: true, closeOnInteractOutside: false })
    service.send({ type: 'interact.outside' })
    expect(service.state).toBe('open')
  })
})

describe('popover machine — part registration', () => {
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

describe('popover connect — logical bindings', () => {
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

  it('content carries the dialog role and identity, non-modal by default', () => {
    const { connection } = build({ defaultOpen: true })
    const content = connection.snapshot.parts.content
    expect(content.role).toBe('dialog')
    expect(content.modal).toBeUndefined() // a popover coexists with the page
    expect(content.id).toBe(ids.content)
    expect(content.focusable).toBe(false) // the focus fallback: tabIndex -1
  })

  it('content carries aria-modal when the popover opts into modal', () => {
    const { connection } = build({ defaultOpen: true, modal: true })
    expect(connection.snapshot.parts.content.modal).toBe(true)
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

  it('close part closes; setOpen drives both directions', () => {
    const { service, connection } = build({ defaultOpen: true })
    connection.snapshot.parts.close.onPress?.()
    expect(service.state).toBe('closed')

    connection.snapshot.setOpen(true)
    expect(service.state).toBe('open')
    connection.snapshot.setOpen(false)
    expect(service.state).toBe('closed')
  })

  it('parts expose data-state for styling/animation', () => {
    const { connection } = build({ defaultOpen: true })
    expect(connection.snapshot.parts.content['data-state']).toBe('open')
    expect(connection.snapshot.parts.trigger['data-state']).toBe('open')
    connection.snapshot.setOpen(false)
    expect(connection.snapshot.parts.content['data-state']).toBe('closed')
  })
})

describe('popover connect — outside interaction intent', () => {
  it('reports the interaction, then dismisses through the machine', () => {
    const onInteractOutside = vi.fn()
    const { service, connection } = build({ defaultOpen: true, onInteractOutside })

    connection.snapshot.onInteractOutside()
    expect(onInteractOutside).toHaveBeenCalledTimes(1)
    expect(service.state).toBe('closed')
  })

  it('honors the onInteractOutside veto', () => {
    const onInteractOutside = vi.fn((event?: PointerPayload) => event?.preventDefault?.())
    const { service, connection } = build({ defaultOpen: true, onInteractOutside })

    connection.snapshot.onInteractOutside(vetoingPayload())
    expect(onInteractOutside).toHaveBeenCalledTimes(1)
    expect(service.state).toBe('open') // vetoed
  })
})

describe('popover connect — reactions', () => {
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

describe('popover machine — controlled', () => {
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

  it('still gates dismissal intents before reporting them', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ open: true, closeOnEscape: false, onOpenChange })
    service.send({ type: 'escape' })
    expect(service.state).toBe('open')
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
