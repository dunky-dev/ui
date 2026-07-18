// The agnostic core of the Select — machine + connect, no DOM, no framework.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { connector, machine, type Connector, type Machine } from '@dunky.dev/state-machine'
import { selectMachine, selectConnect, selectIds } from '@dunky.dev/select'
import type {
  KeyboardPayload,
  SelectApi,
  SelectContext,
  SelectItem,
  SelectMachineEvent,
  SelectOptions,
  SelectStateName,
} from '@dunky.dev/select'

// The per-part ids the connect derives from a base id of `sel`.
const ids = selectIds('sel')
const optionId = (value: string): string => `sel-option-${value}`

// The default option list: `cherry` is the one disabled option.
const fruits: SelectItem[] = [
  { value: 'apple', label: 'Apple', disabled: false },
  { value: 'banana', label: 'Banana', disabled: false },
  { value: 'blueberry', label: 'Blueberry', disabled: false },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'date', label: 'Date', disabled: false },
]

interface Harness {
  service: Machine<SelectStateName, SelectContext, SelectMachineEvent>
  connection: Connector<SelectStateName, SelectContext, SelectApi, SelectOptions>
}

const build = (options: SelectOptions = {}, items: SelectItem[] = fruits): Harness => {
  const service = machine(selectMachine({ id: 'sel', ...options }))
  const connection = connector(service, selectConnect, options)
  service.start()
  for (const item of items) service.send({ type: 'item.register', item })
  return { service, connection }
}

