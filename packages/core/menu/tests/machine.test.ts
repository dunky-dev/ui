// The agnostic core of the Menu — machine + connect, no DOM, no framework.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { menuMachine, menuConnect } from '@dunky.dev/menu'
import type {
  KeyboardPayload,
  MenuApi,
  MenuContext,
  MenuIds,
  MenuMachineEvent,
  MenuOptions,
  MenuStateName,
  PointerPayload,
} from '@dunky.dev/menu'

// The per-part ids the connect derives from a base id of `menu`.
const ids: MenuIds = { trigger: 'menu-trigger', content: 'menu-content' }
const itemId = (value: string): string => `menu-item-${value}`

interface Harness {
  service: Machine<MenuStateName, MenuContext, MenuMachineEvent>
  connection: Connector<MenuStateName, MenuContext, MenuApi, MenuOptions>
}

const build = (options: MenuOptions = {}): Harness => {
  const service = machine(menuMachine({ id: 'menu', ...options }))
  const connection = connector(service, menuConnect, options)
  service.start()
  return { service, connection }
}

const registerItems = (
  service: Harness['service'],
  items: Array<{ value: string; label?: string; disabled?: boolean }>,
): void => {
  for (const item of items) {
    service.send({
      type: 'item.register',
      item: {
        value: item.value,
        label: item.label ?? item.value,
        disabled: item.disabled ?? false,
      },
    })
  }
}

// A registered anatomy shared by most navigation tests: b is disabled.
const openWithItems = (options: MenuOptions = {}): Harness => {
  const harness = build({ defaultOpen: true, ...options })
  registerItems(harness.service, [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta', disabled: true },
    { value: 'c', label: 'Caramel' },
    { value: 'd', label: 'Cocoa' },
  ])
  return harness
}

const keyboardPayload = (key: string): KeyboardPayload => ({
  key,
  defaultPrevented: false,
  preventDefault() {
    this.defaultPrevented = true
  },
})

describe('menu machine — open/close', () => {
  it('starts closed by default', () => {
    const { service } = build()
    expect(service.state).toBe('closed')
  })

  it('starts open when defaultOpen', () => {
    const { service } = build({ defaultOpen: true })
    expect(service.state).toBe('open')
  })

  it('starts open when controlled open=true', () => {
    const { service } = build({ open: true })
    expect(service.state).toBe('open')
  })

  it('toggle flips closed -> open -> closed', () => {
    const { service } = build()
    service.send({ type: 'toggle' })
    expect(service.state).toBe('open')
    service.send({ type: 'toggle' })
    expect(service.state).toBe('closed')
  })

  it('escape, tab, and outside interaction each close', () => {
    for (const type of ['escape', 'tab', 'interact.outside'] as const) {
      const { service } = build({ defaultOpen: true })
      service.send({ type })
      expect(service.state).toBe('closed')
    }
  })
})

describe('menu machine — controlled', () => {
  it('reports dismissal intents without moving the machine', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ open: true, onOpenChange })
    service.send({ type: 'escape' })
    expect(service.state).toBe('open')
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('moves only on controlled.sync, and the prop echo is not reported back', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ open: true, onOpenChange })
    service.send({ type: 'controlled.sync', open: false })
    expect(service.state).toBe('closed')
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('holds a keyboard aim through the veto window until the prop opens', () => {
    const { service } = build({ open: false })
    service.send({ type: 'open', highlight: 'first' })
    expect(service.state).toBe('closed')

    service.send({ type: 'controlled.sync', open: true })
    registerItems(service, [{ value: 'a' }])
    expect(service.context.highlightedValue).toBe('a')
  })
})

