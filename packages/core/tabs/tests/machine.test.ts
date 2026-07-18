// The agnostic core of the Tabs — machine + connect, no DOM, no framework.
import { describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { tabsMachine, tabsConnect } from '@dunky.dev/tabs'
import type {
  KeyboardPayload,
  TabsApi,
  TabsContext,
  TabsMachineEvent,
  TabsOptions,
  TabsStateName,
} from '@dunky.dev/tabs'

interface Harness {
  service: Machine<TabsStateName, TabsContext, TabsMachineEvent>
  connection: Connector<TabsStateName, TabsContext, TabsApi, TabsOptions>
}

// Three tabs registered in DOM order, with a base id of `tabs`; per test,
// `disabled` lists the values registered as disabled.
const build = (options: TabsOptions = {}, disabled: string[] = []): Harness => {
  const service = machine(tabsMachine({ id: 'tabs', ...options }))
  const connection = connector(service, tabsConnect, options)
  service.start()
  for (const value of ['one', 'two', 'three']) {
    service.send({ type: 'tab.register', value, disabled: disabled.includes(value) })
  }
  return { service, connection }
}

const keydown = (key: string): KeyboardPayload => ({
  key,
  defaultPrevented: false,
  preventDefault() {
    this.defaultPrevented = true
  },
})

describe('tabs machine — selection', () => {
  it('starts with no selection by default', () => {
    const { service } = build()
    expect(service.context.selectedValue).toBeUndefined()
  })

  it('seeds the selection from defaultValue', () => {
    const { service } = build({ defaultValue: 'two' })
    expect(service.context.selectedValue).toBe('two')
  })

  it('seeds the selection from the controlled value', () => {
    const { service } = build({ value: 'two' })
    expect(service.context.selectedValue).toBe('two')
  })

  it('select moves the selection to an enabled tab', () => {
    const { service } = build({ defaultValue: 'one' })
    service.send({ type: 'select', value: 'three' })
    expect(service.context.selectedValue).toBe('three')
  })

  it('select is ignored for a disabled tab', () => {
    const { service } = build({ defaultValue: 'one' }, ['two'])
    service.send({ type: 'select', value: 'two' })
    expect(service.context.selectedValue).toBe('one')
  })

  it('select is ignored for an unregistered value', () => {
    const { service } = build({ defaultValue: 'one' })
    service.send({ type: 'select', value: 'missing' })
    expect(service.context.selectedValue).toBe('one')
  })

  it('value.set is programmatic authority — it lands even on a disabled tab', () => {
    const { service } = build({}, ['two'])
    service.send({ type: 'value.set', value: 'two' })
    expect(service.context.selectedValue).toBe('two')
  })
})

describe('tabs machine — tab registry', () => {
  it('re-registering a tab updates its disabled flag in place, keeping its slot', () => {
    const { service } = build()
    service.send({ type: 'tab.register', value: 'two', disabled: true })
    service.send({ type: 'focus', value: 'one' })
    service.send({ type: 'navigate.next' })
    expect(service.context.focusedValue).toBe('three')

    service.send({ type: 'tab.register', value: 'two', disabled: false })
    service.send({ type: 'navigate.previous' })
    expect(service.context.focusedValue).toBe('two') // back in its slot, not appended
  })

  it('an unregistered tab leaves navigation and can no longer be selected', () => {
    const { service } = build({ defaultValue: 'one' })
    service.send({ type: 'tab.unregister', value: 'two' })
    service.send({ type: 'select', value: 'two' })
    expect(service.context.selectedValue).toBe('one')

    service.send({ type: 'focus', value: 'one' })
    service.send({ type: 'navigate.next' })
    expect(service.context.focusedValue).toBe('three')
  })
})

describe('tabs machine — focus', () => {
  it('focus enters the focused state and records the tab', () => {
    const { service } = build()
    service.send({ type: 'focus', value: 'one' })
    expect(service.state).toBe('focused')
    expect(service.context.focusedValue).toBe('one')
  })

  it('blur returns to idle and clears the focused tab', () => {
    const { service } = build()
    service.send({ type: 'focus', value: 'one' })
    service.send({ type: 'blur' })
    expect(service.state).toBe('idle')
    expect(service.context.focusedValue).toBeUndefined()
  })

  it('automatic activation selects the tab that receives focus', () => {
    const { service } = build()
    service.send({ type: 'focus', value: 'two' })
    expect(service.context.selectedValue).toBe('two')
  })

  it('focusing a disabled tab records focus but never selects', () => {
    const { service } = build({}, ['two'])
    service.send({ type: 'focus', value: 'two' })
    expect(service.context.focusedValue).toBe('two')
    expect(service.context.selectedValue).toBeUndefined()
  })

  it('manual activation does not select on focus', () => {
    const { service } = build({ activationMode: 'manual' })
    service.send({ type: 'focus', value: 'two' })
    expect(service.context.selectedValue).toBeUndefined()
  })
})

describe('tabs machine — navigation', () => {
  it('navigation is ignored while idle', () => {
    const { service } = build()
    service.send({ type: 'navigate.next' })
    expect(service.context.focusedValue).toBeUndefined()
  })

  it('next moves to the next tab and wraps at the end', () => {
    const { service } = build()
    service.send({ type: 'focus', value: 'two' })
    service.send({ type: 'navigate.next' })
    expect(service.context.focusedValue).toBe('three')
    service.send({ type: 'navigate.next' })
    expect(service.context.focusedValue).toBe('one')
  })

  it('previous moves back and wraps at the start', () => {
    const { service } = build()
    service.send({ type: 'focus', value: 'one' })
    service.send({ type: 'navigate.previous' })
    expect(service.context.focusedValue).toBe('three')
  })

  it('navigation skips disabled tabs', () => {
    const { service } = build({}, ['two'])
    service.send({ type: 'focus', value: 'one' })
    service.send({ type: 'navigate.next' })
    expect(service.context.focusedValue).toBe('three')
  })

  it('first/last jump to the first/last enabled tab', () => {
    const { service } = build({}, ['three'])
    service.send({ type: 'focus', value: 'two' })
    service.send({ type: 'navigate.first' })
    expect(service.context.focusedValue).toBe('one')
    service.send({ type: 'navigate.last' })
    expect(service.context.focusedValue).toBe('two') // `three` is disabled
  })

  it('navigation selects as it moves in automatic mode', () => {
    const { service } = build()
    service.send({ type: 'focus', value: 'one' })
    service.send({ type: 'navigate.next' })
    expect(service.context.selectedValue).toBe('two')
  })

  it('navigation only moves focus in manual mode', () => {
    const { service } = build({ activationMode: 'manual', defaultValue: 'one' })
    service.send({ type: 'focus', value: 'one' })
    service.send({ type: 'navigate.next' })
    expect(service.context.focusedValue).toBe('two')
    expect(service.context.selectedValue).toBe('one')
  })
})

describe('tabs connect — list bindings', () => {
  it('the list carries the tablist surface', () => {
    const list = build().connection.snapshot.parts.list
    expect(list.role).toBe('tablist')
    expect(list.orientation).toBe('horizontal')
    expect(list['data-orientation']).toBe('horizontal')
  })

  it('arrow keys follow the horizontal axis and consume the event', () => {
    const { service, connection } = build()
    service.send({ type: 'focus', value: 'one' })

    const next = keydown('ArrowRight')
    connection.snapshot.parts.list.onKeyDown?.(next)
    expect(service.context.focusedValue).toBe('two')
    expect(next.defaultPrevented).toBe(true)

    connection.snapshot.parts.list.onKeyDown?.(keydown('ArrowLeft'))
    expect(service.context.focusedValue).toBe('one')

    const offAxis = keydown('ArrowDown')
    connection.snapshot.parts.list.onKeyDown?.(offAxis)
    expect(service.context.focusedValue).toBe('one')
    expect(offAxis.defaultPrevented).toBe(false)
  })

  it('arrow keys follow the vertical axis when orientation=vertical', () => {
    const { service, connection } = build({ orientation: 'vertical' })
    expect(connection.snapshot.parts.list.orientation).toBe('vertical')
    service.send({ type: 'focus', value: 'one' })

    connection.snapshot.parts.list.onKeyDown?.(keydown('ArrowDown'))
    expect(service.context.focusedValue).toBe('two')
    connection.snapshot.parts.list.onKeyDown?.(keydown('ArrowUp'))
    expect(service.context.focusedValue).toBe('one')
  })

  it('Home and End map to the first/last navigation', () => {
    const { service, connection } = build()
    service.send({ type: 'focus', value: 'two' })

    connection.snapshot.parts.list.onKeyDown?.(keydown('End'))
    expect(service.context.focusedValue).toBe('three')
    connection.snapshot.parts.list.onKeyDown?.(keydown('Home'))
    expect(service.context.focusedValue).toBe('one')
  })

  it('Enter and Space select the focused tab in manual mode', () => {
    const { service, connection } = build({ activationMode: 'manual' })
    service.send({ type: 'focus', value: 'one' })
    service.send({ type: 'navigate.next' })

    connection.snapshot.parts.list.onKeyDown?.(keydown('Enter'))
    expect(service.context.selectedValue).toBe('two')

    service.send({ type: 'navigate.next' })
    connection.snapshot.parts.list.onKeyDown?.(keydown(' '))
    expect(service.context.selectedValue).toBe('three')
  })

  it('does not consume keys while the strip is not focused', () => {
    const { connection } = build()
    const event = keydown('ArrowRight')
    connection.snapshot.parts.list.onKeyDown?.(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('blur reports through the machine', () => {
    const { service, connection } = build()
    service.send({ type: 'focus', value: 'one' })
    connection.snapshot.parts.list.onBlur?.()
    expect(service.state).toBe('idle')
  })
})

describe('tabs connect — trigger bindings', () => {
  it('a trigger carries the tab surface wired to its panel', () => {
    const { connection } = build({ defaultValue: 'one' })
    const selected = connection.snapshot.parts.trigger({ value: 'one' })
    expect(selected.role).toBe('tab')
    expect(selected.id).toBe('tabs-trigger-one')
    expect(selected.controls).toBe('tabs-content-one')
    expect(selected.selected).toBe(true)
    expect(selected['data-state']).toBe('active')
    expect(selected['data-orientation']).toBe('horizontal')

    const unselected = connection.snapshot.parts.trigger({ value: 'two' })
    expect(unselected.selected).toBe(false)
    expect(unselected['data-state']).toBe('inactive')
  })

  it('the roving tab stop follows the selection', () => {
    const { connection } = build({ defaultValue: 'two' })
    expect(connection.snapshot.parts.trigger({ value: 'two' }).focusable).toBe(true)
    expect(connection.snapshot.parts.trigger({ value: 'one' }).focusable).toBe(false)
    expect(connection.snapshot.parts.trigger({ value: 'three' }).focusable).toBe(false)
  })

  it('the roving tab stop falls back to the first enabled tab when nothing is selected', () => {
    const { connection } = build({}, ['one'])
    expect(connection.snapshot.parts.trigger({ value: 'one', disabled: true }).focusable).toBe(
      false,
    )
    expect(connection.snapshot.parts.trigger({ value: 'two' }).focusable).toBe(true)
    expect(connection.snapshot.parts.trigger({ value: 'three' }).focusable).toBe(false)
  })

  it('the roving tab stop skips a selected-but-disabled tab', () => {
    const { connection } = build({ defaultValue: 'two' }, ['two'])
    expect(connection.snapshot.parts.trigger({ value: 'two', disabled: true }).focusable).toBe(
      false,
    )
    expect(connection.snapshot.parts.trigger({ value: 'one' }).focusable).toBe(true)
  })

  it('a disabled trigger is marked disabled and its press never selects', () => {
    const { service, connection } = build({}, ['two'])
    const trigger = connection.snapshot.parts.trigger({ value: 'two', disabled: true })
    expect(trigger.disabled).toBe(true)
    trigger.onPress?.()
    expect(service.context.selectedValue).toBeUndefined()

    expect(connection.snapshot.parts.trigger({ value: 'one' }).disabled).toBeUndefined()
  })

  it('trigger press and focus drive the machine', () => {
    const { service, connection } = build()
    connection.snapshot.parts.trigger({ value: 'three' }).onPress?.()
    expect(service.context.selectedValue).toBe('three')

    connection.snapshot.parts.trigger({ value: 'two' }).onFocus?.()
    expect(service.state).toBe('focused')
    expect(service.context.focusedValue).toBe('two')
  })
})

describe('tabs connect — content bindings', () => {
  it('a panel carries the tabpanel surface wired to its tab', () => {
    const { connection } = build({ defaultValue: 'one' })
    const active = connection.snapshot.parts.content({ value: 'one' })
    expect(active.role).toBe('tabpanel')
    expect(active.id).toBe('tabs-content-one')
    expect(active.labelledBy).toBe('tabs-trigger-one')
    expect(active.focusable).toBe(true)
    expect(active.hidden).toBeUndefined()
    expect(active['data-state']).toBe('active')

    const inactive = connection.snapshot.parts.content({ value: 'two' })
    expect(inactive.hidden).toBe(true)
    expect(inactive['data-state']).toBe('inactive')
  })
})

describe('tabs connect — api', () => {
  it('setValue drives selection programmatically', () => {
    const { connection } = build()
    connection.snapshot.setValue('two')
    expect(connection.snapshot.value).toBe('two')
  })
})

describe('tabs connect — reactions', () => {
  it('fires onValueChange on every selection change, not on subscribe', () => {
    const onValueChange = vi.fn()
    const { service } = build({ defaultValue: 'one', onValueChange })
    expect(onValueChange).not.toHaveBeenCalled()

    service.send({ type: 'select', value: 'two' })
    expect(onValueChange).toHaveBeenLastCalledWith('two')
    service.send({ type: 'focus', value: 'three' }) // automatic activation
    expect(onValueChange).toHaveBeenLastCalledWith('three')
    expect(onValueChange).toHaveBeenCalledTimes(2)
  })
})
