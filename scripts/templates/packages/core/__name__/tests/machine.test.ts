import { describe, expect, it, vi } from 'vitest'
import { connector, machine } from '@dunky.dev/state-machine'
import { create__Name__Config, __camelName__Connect } from '@dunky.dev/__name__'
import type { __Name__Options } from '@dunky.dev/__name__'

function harness(options: __Name__Options = {}) {
  const service = machine(create__Name__Config(options))
  connector(service, __camelName__Connect, options)
  service.start()
  return { service, send: service.send }
}

describe('__name__ machine', () => {
  it('fires onActivate on ACTIVATE', () => {
    const onActivate = vi.fn()
    const { send } = harness({ onActivate })
    send({ type: 'ACTIVATE' })
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('does not activate while disabled', () => {
    const onActivate = vi.fn()
    const { send } = harness({ disabled: true, onActivate })
    send({ type: 'ACTIVATE' })
    expect(onActivate).not.toHaveBeenCalled()
  })
})
