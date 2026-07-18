// The agnostic core of the __name__ — machine + connect, no DOM, no framework.
import { describe, expect, it, vi } from 'vitest'
import { connector, machine } from '@dunky.dev/state-machine'
import { __camelName__Machine, __camelName__Connect } from '@dunky.dev/__name__'
import type { __Name__Options } from '@dunky.dev/__name__'

const build = (options: __Name__Options = {}) => {
  const service = machine(__camelName__Machine(options))
  const connection = connector(service, __camelName__Connect, options)
  service.start()
  return { service, connection }
}

describe('__name__ machine', () => {
  it('fires disable when SET_DISABLED turns it on', () => {
    const disable = vi.fn()
    build({ disable }).service.send({ type: 'SET_DISABLED', disabled: true })
    expect(disable).toHaveBeenCalledTimes(1)
  })

  it('seeds the disabled flag from options', () => {
    const { service } = build({ disabled: true })
    expect(service.context.disabled).toBe(true)
  })

  it('does not fire disable on the disabled -> enabled transition', () => {
    const disable = vi.fn()
    const { service } = build({ disable, disabled: true })
    service.send({ type: 'SET_DISABLED', disabled: false })
    expect(disable).not.toHaveBeenCalled()
  })
})

describe('__name__ connect — logical bindings', () => {
  it('the root part disables through the machine', () => {
    const disable = vi.fn()
    const { service, connection } = build({ disable })
    expect(connection.snapshot.parts.root['data-state']).toBe('idle')

    connection.snapshot.parts.root.onPress?.()
    expect(service.context.disabled).toBe(true)
    expect(disable).toHaveBeenCalledTimes(1)
  })

  it('exposes the disabled flag on the api and the part', () => {
    const { connection } = build({ disabled: true })
    expect(connection.snapshot.disabled).toBe(true)
    expect(connection.snapshot.parts.root.disabled).toBe(true)
  })
})