const buildOpen = (options: SelectOptions = {}, items: SelectItem[] = fruits): Harness => {
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

afterEach(() => {
  vi.useRealTimers()
})

describe('select machine — open/close', () => {
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

  it('a disabled select never opens', () => {
    const { service } = build({ disabled: true })
    service.send({ type: 'toggle' })
    expect(service.state).toBe('closed')
    service.send({ type: 'open' })
    expect(service.state).toBe('closed')
  })

  it('close leaves the value untouched and clears the highlight', () => {
    const { service } = buildOpen()
    service.send({ type: 'highlight.next' })
    service.send({ type: 'close' })
    expect(service.state).toBe('closed')
    expect(service.context.value).toBeNull()
    expect(service.context.highlightedValue).toBeNull()
  })
})

describe('select machine — highlight on open', () => {
  it('opening highlights the first enabled option when nothing is selected', () => {
    const { service } = buildOpen()
    expect(service.context.highlightedValue).toBe('apple')
  })

  it('opening highlights the selected option', () => {
    const { service } = buildOpen({ defaultValue: 'banana' })
    expect(service.context.highlightedValue).toBe('banana')
  })

  it('opening falls back to the first enabled option when the selection is disabled', () => {
    const { service } = buildOpen({ defaultValue: 'cherry' })
    expect(service.context.highlightedValue).toBe('apple')
  })

  it('skips a disabled option at the head of the list', () => {
    const gated: SelectItem[] = [
      { value: 'locked', label: 'Locked', disabled: true },
      { value: 'first', label: 'First', disabled: false },
    ]
    const { service } = buildOpen({}, gated)
    expect(service.context.highlightedValue).toBe('first')
  })

  it('options registering while open still land the highlight on the selection', () => {
    // defaultOpen: the machine is open before any option registers.
    const { service } = build({ defaultOpen: true, defaultValue: 'banana' })
    expect(service.context.highlightedValue).toBe('banana')
  })

  it('clears the highlight when the highlighted option unregisters', () => {
    const { service } = buildOpen()
    service.send({ type: 'item.unregister', value: 'apple' })
    expect(service.context.highlightedValue).toBeNull()
  })

  it('the selected option re-registering in place leaves the highlight alone', () => {
    const { service } = buildOpen({ defaultValue: 'banana' })
    service.send({ type: 'highlight.next' }) // the user moved on to blueberry
    service.send({
      type: 'item.register',
      item: { value: 'banana', label: 'Ripe banana', disabled: false },
    })
    expect(service.context.highlightedValue).toBe('blueberry')
  })

  it('disabling the highlighted option in place forfeits the highlight and the commit', () => {
    const { service } = buildOpen() // highlight: apple
    service.send({
      type: 'item.register',
      item: { value: 'apple', label: 'Apple', disabled: true },
    })
    expect(service.context.highlightedValue).toBeNull()
    service.send({ type: 'select' })
    expect(service.context.value).toBeNull()
  })
})

describe('select machine — highlight navigation', () => {
  it('next/prev move across enabled options, skipping disabled ones', () => {
    const { service } = buildOpen()
    service.send({ type: 'highlight.next' })
    expect(service.context.highlightedValue).toBe('banana')
    service.send({ type: 'highlight.next' })
    expect(service.context.highlightedValue).toBe('blueberry')
    service.send({ type: 'highlight.next' }) // cherry is disabled — skipped
    expect(service.context.highlightedValue).toBe('date')
    service.send({ type: 'highlight.prev' })
    expect(service.context.highlightedValue).toBe('blueberry')
  })

  it('sticks at the ends without loop', () => {
    const { service } = buildOpen()
    service.send({ type: 'highlight.prev' })
    expect(service.context.highlightedValue).toBe('apple')
    service.send({ type: 'highlight.last' })
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

  it('first/last jump to the first/last enabled option', () => {
    const { service } = buildOpen()
    service.send({ type: 'highlight.last' })
    expect(service.context.highlightedValue).toBe('date')
    service.send({ type: 'highlight.first' })
    expect(service.context.highlightedValue).toBe('apple')
  })

  it('highlight.set highlights an enabled option and ignores a disabled one', () => {
    const { service } = buildOpen()
    service.send({ type: 'highlight.set', value: 'banana' })
    expect(service.context.highlightedValue).toBe('banana')
    service.send({ type: 'highlight.set', value: 'cherry' })
    expect(service.context.highlightedValue).toBe('banana')
  })

  it('navigation with no highlight starts from the matching end', () => {
    const { service } = buildOpen()
    service.send({ type: 'item.unregister', value: 'apple' }) // highlight -> null
    service.send({ type: 'highlight.next' })
    expect(service.context.highlightedValue).toBe('banana')
  })

  it('a known value re-registering updates in place, keeping its position', () => {
    const { service, connection } = buildOpen({ defaultValue: 'banana' }) // highlight: banana
    service.send({
      type: 'item.register',
      item: { value: 'banana', label: 'Ripe banana', disabled: false },
    })
    expect(connection.snapshot.selectedLabel).toBe('Ripe banana')
    service.send({ type: 'highlight.prev' })
    expect(service.context.highlightedValue).toBe('apple') // still right before banana
  })
})

describe('select machine — typeahead', () => {
  it('a character highlights the next matching option', () => {
    const { service } = buildOpen()
    service.send({ type: 'typeahead', char: 'b' })
    expect(service.context.highlightedValue).toBe('banana')
  })

  it('repeating one character cycles through the options starting with it', () => {
    const { service } = buildOpen()
    service.send({ type: 'typeahead', char: 'b' })
    service.send({ type: 'typeahead', char: 'b' })
    expect(service.context.highlightedValue).toBe('blueberry')
    service.send({ type: 'typeahead', char: 'b' })
    expect(service.context.highlightedValue).toBe('banana')
  })

  it('a growing buffer refines the match', () => {
    const { service } = buildOpen()
    service.send({ type: 'typeahead', char: 'b' })
    service.send({ type: 'typeahead', char: 'l' })
    expect(service.context.highlightedValue).toBe('blueberry')
  })

  it('matches case-insensitively', () => {
    const { service } = buildOpen()
    service.send({ type: 'typeahead', char: 'D' })
    expect(service.context.highlightedValue).toBe('date')
  })

  it('never lands on a disabled option', () => {
    const { service } = buildOpen()
    service.send({ type: 'typeahead', char: 'c' })
    expect(service.context.highlightedValue).toBe('apple')
  })

  it('resets the buffer after the timeout', () => {
    vi.useFakeTimers()
    const { service } = buildOpen()
    service.send({ type: 'typeahead', char: 'b' })
    expect(service.context.highlightedValue).toBe('banana')
    vi.advanceTimersByTime(1100)
    // A stale buffer would search for "bd" and stay put; a fresh one finds Date.
    service.send({ type: 'typeahead', char: 'd' })
    expect(service.context.highlightedValue).toBe('date')
  })

  it('Space joins the buffer while a typeahead is in progress', () => {
    const { service } = buildOpen()
    service.send({ type: 'typeahead', char: 'b' })
    service.send({ type: 'typeahead', char: ' ' })
    expect(service.state).toBe('open') // did not commit
    expect(service.context.highlightedValue).toBe('banana') // "b " matches nothing — stays
  })

  it('Space with no typeahead in progress selects the highlighted option', () => {
    const { service } = buildOpen()
    service.send({ type: 'typeahead', char: ' ' })
    expect(service.state).toBe('closed')
    expect(service.context.value).toBe('apple')
  })

  it('Space after the typeahead timeout commits instead of joining the stale buffer', () => {
    vi.useFakeTimers()
    const { service } = buildOpen()
    service.send({ type: 'typeahead', char: 'b' })
    vi.advanceTimersByTime(1100)
    service.send({ type: 'typeahead', char: ' ' })
    expect(service.state).toBe('closed')
    expect(service.context.value).toBe('banana')
  })
})

describe('select machine — selection', () => {
  it('select with a value commits it and closes', () => {
    const { service } = buildOpen()
    service.send({ type: 'select', value: 'banana' })
    expect(service.state).toBe('closed')
    expect(service.context.value).toBe('banana')
    expect(service.context.highlightedValue).toBeNull()
  })

  it('select without a value commits the highlighted option', () => {
    const { service } = buildOpen()
    service.send({ type: 'select' })
    expect(service.state).toBe('closed')
    expect(service.context.value).toBe('apple')
  })

  it('select on a disabled option is ignored', () => {
    const { service } = buildOpen()
    service.send({ type: 'select', value: 'cherry' })
    expect(service.state).toBe('open')
    expect(service.context.value).toBeNull()
  })

  it('select with nothing highlighted closes without a value', () => {
    const { service } = buildOpen({}, [])
    service.send({ type: 'select' })
    expect(service.state).toBe('closed')
    expect(service.context.value).toBeNull()
  })
})

describe('select machine — controlled sync', () => {
  it('value.set drives the value in both directions', () => {
    const { service } = build()
    service.send({ type: 'value.set', value: 'banana' })
    expect(service.context.value).toBe('banana')
    service.send({ type: 'value.set', value: null })
    expect(service.context.value).toBeNull()
  })

  it('disabled.set updates the flag', () => {
    const { service } = build()
    service.send({ type: 'disabled.set', disabled: true })
    expect(service.context.disabled).toBe(true)
  })
})

describe('select connect — logical bindings', () => {
  it('trigger carries the combobox contract', () => {
    const { connection } = build()
    const trigger = connection.snapshot.parts.trigger
    expect(trigger.id).toBe(ids.trigger)
    expect(trigger.role).toBe('combobox')
    expect(trigger.hasPopup).toBe('listbox')
    expect(trigger.expanded).toBe(false)
    expect(trigger.controls).toBe(ids.listbox)
    expect(trigger['data-state']).toBe('closed')
  })

  it('trigger press toggles through the machine', () => {
    const { service, connection } = build()
    connection.snapshot.parts.trigger.onPress?.()
    expect(service.state).toBe('open')
    connection.snapshot.parts.trigger.onPress?.()
    expect(service.state).toBe('closed')
  })

  it('a disabled select is announced, not removed', () => {
    const { connection } = build({ disabled: true })
    const trigger = connection.snapshot.parts.trigger
    expect(trigger.disabled).toBe(true)
    expect(trigger['data-disabled']).toBe('')
  })

  it('activeDescendant names the highlighted option only while open', () => {
    const { service, connection } = build()
    expect(connection.snapshot.parts.trigger.activeDescendant).toBeUndefined()

    service.send({ type: 'open' })
    expect(connection.snapshot.parts.trigger.activeDescendant).toBe(optionId('apple'))

    service.send({ type: 'close' })
    expect(connection.snapshot.parts.trigger.activeDescendant).toBeUndefined()
  })

  it('listbox carries its role and identity and hides while closed', () => {
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

  it('item bindings expose selection, highlight, and disabled state', () => {
    const { connection } = buildOpen({ defaultValue: 'banana' })
    const { parts } = connection.snapshot

    const selected = parts.item({ value: 'banana' })
    expect(selected.id).toBe(optionId('banana'))
    expect(selected.role).toBe('option')
    expect(selected.selected).toBe(true)
    expect(selected['data-state']).toBe('selected')
    expect(selected['data-highlighted']).toBe('') // highlighted on open

    const idle = parts.item({ value: 'apple' })
    expect(idle.selected).toBe(false)
    expect(idle['data-state']).toBe('unselected')
    expect(idle['data-highlighted']).toBeUndefined()

    const disabled = parts.item({ value: 'cherry', disabled: true })
    expect(disabled.disabled).toBe(true)
    expect(disabled['data-disabled']).toBe('')
  })

  it('item press selects and item pointer movement highlights', () => {
    const { service, connection } = buildOpen()
    connection.snapshot.parts.item({ value: 'date' }).onPointerMove?.()
    expect(service.context.highlightedValue).toBe('date')

    connection.snapshot.parts.item({ value: 'banana' }).onPress?.()
    expect(service.state).toBe('closed')
    expect(service.context.value).toBe('banana')
  })

  it('value part flags the placeholder state', () => {
    const { service, connection } = build()
    expect(connection.snapshot.parts.value['data-placeholder']).toBe('')
    service.send({ type: 'value.set', value: 'apple' })
    expect(connection.snapshot.parts.value['data-placeholder']).toBeUndefined()
  })

  it('itemIndicator is hidden from assistive tech', () => {
    const { connection } = build()
    expect(connection.snapshot.parts.itemIndicator.hidden).toBe(true)
  })

  it('selectedLabel resolves from the registered items', () => {
    const { service, connection } = build()
    expect(connection.snapshot.selectedLabel).toBeNull()
    service.send({ type: 'value.set', value: 'banana' })
    expect(connection.snapshot.selectedLabel).toBe('Banana')
  })

  it('setOpen drives both directions', () => {
    const { service, connection } = build()
    connection.snapshot.setOpen(true)
    expect(service.state).toBe('open')
    connection.snapshot.setOpen(false)
    expect(service.state).toBe('closed')
  })
})

describe('select connect — trigger keyboard', () => {
  it.each(['Enter', ' ', 'ArrowDown', 'ArrowUp'])('%j opens from closed', key => {
    const { service, connection } = build()
    const event = keydown(key)
    connection.snapshot.parts.trigger.onKeyDown?.(event)
    expect(service.state).toBe('open')
    expect(event.defaultPrevented).toBe(true)
  })

  it('Home and End open with the highlight pinned to the matching end', () => {
    // The selection would take the highlight on a plain open — Home/End pin
    // the ends instead.
    const { service, connection } = build({ defaultValue: 'banana' })
    connection.snapshot.parts.trigger.onKeyDown?.(keydown('End'))
    expect(service.state).toBe('open')
    expect(service.context.highlightedValue).toBe('date')

    service.send({ type: 'close' })
    connection.snapshot.parts.trigger.onKeyDown?.(keydown('Home'))
    expect(service.state).toBe('open')
    expect(service.context.highlightedValue).toBe('apple')
  })

  it('arrows, Home, and End move the highlight while open', () => {
    const { service, connection } = buildOpen()
    connection.snapshot.parts.trigger.onKeyDown?.(keydown('ArrowDown'))
    expect(service.context.highlightedValue).toBe('banana')
    connection.snapshot.parts.trigger.onKeyDown?.(keydown('ArrowUp'))
    expect(service.context.highlightedValue).toBe('apple')
    connection.snapshot.parts.trigger.onKeyDown?.(keydown('End'))
    expect(service.context.highlightedValue).toBe('date')
    connection.snapshot.parts.trigger.onKeyDown?.(keydown('Home'))
    expect(service.context.highlightedValue).toBe('apple')
  })

  it('Enter selects the highlighted option and closes', () => {
    const { service, connection } = buildOpen()
    connection.snapshot.parts.trigger.onKeyDown?.(keydown('Enter'))
    expect(service.state).toBe('closed')
    expect(service.context.value).toBe('apple')
  })

  it('Escape closes without selecting', () => {
    const { service, connection } = buildOpen()
    connection.snapshot.parts.trigger.onKeyDown?.(keydown('Escape'))
    expect(service.state).toBe('closed')
    expect(service.context.value).toBeNull()
  })

  it('Tab closes without trapping focus', () => {
    const { service, connection } = buildOpen()
    const event = keydown('Tab')
    connection.snapshot.parts.trigger.onKeyDown?.(event)
    expect(service.state).toBe('closed')
    expect(event.defaultPrevented).toBe(false) // focus must move on
  })

  it('printable characters run the typeahead', () => {
    const { service, connection } = buildOpen()
    connection.snapshot.parts.trigger.onKeyDown?.(keydown('b'))
    expect(service.context.highlightedValue).toBe('banana')
  })
})

describe('select connect — reactions', () => {
  it('fires onValueChange on selection, and not for an unchanged value', () => {
    const onValueChange = vi.fn()
    const { service } = build({ onValueChange })
    expect(onValueChange).not.toHaveBeenCalled()

    service.send({ type: 'open' })
    service.send({ type: 'select', value: 'banana' })
    expect(onValueChange).toHaveBeenLastCalledWith('banana')

    service.send({ type: 'open' })
    service.send({ type: 'select', value: 'banana' })
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it('fires onOpenChange on every flip, not on subscribe', () => {
    const onOpenChange = vi.fn()
    const { service } = build({ onOpenChange })
    expect(onOpenChange).not.toHaveBeenCalled()

    service.send({ type: 'toggle' })
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    service.send({ type: 'close' })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })

  it('fires onHighlightChange on every move, including the clear on close', () => {
    const onHighlightChange = vi.fn()
    const { service } = build({ onHighlightChange })

    service.send({ type: 'open' })
    expect(onHighlightChange).toHaveBeenLastCalledWith('apple')
    service.send({ type: 'highlight.next' })
    expect(onHighlightChange).toHaveBeenLastCalledWith('banana')
    service.send({ type: 'close' })
    expect(onHighlightChange).toHaveBeenLastCalledWith(null)
    expect(onHighlightChange).toHaveBeenCalledTimes(3)
  })

  it('one selection reports value, then highlight, then open', () => {
    const order: string[] = []
    const { service } = build({
      onValueChange: value => order.push(`value:${value}`),
      onHighlightChange: value => order.push(`highlight:${value}`),
      onOpenChange: open => order.push(`open:${open}`),
    })

    service.send({ type: 'open' })
    service.send({ type: 'select', value: 'banana' })
    expect(order).toEqual([
      'highlight:apple',
      'open:true',
      'value:banana',
      'highlight:null',
      'open:false',
    ])
  })
})
