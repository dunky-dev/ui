// The agnostic core of the Checkbox — machine + connect, no DOM, no framework.
import { describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { checkboxConnect, checkboxMachine } from '@dunky.dev/checkbox'
import type {
  CheckboxApi,
  CheckboxContext,
  CheckboxIds,
  CheckboxMachineEvent,
  CheckboxOptions,
  CheckboxStateName,
  KeyboardPayload,
} from '@dunky.dev/checkbox'

// The per-part ids the connect derives from a base id of `cbx`.
const ids: CheckboxIds = {
  control: 'cbx-control',
  label: 'cbx-label',
}

interface Harness {
  service: Machine<CheckboxStateName, CheckboxContext, CheckboxMachineEvent>
  connection: Connector<CheckboxStateName, CheckboxContext, CheckboxApi, CheckboxOptions>
}

const build = (options: CheckboxOptions = {}): Harness => {
  const service = machine(checkboxMachine({ id: 'cbx', ...options }))
  const connection = connector(service, checkboxConnect, options)
  service.start()
  return { service, connection }
}

const keyPayload = (key: string): KeyboardPayload => ({
  key,
  defaultPrevented: false,
  preventDefault() {
    this.defaultPrevented = true
  },
})

describe('checkbox machine — checked state', () => {
  it('starts unchecked by default', () => {
    const { service } = build()
    expect(service.state).toBe('unchecked')
  })

  it('starts from defaultChecked (true / "indeterminate")', () => {
    expect(build({ defaultChecked: true }).service.state).toBe('checked')
    expect(build({ defaultChecked: 'indeterminate' }).service.state).toBe('indeterminate')
  })

  it('starts from controlled checked when provided', () => {
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

  it('toggle resolves indeterminate to checked — never back into it', () => {
    const { service } = build({ defaultChecked: 'indeterminate' })
    service.send({ type: 'toggle' })
    expect(service.state).toBe('checked')
  })

  it('set.checked moves to any value from any state', () => {
    const { service } = build()
    service.send({ type: 'set.checked', checked: 'indeterminate' })
    expect(service.state).toBe('indeterminate')
    service.send({ type: 'set.checked', checked: true })
    expect(service.state).toBe('checked')
    service.send({ type: 'set.checked', checked: false })
    expect(service.state).toBe('unchecked')
  })
})

describe('checkbox machine — disabled gating', () => {
  it('toggle is ignored while disabled', () => {
    const { service } = build({ disabled: true })
    service.send({ type: 'toggle' })
    expect(service.state).toBe('unchecked')
  })

  it('set.checked still applies while disabled — disabled gates the user, not the consumer', () => {
    const { service } = build({ disabled: true })
    service.send({ type: 'set.checked', checked: true })
    expect(service.state).toBe('checked')
  })

  it('set.disabled flips the gate at runtime', () => {
    const { service } = build({ disabled: true })
    service.send({ type: 'set.disabled', disabled: false })
    service.send({ type: 'toggle' })
    expect(service.state).toBe('checked')

    service.send({ type: 'set.disabled', disabled: true })
    service.send({ type: 'toggle' })
    expect(service.state).toBe('checked')
  })
})

describe('checkbox machine — part registration', () => {
  it('tracks label presence in context', () => {
    const { service } = build()
    expect(service.context.parts.label).toBe(false)

    service.send({ type: 'part.presence', part: 'label', present: true })
    expect(service.context.parts.label).toBe(true)

    service.send({ type: 'part.presence', part: 'label', present: false })
    expect(service.context.parts.label).toBe(false)
  })
})

describe('checkbox connect — logical bindings', () => {
  it('control carries the checkbox role and identity, and toggles on press', () => {
    const { service, connection } = build()
    const control = connection.snapshot.parts.control
    expect(control.role).toBe('checkbox')
    expect(control.id).toBe(ids.control)

    control.onPress?.()
    expect(service.state).toBe('checked')

    connection.snapshot.parts.control.onPress?.()
    expect(service.state).toBe('unchecked')
  })

  it('control maps the value to the checked binding: false / true / mixed', () => {
    const { service, connection } = build()
    expect(connection.snapshot.parts.control.checked).toBe(false)

    service.send({ type: 'toggle' })
    expect(connection.snapshot.parts.control.checked).toBe(true)

    service.send({ type: 'set.checked', checked: 'indeterminate' })
    expect(connection.snapshot.parts.control.checked).toBe('mixed')
  })

  it('control suppresses Enter — Space is the only checkbox key', () => {
    const { connection } = build()
    const enter = keyPayload('Enter')
    connection.snapshot.parts.control.onKeyDown?.(enter)
    expect(enter.defaultPrevented).toBe(true)

    const space = keyPayload(' ')
    connection.snapshot.parts.control.onKeyDown?.(space)
    expect(space.defaultPrevented).toBe(false)
  })

  it('labelledBy only references a rendered label', () => {
    const { service, connection } = build()
    expect(connection.snapshot.parts.control.labelledBy).toBeUndefined()

    service.send({ type: 'part.presence', part: 'label', present: true })
    expect(connection.snapshot.parts.control.labelledBy).toBe(ids.label)
    expect(connection.snapshot.parts.label.id).toBe(ids.label)
  })

  it('label press toggles through the machine', () => {
    const { service, connection } = build()
    connection.snapshot.parts.label.onPress?.()
    expect(service.state).toBe('checked')
  })

  it('setChecked drives all three values', () => {
    const { service, connection } = build()
    connection.snapshot.setChecked(true)
    expect(service.state).toBe('checked')
    connection.snapshot.setChecked('indeterminate')
    expect(service.state).toBe('indeterminate')
    connection.snapshot.setChecked(false)
    expect(service.state).toBe('unchecked')
  })

  it('parts expose data-state for styling/animation', () => {
    const { connection } = build({ defaultChecked: true })
    expect(connection.snapshot.parts.control['data-state']).toBe('checked')
    expect(connection.snapshot.parts.indicator['data-state']).toBe('checked')
    expect(connection.snapshot.parts.label['data-state']).toBe('checked')

    connection.snapshot.setChecked('indeterminate')
    expect(connection.snapshot.parts.control['data-state']).toBe('indeterminate')
  })

  it('disabled surfaces as the disabled binding plus data-disabled on every part', () => {
    const { connection } = build({ disabled: true })
    expect(connection.snapshot.parts.control.disabled).toBe(true)
    expect(connection.snapshot.parts.control['data-disabled']).toBe('')
    expect(connection.snapshot.parts.indicator['data-disabled']).toBe('')
    expect(connection.snapshot.parts.label['data-disabled']).toBe('')

    const enabled = build()
    expect(enabled.connection.snapshot.parts.control.disabled).toBeUndefined()
    expect(enabled.connection.snapshot.parts.control['data-disabled']).toBeUndefined()
  })
})

describe('checkbox connect — reactions', () => {
  it('fires onCheckedChange on toggles and programmatic sets, not on subscribe', () => {
    const onCheckedChange = vi.fn()
    const { service } = build({ onCheckedChange })
    expect(onCheckedChange).not.toHaveBeenCalled()

    service.send({ type: 'toggle' })
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)

    service.send({ type: 'set.checked', checked: 'indeterminate' })
    expect(onCheckedChange).toHaveBeenLastCalledWith('indeterminate')

    service.send({ type: 'toggle' })
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)

    service.send({ type: 'toggle' })
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
    expect(onCheckedChange).toHaveBeenCalledTimes(4)
  })

  it('sync.checked applies the value silently — the controlled prop is never echoed', () => {
    const onCheckedChange = vi.fn()
    const { service } = build({ onCheckedChange })

    service.send({ type: 'sync.checked', checked: 'indeterminate' })
    expect(service.state).toBe('indeterminate')
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('reports a toggle whose value recurs after a silent sync', () => {
    const onCheckedChange = vi.fn()
    const { service } = build({ onCheckedChange })

    service.send({ type: 'toggle' })
    service.send({ type: 'sync.checked', checked: 'indeterminate' })
    service.send({ type: 'toggle' })
    expect(onCheckedChange).toHaveBeenCalledTimes(2)
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
  })
})
