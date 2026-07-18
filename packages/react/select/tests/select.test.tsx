// @vitest-environment jsdom
// The React edge of the Select — behavior only; the machine's own contract is
// covered in @dunky.dev/select's tests.
import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Select, type SelectProps } from '@dunky.dev/react-select'

const DefaultSelect = (props: SelectProps) => (
  <Select {...props}>
    <Select.Trigger>
      <Select.Value placeholder='Pick a fruit' />
    </Select.Trigger>
    <Select.Listbox>
      <Select.Item value='apple'>Apple</Select.Item>
      <Select.Item value='banana'>Banana</Select.Item>
      <Select.Item value='cherry' disabled>
        Cherry
      </Select.Item>
      <Select.Item value='date'>Date</Select.Item>
    </Select.Listbox>
  </Select>
)

const trigger = (): HTMLElement => screen.getByRole('combobox')

const openSelect = (): void => {
  act(() => trigger().click())
}

const pressKey = (key: string): void => {
  fireEvent.keyDown(trigger(), { key })
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Select', () => {
  describe('open / close', () => {
    it('opens on trigger press and closes on a second press', () => {
      render(<DefaultSelect />)
      expect(screen.queryByRole('listbox')).toBeNull()

      openSelect()
      expect(screen.queryByRole('listbox')).not.toBeNull()
      expect(trigger().getAttribute('aria-expanded')).toBe('true')

      openSelect()
      expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('keeps the listbox mounted (hidden) while closed', () => {
      render(<DefaultSelect />)
      const listbox = document.getElementById(
        trigger().getAttribute('aria-controls') as string,
      ) as HTMLElement
      expect(listbox.hasAttribute('hidden')).toBe(true)
      expect(listbox.getAttribute('data-state')).toBe('closed')
    })

    it('fires onOpenChange with the new value on open and close', () => {
      const onOpenChange = vi.fn()
      render(<DefaultSelect onOpenChange={onOpenChange} />)

      openSelect()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)

      fireEvent.keyDown(trigger(), { key: 'Escape' })
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })

    it('does not open when disabled', () => {
      render(<DefaultSelect disabled />)
      expect(trigger().getAttribute('aria-disabled')).toBe('true')

      openSelect()
      expect(screen.queryByRole('listbox')).toBeNull()
    })
  })

  describe('keyboard', () => {
    it('ArrowDown opens and highlights the first option', () => {
      render(<DefaultSelect />)
      pressKey('ArrowDown')

      const apple = screen.getByRole('option', { name: 'Apple' })
      expect(trigger().getAttribute('aria-activedescendant')).toBe(apple.id)
      expect(apple.hasAttribute('data-highlighted')).toBe(true)
    })

    it('navigation moves the highlight, skipping disabled options', () => {
      const onHighlightChange = vi.fn()
      render(<DefaultSelect onHighlightChange={onHighlightChange} />)
      pressKey('ArrowDown') // open, highlight apple
      pressKey('ArrowDown') // banana
      pressKey('ArrowDown') // cherry is disabled -> date

      const date = screen.getByRole('option', { name: 'Date' })
      expect(trigger().getAttribute('aria-activedescendant')).toBe(date.id)
      expect(onHighlightChange).toHaveBeenLastCalledWith('date')
    })

    it('Enter selects the highlighted option and closes', () => {
      const onValueChange = vi.fn()
      render(<DefaultSelect onValueChange={onValueChange} />)
      pressKey('ArrowDown')
      pressKey('ArrowDown')
      pressKey('Enter')

      expect(onValueChange).toHaveBeenCalledWith('banana')
      expect(screen.queryByRole('listbox')).toBeNull()
      expect(trigger().textContent).toBe('Banana')
    })

    it('Escape closes without selecting', () => {
      const onValueChange = vi.fn()
      render(<DefaultSelect onValueChange={onValueChange} />)
      pressKey('ArrowDown')
      pressKey('Escape')

      expect(onValueChange).not.toHaveBeenCalled()
      expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('Tab closes without selecting', () => {
      render(<DefaultSelect />)
      pressKey('ArrowDown')
      pressKey('Tab')
      expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('typing runs the typeahead over the item labels', () => {
      render(<DefaultSelect />)
      pressKey('ArrowDown')
      pressKey('b')

      const banana = screen.getByRole('option', { name: 'Banana' })
      expect(trigger().getAttribute('aria-activedescendant')).toBe(banana.id)
    })
  })

  describe('pointer', () => {
    it('clicking an option selects it and closes', () => {
      const onValueChange = vi.fn()
      render(<DefaultSelect onValueChange={onValueChange} />)
      openSelect()
      act(() => screen.getByRole('option', { name: 'Date' }).click())

      expect(onValueChange).toHaveBeenCalledWith('date')
      expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('clicking a disabled option does nothing', () => {
      const onValueChange = vi.fn()
      render(<DefaultSelect onValueChange={onValueChange} />)
      openSelect()
      act(() => screen.getByRole('option', { name: 'Cherry' }).click())

      expect(onValueChange).not.toHaveBeenCalled()
      expect(screen.queryByRole('listbox')).not.toBeNull()
    })

    it('pointer movement over an option highlights it', () => {
      render(<DefaultSelect />)
      openSelect()
      const banana = screen.getByRole('option', { name: 'Banana' })
      fireEvent.pointerMove(banana)
      expect(trigger().getAttribute('aria-activedescendant')).toBe(banana.id)
    })

    it('pointerdown outside the trigger and listbox closes', () => {
      render(<DefaultSelect />)
      openSelect()
      act(() => {
        fireEvent.pointerDown(document.body)
      })
      expect(screen.queryByRole('listbox')).toBeNull()
    })
  })

  describe('value', () => {
    it('shows the placeholder while nothing is selected', () => {
      render(<DefaultSelect />)
      expect(trigger().textContent).toBe('Pick a fruit')
      expect(trigger().querySelector('[data-placeholder]')).not.toBeNull()
    })

    it('uncontrolled: defaultValue selects and opening highlights it', () => {
      render(<DefaultSelect defaultValue='banana' />)
      expect(trigger().textContent).toBe('Banana')

      openSelect()
      const banana = screen.getByRole('option', { name: 'Banana' })
      expect(banana.getAttribute('aria-selected')).toBe('true')
      expect(trigger().getAttribute('aria-activedescendant')).toBe(banana.id)
    })

    it('controlled: follows the value prop in both directions', () => {
      const { rerender } = render(<DefaultSelect value='banana' />)
      expect(trigger().textContent).toBe('Banana')

      rerender(<DefaultSelect value='date' />)
      expect(trigger().textContent).toBe('Date')

      rerender(<DefaultSelect value={null} />)
      expect(trigger().textContent).toBe('Pick a fruit')
    })

    it('controlled: follows the open prop in both directions', () => {
      const { rerender } = render(<DefaultSelect open={false} />)
      expect(screen.queryByRole('listbox')).toBeNull()

      rerender(<DefaultSelect open />)
      expect(screen.queryByRole('listbox')).not.toBeNull()

      rerender(<DefaultSelect open={false} />)
      expect(screen.queryByRole('listbox')).toBeNull()
    })
  })

  describe('aria wiring', () => {
    it('trigger exposes the combobox contract', () => {
      render(<DefaultSelect />)
      const combobox = trigger()
      expect(combobox.tagName).toBe('BUTTON')
      expect(combobox.getAttribute('aria-haspopup')).toBe('listbox')
      expect(combobox.getAttribute('aria-expanded')).toBe('false')
      expect(combobox.getAttribute('aria-controls')).not.toBeNull()
    })

    it('options carry role and aria-disabled from their props', () => {
      render(<DefaultSelect />)
      openSelect()
      expect(screen.getAllByRole('option')).toHaveLength(4)
      const cherry = screen.getByRole('option', { name: 'Cherry' })
      expect(cherry.getAttribute('aria-disabled')).toBe('true')
      expect(cherry.hasAttribute('data-disabled')).toBe(true)
    })
  })

  describe('item indicator', () => {
    const IndicatorSelect = (props: SelectProps) => (
      <Select {...props}>
        <Select.Trigger>
          <Select.Value placeholder='Pick' />
        </Select.Trigger>
        <Select.Listbox>
          <Select.Item value='apple' label='Apple'>
            Apple <Select.ItemIndicator data-testid='indicator-apple'>✓</Select.ItemIndicator>
          </Select.Item>
          <Select.Item value='banana' label='Banana'>
            Banana <Select.ItemIndicator data-testid='indicator-banana'>✓</Select.ItemIndicator>
          </Select.Item>
        </Select.Listbox>
      </Select>
    )

    it('renders only inside the selected item, hidden from assistive tech', () => {
      render(<IndicatorSelect defaultValue='banana' />)
      expect(screen.queryByTestId('indicator-apple')).toBeNull()

      const indicator = screen.getByTestId('indicator-banana')
      expect(indicator.getAttribute('aria-hidden')).toBe('true')
    })

    it('uses the label prop for the value text when children are not a string', () => {
      render(<IndicatorSelect defaultValue='banana' />)
      expect(trigger().textContent).toBe('Banana')
    })
  })

  describe('lifecycle', () => {
    const ShrinkingSelect = ({ showApple }: { showApple: boolean }) => (
      <Select>
        <Select.Trigger>
          <Select.Value placeholder='Pick a fruit' />
        </Select.Trigger>
        <Select.Listbox>
          {showApple && <Select.Item value='apple'>Apple</Select.Item>}
          <Select.Item value='banana'>Banana</Select.Item>
        </Select.Listbox>
      </Select>
    )

    it('unmounted items leave the navigation order', () => {
      const { rerender } = render(<ShrinkingSelect showApple />)
      rerender(<ShrinkingSelect showApple={false} />)
      pressKey('ArrowDown')
      // apple unregistered — the first option is banana now.
      expect(trigger().getAttribute('aria-activedescendant')).toBe(
        screen.getByRole('option', { name: 'Banana' }).id,
      )
    })

    const RelabelingSelect = ({ bananaLabel }: { bananaLabel: string }) => (
      <Select>
        <Select.Trigger>
          <Select.Value placeholder='Pick a fruit' />
        </Select.Trigger>
        <Select.Listbox>
          <Select.Item value='apple'>Apple</Select.Item>
          <Select.Item value='banana' label={bananaLabel}>
            Banana
          </Select.Item>
          <Select.Item value='date'>Date</Select.Item>
        </Select.Listbox>
      </Select>
    )

    it('a label change updates the item in place, keeping the navigation order', () => {
      const { rerender } = render(<RelabelingSelect bananaLabel='Banana' />)
      rerender(<RelabelingSelect bananaLabel='Ripe banana' />)
      pressKey('ArrowDown') // open, highlight apple
      pressKey('ArrowDown') // a re-appended banana would put date here instead
      expect(trigger().getAttribute('aria-activedescendant')).toBe(
        screen.getByRole('option', { name: 'Banana' }).id,
      )
    })

    it('works under StrictMode without duplicate callbacks', () => {
      const onValueChange = vi.fn()
      render(
        <StrictMode>
          <DefaultSelect onValueChange={onValueChange} />
        </StrictMode>,
      )
      openSelect()
      act(() => screen.getByRole('option', { name: 'Apple' }).click())
      expect(onValueChange).toHaveBeenCalledTimes(1)
      expect(onValueChange).toHaveBeenCalledWith('apple')
    })
  })
})
