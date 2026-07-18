// @vitest-environment jsdom
// The React edge of the Checkbox — behavior only; the machine's own contract
// is covered in @dunky.dev/checkbox's tests.
import { useState } from 'react'
import { act, cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Checkbox, type CheckboxCheckedState, type CheckboxProps } from '@dunky.dev/react-checkbox'

const DefaultCheckbox = (props: CheckboxProps) => (
  <Checkbox {...props}>
    <Checkbox.Control>
      <Checkbox.Indicator data-testid='indicator'>✓</Checkbox.Indicator>
    </Checkbox.Control>
    <Checkbox.Label>Accept terms</Checkbox.Label>
  </Checkbox>
)

// The select-all shape: the parent's controlled `checked` DERIVES from the very
// state its onCheckedChange updates — the regression target for the controlled
// re-sync echo (an echo feeds the derivation its own output and collapses the
// group).
const SelectAllGroup = () => {
  const [selected, setSelected] = useState([true, true])
  const count = selected.filter(Boolean).length
  const parentChecked: CheckboxCheckedState =
    count === selected.length ? true : count > 0 ? 'indeterminate' : false

  return (
    <>
      <Checkbox
        checked={parentChecked}
        onCheckedChange={checked => setSelected(selected.map(() => checked === true))}
      >
        <Checkbox.Control aria-label='Select all' />
      </Checkbox>
      {selected.map((checked, index) => (
        <Checkbox
          key={index}
          checked={checked}
          onCheckedChange={next =>
            setSelected(selected.map((value, i) => (i === index ? next === true : value)))
          }
        >
          <Checkbox.Control aria-label={`Item ${index + 1}`} />
        </Checkbox>
      ))}
    </>
  )
}

