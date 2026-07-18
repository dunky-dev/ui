// @vitest-environment jsdom
// The React edge of the Combobox — behavior only; the machine's own contract
// is covered in @dunky.dev/combobox's tests.
import { StrictMode, useState } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerLayer } from '@dunky.dev/dom-layer-stack'
import { Combobox, type ComboboxProps } from '@dunky.dev/react-combobox'

const DefaultCombobox = (props: ComboboxProps) => (
  <Combobox {...props}>
    <Combobox.Input aria-label='Fruit' />
    <Combobox.Trigger aria-label='Show fruits'>v</Combobox.Trigger>
    <Combobox.Listbox>
      <Combobox.Item value='apple'>Apple</Combobox.Item>
      <Combobox.Item value='banana'>Banana</Combobox.Item>
      <Combobox.Item value='cherry' disabled>
        Cherry
      </Combobox.Item>
      <Combobox.Item value='date'>Date</Combobox.Item>
    </Combobox.Listbox>
  </Combobox>
)

const fruits = ['Apple', 'Banana', 'Cherry']

// The consumer owns filtering: the canonical wiring mirrors the input text
// into state and renders only the matching items.
const FilterCombobox = (props: ComboboxProps) => {
  const [query, setQuery] = useState('')
  return (
    <Combobox {...props} inputValue={query} onInputValueChange={setQuery}>
      <Combobox.Input aria-label='Fruit' />
      <Combobox.Listbox>
        {fruits
          .filter(fruit => fruit.toLowerCase().includes(query.toLowerCase()))
          .map(fruit => (
            <Combobox.Item key={fruit} value={fruit.toLowerCase()}>
              {fruit}
            </Combobox.Item>
          ))}
      </Combobox.Listbox>
    </Combobox>
  )
}

// A keyed re-sort: the stable keys make React move the rendered nodes in
// place — no item unmounts, no prop changes.
const ReorderCombobox = () => {
  const [reversed, setReversed] = useState(false)
  const options = reversed ? [...fruits].reverse() : fruits
  return (
    <>
      <button type='button' onClick={() => setReversed(true)}>
        Reverse
      </button>
      <Combobox>
        <Combobox.Input aria-label='Fruit' />
        <Combobox.Listbox>
          {options.map(fruit => (
            <Combobox.Item key={fruit} value={fruit.toLowerCase()}>
              {fruit}
            </Combobox.Item>
          ))}
        </Combobox.Listbox>
      </Combobox>
    </>
  )
}

const input = (): HTMLInputElement => screen.getByRole('combobox')

const typeText = (value: string): void => {
  fireEvent.change(input(), { target: { value } })
}

const pressKey = (key: string): void => {
  fireEvent.keyDown(input(), { key })
}

const pressEscape = (): void => {
  fireEvent.keyDown(document.body, { key: 'Escape' })
}

