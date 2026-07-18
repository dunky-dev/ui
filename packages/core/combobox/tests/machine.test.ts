// The agnostic core of the Combobox — machine + connect, no DOM, no framework.
import { describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { comboboxMachine, comboboxConnect } from '@dunky.dev/combobox'
import type {
  ComboboxApi,
  ComboboxContext,
  ComboboxIds,
  ComboboxItem,
  ComboboxMachineEvent,
  ComboboxOptions,
  ComboboxStateName,
  KeyboardPayload,
  PointerPayload,
} from '@dunky.dev/combobox'

// The per-part ids the connect derives from a base id of `cb`.
const ids: ComboboxIds = { input: 'cb-input', listbox: 'cb-listbox' }
const itemId = (value: string): string => `cb-item-${value}`

// The default suggestion list: `cherry` is the one disabled item.
const fruits: ComboboxItem[] = [
  { value: 'apple', label: 'Apple', disabled: false },
  { value: 'banana', label: 'Banana', disabled: false },
  { value: 'blueberry', label: 'Blueberry', disabled: false },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'date', label: 'Date', disabled: false },
]

interface Harness {
  service: Machine<ComboboxStateName, ComboboxContext, ComboboxMachineEvent>
  connection: Connector<ComboboxStateName, ComboboxContext, ComboboxApi, ComboboxOptions>
}

const build = (options: ComboboxOptions = {}, items: ComboboxItem[] = fruits): Harness => {
  const service = machine(comboboxMachine({ id: 'cb', ...options }))
  const connection = connector(service, comboboxConnect, options)
  service.start()
  for (const item of items) service.send({ type: 'item.register', item })
  return { service, connection }
}

const buildOpen = (options: ComboboxOptions = {}, items: ComboboxItem[] = fruits): Harness => {
  const harness = build(options, items)
  harness.service.send({ type: 'open' })
  return harness
}

const keydown = (key: string): KeyboardPayload => ({
  key,
  defaultPrevented: false,
  preventDefault() {
    this.defaultPrevented = true
  },
})

const pointer = (): PointerPayload => ({
  defaultPrevented: false,
  preventDefault() {
    this.defaultPrevented = true
  },
})

describe('combobox machine — open/close', () => {
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

  it('escape closes without selecting', () => {
    const { service } = buildOpen({ defaultInputValue: 'app' })
    service.send({ type: 'highlight.next' })
    service.send({ type: 'escape' })
    expect(service.state).toBe('closed')
    expect(service.context.value).toBeNull()
    expect(service.context.inputValue).toBe('app') // the typed text survives
  })

  it('interact.outside closes without selecting', () => {
    const { service } = buildOpen()
    service.send({ type: 'interact.outside' })
    expect(service.state).toBe('closed')
    expect(service.context.value).toBeNull()
  })

  it('never opens while disabled, by any intent', () => {
    const { service } = build({ disabled: true })
    service.send({ type: 'open' })
    service.send({ type: 'toggle' })
    service.send({ type: 'input', value: 'a' })
    service.send({ type: 'highlight.next' })
    expect(service.state).toBe('closed')
  })
})

describe('combobox machine — input text', () => {
  it('typing updates the input text and opens the list', () => {
    const { service } = build()
    service.send({ type: 'input', value: 'ba' })
    expect(service.state).toBe('open')
    expect(service.context.inputValue).toBe('ba')
  })

  it('typing while open clears the highlight', () => {
    const { service } = buildOpen()
    service.send({ type: 'highlight.next' })
    expect(service.context.highlightedValue).toBe('apple')

    service.send({ type: 'input', value: 'b' })
    expect(service.context.highlightedValue).toBeNull()
    expect(service.state).toBe('open')
  })

  it('seeds the input text from defaultInputValue', () => {
    const { service } = build({ defaultInputValue: 'ch' })
    expect(service.context.inputValue).toBe('ch')
  })

  it('inputValue.set syncs the controlled text without opening', () => {
    const { service } = build()
    service.send({ type: 'inputValue.set', value: 'external' })
    expect(service.context.inputValue).toBe('external')
    expect(service.state).toBe('closed')
  })
})

