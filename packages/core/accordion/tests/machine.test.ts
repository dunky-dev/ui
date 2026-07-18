// The agnostic core of the accordion — machine + connect, no DOM, no framework.
import { describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { accordionConnect, accordionIds, accordionMachine } from '@dunky.dev/accordion'
import type {
  AccordionApi,
  AccordionContext,
  AccordionItemOptions,
  AccordionMachineEvent,
  AccordionOptions,
  AccordionStateName,
} from '@dunky.dev/accordion'

// The per-item ids the connect derives from a base id of `acc`.
const ids = accordionIds('acc')

interface Harness {
  service: Machine<AccordionStateName, AccordionContext, AccordionMachineEvent>
  connection: Connector<AccordionStateName, AccordionContext, AccordionApi, AccordionOptions>
}

// Builds a started machine with items a/b/c registered — the standard fixture.
const build = (
  options: AccordionOptions = { type: 'single' },
  items: AccordionItemOptions[] = [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
): Harness => {
  const service = machine(accordionMachine({ id: 'acc', ...options }))
  const connection = connector(service, accordionConnect, options)
  service.start()
  for (const item of items) {
    service.send({ type: 'item.register', value: item.value, disabled: item.disabled })
  }
  return { service, connection }
}

const focus = (service: Harness['service'], value: string): void => {
  service.send({ type: 'focus.set', value })
}

describe('accordion machine — open value', () => {
  it('starts fully closed with no default', () => {
    const { service } = build()
    expect(service.context.value).toEqual([])
  })

  it('seeds the single value from defaultValue, controlled value winning', () => {
    expect(build({ type: 'single', defaultValue: 'b' }).service.context.value).toEqual(['b'])
    expect(build({ type: 'single', value: 'a', defaultValue: 'b' }).service.context.value).toEqual([
      'a',
    ])
  })

  it('seeds the multiple value array', () => {
    const { service } = build({ type: 'multiple', defaultValue: ['a', 'c'] })
    expect(service.context.value).toEqual(['a', 'c'])
  })

  it('single: opening another item closes the open one', () => {
    const { service } = build({ type: 'single', defaultValue: 'a' })
    service.send({ type: 'toggle', value: 'b' })
    expect(service.context.value).toEqual(['b'])
  })

  it('single non-collapsible (the default): re-toggling the open item keeps it open', () => {
    const { service } = build({ type: 'single', defaultValue: 'a' })
    service.send({ type: 'toggle', value: 'a' })
    expect(service.context.value).toEqual(['a'])
  })

  it('single collapsible: re-toggling the open item closes it', () => {
    const { service } = build({ type: 'single', collapsible: true, defaultValue: 'a' })
    service.send({ type: 'toggle', value: 'a' })
    expect(service.context.value).toEqual([])
  })

  it('multiple: items toggle independently', () => {
    const { service } = build({ type: 'multiple' })
    service.send({ type: 'toggle', value: 'a' })
    service.send({ type: 'toggle', value: 'c' })
    expect(service.context.value).toEqual(['a', 'c'])
    service.send({ type: 'toggle', value: 'a' })
    expect(service.context.value).toEqual(['c'])
  })

  it('single: value.set clamps the open set to at most one entry', () => {
    const { service } = build({ type: 'single' })
    service.send({ type: 'value.set', value: ['b', 'c'] })
    expect(service.context.value).toEqual(['b'])
  })

  it('controlled: a toggle reports intent without moving the value; value.set is not echoed', () => {
    const onValueChange = vi.fn()
    const { service } = build({ type: 'single', value: 'a', onValueChange })

    service.send({ type: 'toggle', value: 'b' })
    expect(service.context.value).toEqual(['a'])
    expect(onValueChange).toHaveBeenLastCalledWith('b')

    service.send({ type: 'value.set', value: ['b'] })
    expect(service.context.value).toEqual(['b'])
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it('arrays never cross the boundary by reference — in or out', () => {
    const onValueChange = vi.fn()
    const { service, connection } = build({ type: 'multiple', onValueChange })

    const incoming = ['a']
    service.send({ type: 'value.set', value: incoming })
    incoming.push('b')
    expect(service.context.value).toEqual(['a'])

    onValueChange.mock.calls[0][0].push('c')
    expect(service.context.value).toEqual(['a'])

    connection.snapshot.value.push('d')
    expect(service.context.value).toEqual(['a'])
  })
})

describe('accordion machine — disabled gating', () => {
  it('toggle on a disabled item is ignored', () => {
    const { service } = build({ type: 'single' }, [{ value: 'a' }, { value: 'b', disabled: true }])
    service.send({ type: 'toggle', value: 'b' })
    expect(service.context.value).toEqual([])
  })

  it('toggle is ignored while the whole accordion is disabled', () => {
    const { service } = build({ type: 'single', disabled: true })
    service.send({ type: 'toggle', value: 'a' })
    expect(service.context.value).toEqual([])
  })

  it('disabled.set re-enables toggling', () => {
    const { service } = build({ type: 'single', disabled: true })
    service.send({ type: 'disabled.set', disabled: false })
    service.send({ type: 'toggle', value: 'a' })
    expect(service.context.value).toEqual(['a'])
  })
})

describe('accordion machine — item registry', () => {
  it('registers in order and unregisters by value', () => {
    const { service } = build()
    expect(service.context.items.map(item => item.value)).toEqual(['a', 'b', 'c'])

    service.send({ type: 'item.unregister', value: 'b' })
    expect(service.context.items.map(item => item.value)).toEqual(['a', 'c'])
  })

  it('re-registering a value updates disabled in place, keeping the order', () => {
    const { service } = build()
    service.send({ type: 'item.register', value: 'b', disabled: true })
    expect(service.context.items.map(item => item.value)).toEqual(['a', 'b', 'c'])
    expect(service.context.items[1].disabled).toBe(true)
  })
})

describe('accordion machine — focus', () => {
  it('focus.set enters focused; focus.clear returns to idle', () => {
    const { service } = build()
    expect(service.state).toBe('idle')

    focus(service, 'a')
    expect(service.state).toBe('focused')
    expect(service.context.focusedValue).toBe('a')

    service.send({ type: 'focus.clear' })
    expect(service.state).toBe('idle')
    expect(service.context.focusedValue).toBeNull()
  })

  it('navigation is ignored while idle', () => {
    const { service } = build()
    service.send({ type: 'focus.next' })
    expect(service.context.focusTarget).toBeNull()
    expect(service.context.focusedValue).toBeNull()
  })

  it('focus.next moves forward, skipping disabled items and wrapping at the end', () => {
    const { service } = build({ type: 'single' }, [
      { value: 'a' },
      { value: 'b', disabled: true },
      { value: 'c' },
    ])
    focus(service, 'a')

    service.send({ type: 'focus.next' })
    expect(service.context.focusedValue).toBe('c')

    service.send({ type: 'focus.next' })
    expect(service.context.focusedValue).toBe('a')
  })

  it('focus.previous moves backward with wrap', () => {
    const { service } = build()
    focus(service, 'a')
    service.send({ type: 'focus.previous' })
    expect(service.context.focusedValue).toBe('c')
  })

  it('focus.first / focus.last land on the first / last enabled item', () => {
    const { service } = build({ type: 'single' }, [
      { value: 'a', disabled: true },
      { value: 'b' },
      { value: 'c' },
      { value: 'd', disabled: true },
    ])
    focus(service, 'c')

    service.send({ type: 'focus.first' })
    expect(service.context.focusedValue).toBe('b')

    service.send({ type: 'focus.last' })
    expect(service.context.focusedValue).toBe('c')
  })

  it('each move writes a fresh focus mailbox token', () => {
    const { service } = build()
    focus(service, 'b')

    service.send({ type: 'focus.first' })
    const first = service.context.focusTarget
    expect(first).toEqual({ value: 'a' })

    service.send({ type: 'focus.first' })
    expect(service.context.focusTarget).toEqual({ value: 'a' })
    expect(service.context.focusTarget).not.toBe(first)
  })

  it('navigation moves nothing while the accordion is disabled', () => {
    const { service } = build({ type: 'single', disabled: true })
    focus(service, 'a')
    service.send({ type: 'focus.next' })
    expect(service.context.focusedValue).toBe('a')
    expect(service.context.focusTarget).toBeNull()
  })

  it('navigation moves nothing when every item is disabled', () => {
    const { service } = build({ type: 'single' }, [
      { value: 'a', disabled: true },
      { value: 'b', disabled: true },
    ])
    focus(service, 'a')

    service.send({ type: 'focus.next' })
    service.send({ type: 'focus.first' })
    expect(service.context.focusedValue).toBe('a')
    expect(service.context.focusTarget).toBeNull()
  })

  it('after the focused item unregisters, navigation enters from the matching edge', () => {
    const forward = build()
    focus(forward.service, 'b')
    forward.service.send({ type: 'item.unregister', value: 'b' })
    forward.service.send({ type: 'focus.next' })
    expect(forward.service.context.focusedValue).toBe('a')

    const backward = build()
    focus(backward.service, 'b')
    backward.service.send({ type: 'item.unregister', value: 'b' })
    backward.service.send({ type: 'focus.previous' })
    expect(backward.service.context.focusedValue).toBe('c')
  })
})

describe('accordion connect — logical bindings', () => {
  it('trigger carries the disclosure wiring and toggles', () => {
    const { service, connection } = build()
    const trigger = connection.snapshot.parts.trigger({ value: 'a' })
    expect(trigger.id).toBe(ids.trigger('a'))
    expect(trigger.controls).toBe(ids.content('a'))
    expect(trigger.expanded).toBe(false)

    trigger.onPress?.()
    expect(service.context.value).toEqual(['a'])
    expect(connection.snapshot.parts.trigger({ value: 'a' }).expanded).toBe(true)
  })

  it('trigger focus/blur drive the focus state', () => {
    const { service, connection } = build()
    connection.snapshot.parts.trigger({ value: 'b' }).onFocus?.()
    expect(service.state).toBe('focused')
    expect(service.context.focusedValue).toBe('b')

    connection.snapshot.parts.trigger({ value: 'b' }).onBlur?.()
    expect(service.state).toBe('idle')
  })

  it('the arrow axis follows orientation, live', () => {
    const { service, connection } = build({ type: 'single', orientation: 'horizontal' })
    focus(service, 'a')

    const press = (key: string) => {
      const payload = {
        key,
        defaultPrevented: false,
        preventDefault() {
          this.defaultPrevented = true
        },
      }
      connection.snapshot.parts.trigger({ value: 'a' }).onKeyDown?.(payload)
      return payload
    }

    expect(press('ArrowDown').defaultPrevented).toBe(false)
    expect(service.context.focusedValue).toBe('a')

    expect(press('ArrowRight').defaultPrevented).toBe(true)
    expect(service.context.focusedValue).toBe('b')

    service.send({ type: 'orientation.set', orientation: 'vertical' })
    expect(press('ArrowDown').defaultPrevented).toBe(true)
    expect(service.context.focusedValue).toBe('c')
  })

  it('Home and End keys jump across enabled triggers', () => {
    const { service, connection } = build()
    focus(service, 'b')

    connection.snapshot.parts.trigger({ value: 'b' }).onKeyDown?.({ key: 'End' })
    expect(service.context.focusedValue).toBe('c')

    connection.snapshot.parts.trigger({ value: 'c' }).onKeyDown?.({ key: 'Home' })
    expect(service.context.focusedValue).toBe('a')
  })

  it('a disabled accordion leaves the navigation keys their default behavior', () => {
    const { connection } = build({ type: 'single', disabled: true })
    const payload = {
      key: 'Home',
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true
      },
    }
    connection.snapshot.parts.trigger({ value: 'a' }).onKeyDown?.(payload)
    expect(payload.defaultPrevented).toBe(false)
  })

  it('content carries the region wiring', () => {
    const { connection } = build()
    const content = connection.snapshot.parts.content({ value: 'a' })
    expect(content.role).toBe('region')
    expect(content.id).toBe(ids.content('a'))
    expect(content.labelledBy).toBe(ids.trigger('a'))
  })

  it('an item value with whitespace still derives a valid, single-id reference', () => {
    expect(ids.trigger('item one')).not.toMatch(/\s/)
  })

  it('parts expose data-state / data-disabled / data-orientation', () => {
    const { connection } = build({ type: 'single', defaultValue: 'a' })
    const openItem = connection.snapshot.parts.item({ value: 'a' })
    expect(openItem['data-state']).toBe('open')
    expect(openItem['data-orientation']).toBe('vertical')
    expect(openItem['data-disabled']).toBeUndefined()

    const disabledHeader = connection.snapshot.parts.header({ value: 'b', disabled: true })
    expect(disabledHeader['data-state']).toBe('closed')
    expect(disabledHeader['data-disabled']).toBe('')
  })

  it('a disabled trigger is exposed as aria-disabled, per-item or accordion-wide', () => {
    const { connection } = build()
    expect(connection.snapshot.parts.trigger({ value: 'b', disabled: true }).disabled).toBe(true)
    expect(connection.snapshot.parts.trigger({ value: 'a' }).disabled).toBeUndefined()

    const disabledAll = build({ type: 'single', disabled: true })
    expect(disabledAll.connection.snapshot.parts.trigger({ value: 'a' }).disabled).toBe(true)
  })

  it('single non-collapsible: the open trigger announces aria-disabled, per APG', () => {
    const { connection } = build({ type: 'single', defaultValue: 'a' })
    expect(connection.snapshot.parts.trigger({ value: 'a' }).disabled).toBe(true)
    // Presentation only — the item itself is not styled or navigated as disabled.
    expect(connection.snapshot.parts.item({ value: 'a' })['data-disabled']).toBeUndefined()

    const collapsible = build({ type: 'single', collapsible: true, defaultValue: 'a' })
    expect(collapsible.connection.snapshot.parts.trigger({ value: 'a' }).disabled).toBeUndefined()
  })

  it('setValue drives the open set; the machine dedupes unchanged sets', () => {
    const onValueChange = vi.fn()
    const { service, connection } = build({ type: 'multiple', onValueChange })

    connection.snapshot.setValue(['b', 'c'])
    expect(service.context.value).toEqual(['b', 'c'])
    expect(onValueChange).toHaveBeenCalledTimes(1)

    connection.snapshot.setValue(['b', 'c'])
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })
})

describe('accordion connect — reactions', () => {
  it('single: onValueChange reports the item value, and null on collapse', () => {
    const onValueChange = vi.fn()
    const { service } = build({ type: 'single', collapsible: true, onValueChange })
    expect(onValueChange).not.toHaveBeenCalled()

    service.send({ type: 'toggle', value: 'a' })
    expect(onValueChange).toHaveBeenLastCalledWith('a')

    service.send({ type: 'toggle', value: 'a' })
    expect(onValueChange).toHaveBeenLastCalledWith(null)
    expect(onValueChange).toHaveBeenCalledTimes(2)
  })

  it('multiple: onValueChange reports the open array', () => {
    const onValueChange = vi.fn()
    const { service } = build({ type: 'multiple', onValueChange })

    service.send({ type: 'toggle', value: 'a' })
    service.send({ type: 'toggle', value: 'c' })
    expect(onValueChange).toHaveBeenLastCalledWith(['a', 'c'])
  })
})