// The listbox stays mounted (hidden) while closed, so resolve it through the
// wiring rather than a role query.
const listbox = (): HTMLElement =>
  document.getElementById(input().getAttribute('aria-controls') as string) as HTMLElement

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Combobox', () => {
  describe('aria wiring', () => {
    it('wires the input as a list-autocomplete combobox over the listbox', () => {
      render(<DefaultCombobox />)
      const combobox = input()
      expect(combobox.tagName).toBe('INPUT')
      expect(combobox.getAttribute('aria-autocomplete')).toBe('list')
      expect(combobox.getAttribute('aria-expanded')).toBe('false')

      expect(listbox().getAttribute('role')).toBe('listbox')
      expect(listbox().hasAttribute('hidden')).toBe(true)
      expect(listbox().getAttribute('data-state')).toBe('closed')

      typeText('a')
      expect(combobox.getAttribute('aria-expanded')).toBe('true')
      expect(listbox().hasAttribute('hidden')).toBe(false)
      expect(listbox().getAttribute('data-state')).toBe('open')
    })

    it('keeps the trigger out of the tab order, carrying the popup relationship', () => {
      render(<DefaultCombobox />)
      const trigger = screen.getByLabelText('Show fruits')
      expect(trigger.tabIndex).toBe(-1)
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
    })
  })

  describe('open / close', () => {
    it('renders open when defaultOpen', () => {
      render(<DefaultCombobox defaultOpen />)
      expect(screen.queryByRole('listbox')).not.toBeNull()
    })

    it('fires onOpenChange with the new value on open and close', () => {
      const onOpenChange = vi.fn()
      render(<DefaultCombobox onOpenChange={onOpenChange} />)

      typeText('a')
      expect(onOpenChange).toHaveBeenLastCalledWith(true)

      pressEscape()
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })

    it('trigger press toggles the list and hands focus to the input', () => {
      render(<DefaultCombobox />)
      const trigger = screen.getByLabelText('Show fruits')

      act(() => trigger.click())
      expect(screen.queryByRole('listbox')).not.toBeNull()
      expect(document.activeElement).toBe(input())

      // A real press is pointerdown (outside-detection territory) then click:
      // the trigger is excused as the anchor, so one press closes in one
      // motion — no dismiss-then-reopen flicker.
      fireEvent.pointerDown(trigger)
      fireEvent.click(trigger)
      expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('does not open when disabled', () => {
      render(<DefaultCombobox disabled />)
      expect(input().disabled).toBe(true)
      expect(input().getAttribute('aria-disabled')).toBe('true')

      act(() => screen.getByLabelText('Show fruits').click())
      expect(screen.queryByRole('listbox')).toBeNull()
    })
  })

  describe('keyboard', () => {
    it('ArrowDown opens and highlights the first option', () => {
      render(<DefaultCombobox />)
      pressKey('ArrowDown')

      const apple = screen.getByRole('option', { name: 'Apple' })
      expect(input().getAttribute('aria-activedescendant')).toBe(apple.id)
      expect(apple.hasAttribute('data-highlighted')).toBe(true)
    })

    it('Enter commits the highlighted option: label in the input, list closed', () => {
      const onValueChange = vi.fn()
      render(<DefaultCombobox onValueChange={onValueChange} />)

      pressKey('ArrowDown')
      pressKey('ArrowDown')
      pressKey('Enter')

      expect(onValueChange).toHaveBeenLastCalledWith('banana')
      expect(input().value).toBe('Banana')
      expect(screen.queryByRole('listbox')).toBeNull()
      expect(input().hasAttribute('aria-activedescendant')).toBe(false)
    })

    it('Escape closes without selecting, keeping the typed text', () => {
      const onValueChange = vi.fn()
      render(<DefaultCombobox onValueChange={onValueChange} />)

      typeText('ban')
      pressEscape()

      expect(screen.queryByRole('listbox')).toBeNull()
      expect(input().value).toBe('ban')
      expect(onValueChange).not.toHaveBeenCalled()
    })

    it('stays open when onEscapeKeyDown prevents default', () => {
      const onEscapeKeyDown = vi.fn(event => event.preventDefault())
      render(<DefaultCombobox defaultOpen onEscapeKeyDown={onEscapeKeyDown} />)

      pressEscape()
      expect(onEscapeKeyDown).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('listbox')).not.toBeNull()
    })
  })

  describe('pointer', () => {
    it('moving the pointer over an option highlights it', () => {
      render(<DefaultCombobox defaultOpen />)
      const banana = screen.getByRole('option', { name: 'Banana' })

      fireEvent.pointerMove(banana)
      expect(input().getAttribute('aria-activedescendant')).toBe(banana.id)
      expect(banana.hasAttribute('data-highlighted')).toBe(true)
    })

    it('pressing an option selects it without stealing focus from the input', () => {
      render(<DefaultCombobox defaultOpen />)
      act(() => input().focus())
      const banana = screen.getByRole('option', { name: 'Banana' })

      // The option cancels the pointerdown default — the focus move.
      expect(fireEvent.pointerDown(banana)).toBe(false)
      fireEvent.click(banana)

      expect(input().value).toBe('Banana')
      expect(screen.queryByRole('listbox')).toBeNull()
      expect(document.activeElement).toBe(input())
    })

    it('pressing a disabled option does nothing', () => {
      render(<DefaultCombobox defaultOpen />)
      fireEvent.click(screen.getByRole('option', { name: 'Cherry' }))
      expect(screen.queryByRole('listbox')).not.toBeNull()
      expect(input().value).toBe('')
    })

    it('pressing the listbox surface between options keeps focus in the input', () => {
      render(<DefaultCombobox defaultOpen />)
      act(() => input().focus())

      // The surface cancels the pointerdown default — the focus move to body.
      expect(fireEvent.pointerDown(listbox())).toBe(false)
      expect(document.activeElement).toBe(input())
      expect(screen.queryByRole('listbox')).not.toBeNull()
    })
  })

  describe('outside interaction', () => {
    it('closes on a press outside the combobox', () => {
      render(<DefaultCombobox defaultOpen />)
      fireEvent.pointerDown(document.body)
      expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('a press on the input is the anchor, not outside', () => {
      render(<DefaultCombobox defaultOpen />)
      fireEvent.pointerDown(input())
      expect(screen.queryByRole('listbox')).not.toBeNull()
    })

    it('closes when focus moves outside', () => {
      render(
        <>
          <DefaultCombobox defaultOpen />
          <button type='button'>Elsewhere</button>
        </>,
      )
      act(() => screen.getByText('Elsewhere').focus())
      expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('stays open when onInteractOutside prevents default', () => {
      const onInteractOutside = vi.fn(event => event?.preventDefault())
      render(<DefaultCombobox defaultOpen onInteractOutside={onInteractOutside} />)

      fireEvent.pointerDown(document.body)
      expect(onInteractOutside).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('listbox')).not.toBeNull()
    })
  })

  describe('layering', () => {
    // A combobox can't nest itself, so a stub layer registered deeper on the
    // shared stack stands in for an overlay opened from within the listbox
    // (the open combobox sits at depth 1).
    const stackStubLayer = () => {
      const element = document.createElement('div')
      document.body.append(element)
      const unregister = registerLayer({ id: 'stub-layer', depth: 2, element, modal: false })
      return {
        element,
        remove: () => {
          unregister()
          element.remove()
        },
      }
    }

    it('Escape routes to the topmost layer only, one layer per press', () => {
      render(<DefaultCombobox defaultOpen />)
      const stub = stackStubLayer()

      pressEscape()
      expect(screen.queryByRole('listbox')).not.toBeNull()

      stub.remove()
      pressEscape()
      expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('outside presses route to the topmost layer; a nested layer is never outside', () => {
      render(<DefaultCombobox defaultOpen />)
      const stub = stackStubLayer()

      // Inside the nested layer: not outside the combobox beneath it.
      fireEvent.pointerDown(stub.element)
      expect(screen.queryByRole('listbox')).not.toBeNull()

      // Outside everything: only the topmost layer answers.
      fireEvent.pointerDown(document.body)
      expect(screen.queryByRole('listbox')).not.toBeNull()

      stub.remove()
      fireEvent.pointerDown(document.body)
      expect(screen.queryByRole('listbox')).toBeNull()
    })
  })

  describe('controlled', () => {
    it('follows the open prop in both directions', () => {
      const { rerender } = render(<DefaultCombobox open={false} />)
      expect(screen.queryByRole('listbox')).toBeNull()

      rerender(<DefaultCombobox open />)
      expect(screen.queryByRole('listbox')).not.toBeNull()

      rerender(<DefaultCombobox open={false} />)
      expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('follows the inputValue prop and reports typing through onInputValueChange', () => {
      const onInputValueChange = vi.fn()
      const { rerender } = render(
        <DefaultCombobox inputValue='Ap' onInputValueChange={onInputValueChange} />,
      )
      expect(input().value).toBe('Ap')

      typeText('App')
      expect(onInputValueChange).toHaveBeenLastCalledWith('App')

      rerender(<DefaultCombobox inputValue='Apple' onInputValueChange={onInputValueChange} />)
      expect(input().value).toBe('Apple')
    })

    it('marks the controlled value as selected', () => {
      render(<DefaultCombobox value='banana' defaultOpen />)
      const banana = screen.getByRole('option', { name: 'Banana' })
      expect(banana.getAttribute('aria-selected')).toBe('true')
      expect(banana.getAttribute('data-state')).toBe('selected')
      expect(screen.getByRole('option', { name: 'Apple' }).getAttribute('data-state')).toBe(
        'unselected',
      )
    })

    it('follows the value prop in both directions', () => {
      const banana = () => screen.getByRole('option', { name: 'Banana' })
      const { rerender } = render(<DefaultCombobox value={null} defaultOpen />)
      expect(banana().getAttribute('aria-selected')).toBe('false')

      rerender(<DefaultCombobox value='banana' defaultOpen />)
      expect(banana().getAttribute('aria-selected')).toBe('true')

      rerender(<DefaultCombobox value={null} defaultOpen />)
      expect(banana().getAttribute('aria-selected')).toBe('false')
    })

    it('re-syncs disabled when the prop changes', () => {
      const { rerender } = render(<DefaultCombobox />)
      rerender(<DefaultCombobox disabled />)
      expect(input().disabled).toBe(true)

      rerender(<DefaultCombobox />)
      expect(input().disabled).toBe(false)
    })
  })

  describe('consumer filtering', () => {
    it('keeps navigation in rendered order after items unmount and remount', () => {
      render(<FilterCombobox />)
      typeText('ch') // the consumer's filtering narrows to the one match…
      expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual(['Cherry'])
      typeText('') // …then Apple and Banana remount around it
      expect(screen.getAllByRole('option')).toHaveLength(3)

      pressKey('ArrowDown')
      const apple = screen.getByRole('option', { name: 'Apple' })
      expect(input().getAttribute('aria-activedescendant')).toBe(apple.id)
    })

    it('keeps navigation in rendered order after a keyed re-sort moves items in place', () => {
      render(<ReorderCombobox />)
      act(() => screen.getByText('Reverse').click())

      pressKey('ArrowDown')
      const cherry = screen.getByRole('option', { name: 'Cherry' })
      expect(input().getAttribute('aria-activedescendant')).toBe(cherry.id)

      pressKey('ArrowDown')
      const banana = screen.getByRole('option', { name: 'Banana' })
      expect(input().getAttribute('aria-activedescendant')).toBe(banana.id)
    })

    it('selecting writes the label back through the controlled text', () => {
      render(<FilterCombobox />)
      typeText('ban')
      pressKey('ArrowDown')
      pressKey('Enter')
      expect(input().value).toBe('Banana')
    })
  })

  describe('items', () => {
    it('renders the indicator only inside the selected item, hidden from AT', () => {
      render(
        <Combobox defaultValue='banana' defaultOpen>
          <Combobox.Input aria-label='Fruit' />
          <Combobox.Listbox>
            <Combobox.Item value='apple'>
              Apple <Combobox.ItemIndicator data-testid='indicator-apple'>✓</Combobox.ItemIndicator>
            </Combobox.Item>
            <Combobox.Item value='banana'>
              Banana{' '}
              <Combobox.ItemIndicator data-testid='indicator-banana'>✓</Combobox.ItemIndicator>
            </Combobox.Item>
          </Combobox.Listbox>
        </Combobox>,
      )
      expect(screen.queryByTestId('indicator-apple')).toBeNull()
      const indicator = screen.getByTestId('indicator-banana')
      expect(indicator.getAttribute('aria-hidden')).toBe('true')
    })

    it('works under StrictMode without duplicate callbacks', () => {
      const onValueChange = vi.fn()
      render(
        <StrictMode>
          <DefaultCombobox defaultOpen onValueChange={onValueChange} />
        </StrictMode>,
      )
      fireEvent.click(screen.getByRole('option', { name: 'Apple' }))
      expect(onValueChange).toHaveBeenCalledTimes(1)
      expect(onValueChange).toHaveBeenCalledWith('apple')
    })
  })
})