describe('combobox machine — highlight', () => {
  it('ArrowDown-open seeds the first enabled item when nothing is selected', () => {
    const { service } = build(undefined, [
      { value: 'cherry', label: 'Cherry', disabled: true },
      ...fruits.slice(0, 2),
    ])
    service.send({ type: 'highlight.next' })
    expect(service.state).toBe('open')
    expect(service.context.highlightedValue).toBe('apple') // leading disabled skipped
  })

  it('ArrowDown-open seeds the selected item when it is rendered and enabled', () => {
    const { service } = build({ defaultValue: 'banana' })
    service.send({ type: 'highlight.next' })
    expect(service.context.highlightedValue).toBe('banana')
  })

  it('ArrowDown-open falls back to the first enabled item when the selection is unavailable', () => {
    const disabledSelection = build({ defaultValue: 'cherry' }) // cherry is disabled
    disabledSelection.service.send({ type: 'highlight.next' })
    expect(disabledSelection.service.context.highlightedValue).toBe('apple')

    const filteredOutSelection = build({ defaultValue: 'mango' }) // never registered
    filteredOutSelection.service.send({ type: 'highlight.next' })
    expect(filteredOutSelection.service.context.highlightedValue).toBe('apple')
  })

  it('ArrowUp-open seeds the last enabled item when nothing is selected', () => {
    const { service } = build()
    service.send({ type: 'highlight.prev' })
    expect(service.state).toBe('open')
    expect(service.context.highlightedValue).toBe('date')
  })

  it('steps across enabled items, skipping disabled ones', () => {
    const { service } = buildOpen()
    service.send({ type: 'highlight.next' })
    service.send({ type: 'highlight.next' })
    service.send({ type: 'highlight.next' })
    expect(service.context.highlightedValue).toBe('blueberry')
    service.send({ type: 'highlight.next' })
    expect(service.context.highlightedValue).toBe('date') // cherry (disabled) skipped

    service.send({ type: 'highlight.prev' })
    expect(service.context.highlightedValue).toBe('blueberry')
  })

  it('stops at the ends without loop', () => {
    const { service } = buildOpen()
    service.send({ type: 'highlight.prev' }) // no highlight: starts from the last
    expect(service.context.highlightedValue).toBe('date')
    service.send({ type: 'highlight.next' })
    expect(service.context.highlightedValue).toBe('date')
  })

  it('wraps around the ends with loop', () => {
    const { service } = buildOpen({ loop: true })
    service.send({ type: 'highlight.prev' })
    expect(service.context.highlightedValue).toBe('date')
    service.send({ type: 'highlight.next' })
    expect(service.context.highlightedValue).toBe('apple')
  })

  it('highlight.set moves to an enabled item and ignores a disabled one', () => {
    const { service } = buildOpen()
    service.send({ type: 'highlight.set', value: 'banana' })
    expect(service.context.highlightedValue).toBe('banana')

    service.send({ type: 'highlight.set', value: 'cherry' })
    expect(service.context.highlightedValue).toBe('banana')
  })

  it('clears the highlight when the highlighted item unregisters', () => {
    const { service } = buildOpen()
    service.send({ type: 'highlight.set', value: 'banana' })
    service.send({ type: 'item.unregister', value: 'banana' })
    expect(service.context.highlightedValue).toBeNull()
  })

  it('clears the highlight when the highlighted item re-registers disabled', () => {
    const { service } = buildOpen()
    service.send({ type: 'highlight.set', value: 'banana' })
    service.send({
      type: 'item.register',
      item: { value: 'banana', label: 'Banana', disabled: true },
    })
    expect(service.context.highlightedValue).toBeNull()
  })

  it('clears the highlight on close', () => {
    const { service } = buildOpen()
    service.send({ type: 'highlight.next' })
    service.send({ type: 'close' })
    expect(service.context.highlightedValue).toBeNull()
  })
})

describe('combobox machine — selection', () => {
  it('select commits the highlighted item: value, label as input text, closed', () => {
    const { service } = buildOpen()
    service.send({ type: 'highlight.next' })
    service.send({ type: 'select' })
    expect(service.state).toBe('closed')
    expect(service.context.value).toBe('apple')
    expect(service.context.inputValue).toBe('Apple')
    expect(service.context.highlightedValue).toBeNull()
  })

  it('select with an explicit value commits that item (item press)', () => {
    const { service } = buildOpen()
    service.send({ type: 'select', value: 'banana' })
    expect(service.state).toBe('closed')
    expect(service.context.value).toBe('banana')
    expect(service.context.inputValue).toBe('Banana')
  })

  it('select with nothing highlighted closes without committing', () => {
    const { service } = buildOpen({ defaultInputValue: 'free text' })
    service.send({ type: 'select' })
    expect(service.state).toBe('closed')
    expect(service.context.value).toBeNull()
    expect(service.context.inputValue).toBe('free text')
  })

  it('select targeting a disabled item does nothing', () => {
    const { service } = buildOpen()
    service.send({ type: 'select', value: 'cherry' })
    expect(service.state).toBe('open')
    expect(service.context.value).toBeNull()
  })

  it('value.set syncs the controlled value without touching the input text', () => {
    const { service } = build({ defaultInputValue: 'typed' })
    service.send({ type: 'value.set', value: 'banana' })
    expect(service.context.value).toBe('banana')
    expect(service.context.inputValue).toBe('typed')

    service.send({ type: 'value.set', value: null })
    expect(service.context.value).toBeNull()
  })
})