describe('menu machine — item registry', () => {
  it('registers and unregisters items in order', () => {
    const { service } = build({ defaultOpen: true })
    registerItems(service, [{ value: 'a' }, { value: 'b' }])
    expect(service.context.items.map(item => item.value)).toEqual(['a', 'b'])

    service.send({ type: 'item.unregister', value: 'a' })
    expect(service.context.items.map(item => item.value)).toEqual(['b'])
  })

  it('re-registering a value updates the item in place, keeping its order', () => {
    const { service } = build({ defaultOpen: true })
    registerItems(service, [{ value: 'a' }, { value: 'b' }])
    service.send({ type: 'item.register', item: { value: 'a', label: 'Alpha', disabled: true } })
    expect(service.context.items.map(item => item.value)).toEqual(['a', 'b'])
    expect(service.context.items[0]).toMatchObject({ label: 'Alpha', disabled: true })
  })

  it('clears the highlight when the highlighted item unregisters', () => {
    const { service } = openWithItems()
    service.send({ type: 'highlight.set', value: 'a' })
    service.send({ type: 'item.unregister', value: 'a' })
    expect(service.context.highlightedValue).toBeNull()
  })

  it('clears the highlight when the highlighted item re-registers disabled', () => {
    const { service } = openWithItems()
    service.send({ type: 'highlight.set', value: 'a' })
    service.send({ type: 'item.register', item: { value: 'a', label: 'Alpha', disabled: true } })
    expect(service.context.highlightedValue).toBeNull()
  })

  it('drops the highlight when a pending aim has no enabled target left', () => {
    const { service } = build()
    service.send({ type: 'open', highlight: 'first' })
    registerItems(service, [{ value: 'a' }])
    expect(service.context.highlightedValue).toBe('a')

    service.send({ type: 'item.unregister', value: 'a' })
    expect(service.context.highlightedValue).toBeNull()
  })
})

describe('menu machine — highlight', () => {
  it('highlights an enabled item and ignores a disabled one', () => {
    const { service } = openWithItems()
    service.send({ type: 'highlight.set', value: 'a' })
    expect(service.context.highlightedValue).toBe('a')

    service.send({ type: 'highlight.set', value: 'b' })
    expect(service.context.highlightedValue).toBe('a')
  })

  it('clears on highlight.set null (pointer leave)', () => {
    const { service } = openWithItems()
    service.send({ type: 'highlight.set', value: 'a' })
    service.send({ type: 'highlight.set', value: null })
    expect(service.context.highlightedValue).toBeNull()
  })

  it('moves next/previous over enabled items, skipping disabled, wrapping at the ends', () => {
    const { service } = openWithItems()
    service.send({ type: 'highlight.move', to: 'next' }) // none -> first enabled
    expect(service.context.highlightedValue).toBe('a')
    service.send({ type: 'highlight.move', to: 'next' }) // skips disabled b
    expect(service.context.highlightedValue).toBe('c')
    service.send({ type: 'highlight.move', to: 'next' })
    expect(service.context.highlightedValue).toBe('d')
    service.send({ type: 'highlight.move', to: 'next' }) // wraps
    expect(service.context.highlightedValue).toBe('a')
    service.send({ type: 'highlight.move', to: 'previous' }) // wraps back
    expect(service.context.highlightedValue).toBe('d')
  })

  it('jumps to first/last enabled item', () => {
    const { service } = openWithItems()
    service.send({ type: 'highlight.move', to: 'last' })
    expect(service.context.highlightedValue).toBe('d')
    service.send({ type: 'highlight.move', to: 'first' })
    expect(service.context.highlightedValue).toBe('a')
  })

  it('moves are a no-op when no item is enabled', () => {
    const { service } = build({ defaultOpen: true })
    registerItems(service, [{ value: 'a', disabled: true }])
    service.send({ type: 'highlight.move', to: 'next' })
    expect(service.context.highlightedValue).toBeNull()
  })

  it('clears the highlight on every close so the next open starts fresh', () => {
    const { service } = openWithItems()
    service.send({ type: 'highlight.set', value: 'a' })
    service.send({ type: 'escape' })
    expect(service.context.highlightedValue).toBeNull()
  })
})

