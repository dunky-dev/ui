// The agnostic core of the Switch — machine + connect, no DOM, no framework.
import { describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { switchMachine, switchConnect } from '@dunky.dev/switch'
import type {
  SwitchApi,
  SwitchContext,
  SwitchIds,
  SwitchMachineEvent,
  SwitchOptions,
  SwitchStateName,
} from '@dunky.dev/switch'

// The per-part ids the connect derives from a base id of `sw`.
const ids: SwitchIds = {
  control: 'sw-control',
  label: 'sw-label',
}

interface Harness {
  service: Machine<SwitchStateName, SwitchContext, SwitchMachineEvent>
  connection: Connector<SwitchStateName, SwitchContext, SwitchApi, SwitchOptions>
}

const build = (options: SwitchOptions = {}): Harness => {
  const service = machine(switchMachine({ id: 'sw', ...options }))
  const connection = connector(service, switchConnect, options)
  service.start()
  return { service, connection }
}

describe('switch machine — checked/unchecked', () => {
  it('starts unchecked by default', () => {
    const { service } = build()
    expect(service.state).toBe('unchecked')
  })

  it('starts checked when defaultChecked', () => {
    const { service } = build({ defaultChecked: true })
    expect(service.state).toBe('checked')
  })

  it('starts checked when controlled checked=true', () => {
    const { service } = build({ checked: true })
    expect(service.state).toBe('checked')
  })

  it('toggle flips unchecked -> checked -> unchecked', () => {
    const { service } = build()
    service.send({ type: 'toggle' })
    expect(service.state).toBe('checked')
    service.send({ type: 'toggle' })
    expect(service.state).toBe('unchecked')
  })

  it('check/uncheck are one-directional (check while checked is a no-op)', () => {
    const { service } = build({ defaultChecked: true })
    service.send({ type: 'check' })
    expect(service.state).toBe('checked')
    service.send({ type: 'uncheck' })
    expect(service.state).toBe('unchecked')
    service.send({ type: 'uncheck' })
    expect(service.state).toBe('unchecked')
  })
})

describe('switch machine — disabled gating', () => {
  it('toggle is ignored while disabled', () => {
    const { service } = build({ disabled: true })
    service.send({ type: 'toggle' })
    expect(service.state).toBe('unchecked')
  })

  it('set.disabled flips the gate at runtime', () => {
    const { service } = build()
    service.send({ type: 'set.disabled', disabled: true })
    service.send({ type: 'toggle' })
    expect(service.state).toBe('unchecked')

    service.send({ type: 'set.disabled', disabled: false })
    service.send({ type: 'toggle' })
    expect(service.state).toBe('checked')
  })

  it('programmatic check/uncheck still applies while disabled', () => {
    const { service } = build({ disabled: true })
    service.send({ type: 'check' })
    expect(service.state).toBe('checked')
    service.send({ type: 'uncheck' })
    expect(service.state).toBe('unchecked')
  })
})

describe('switch machine — part registration', () => {
  it('tracks label presence in context', () => {
    const { service } = build()
    expect(service.context.parts.label).toBe(false)

    service.send({ type: 'part.presence', part: 'label', present: true })
    expect(service.context.parts.label).toBe(true)

    service.send({ type: 'part.presence', part: 'label', present: false })
    expect(service.context.parts.label).toBe(false)
  })
})

describe('switch connect — logical bindings', () => {
  it('control carries the switch role, checked state, and identity', () => {
    const { connection } = build()
    const control = connection.snapshot.parts.control
    expect(control.role).toBe('switch')
    expect(control.checked).toBe(false) // always present — never a bare undefined
    expect(control.id).toBe(ids.control)
  })

  it('control press toggles through the machine', () => {
    const { service, connection } = build()
    connection.snapshot.parts.control.onPress?.()
    expect(service.state).toBe('checked')
    expect(connection.snapshot.parts.control.checked).toBe(true)

    connection.snapshot.parts.control.onPress?.()
    expect(service.state).toBe('unchecked')
  })

  it('label press is the same toggle intent', () => {
    const { service, connection } = build()
    expect(connection.snapshot.parts.label.id).toBe(ids.label)
    connection.snapshot.parts.label.onPress?.()
    expect(service.state).toBe('checked')
  })

  it('labelledBy only references a rendered label', () => {
    const { service, connection } = build()
    expect(connection.snapshot.parts.control.labelledBy).toBeUndefined()

    service.send({ type: 'part.presence', part: 'label', present: true })
    expect(connection.snapshot.parts.control.labelledBy).toBe(ids.label)
  })

  it('disabled marks every part for assistive tech and styling', () => {
    const { connection } = build({ disabled: true })
    expect(connection.snapshot.disabled).toBe(true)
    expect(connection.snapshot.parts.control.disabled).toBe(true)
    expect(connection.snapshot.parts.control['data-disabled']).toBe('')
    expect(connection.snapshot.parts.thumb['data-disabled']).toBe('')
    expect(connection.snapshot.parts.label['data-disabled']).toBe('')

    const enabled = build()
    expect(enabled.connection.snapshot.parts.control.disabled).toBeUndefined()
    expect(enabled.connection.snapshot.parts.control['data-disabled']).toBeUndefined()
  })

  it('parts expose data-state for styling/animation', () => {
    const { connection } = build({ defaultChecked: true })
    expect(connection.snapshot.parts.control['data-state']).toBe('checked')
    expect(connection.snapshot.parts.thumb['data-state']).toBe('checked')
    expect(connection.snapshot.parts.label['data-state']).toBe('checked')

    connection.snapshot.setChecked(false)
    expect(connection.snapshot.parts.thumb['data-state']).toBe('unchecked')
  })

  it('setChecked drives both directions', () => {
    const { service, connection } = build()
    connection.snapshot.setChecked(true)
    expect(service.state).toBe('checked')
    connection.snapshot.setChecked(false)
    expect(service.state).toBe('unchecked')
  })
})

describe('switch connect — reactions', () => {
  it('fires onCheckedChange on every flip, whatever its cause, not on subscribe', () => {
    const onCheckedChange = vi.fn()
    const { service } = build({ onCheckedChange })
    expect(onCheckedChange).not.toHaveBeenCalled()

    service.send({ type: 'toggle' })
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)

    // A programmatic flip reports too — even while disabled (the sync contract).
    service.send({ type: 'set.disabled', disabled: true })
    service.send({ type: 'uncheck' })
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
    expect(onCheckedChange).toHaveBeenCalledTimes(2)
  })
})