describe('combobox machine — item registration', () => {
  it('registers items in send order and unregisters by value', () => {
    const { service } = build(undefined, fruits.slice(0, 2))
    expect(service.context.items.map(item => item.value)).toEqual(['apple', 'banana'])

    service.send({ type: 'item.unregister', value: 'apple' })
    expect(service.context.items.map(item => item.value)).toEqual(['banana'])
  })

  it('inserts a registration at its rendered position (remount after filtering)', () => {
    const { service } = build(undefined, fruits.slice(0, 3))
    service.send({ type: 'item.unregister', value: 'banana' })

    // banana remounts between apple and blueberry — the substrate reports
    // index 1, its position among the rendered options.
    service.send({ type: 'item.register', item: fruits[1], index: 1 })
    expect(service.context.items.map(item => item.value)).toEqual(['apple', 'banana', 'blueberry'])
  })

  it('re-registering updates in place, keeping the item position', () => {
    const { service } = build(undefined, fruits.slice(0, 3))
    service.send({
      type: 'item.register',
      item: { value: 'banana', label: 'Ripe banana', disabled: true },
      index: 1, // its rendered position didn't change — only its data
    })
    expect(service.context.items.map(item => item.value)).toEqual(['apple', 'banana', 'blueberry'])
    expect(service.context.items[1]).toEqual({
      value: 'banana',
      label: 'Ripe banana',
      disabled: true,
    })
  })

  it('re-registering at a new reported position moves the item (in-place reorder)', () => {
    const { service } = build(undefined, fruits.slice(0, 3))

    // The consumer re-sorted the rendered list without unmounting anything:
    // blueberry now renders first, and its registration reports that.
    service.send({ type: 'item.register', item: fruits[2], index: 0 })
    expect(service.context.items.map(item => item.value)).toEqual(['blueberry', 'apple', 'banana'])
  })
})

