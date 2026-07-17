// The agnostic core of the __name__ — machine + connect, no DOM, no framework.
import { describe, expect, it, vi } from 'vitest'
import { connector, machine } from '@dunky.dev/state-machine'
import { create__Name__Config, __camelName__Connect } from '@dunky.dev/__name__'
import type { __Name__Options } from '@dunky.dev/__name__'

const build = (options: __Name__Options = {}) => {
  const service = machine(create__Name__Config(options))
  const connection = connector(service, __camelName__Connect, options)
  service.start()
  return { service, connection }
}

describe('__name__ machine', () => {
  it('fires onActivate on ACTIVATE', () => {
    const onActivate = vi.fn()
    build({ onActivate }).service.send({ type: 'ACTIVATE' })
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('gates ACTIVATE while disabled', () => {
    const onActivate = vi.fn()
    build({ onActivate, disabled: true }).service.send({ type: 'ACTIVATE' })
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('SET_DISABLED flips the gate at runtime', () => {
    const onActivate = vi.fn()
    const { service } = build({ onActivate })
    service.send({ type: 'SET_DISABLED', disabled: true })
    service.send({ type: 'ACTIVATE' })
    expect(onActivate).not.toHaveBeenCalled()

    service.send({ type: 'SET_DISABLED', disabled: false })
    service.send({ type: 'ACTIVATE' })
    expect(onActivate).toHaveBeenCalledTimes(1)
  })
})

describe('__name__ connect — logical bindings', () => {
  it('the root part presses through the machine', () => {
    const onActivate = vi.fn()
    const { connection } = build({ onActivate })
    expect(connection.snapshot.parts.root['data-state']).toBe('idle')

    connection.snapshot.parts.root.onPress?.()
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('exposes the disabled flag on the api and the part', () => {
    const { connection } = build({ disabled: true })
    expect(connection.snapshot.disabled).toBe(true)
    expect(connection.snapshot.parts.root.disabled).toBe(true)
  })
})
