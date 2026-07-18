// @vitest-environment jsdom
// The React edge of the Switch — behavior only; the machine's own contract is
// covered in @dunky.dev/switch's tests.
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Switch, type SwitchProps } from '@dunky.dev/react-switch'

const DefaultSwitch = (props: SwitchProps) => (
  <Switch {...props}>
    <Switch.Control data-testid='control'>
      <Switch.Thumb data-testid='thumb' />
    </Switch.Control>
    <Switch.Label data-testid='label'>Airplane mode</Switch.Label>
  </Switch>
)

const user = userEvent.setup()

const getControl = (): HTMLElement => screen.getByRole('switch')

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Switch', () => {
  describe('toggling', () => {
    it('toggles on control press', async () => {
      render(<DefaultSwitch />)
      expect(getControl().getAttribute('aria-checked')).toBe('false')

      await user.click(getControl())
      expect(getControl().getAttribute('aria-checked')).toBe('true')

      await user.click(getControl())
      expect(getControl().getAttribute('aria-checked')).toBe('false')
    })

    it('toggles on Space when the control has focus', async () => {
      render(<DefaultSwitch />)
      act(() => getControl().focus())

      await user.keyboard('[Space]')
      expect(getControl().getAttribute('aria-checked')).toBe('true')
    })

    it('toggles on label press', async () => {
      render(<DefaultSwitch />)
      await user.click(screen.getByTestId('label'))
      expect(getControl().getAttribute('aria-checked')).toBe('true')
    })

    it('renders checked when defaultChecked', () => {
      render(<DefaultSwitch defaultChecked />)
      expect(getControl().getAttribute('aria-checked')).toBe('true')
    })

    it('fires onCheckedChange with the new value on each toggle', async () => {
      const onCheckedChange = vi.fn()
      render(<DefaultSwitch onCheckedChange={onCheckedChange} />)

      await user.click(getControl())
      expect(onCheckedChange).toHaveBeenLastCalledWith(true)

      await user.click(getControl())
      expect(onCheckedChange).toHaveBeenLastCalledWith(false)
      expect(onCheckedChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('disabled', () => {
    it('blocks toggling until re-enabled', async () => {
      const onCheckedChange = vi.fn()
      const { rerender } = render(<DefaultSwitch disabled onCheckedChange={onCheckedChange} />)

      await user.click(getControl())
      expect(getControl().getAttribute('aria-checked')).toBe('false')
      expect(onCheckedChange).not.toHaveBeenCalled()

      rerender(<DefaultSwitch onCheckedChange={onCheckedChange} />)
      await user.click(getControl())
      expect(getControl().getAttribute('aria-checked')).toBe('true')
    })

    it('marks every part for assistive tech and styling', () => {
      render(<DefaultSwitch disabled />)
      expect(getControl().getAttribute('aria-disabled')).toBe('true')
      expect(getControl().hasAttribute('data-disabled')).toBe(true)
      expect(screen.getByTestId('thumb').hasAttribute('data-disabled')).toBe(true)
      expect(screen.getByTestId('label').hasAttribute('data-disabled')).toBe(true)
    })
  })

  describe('controlled checked', () => {
    it('follows the checked prop in both directions', () => {
      const { rerender } = render(<DefaultSwitch checked={false} />)
      expect(getControl().getAttribute('aria-checked')).toBe('false')

      rerender(<DefaultSwitch checked />)
      expect(getControl().getAttribute('aria-checked')).toBe('true')

      rerender(<DefaultSwitch checked={false} />)
      expect(getControl().getAttribute('aria-checked')).toBe('false')
    })

    it('reports the toggle intent through onCheckedChange', async () => {
      const onCheckedChange = vi.fn()
      render(<DefaultSwitch checked={false} onCheckedChange={onCheckedChange} />)

      await user.click(getControl())
      expect(onCheckedChange).toHaveBeenLastCalledWith(true)
      // Controlled is a sync contract, not a hard gate: the flip applies
      // immediately; the prop pulls it back only when its value changes.
      expect(getControl().getAttribute('aria-checked')).toBe('true')
    })
  })

  describe('aria wiring', () => {
    it('control is labelled by the rendered Label', () => {
      render(<DefaultSwitch />)
      const control = screen.getByRole('switch', { name: 'Airplane mode' })
      expect(control.getAttribute('aria-labelledby')).toBe(screen.getByTestId('label').id)
    })

    it('leaves no dangling label reference when no Label is rendered', () => {
      render(
        <Switch>
          <Switch.Control aria-label='Mute'>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>,
      )
      const control = screen.getByRole('switch', { name: 'Mute' })
      expect(control.hasAttribute('aria-labelledby')).toBe(false)
    })

    it('parts carry data-state as the styling hook', async () => {
      render(<DefaultSwitch />)
      expect(getControl().getAttribute('data-state')).toBe('unchecked')
      expect(screen.getByTestId('thumb').getAttribute('data-state')).toBe('unchecked')
      expect(screen.getByTestId('label').getAttribute('data-state')).toBe('unchecked')

      await user.click(getControl())
      expect(screen.getByTestId('thumb').getAttribute('data-state')).toBe('checked')
    })
  })
})