describe('menu machine — pending highlight (keyboard open)', () => {
  it('resolves "first" to the first enabled item as items register', () => {
    const { service } = build()
    service.send({ type: 'open', highlight: 'first' })
    expect(service.state).toBe('open')
    expect(service.context.highlightedValue).toBeNull() // nothing registered yet

    registerItems(service, [{ value: 'a', disabled: true }, { value: 'b' }, { value: 'c' }])
    expect(service.context.highlightedValue).toBe('b')
  })

  it('resolves "last" against every registration, ending at the last enabled item', () => {
    const { service } = build()
    service.send({ type: 'open', highlight: 'last' })
    registerItems(service, [{ value: 'a' }, { value: 'b' }, { value: 'c', disabled: true }])
    expect(service.context.highlightedValue).toBe('b')
  })

  it('an explicit highlight move cancels the pending aim', () => {
    const { service } = build()
    service.send({ type: 'open', highlight: 'last' })
    registerItems(service, [{ value: 'a' }])
    service.send({ type: 'highlight.set', value: 'a' })

    registerItems(service, [{ value: 'b' }]) // would re-resolve "last" if still pending
    expect(service.context.highlightedValue).toBe('a')
  })

  it('a pointer open aims nothing', () => {
    const { service } = build()
    service.send({ type: 'toggle' })
    registerItems(service, [{ value: 'a' }])
    expect(service.context.highlightedValue).toBeNull()
  })
})

describe('menu machine — typeahead', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('jumps to the next enabled item whose label starts with the query', () => {
    const { service } = openWithItems()
    service.send({ type: 'typeahead', key: 'c' })
    expect(service.context.highlightedValue).toBe('c')
  })

  it('accumulates characters into one query', () => {
    const { service } = openWithItems()
    service.send({ type: 'typeahead', key: 'c' })
    service.send({ type: 'typeahead', key: 'o' })
    expect(service.context.highlightedValue).toBe('d') // "co" -> Cocoa
  })

  it('repeating the same character cycles through items starting with it', () => {
    const { service } = openWithItems()
    service.send({ type: 'typeahead', key: 'c' })
    expect(service.context.highlightedValue).toBe('c')
    service.send({ type: 'typeahead', key: 'c' })
    expect(service.context.highlightedValue).toBe('d')
    service.send({ type: 'typeahead', key: 'c' })
    expect(service.context.highlightedValue).toBe('c') // wraps
  })

  it('resets the query after a pause', () => {
    const { service } = openWithItems()
    service.send({ type: 'typeahead', key: 'a' })
    expect(service.context.highlightedValue).toBe('a')

    vi.advanceTimersByTime(1100)
    service.send({ type: 'typeahead', key: 'c' }) // fresh query, not "ac"
    expect(service.context.highlightedValue).toBe('c')
  })

  it('matches case-insensitively and skips disabled items', () => {
    const { service } = openWithItems()
    service.send({ type: 'typeahead', key: 'B' }) // Beta is disabled
    expect(service.context.highlightedValue).toBeNull()
  })

  it('keeps the highlight when nothing matches', () => {
    const { service } = openWithItems()
    service.send({ type: 'highlight.set', value: 'a' })
    service.send({ type: 'typeahead', key: 'z' })
    expect(service.context.highlightedValue).toBe('a')
  })
})

describe('menu machine — activation', () => {
  it('records the selection and closes on an enabled item', () => {
    const { service } = openWithItems()
    service.send({ type: 'item.activate', value: 'a' })
    expect(service.context.selection).toEqual({ value: 'a' })
    expect(service.state).toBe('closed')
  })

  it('activates the highlighted item when no value is given', () => {
    const { service } = openWithItems()
    service.send({ type: 'highlight.set', value: 'c' })
    service.send({ type: 'item.activate' })
    expect(service.context.selection).toEqual({ value: 'c' })
    expect(service.state).toBe('closed')
  })

  it('ignores a disabled item and an empty highlight', () => {
    const { service } = openWithItems()
    service.send({ type: 'item.activate', value: 'b' })
    expect(service.state).toBe('open')

    service.send({ type: 'item.activate' }) // nothing highlighted
    expect(service.state).toBe('open')
    expect(service.context.selection).toBeNull()
  })

  it('mints a fresh selection token per activation, even for the same value', () => {
    const { service } = openWithItems()
    service.send({ type: 'item.activate', value: 'a' })
    const first = service.context.selection

    service.send({ type: 'open' })
    service.send({ type: 'item.activate', value: 'a' })
    expect(service.context.selection).toEqual(first)
    expect(service.context.selection).not.toBe(first)
  })
})

