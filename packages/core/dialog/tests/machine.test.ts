// The agnostic core of the Dialog — machine + connect, no DOM, no framework.
import { describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { dialogMachine, dialogConnect } from '@dunky.dev/dialog'
import type {
  DialogApi,
  DialogContext,
  DialogIds,
  DialogMachineEvent,
  DialogOptions,
  DialogStateName,
} from '@dunky.dev/dialog'
import type { PointerPayload } from '@dunky.dev/state-machine-bindings'

// The per-part ids the connect derives from a base id of `dlg`.
const ids: DialogIds = {
  content: 'dlg-content',
  close: 'dlg-close',
  title: 'dlg-title',
  description: 'dlg-description',
}

interface Harness {
  service: Machine<DialogStateName, DialogContext, DialogMachineEvent>
  connection: Connector<DialogStateName, DialogContext, DialogApi, DialogOptions>
}

const build = (options: DialogOptions = {}): Harness => {
  const service = machine(dialogMachine({ id: 'dlg', ...options }))
  const connection = connector(service, dialogConnect, options)
  service.start()
  return { service, connection }
}

describe('dialog machine — open/close', () => {
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

describe('dialog machine — dismissal gating', () => {
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

  it('alertdialog defaults closeOnInteractOutside to false', () => {
    const { service } = build({ role: 'alertdialog' })
    expect(service.context.closeOnInteractOutside).toBe(false)
    // an explicit opt-in still wins over the role default
    const optedIn = build({ role: 'alertdialog', closeOnInteractOutside: true })
    expect(optedIn.service.context.closeOnInteractOutside).toBe(true)
  })
})

describe('dialog machine — part registration', () => {
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

describe('dialog connect — logical bindings', () => {
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

  it('content carries role, modality, and identity', () => {
    const { connection } = build({ defaultOpen: true })
    const content = connection.snapshot.parts.content
    expect(content.role).toBe('dialog')
    expect(content.modal).toBe(true)
    expect(content.id).toBe(ids.content)
    expect(content.focusable).toBe(false) // the focus target: tabIndex -1
  })

  it('content omits aria-modal when modal=false and takes the alertdialog role', () => {
    const { connection } = build({ defaultOpen: true, modal: false, role: 'alertdialog' })
    const content = connection.snapshot.parts.content
    expect(content.modal).toBeUndefined()
    expect(content.role).toBe('alertdialog')
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

  it('backdrop press dismisses through the machine', () => {
    const { service, connection } = build({ defaultOpen: true })
    connection.snapshot.parts.backdrop.onPress?.()
    expect(service.state).toBe('closed')
  })

  it('viewport press is the same outside interaction as the backdrop', () => {
    const { service, connection } = build({ defaultOpen: true })
    expect(connection.snapshot.parts.viewport['data-state']).toBe('open')
    connection.snapshot.parts.viewport.onPress?.()
    expect(service.state).toBe('closed')
  })

  it('backdrop press honors the onInteractOutside veto', () => {
    const onInteractOutside = vi.fn((event?: PointerPayload) => event?.preventDefault?.())
    const { service, connection } = build({ defaultOpen: true, onInteractOutside })

    const payload: PointerPayload = {
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true
      },
    }
    connection.snapshot.parts.backdrop.onPress?.(payload)

    expect(onInteractOutside).toHaveBeenCalledTimes(1)
    expect(service.state).toBe('open') // vetoed
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

  it('close carries its derived id for the focus-cycle contract', () => {
    const { connection } = build({ defaultOpen: true })
    expect(connection.snapshot.parts.close.id).toBe(ids.close)
  })

  it('parts expose data-state for styling/animation', () => {
    const { connection } = build({ defaultOpen: true })
    expect(connection.snapshot.parts.content['data-state']).toBe('open')
    expect(connection.snapshot.parts.trigger['data-state']).toBe('open')
    connection.snapshot.setOpen(false)
    expect(connection.snapshot.parts.content['data-state']).toBe('closed')
  })
})

describe('dialog connect — reactions', () => {
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

describe('dialog machine — controlled', () => {
  it('a dismissal intent moves nothing and reports nothing', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ open: true, onOpenChange })
    service.send({ type: 'escape' })
    expect(service.state).toBe('open')
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('moves only on controlled.sync, reporting the actual change', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ open: true, onOpenChange })
    service.send({ type: 'controlled.sync', value: false })
    expect(service.state).toBe('closed')
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(onOpenChange).toHaveBeenCalledTimes(1)
  })

  it('still gates dismissal intents before recording them', () => {
    const { service } = build({ open: true, closeOnEscape: false })
    service.send({ type: 'escape' })
    expect(service.context.open.intent).toBeNull()

    const allowed = build({ open: true })
    allowed.service.send({ type: 'escape' })
    expect(allowed.service.context.open.intent).toEqual({ value: false })
  })

  it('an undefined echo hands the state back, uncontrolled where it stands', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ open: true, onOpenChange })
    service.send({ type: 'controlled.sync', value: undefined })
    expect(service.state).toBe('open')
    expect(onOpenChange).not.toHaveBeenCalled()

    service.send({ type: 'escape' }) // uncontrolled now: dismissal works again
    expect(service.state).toBe('closed')
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })
})
