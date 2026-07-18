// The agnostic core of the Tooltip — machine + connect, no DOM, no framework.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { tooltipMachine, tooltipConnect } from '@dunky.dev/tooltip'
import type {
  TooltipApi,
  TooltipContext,
  TooltipMachineEvent,
  TooltipOptions,
  TooltipStateName,
} from '@dunky.dev/tooltip'

// The content id the connect derives from a base id of `tip`.
const contentId = 'tip-content'

const OPEN_DELAY = 700
const CLOSE_DELAY = 300

interface Harness {
  service: Machine<TooltipStateName, TooltipContext, TooltipMachineEvent>
  connection: Connector<TooltipStateName, TooltipContext, TooltipApi, TooltipOptions>
}

const build = (options: TooltipOptions = {}): Harness => {
  const service = machine(tooltipMachine({ id: 'tip', ...options }))
  const connection = connector(service, tooltipConnect, options)
  service.start()
  return { service, connection }
}

// The delay transitions ride on real setTimeout scheduling.
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('tooltip machine — showing', () => {
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

  it('pointer enter opens only after the open delay', () => {
    const { service } = build()
    service.send({ type: 'pointer.enter' })
    expect(service.state).toBe('opening')

    vi.advanceTimersByTime(OPEN_DELAY - 1)
    expect(service.state).toBe('opening')
    vi.advanceTimersByTime(1)
    expect(service.state).toBe('open')
  })

  it('honors a custom openDelay', () => {
    const { service } = build({ openDelay: 100 })
    service.send({ type: 'pointer.enter' })
    vi.advanceTimersByTime(100)
    expect(service.state).toBe('open')
  })

  it('focus opens immediately, even while the open delay runs', () => {
    const { service } = build()
    service.send({ type: 'focus' })
    expect(service.state).toBe('open')

    service.send({ type: 'blur' })
    service.send({ type: 'pointer.enter' })
    service.send({ type: 'focus' })
    expect(service.state).toBe('open')
  })
})

describe('tooltip machine — hiding', () => {
  it('pointer leave closes only after the close delay', () => {
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'pointer.leave' })
    expect(service.state).toBe('closing')

    vi.advanceTimersByTime(CLOSE_DELAY - 1)
    expect(service.state).toBe('closing')
    vi.advanceTimersByTime(1)
    expect(service.state).toBe('closed')
  })

  it('honors a custom closeDelay', () => {
    const { service } = build({ defaultOpen: true, closeDelay: 100 })
    service.send({ type: 'pointer.leave' })
    vi.advanceTimersByTime(100)
    expect(service.state).toBe('closed')
  })

  it('pointer leave while opening cancels the pending open', () => {
    const { service } = build()
    service.send({ type: 'pointer.enter' })
    service.send({ type: 'pointer.leave' })
    expect(service.state).toBe('closed')

    vi.advanceTimersByTime(OPEN_DELAY)
    expect(service.state).toBe('closed')
  })

  it('pointer enter while closing cancels back to open', () => {
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'pointer.leave' })
    service.send({ type: 'pointer.enter' })
    expect(service.state).toBe('open')

    vi.advanceTimersByTime(CLOSE_DELAY)
    expect(service.state).toBe('open')
  })

  it('focus while closing cancels back to open', () => {
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'pointer.leave' })
    service.send({ type: 'focus' })
    expect(service.state).toBe('open')
  })

  it('blur closes immediately, even while opening or closing', () => {
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'blur' })
    expect(service.state).toBe('closed')

    service.send({ type: 'pointer.enter' })
    service.send({ type: 'blur' })
    expect(service.state).toBe('closed')

    service.send({ type: 'open' })
    service.send({ type: 'pointer.leave' })
    service.send({ type: 'blur' })
    expect(service.state).toBe('closed')
  })

  it('escape closes immediately, even while opening or closing', () => {
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'escape' })
    expect(service.state).toBe('closed')

    service.send({ type: 'pointer.enter' })
    service.send({ type: 'escape' })
    expect(service.state).toBe('closed')

    service.send({ type: 'open' })
    service.send({ type: 'pointer.leave' })
    service.send({ type: 'escape' })
    expect(service.state).toBe('closed')
  })

  it('a trigger press closes immediately, even while opening or closing', () => {
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'pointer.down' })
    expect(service.state).toBe('closed')

    service.send({ type: 'pointer.enter' })
    service.send({ type: 'pointer.down' })
    expect(service.state).toBe('closed')

    service.send({ type: 'open' })
    service.send({ type: 'pointer.leave' })
    service.send({ type: 'pointer.down' })
    expect(service.state).toBe('closed')
  })

  it('a trigger activation (keyboard press fires no pointerdown) closes immediately', () => {
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'press' })
    expect(service.state).toBe('closed')
  })
})

