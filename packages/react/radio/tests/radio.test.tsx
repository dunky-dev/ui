// @vitest-environment jsdom
// The React edge of the Radio — behavior only; the machine's own contract is
// covered in @dunky.dev/radio's tests.
import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Radio, type RadioProps } from '@dunky.dev/react-radio'

// Three options — Cherry disabled — the shape every test reads against.
const DefaultRadio = (props: RadioProps) => (
  <Radio {...props}>
    <Radio.Group aria-label='Fruit'>
      <Radio.Item value='apple'>
        <Radio.ItemIndicator data-testid='indicator-apple' />
      </Radio.Item>
      <Radio.ItemLabel value='apple'>Apple</Radio.ItemLabel>
      <Radio.Item value='banana'>
        <Radio.ItemIndicator data-testid='indicator-banana' />
      </Radio.Item>
      <Radio.ItemLabel value='banana'>Banana</Radio.ItemLabel>
      <Radio.Item value='cherry' disabled>
        <Radio.ItemIndicator data-testid='indicator-cherry' />
      </Radio.Item>
      <Radio.ItemLabel value='cherry'>Cherry</Radio.ItemLabel>
    </Radio.Group>
  </Radio>
)

const getItem = (name: string): HTMLElement => screen.getByRole('radio', { name })

