// @vitest-environment jsdom
// The DOM half of the __name__, driven directly — no substrate, no framework.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { machine, type Machine } from '@dunky.dev/state-machine'
import { __camelName__Machine } from '@dunky.dev/__name__'
import type {
  __Name__Context,
  __Name__MachineEvent,
  __Name__Options,
  __Name__StateName,
} from '@dunky.dev/__name__'
import { dom__Name__Effects } from '@dunky.dev/dom-__name__'

type __Name__Service = Machine<__Name__StateName, __Name__Context, __Name__MachineEvent>

const build = (options: __Name__Options = {}): __Name__Service => {
  const service = machine(__camelName__Machine(options))
  service.start()
  return service
}

// Effects are plain tuples, so a test drives one directly rather than through
// a host lifecycle. Index by position; the disposer is what the substrate's
// cleanup would call.
const arm = (index: number, service: __Name__Service, props: __Name__Options = {}): (() => void) => {
  const [effect] = dom__Name__Effects[index] as (typeof dom__Name__Effects)[number]
  return effect(service, props) ?? ((): void => {})
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('dom__Name__Effects', () => {
  it('reacts to the document while armed', () => {
    const service = build()
    arm(0, service)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(service.context.disabled).toBe(true)
  })

  it('detaches its listener on dispose', () => {
    const service = build()
    arm(0, service)()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(service.context.disabled).toBe(false)
  })
})