describe('tooltip machine — press-then-focus suppression', () => {
  it('the focus that follows a trigger press does not reopen', () => {
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'pointer.down' })
    service.send({ type: 'focus' })
    expect(service.state).toBe('closed')

    // The suppression is consumed: the next deliberate focus opens.
    service.send({ type: 'blur' })
    service.send({ type: 'focus' })
    expect(service.state).toBe('open')
  })

  it('a press on a closed tooltip (touch tap) suppresses the focus it causes', () => {
    const { service } = build()
    service.send({ type: 'pointer.down' })
    service.send({ type: 'focus' })
    expect(service.state).toBe('closed')
  })

  it('blur disarms a suppression no focus ever consumed', () => {
    // A press on an already-focused trigger raises no focus event; the flag
    // must not swallow the next deliberate focus after tabbing away.
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'pointer.down' })
    service.send({ type: 'blur' })
    service.send({ type: 'focus' })
    expect(service.state).toBe('open')
  })

  it('the click ending a press disarms a suppression no focus ever consumed', () => {
    // Some browsers never focus a clicked button (Safari/Firefox on macOS,
    // touch taps): the activation's click bounds the flag, so the next
    // deliberate focus still opens.
    const { service } = build({ defaultOpen: true })
    service.send({ type: 'pointer.down' })
    service.send({ type: 'press' })
    service.send({ type: 'focus' })
    expect(service.state).toBe('open')
  })
})

describe('tooltip connect — logical bindings', () => {
  it('trigger wires the hover and focus lifecycle', () => {
    const { service, connection } = build()
    const trigger = connection.snapshot.parts.trigger

    trigger.onPointerEnter?.()
    expect(service.state).toBe('opening')
    trigger.onPointerLeave?.()
    expect(service.state).toBe('closed')

    trigger.onFocus?.()
    expect(service.state).toBe('open')
    trigger.onBlur?.()
    expect(service.state).toBe('closed')

    trigger.onFocus?.()
    connection.snapshot.parts.trigger.onPointerDown?.()
    expect(service.state).toBe('closed')

    service.send({ type: 'open' })
    connection.snapshot.parts.trigger.onPress?.()
    expect(service.state).toBe('closed')
  })

  it('trigger references the content only while the tooltip is shown', () => {
    const { service, connection } = build()
    expect(connection.snapshot.parts.trigger.describedBy).toBeUndefined()

    service.send({ type: 'pointer.enter' })
    expect(connection.snapshot.parts.trigger.describedBy).toBeUndefined() // opening: not shown yet

    vi.advanceTimersByTime(OPEN_DELAY)
    expect(connection.snapshot.parts.trigger.describedBy).toBe(contentId)

    service.send({ type: 'pointer.leave' })
    expect(connection.snapshot.parts.trigger.describedBy).toBe(contentId) // closing: still shown
  })

  it('content carries the tooltip role and identity, and hovering it keeps it open', () => {
    const { service, connection } = build({ defaultOpen: true })
    const content = connection.snapshot.parts.content
    expect(content.role).toBe('tooltip')
    expect(content.id).toBe(contentId)

    service.send({ type: 'pointer.leave' })
    content.onPointerEnter?.()
    expect(service.state).toBe('open')
  })

  it('leaving the content follows the same close-delay rules as the trigger', () => {
    const { service, connection } = build({ defaultOpen: true })
    connection.snapshot.parts.content.onPointerLeave?.()
    expect(service.state).toBe('closing')

    vi.advanceTimersByTime(CLOSE_DELAY)
    expect(service.state).toBe('closed')
  })

  it('parts expose the full lifecycle as data-state', () => {
    const { service, connection } = build()
    expect(connection.snapshot.parts.trigger['data-state']).toBe('closed')

    service.send({ type: 'pointer.enter' })
    expect(connection.snapshot.parts.trigger['data-state']).toBe('opening')

    vi.advanceTimersByTime(OPEN_DELAY)
    expect(connection.snapshot.parts.content['data-state']).toBe('open')

    service.send({ type: 'pointer.leave' })
    expect(connection.snapshot.parts.content['data-state']).toBe('closing')
  })

  it('api.open means shown: true through open and closing, false otherwise', () => {
    const { service, connection } = build()
    expect(connection.snapshot.open).toBe(false)

    service.send({ type: 'pointer.enter' })
    expect(connection.snapshot.open).toBe(false)

    service.send({ type: 'focus' })
    expect(connection.snapshot.open).toBe(true)

    service.send({ type: 'pointer.leave' })
    expect(connection.snapshot.open).toBe(true)
  })

  it('setOpen drives both directions immediately, skipping the delays', () => {
    const { service, connection } = build()
    connection.snapshot.setOpen(true)
    expect(service.state).toBe('open')

    connection.snapshot.setOpen(false)
    expect(service.state).toBe('closed')

    // Imperative intent also overrides a running delay.
    service.send({ type: 'pointer.enter' })
    connection.snapshot.setOpen(false)
    expect(service.state).toBe('closed')
    connection.snapshot.setOpen(true)
    expect(service.state).toBe('open')
  })
})

describe('tooltip connect — reactions', () => {
  it('fires onOpenChange once per shown phase, not per state', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ onOpenChange })

    service.send({ type: 'pointer.enter' })
    expect(onOpenChange).not.toHaveBeenCalled() // opening: not shown yet

    vi.advanceTimersByTime(OPEN_DELAY)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)

    service.send({ type: 'pointer.leave' })
    expect(onOpenChange).toHaveBeenCalledTimes(1) // closing: still shown

    vi.advanceTimersByTime(CLOSE_DELAY)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })
})