describe('combobox connect — logical bindings', () => {
  it('input carries the combobox role and list-autocomplete wiring', () => {
    const { service, connection } = build()
    const input = connection.snapshot.parts.input
    expect(input.id).toBe(ids.input)
    expect(input.role).toBe('combobox')
    expect(input.autoComplete).toBe('list')
    expect(input.expanded).toBe(false)
    expect(input.controls).toBe(ids.listbox)
    expect(input['data-state']).toBe('closed')

    service.send({ type: 'open' })
    expect(connection.snapshot.parts.input.expanded).toBe(true)
  })

  it('typing through the input binding drives the machine', () => {
    const { service, connection } = build()
    connection.snapshot.parts.input.onValueChange?.({ value: 'ba' })
    expect(service.state).toBe('open')
    expect(service.context.inputValue).toBe('ba')
  })

  it('activeDescendant names the highlighted option, only while one exists', () => {
    const { service, connection } = buildOpen()
    expect(connection.snapshot.parts.input.activeDescendant).toBeUndefined()

    service.send({ type: 'highlight.set', value: 'banana' })
    expect(connection.snapshot.parts.input.activeDescendant).toBe(itemId('banana'))

    service.send({ type: 'close' })
    expect(connection.snapshot.parts.input.activeDescendant).toBeUndefined()
  })

  it('arrow keys on the input drive the highlight and cancel the default', () => {
    const { service, connection } = build()
    const down = keydown('ArrowDown')
    connection.snapshot.parts.input.onKeyDown?.(down)
    expect(down.defaultPrevented).toBe(true)
    expect(service.state).toBe('open')
    expect(service.context.highlightedValue).toBe('apple')

    const up = keydown('ArrowUp')
    connection.snapshot.parts.input.onKeyDown?.(up)
    expect(service.context.highlightedValue).toBe('apple') // start stays put
  })

  it('Enter selects only while open; closed Enter keeps its native default', () => {
    const { service, connection } = buildOpen()
    service.send({ type: 'highlight.set', value: 'banana' })
    const enter = keydown('Enter')
    connection.snapshot.parts.input.onKeyDown?.(enter)
    expect(enter.defaultPrevented).toBe(true) // no form submit mid-interaction
    expect(service.context.value).toBe('banana')

    const closedEnter = keydown('Enter')
    connection.snapshot.parts.input.onKeyDown?.(closedEnter)
    expect(closedEnter.defaultPrevented).toBe(false)
  })

  it('Home/End keep their native caret behavior', () => {
    const { service, connection } = buildOpen()
    const home = keydown('Home')
    connection.snapshot.parts.input.onKeyDown?.(home)
    expect(home.defaultPrevented).toBe(false)
    expect(service.context.highlightedValue).toBeNull()
  })

  it('trigger carries the popup relationship, out of the tab order, and toggles', () => {
    const { service, connection } = build()
    const trigger = connection.snapshot.parts.trigger
    expect(trigger.hasPopup).toBe('listbox')
    expect(trigger.expanded).toBe(false)
    expect(trigger.controls).toBe(ids.listbox)
    expect(trigger.focusable).toBe(false) // tabIndex -1: the input is the tab stop

    trigger.onPress?.()
    expect(service.state).toBe('open')
    connection.snapshot.parts.trigger.onPress?.()
    expect(service.state).toBe('closed')
  })

  it('listbox is a hidden listbox while closed', () => {
    const { service, connection } = build()
    const listbox = connection.snapshot.parts.listbox
    expect(listbox.id).toBe(ids.listbox)
    expect(listbox.role).toBe('listbox')
    expect(listbox.hidden).toBe(true)
    expect(listbox['data-state']).toBe('closed')

    service.send({ type: 'open' })
    expect(connection.snapshot.parts.listbox.hidden).toBeUndefined()
    expect(connection.snapshot.parts.listbox['data-state']).toBe('open')
  })

  it('item carries identity, selection, and the styling hooks', () => {
    const { service, connection } = buildOpen({ defaultValue: 'banana' })
    service.send({ type: 'highlight.set', value: 'banana' })

    const banana = connection.snapshot.parts.item({ value: 'banana' })
    expect(banana.id).toBe(itemId('banana'))
    expect(banana.role).toBe('option')
    expect(banana.selected).toBe(true)
    expect(banana['data-state']).toBe('selected')
    expect(banana['data-highlighted']).toBe('')

    const cherry = connection.snapshot.parts.item({ value: 'cherry', disabled: true })
    expect(cherry.selected).toBe(false)
    expect(cherry['data-state']).toBe('unselected')
    expect(cherry.disabled).toBe(true)
    expect(cherry['data-disabled']).toBe('')
    expect(cherry['data-highlighted']).toBeUndefined()
  })

  it('item press selects; pointer move highlights; pointer down keeps input focus', () => {
    const { service, connection } = buildOpen()
    const item = connection.snapshot.parts.item({ value: 'banana' })

    item.onPointerMove?.()
    expect(service.context.highlightedValue).toBe('banana')

    const press = pointer()
    item.onPointerDown?.(press)
    expect(press.defaultPrevented).toBe(true) // the press must not steal DOM focus

    item.onPress?.()
    expect(service.context.value).toBe('banana')
    expect(service.state).toBe('closed')
  })

  it('presses on the listbox surface and the trigger cancel the focus-stealing default', () => {
    const { connection } = buildOpen()

    const surfacePress = pointer()
    connection.snapshot.parts.listbox.onPointerDown?.(surfacePress)
    expect(surfacePress.defaultPrevented).toBe(true)

    const triggerPress = pointer()
    connection.snapshot.parts.trigger.onPointerDown?.(triggerPress)
    expect(triggerPress.defaultPrevented).toBe(true)
  })

  it('itemIndicator is decoration, hidden from assistive tech', () => {
    const { connection } = build()
    expect(connection.snapshot.parts.itemIndicator.hidden).toBe(true)
  })

  it('setOpen drives both directions; onInteractOutside honors the veto', () => {
    const onInteractOutside = vi.fn((event?: PointerPayload) => event?.preventDefault?.())
    const { service, connection } = build({ onInteractOutside })

    connection.snapshot.setOpen(true)
    expect(service.state).toBe('open')

    connection.snapshot.onInteractOutside(pointer())
    expect(onInteractOutside).toHaveBeenCalledTimes(1)
    expect(service.state).toBe('open') // vetoed

    connection.snapshot.setOpen(false)
    expect(service.state).toBe('closed')
  })
})

describe('combobox connect — reactions', () => {
  it('reports every change through its callback, none on subscribe', () => {
    const onInputValueChange = vi.fn()
    const onHighlightChange = vi.fn()
    const { service } = build({ onInputValueChange, onHighlightChange })
    expect(onInputValueChange).not.toHaveBeenCalled()
    expect(onHighlightChange).not.toHaveBeenCalled()

    service.send({ type: 'input', value: 'b' })
    expect(onInputValueChange).toHaveBeenLastCalledWith('b')

    service.send({ type: 'highlight.next' })
    expect(onHighlightChange).toHaveBeenLastCalledWith('apple')
  })

  it('one selection fires value, input text, highlight, open — in that order', () => {
    const order: string[] = []
    const { service } = buildOpen({
      onValueChange: () => order.push('value'),
      onInputValueChange: () => order.push('input'),
      onHighlightChange: value => order.push(`highlight:${value}`),
      onOpenChange: open => order.push(`open:${open}`),
    })
    service.send({ type: 'highlight.set', value: 'banana' })
    order.length = 0

    service.send({ type: 'select' })
    expect(order).toEqual(['value', 'input', 'highlight:null', 'open:false'])
  })
})
