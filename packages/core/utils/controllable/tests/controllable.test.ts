import { describe, expect, it } from 'vitest'
import { machine, setup, type Guard } from '@dunky.dev/state-machine'
import {
  controllable,
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
const intend = intent.as<ToggleState, ToggleContext, ToggleEvent>()
const synced = syncControlled.as<ToggleState, ToggleContext, ToggleEvent>()

const build = (options: { on?: boolean; allowStop?: boolean } = {}) => {
  const service = machine(
    setup.as<ToggleContext, ToggleEvent>().createMachine({
      initial: options.on === true ? 'on' : 'off',
      context: { on: controllable(options.on), allowStop: options.allowStop ?? true },
      states: {
        off: {
          on: {
            start: intend('on', { target: 'on', value: true }),
            'controlled.sync': synced('on', { value: true, target: 'on' }),
          },
        },
        on: {
          on: {
            // Bare call: the typed guard carries Context/Event, so it infers.
            stop: intent('on', { guard: canStop, target: 'off', value: false }),
            'controlled.sync': synced('on', { value: false, target: 'off' }),
          },
        },
      },
    }),
  )
  service.start()
  return service
}

describe('controllable', () => {
  it('derives the controlled flag from whether a value was supplied', () => {
    expect(controllable(undefined).controlled).toBe(false)
    expect(controllable(false).controlled).toBe(true)
    expect(controllable(undefined).intent).toBeNull()
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

  it('re-derives controlled-ness from the echoed value presence, both directions', () => {
    const service = build({ on: true })
    service.send({ type: 'controlled.sync', value: undefined })
    expect(service.state).toBe('on') // hands back, right where it stands
    expect(service.context.on.controlled).toBe(false)

    service.send({ type: 'controlled.sync', value: false })
    expect(service.state).toBe('off') // a value retakes control and moves it
    expect(service.context.on.controlled).toBe(true)
  })
})