describe('menu connect — logical bindings', () => {
  it('trigger carries the popup relationship and toggles', () => {
    const { service, connection } = build()
    const trigger = connection.snapshot.parts.trigger
    expect(trigger.id).toBe(ids.trigger)
    expect(trigger.hasPopup).toBe('menu')
    expect(trigger.expanded).toBe(false)
    expect(trigger.controls).toBeUndefined() // nothing to control while closed

    trigger.onPress?.()
    expect(service.state).toBe('open')

    const openTrigger = connection.snapshot.parts.trigger
    expect(openTrigger.expanded).toBe(true)
    expect(openTrigger.controls).toBe(ids.content)

    openTrigger.onPress?.()
    expect(service.state).toBe('closed')
  })

  it('trigger keyboard opens aim the highlight and suppress the default action', () => {
    const aims: Array<[string, 'first' | 'last']> = [
      ['Enter', 'first'],
      [' ', 'first'],
      ['ArrowDown', 'first'],
      ['ArrowUp', 'last'],
    ]
    for (const [key, aim] of aims) {
      const { service, connection } = build()
      const payload = keyboardPayload(key)
      connection.snapshot.parts.trigger.onKeyDown?.(payload)
      expect(service.state).toBe('open')
      expect(service.context.pendingHighlight).toBe(aim)
      expect(payload.defaultPrevented).toBe(true)
    }
  })

  it('trigger Enter while open toggles closed instead of being swallowed', () => {
    const { service, connection } = build({ defaultOpen: true })
    const payload = keyboardPayload('Enter')
    connection.snapshot.parts.trigger.onKeyDown?.(payload)
    expect(service.state).toBe('closed')
    expect(payload.defaultPrevented).toBe(true)
  })

  it('content carries the menu role, identity, and focus surface', () => {
    const { service, connection } = build({ defaultOpen: true })
    service.send({ type: 'part.presence', part: 'trigger', present: true })
    const content = connection.snapshot.parts.content
    expect(content.role).toBe('menu')
    expect(content.id).toBe(ids.content)
    expect(content.labelledBy).toBe(ids.trigger)
    expect(content.orientation).toBe('vertical')
    expect(content.focusable).toBe(false) // the focus surface: tabIndex -1
  })

  it('content omits labelledBy while no trigger is rendered', () => {
    const { connection } = build({ defaultOpen: true })
    expect(connection.snapshot.parts.content.labelledBy).toBeUndefined()
  })

  it('content exposes the highlighted item through activeDescendant', () => {
    const { service, connection } = openWithItems()
    expect(connection.snapshot.parts.content.activeDescendant).toBeUndefined()

    service.send({ type: 'highlight.set', value: 'a' })
    expect(connection.snapshot.parts.content.activeDescendant).toBe(itemId('a'))
  })

  it('content keydown drives navigation, typeahead, and activation', () => {
    const { service, connection } = openWithItems()
    const content = connection.snapshot.parts.content

    content.onKeyDown?.(keyboardPayload('ArrowDown'))
    expect(service.context.highlightedValue).toBe('a')
    content.onKeyDown?.(keyboardPayload('End'))
    expect(service.context.highlightedValue).toBe('d')
    content.onKeyDown?.(keyboardPayload('Home'))
    expect(service.context.highlightedValue).toBe('a')
    content.onKeyDown?.(keyboardPayload('ArrowUp'))
    expect(service.context.highlightedValue).toBe('d')

    content.onKeyDown?.(keyboardPayload('c'))
    expect(service.context.highlightedValue).toBe('c')

    content.onKeyDown?.(keyboardPayload('Enter'))
    expect(service.context.selection).toEqual({ value: 'c' })
    expect(service.state).toBe('closed')
  })

  it('content keydown Tab closes without suppressing the default focus move', () => {
    const { service, connection } = openWithItems()
    const payload = keyboardPayload('Tab')
    connection.snapshot.parts.content.onKeyDown?.(payload)
    expect(service.state).toBe('closed')
    expect(payload.defaultPrevented).toBe(false)
  })

  it('item bindings carry role, identity, and the styling hooks', () => {
    const { service, connection } = openWithItems()
    service.send({ type: 'highlight.set', value: 'a' })

    const highlighted = connection.snapshot.getItemBindings({ value: 'a' })
    expect(highlighted.role).toBe('menuitem')
    expect(highlighted.id).toBe(itemId('a'))
    expect(highlighted['data-highlighted']).toBe('')
    expect(highlighted.disabled).toBeUndefined()

    const disabled = connection.snapshot.getItemBindings({ value: 'b', disabled: true })
    expect(disabled.disabled).toBe(true)
    expect(disabled['data-disabled']).toBe('')
    expect(disabled['data-highlighted']).toBeUndefined()
  })

  it('item press activates; pointer enter/leave move the highlight', () => {
    const { service, connection } = openWithItems()
    const item = connection.snapshot.getItemBindings({ value: 'a' })

    item.onPointerEnter?.()
    expect(service.context.highlightedValue).toBe('a')
    item.onPointerLeave?.()
    expect(service.context.highlightedValue).toBeNull()

    item.onPress?.()
    expect(service.context.selection).toEqual({ value: 'a' })
    expect(service.state).toBe('closed')
  })

  it('group is labelled by its label only while the label is rendered', () => {
    const { service, connection } = build({ defaultOpen: true })
    expect(connection.snapshot.getGroupBindings({ id: 'g1' }).role).toBe('group')
    expect(connection.snapshot.getGroupBindings({ id: 'g1' }).labelledBy).toBeUndefined()

    service.send({ type: 'group.label.presence', group: 'g1', present: true })
    expect(connection.snapshot.getGroupBindings({ id: 'g1' }).labelledBy).toBe('g1-label')
    expect(connection.snapshot.getGroupLabelBindings({ id: 'g1' }).id).toBe('g1-label')

    service.send({ type: 'group.label.presence', group: 'g1', present: false })
    expect(connection.snapshot.getGroupBindings({ id: 'g1' }).labelledBy).toBeUndefined()
  })

  it('separator carries the separator role', () => {
    const { connection } = build()
    expect(connection.snapshot.parts.separator.role).toBe('separator')
    expect(connection.snapshot.parts.separator.orientation).toBe('horizontal')
  })

  it('parts expose data-state; setOpen drives both directions', () => {
    const { connection } = build({ defaultOpen: true })
    expect(connection.snapshot.parts.trigger['data-state']).toBe('open')
    expect(connection.snapshot.parts.content['data-state']).toBe('open')

    connection.snapshot.setOpen(false)
    expect(connection.snapshot.parts.trigger['data-state']).toBe('closed')
    connection.snapshot.setOpen(true)
    expect(connection.snapshot.open).toBe(true)
  })

  it('interactOutside honors the consumer veto', () => {
    const onInteractOutside = vi.fn((event?: PointerPayload) => event?.preventDefault?.())
    const { service, connection } = build({ defaultOpen: true, onInteractOutside })

    const payload: PointerPayload = {
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true
      },
    }
    connection.snapshot.interactOutside(payload)
    expect(onInteractOutside).toHaveBeenCalledTimes(1)
    expect(service.state).toBe('open') // vetoed

    connection.snapshot.interactOutside()
    expect(service.state).toBe('closed')
  })
})

describe('menu connect — reactions', () => {
  it('fires onOpenChange on every flip, not on subscribe', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ onOpenChange })
    expect(onOpenChange).not.toHaveBeenCalled()

    service.send({ type: 'toggle' })
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    service.send({ type: 'escape' })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })

  it('the selection is observable before the close, per the mailbox contract', () => {
    const order: string[] = []
    const { service } = openWithItems({ onOpenChange: open => order.push(`open:${open}`) })
    service
      .select(() => service.context.selection)
      .subscribe(selection => {
        if (selection !== null) order.push(`select:${selection.value}`)
      })

    service.send({ type: 'item.activate', value: 'a' })
    expect(order).toEqual(['select:a', 'open:false'])
  })
})
