import { describe, expect, it } from 'vitest'
import { machine, setup, type Guard } from '@dunky.dev/state-machine'
import {
  controlled,
  intent,
  syncControlled,
  type Controllable,
  type ControlledSync,
} from '@dunky.dev/controllable'

// A minimal on/off machine — just enough surface to exercise the contract.
type ToggleState = 'off' | 'on'
interface ToggleContext {
  on: Controllable<boolean>
  allowStop: boolean
}
type ToggleEvent = { type: 'start' } | { type: 'stop' } | ControlledSync<boolean>

const canStop: Guard<ToggleContext, ToggleEvent> = ({ context }) => context.allowStop
// Unguarded events carry no Context/Event to infer from — the pinned form.
const request = intent.as<ToggleState, ToggleContext, ToggleEvent>()

const build = (options: { on?: boolean; allowStop?: boolean } = {}) => {
  const service = machine(
    setup.as<ToggleContext, ToggleEvent>().createMachine({
      initial: options.on === true ? 'on' : 'off',
      context: { on: controlled(options.on), allowStop: options.allowStop ?? true },
      states: {
        off: {
          on: {
            start: request('on', { target: 'on', value: true }),
            'controlled.sync': { target: 'on', guard: syncControlled(true) },
          },
        },
        on: {
          on: {
            // Bare call: the typed guard carries Context/Event, so it infers.
            stop: intent('on', { guard: canStop, target: 'off', value: false }),
            'controlled.sync': { target: 'off', guard: syncControlled(false) },
          },
        },
      },
    }),
  )
  service.start()
  return service
}

describe('controlled', () => {
  it('derives the controlled flag from whether a value was supplied', () => {
    expect(controlled(undefined).controlled).toBe(false)
    expect(controlled(false).controlled).toBe(true)
    expect(controlled(undefined).intent).toBeNull()
  })
})

describe('intent', () => {
  it('uncontrolled: transitions and writes the intent', () => {
    const service = build()
    service.send({ type: 'start' })
    expect(service.state).toBe('on')
    expect(service.context.on.intent).toEqual({ value: true })
  })

  it('controlled: writes the intent without moving the machine', () => {
    const service = build({ on: true })
    service.send({ type: 'stop' })
    expect(service.state).toBe('on')
    expect(service.context.on.intent).toEqual({ value: false })
  })

  it('the guard gates both modes before anything is reported', () => {
    const controlled = build({ on: true, allowStop: false })
    controlled.send({ type: 'stop' })
    expect(controlled.context.on.intent).toBeNull()

    const uncontrolled = build({ allowStop: false })
    uncontrolled.send({ type: 'start' }) // start is unguarded
    uncontrolled.send({ type: 'stop' })
    expect(uncontrolled.state).toBe('on')
  })

  it('writes a fresh token per intent so repeats still notify', () => {
    const service = build({ on: true })
    service.send({ type: 'stop' })
    const first = service.context.on.intent
    service.send({ type: 'stop' })
    expect(service.context.on.intent).toEqual(first)
    expect(service.context.on.intent).not.toBe(first)
  })
})

describe('controlled.sync', () => {
  it('moves the machine to the echoed value without reporting an intent', () => {
    const service = build({ on: true })
    service.send({ type: 'controlled.sync', value: false })
    expect(service.state).toBe('off')
    expect(service.context.on.intent).toBeNull()
  })
})
