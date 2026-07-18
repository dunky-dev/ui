// The agnostic core of the Radio — machine + connect, no DOM, no framework.
import { describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { radioMachine, radioConnect, radioIds } from '@dunky.dev/radio'
import type {
  RadioApi,
  RadioContext,
  RadioMachineEvent,
  RadioOptions,
  RadioStateName,
} from '@dunky.dev/radio'

// The per-item ids the connect derives from a base id of `rad`.
const ids = radioIds('rad')

interface Harness {
  service: Machine<RadioStateName, RadioContext, RadioMachineEvent>
  connection: Connector<RadioStateName, RadioContext, RadioApi, RadioOptions>
}

// Three registered items — `c` disabled — the shape every navigation and
// gating test reads against.
const build = (options: RadioOptions = {}): Harness => {
  const service = machine(radioMachine({ id: 'rad', ...options }))
  const connection = connector(service, radioConnect, options)
  service.start()
  service.send({ type: 'item.register', value: 'a', disabled: false })
  service.send({ type: 'item.register', value: 'b', disabled: false })
  service.send({ type: 'item.register', value: 'c', disabled: true })
  return { service, connection }
}

const keyEvent = (key: string) => ({
  key,
  defaultPrevented: false,
  preventDefault() {
    this.defaultPrevented = true
  },
})

describe('radio machine — value', () => {
  it('starts unselected by default', () => {
    const { service } = build()
    expect(service.context.value).toBe(null)
  })

  it('starts at defaultValue', () => {
    const { service } = build({ defaultValue: 'b' })
    expect(service.context.value).toBe('b')
  })

  it('starts at the controlled value', () => {
    const { service } = build({ value: 'a' })
    expect(service.context.value).toBe('a')
  })

  it('select checks an enabled item', () => {
    const { service } = build()
    service.send({ type: 'select', value: 'b' })
    expect(service.context.value).toBe('b')
  })

  it('select is ignored for a disabled item', () => {
    const { service } = build()
    service.send({ type: 'select', value: 'c' })
    expect(service.context.value).toBe(null)
  })

  it('select is ignored while the group is disabled', () => {
    const { service } = build({ disabled: true })
    service.send({ type: 'select', value: 'a' })
    expect(service.context.value).toBe(null)
  })

  it('select is ignored for a value that is not registered', () => {
    const { service } = build()
    service.send({ type: 'select', value: 'ghost' })
    expect(service.context.value).toBe(null)
  })

  it('disabled.set gates selection at runtime', () => {
    const { service } = build()
    service.send({ type: 'disabled.set', disabled: true })
    service.send({ type: 'select', value: 'a' })
    expect(service.context.value).toBe(null)
  })

  it('value.set lands unguarded — even null, even while disabled', () => {
    const { service } = build({ disabled: true, defaultValue: 'a' })
    service.send({ type: 'value.set', value: 'c' })
    expect(service.context.value).toBe('c')
    service.send({ type: 'value.set', value: null })
    expect(service.context.value).toBe(null)
  })
})

describe('radio machine — item registration', () => {
  it('re-registering a value updates disabled in place without moving it', () => {
    const { service } = build()
    service.send({ type: 'item.register', value: 'a', disabled: true })
    expect(service.context.items).toEqual([
      { value: 'a', disabled: true },
      { value: 'b', disabled: false },
      { value: 'c', disabled: true },
    ])
  })

  it('unregister removes the item', () => {
    const { service } = build()
    service.send({ type: 'item.unregister', value: 'b' })
    expect(service.context.items).toEqual([
      { value: 'a', disabled: false },
      { value: 'c', disabled: true },
    ])
  })
})

describe('radio machine — navigation', () => {
  it('navigate selects the next enabled item and requests focus on it', () => {
    const { service } = build()
    service.send({ type: 'navigate', from: 'a', direction: 1 })
    expect(service.context.value).toBe('b')
    expect(service.context.focus).toEqual({ value: 'b' })
  })

  it('navigate skips disabled items and wraps past the end', () => {
    const { service } = build()
    service.send({ type: 'navigate', from: 'b', direction: 1 })
    expect(service.context.value).toBe('a') // c is disabled; wraps to the start
  })

  it('navigate backwards wraps from the first to the last enabled item', () => {
    const { service } = build()
    service.send({ type: 'navigate', from: 'a', direction: -1 })
    expect(service.context.value).toBe('b')
  })

  it('the lone enabled item wraps to itself and selects', () => {
    const { service } = build()
    service.send({ type: 'item.register', value: 'b', disabled: true })
    service.send({ type: 'navigate', from: 'a', direction: 1 })
    expect(service.context.value).toBe('a')
    expect(service.context.focus).toEqual({ value: 'a' })
  })

  it('navigate is ignored while the group is disabled', () => {
    const { service } = build({ disabled: true })
    service.send({ type: 'navigate', from: 'a', direction: 1 })
    expect(service.context.value).toBe(null)
    expect(service.context.focus).toBe(null)
  })

  it('navigate from an unregistered origin is a no-op', () => {
    const { service } = build()
    service.send({ type: 'navigate', from: 'ghost', direction: 1 })
    expect(service.context.value).toBe(null)
  })
})

describe('radio connect — logical bindings', () => {
  it('group carries the radiogroup semantics', () => {
    const { connection } = build({ orientation: 'horizontal' })
    const group = connection.snapshot.parts.group
    expect(group.role).toBe('radiogroup')
    expect(group.id).toBe(ids.group)
    expect(group.orientation).toBe('horizontal')
    expect(group.disabled).toBeUndefined()
    expect(group['data-disabled']).toBeUndefined()
  })

  it('orientation.set updates the group orientation hint', () => {
    const { service, connection } = build({ orientation: 'horizontal' })
    service.send({ type: 'orientation.set', orientation: 'vertical' })
    expect(connection.snapshot.parts.group.orientation).toBe('vertical')
  })

  it('group reflects disabled', () => {
    const { connection } = build({ disabled: true })
    const group = connection.snapshot.parts.group
    expect(group.disabled).toBe(true)
    expect(group['data-disabled']).toBe('')
  })

  it('item press selects, requests focus, and flips checked + data-state', () => {
    const { service, connection } = build()
    const item = connection.snapshot.parts.item({ value: 'a' })
    expect(item.role).toBe('radio')
    expect(item.id).toBe(ids.item('a'))
    expect(item.checked).toBe(false)
    expect(item['data-state']).toBe('unchecked')

    item.onPress?.()
    expect(service.context.value).toBe('a')
    // Not every browser focuses a pressed button — the machine asks for it.
    expect(service.context.focus).toEqual({ value: 'a' })

    const checked = connection.snapshot.parts.item({ value: 'a' })
    expect(checked.checked).toBe(true)
    expect(checked['data-state']).toBe('checked')
  })

  it('a disabled item carries disabled + data-disabled', () => {
    const { connection } = build()
    const item = connection.snapshot.parts.item({ value: 'c', disabled: true })
    expect(item.disabled).toBe(true)
    expect(item['data-disabled']).toBe('')
  })

  it('roving tabindex: the checked item is the only focusable one', () => {
    const { connection } = build({ defaultValue: 'b' })
    expect(connection.snapshot.parts.item({ value: 'b' }).focusable).toBe(true)
    expect(connection.snapshot.parts.item({ value: 'a' }).focusable).toBe(false)
  })

  it('roving tabindex falls back to the first enabled item when nothing is checked', () => {
    const { connection } = build()
    expect(connection.snapshot.parts.item({ value: 'a' }).focusable).toBe(true)
    expect(connection.snapshot.parts.item({ value: 'b' }).focusable).toBe(false)
  })

  it('roving tabindex skips a checked-but-disabled item', () => {
    const { connection } = build({ defaultValue: 'c' })
    expect(connection.snapshot.parts.item({ value: 'c', disabled: true }).focusable).toBe(false)
    expect(connection.snapshot.parts.item({ value: 'a' }).focusable).toBe(true)
  })

  it('a disabled group has no focusable item', () => {
    const { connection } = build({ disabled: true, defaultValue: 'a' })
    expect(connection.snapshot.parts.item({ value: 'a' }).focusable).toBe(false)
  })

  it('arrow keys navigate — down/right forward, up/left backward — and never scroll', () => {
    const { service, connection } = build()
    const send = (from: string, key: string) => {
      const event = keyEvent(key)
      connection.snapshot.parts.item({ value: from }).onKeyDown?.(event)
      return event
    }

    expect(send('a', 'ArrowDown').defaultPrevented).toBe(true)
    expect(service.context.value).toBe('b')
    send('b', 'ArrowRight')
    expect(service.context.value).toBe('a')
    send('a', 'ArrowUp')
    expect(service.context.value).toBe('b')
    send('b', 'ArrowLeft')
    expect(service.context.value).toBe('a')
  })

  it('Space selects the focused unchecked item and suppresses the native press', () => {
    const { service, connection } = build()
    const event = keyEvent(' ')
    connection.snapshot.parts.item({ value: 'a' }).onKeyDown?.(event)
    expect(service.context.value).toBe('a')
    expect(event.defaultPrevented).toBe(true)
  })

  it('Enter does not select and is suppressed (no implicit form submission)', () => {
    const { service, connection } = build()
    const event = keyEvent('Enter')
    connection.snapshot.parts.item({ value: 'a' }).onKeyDown?.(event)
    expect(service.context.value).toBe(null)
    expect(event.defaultPrevented).toBe(true)
  })

  it('labelledBy only references a rendered label', () => {
    const { service, connection } = build()
    expect(connection.snapshot.parts.item({ value: 'a' }).labelledBy).toBeUndefined()

    service.send({ type: 'label.presence', value: 'a', present: true })
    expect(connection.snapshot.parts.item({ value: 'a' }).labelledBy).toBe(ids.label('a'))
    expect(connection.snapshot.parts.itemLabel({ value: 'a' }).id).toBe(ids.label('a'))

    service.send({ type: 'label.presence', value: 'a', present: false })
    expect(connection.snapshot.parts.item({ value: 'a' }).labelledBy).toBeUndefined()
  })

  it('label press selects its item and requests focus on it', () => {
    const { service, connection } = build()
    connection.snapshot.parts.itemLabel({ value: 'b' }).onPress?.()
    expect(service.context.value).toBe('b')
    expect(service.context.focus).toEqual({ value: 'b' })
  })

  it('indicator mirrors the item state for styling', () => {
    const { connection } = build({ defaultValue: 'a' })
    expect(connection.snapshot.parts.itemIndicator({ value: 'a' })['data-state']).toBe('checked')
    const off = connection.snapshot.parts.itemIndicator({ value: 'c', disabled: true })
    expect(off['data-state']).toBe('unchecked')
    expect(off['data-disabled']).toBe('')
  })

  it('setValue drives both directions', () => {
    const { service, connection } = build()
    connection.snapshot.setValue('b')
    expect(service.context.value).toBe('b')
    connection.snapshot.setValue(null)
    expect(service.context.value).toBe(null)
  })
})

describe('radio connect — reactions', () => {
  it('fires onValueChange on every change, not on subscribe or a same-value select', () => {
    const onValueChange = vi.fn()
    const { service } = build({ onValueChange })
    expect(onValueChange).not.toHaveBeenCalled()

    service.send({ type: 'select', value: 'a' })
    expect(onValueChange).toHaveBeenLastCalledWith('a')
    service.send({ type: 'select', value: 'a' })
    expect(onValueChange).toHaveBeenCalledTimes(1)

    service.send({ type: 'value.set', value: null })
    expect(onValueChange).toHaveBeenLastCalledWith(null)
    expect(onValueChange).toHaveBeenCalledTimes(2)
  })
})