const pressKey = (element: HTMLElement, key: string): void => {
  fireEvent.keyDown(element, { key })
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Radio', () => {
  describe('selection', () => {
    it('starts unchecked and selects on press', () => {
      render(<DefaultRadio />)
      const apple = getItem('Apple')
      expect(apple.getAttribute('aria-checked')).toBe('false')
      expect(apple.getAttribute('data-state')).toBe('unchecked')

      act(() => apple.click())
      expect(apple.getAttribute('aria-checked')).toBe('true')
      expect(apple.getAttribute('data-state')).toBe('checked')
    })

    it('checking an item unchecks the previous one', () => {
      render(<DefaultRadio defaultValue='apple' />)
      act(() => getItem('Banana').click())
      expect(getItem('Banana').getAttribute('aria-checked')).toBe('true')
      expect(getItem('Apple').getAttribute('aria-checked')).toBe('false')
    })

    it('renders defaultValue checked', () => {
      render(<DefaultRadio defaultValue='banana' />)
      expect(getItem('Banana').getAttribute('aria-checked')).toBe('true')
    })

    it('pressing an item moves focus onto it', () => {
      // jsdom, like Safari/Firefox, does not focus a button on click — the
      // machine's focus request must land regardless.
      render(<DefaultRadio />)
      act(() => getItem('Banana').click())
      expect(document.activeElement).toBe(getItem('Banana'))
    })

    it('fires onValueChange with the new value', () => {
      const onValueChange = vi.fn()
      render(<DefaultRadio onValueChange={onValueChange} />)
      act(() => getItem('Banana').click())
      expect(onValueChange).toHaveBeenLastCalledWith('banana')
      expect(onValueChange).toHaveBeenCalledTimes(1)
    })

    it('registration survives StrictMode double-mounting', () => {
      render(
        <StrictMode>
          <DefaultRadio />
        </StrictMode>,
      )
      const apple = getItem('Apple')
      act(() => pressKey(apple, 'ArrowDown')) // navigation walks the registry
      expect(getItem('Banana').getAttribute('aria-checked')).toBe('true')
    })
  })

  describe('controlled value', () => {
    it('follows the value prop in both directions', () => {
      const { rerender } = render(<DefaultRadio value='apple' />)
      expect(getItem('Apple').getAttribute('aria-checked')).toBe('true')

      rerender(<DefaultRadio value='banana' />)
      expect(getItem('Banana').getAttribute('aria-checked')).toBe('true')
      expect(getItem('Apple').getAttribute('aria-checked')).toBe('false')

      rerender(<DefaultRadio value={null} />)
      expect(getItem('Banana').getAttribute('aria-checked')).toBe('false')
    })

    it('reports internal selection intent through onValueChange', () => {
      const onValueChange = vi.fn()
      render(<DefaultRadio value='apple' onValueChange={onValueChange} />)
      act(() => getItem('Banana').click())
      expect(onValueChange).toHaveBeenLastCalledWith('banana')
    })
  })

  describe('disabled', () => {
    it('a disabled item ignores presses and stays perceivable', () => {
      render(<DefaultRadio />)
      const cherry = getItem('Cherry')
      expect(cherry.getAttribute('aria-disabled')).toBe('true')
      expect(cherry.getAttribute('data-disabled')).toBe('')
      expect(cherry.tabIndex).toBe(-1)

      act(() => cherry.click())
      expect(cherry.getAttribute('aria-checked')).toBe('false')
    })

    it('a disabled group selects nothing and offers no tabbable item', () => {
      render(<DefaultRadio disabled />)
      const apple = getItem('Apple')
      expect(apple.getAttribute('aria-disabled')).toBe('true')
      expect(apple.tabIndex).toBe(-1)

      act(() => apple.click())
      expect(apple.getAttribute('aria-checked')).toBe('false')
    })
  })

  describe('roving tabindex', () => {
    it('the first enabled item is tabbable while nothing is checked', () => {
      render(<DefaultRadio />)
      expect(getItem('Apple').tabIndex).toBe(0)
      expect(getItem('Banana').tabIndex).toBe(-1)
    })

    it('the checked item takes the tab stop', () => {
      render(<DefaultRadio defaultValue='banana' />)
      expect(getItem('Banana').tabIndex).toBe(0)
      expect(getItem('Apple').tabIndex).toBe(-1)
    })
  })

  describe('keyboard', () => {
    it('ArrowDown moves focus to the next item and selects it', () => {
      render(<DefaultRadio />)
      const apple = getItem('Apple')
      act(() => apple.focus())
      act(() => pressKey(apple, 'ArrowDown'))

      expect(document.activeElement).toBe(getItem('Banana'))
      expect(getItem('Banana').getAttribute('aria-checked')).toBe('true')
    })

    it('arrows skip disabled items and wrap', () => {
      render(<DefaultRadio defaultValue='banana' />)
      const banana = getItem('Banana')
      act(() => banana.focus())
      act(() => pressKey(banana, 'ArrowRight')) // cherry is disabled — wraps to apple

      expect(document.activeElement).toBe(getItem('Apple'))
      expect(getItem('Apple').getAttribute('aria-checked')).toBe('true')
    })

    it('ArrowUp moves backwards', () => {
      render(<DefaultRadio defaultValue='banana' />)
      const banana = getItem('Banana')
      act(() => banana.focus())
      act(() => pressKey(banana, 'ArrowUp'))

      expect(document.activeElement).toBe(getItem('Apple'))
      expect(getItem('Apple').getAttribute('aria-checked')).toBe('true')
    })

    it('Space checks the focused unchecked item', () => {
      render(<DefaultRadio />)
      const apple = getItem('Apple')
      act(() => apple.focus())
      act(() => pressKey(apple, ' '))
      expect(apple.getAttribute('aria-checked')).toBe('true')
    })
  })

  describe('indicator', () => {
    it('renders only while its item is checked', () => {
      render(<DefaultRadio />)
      expect(screen.queryByTestId('indicator-apple')).toBeNull()

      act(() => getItem('Apple').click())
      expect(screen.getByTestId('indicator-apple').getAttribute('data-state')).toBe('checked')

      act(() => getItem('Banana').click())
      expect(screen.queryByTestId('indicator-apple')).toBeNull()
      expect(screen.queryByTestId('indicator-banana')).not.toBeNull()
    })
  })

  describe('label', () => {
    it('press selects and focuses its item', () => {
      render(<DefaultRadio />)
      act(() => screen.getByText('Banana').click())
      expect(getItem('Banana').getAttribute('aria-checked')).toBe('true')
      expect(document.activeElement).toBe(getItem('Banana'))
    })
  })

  describe('aria wiring', () => {
    it('renders the radiogroup with role and follows the orientation prop', () => {
      const { rerender } = render(<DefaultRadio orientation='vertical' />)
      const group = screen.getByRole('radiogroup', { name: 'Fruit' })
      expect(group.getAttribute('aria-orientation')).toBe('vertical')

      rerender(<DefaultRadio orientation='horizontal' />)
      expect(group.getAttribute('aria-orientation')).toBe('horizontal')
    })

    it('items render as buttons named by their label', () => {
      render(<DefaultRadio />)
      const apple = getItem('Apple')
      expect(apple.tagName).toBe('BUTTON')
      expect(apple.getAttribute('aria-labelledby')).toBe(screen.getByText('Apple').id)
    })

    it('an item without a rendered label carries no aria-labelledby', () => {
      render(
        <Radio>
          <Radio.Group aria-label='Bare'>
            <Radio.Item value='solo' aria-label='Solo' />
          </Radio.Group>
        </Radio>,
      )
      expect(screen.getByRole('radio', { name: 'Solo' }).hasAttribute('aria-labelledby')).toBe(
        false,
      )
    })
  })
})