const getControl = (): HTMLElement => screen.getByRole('checkbox')
const pressControl = (): void => {
  act(() => getControl().click())
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Checkbox', () => {
  describe('checked state', () => {
    it('toggles on control press', () => {
      render(<DefaultCheckbox />)
      expect(getControl().getAttribute('aria-checked')).toBe('false')
      expect(getControl().getAttribute('data-state')).toBe('unchecked')

      pressControl()
      expect(getControl().getAttribute('aria-checked')).toBe('true')
      expect(getControl().getAttribute('data-state')).toBe('checked')

      pressControl()
      expect(getControl().getAttribute('aria-checked')).toBe('false')
    })

    it('renders checked when defaultChecked', () => {
      render(<DefaultCheckbox defaultChecked />)
      expect(getControl().getAttribute('aria-checked')).toBe('true')
    })

    it('renders mixed when indeterminate, and a press resolves it to checked', () => {
      render(<DefaultCheckbox defaultChecked='indeterminate' />)
      expect(getControl().getAttribute('aria-checked')).toBe('mixed')
      expect(getControl().getAttribute('data-state')).toBe('indeterminate')

      pressControl()
      expect(getControl().getAttribute('aria-checked')).toBe('true')
    })

    it('fires onCheckedChange with the new value on every toggle', () => {
      const onCheckedChange = vi.fn()
      render(<DefaultCheckbox onCheckedChange={onCheckedChange} />)

      pressControl()
      expect(onCheckedChange).toHaveBeenLastCalledWith(true)

      pressControl()
      expect(onCheckedChange).toHaveBeenLastCalledWith(false)
    })
  })

  describe('keyboard', () => {
    it('suppresses Enter activation — Space is the only checkbox key', () => {
      render(<DefaultCheckbox />)
      const enter = createEvent.keyDown(getControl(), { key: 'Enter' })
      fireEvent(getControl(), enter)
      expect(enter.defaultPrevented).toBe(true)
      expect(getControl().getAttribute('aria-checked')).toBe('false')
    })
  })

  describe('label', () => {
    it('labels the control through aria-labelledby', () => {
      render(<DefaultCheckbox />)
      expect(screen.getByRole('checkbox', { name: 'Accept terms' })).not.toBeNull()
    })

    it('toggles on label press', () => {
      render(<DefaultCheckbox />)
      act(() => screen.getByText('Accept terms').click())
      expect(getControl().getAttribute('aria-checked')).toBe('true')
    })

    it('omits aria-labelledby when no Label is rendered', () => {
      render(
        <Checkbox>
          <Checkbox.Control aria-label='Notify me' />
        </Checkbox>,
      )
      expect(getControl().hasAttribute('aria-labelledby')).toBe(false)
      expect(screen.getByRole('checkbox', { name: 'Notify me' })).not.toBeNull()
    })
  })

  describe('indicator', () => {
    it('mounts only while checked or indeterminate', () => {
      render(<DefaultCheckbox />)
      expect(screen.queryByTestId('indicator')).toBeNull()

      pressControl()
      expect(screen.queryByTestId('indicator')).not.toBeNull()

      pressControl()
      expect(screen.queryByTestId('indicator')).toBeNull()
    })

    it('carries data-state so the glyph can follow checked vs indeterminate', () => {
      render(<DefaultCheckbox defaultChecked='indeterminate' />)
      expect(screen.getByTestId('indicator').getAttribute('data-state')).toBe('indeterminate')
    })
  })

  describe('disabled', () => {
    it('blocks control and label presses', () => {
      render(<DefaultCheckbox disabled />)
      pressControl()
      act(() => screen.getByText('Accept terms').click())
      expect(getControl().getAttribute('aria-checked')).toBe('false')
    })

    it('is conveyed as aria-disabled + data-disabled, staying focusable', () => {
      render(<DefaultCheckbox disabled />)
      const control = getControl()
      expect(control.getAttribute('aria-disabled')).toBe('true')
      expect(control.hasAttribute('data-disabled')).toBe(true)
      expect(control.hasAttribute('disabled')).toBe(false)
      expect(screen.getByText('Accept terms').hasAttribute('data-disabled')).toBe(true)
    })

    it('re-enables when the disabled prop clears', () => {
      const { rerender } = render(<DefaultCheckbox disabled />)
      rerender(<DefaultCheckbox />)
      pressControl()
      expect(getControl().getAttribute('aria-checked')).toBe('true')
    })
  })

  describe('controlled checked', () => {
    it('follows the checked prop in every direction', () => {
      const { rerender } = render(<DefaultCheckbox checked={false} />)
      expect(getControl().getAttribute('aria-checked')).toBe('false')

      rerender(<DefaultCheckbox checked />)
      expect(getControl().getAttribute('aria-checked')).toBe('true')

      rerender(<DefaultCheckbox checked='indeterminate' />)
      expect(getControl().getAttribute('aria-checked')).toBe('mixed')

      rerender(<DefaultCheckbox checked={false} />)
      expect(getControl().getAttribute('aria-checked')).toBe('false')
    })

    it('reports toggle intent through onCheckedChange', () => {
      const onCheckedChange = vi.fn()
      render(<DefaultCheckbox checked={false} onCheckedChange={onCheckedChange} />)
      pressControl()
      expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    })

    it('never echoes the checked prop back — a derived select-all parent keeps its group', () => {
      render(<SelectAllGroup />)
      act(() => screen.getByRole('checkbox', { name: 'Item 1' }).click())

      const parent = screen.getByRole('checkbox', { name: 'Select all' })
      expect(parent.getAttribute('aria-checked')).toBe('mixed')
      expect(screen.getByRole('checkbox', { name: 'Item 1' }).getAttribute('aria-checked')).toBe(
        'false',
      )
      expect(screen.getByRole('checkbox', { name: 'Item 2' }).getAttribute('aria-checked')).toBe(
        'true',
      )
    })
  })

  describe('rendering', () => {
    it('control is a type=button so it never submits a surrounding form', () => {
      render(<DefaultCheckbox />)
      expect(getControl().tagName).toBe('BUTTON')
      expect(getControl().getAttribute('type')).toBe('button')
    })
  })
})
