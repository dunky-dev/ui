// @vitest-environment jsdom
// The React edge of the Tooltip — behavior only; the machine's own contract is
// covered in @dunky.dev/tooltip's tests.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Tooltip, type TooltipProps } from '@dunky.dev/react-tooltip'

const OPEN_DELAY = 700
const CLOSE_DELAY = 300

const DefaultTooltip = (props: TooltipProps) => (
  <Tooltip {...props}>
    <Tooltip.Trigger>Trigger</Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content>Tip</Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip>
)

const trigger = (): HTMLElement => screen.getByText('Trigger')

// React synthesizes onPointerEnter/onPointerLeave from over/out pairs.
const hover = (element: HTMLElement): void => {
  fireEvent.pointerOver(element)
}
const unhover = (element: HTMLElement): void => {
  fireEvent.pointerOut(element)
}
const elapse = (ms: number): void => {
  act(() => vi.advanceTimersByTime(ms))
}

// The delay transitions ride on setTimeout; RTL auto-cleanup needs vitest
// globals, and this repo runs with globals: false.
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Tooltip', () => {
  describe('hover', () => {
    it('shows only after the open delay', () => {
      render(<DefaultTooltip />)
      hover(trigger())
      expect(screen.queryByRole('tooltip')).toBeNull()

      elapse(OPEN_DELAY)
      expect(screen.queryByRole('tooltip')).not.toBeNull()
    })

    it('hides only after the close delay', () => {
      render(<DefaultTooltip defaultOpen />)
      unhover(trigger())
      expect(screen.queryByRole('tooltip')).not.toBeNull()

      elapse(CLOSE_DELAY)
      expect(screen.queryByRole('tooltip')).toBeNull()
    })

    it('stays open when the trigger is re-entered during the close delay', () => {
      render(<DefaultTooltip defaultOpen />)
      unhover(trigger())
      hover(trigger())

      elapse(CLOSE_DELAY)
      expect(screen.queryByRole('tooltip')).not.toBeNull()
    })

    it('stays open when the pointer moves into the content, and hides after leaving it', () => {
      render(<DefaultTooltip defaultOpen />)
      unhover(trigger())
      hover(screen.getByRole('tooltip'))

      elapse(CLOSE_DELAY)
      expect(screen.queryByRole('tooltip')).not.toBeNull()

      unhover(screen.getByRole('tooltip'))
      elapse(CLOSE_DELAY)
      expect(screen.queryByRole('tooltip')).toBeNull()
    })

    it('honors custom delays', () => {
      render(<DefaultTooltip openDelay={50} closeDelay={50} />)
      hover(trigger())
      elapse(50)
      expect(screen.queryByRole('tooltip')).not.toBeNull()

      unhover(trigger())
      elapse(50)
      expect(screen.queryByRole('tooltip')).toBeNull()
    })
  })

  describe('keyboard', () => {
    it('shows immediately on focus and hides immediately on blur', () => {
      render(<DefaultTooltip />)
      act(() => trigger().focus())
      expect(screen.queryByRole('tooltip')).not.toBeNull()

      act(() => trigger().blur())
      expect(screen.queryByRole('tooltip')).toBeNull()
    })

    it('hides immediately on Escape, wherever focus is', () => {
      render(<DefaultTooltip defaultOpen />)
      fireEvent.keyDown(document.body, { key: 'Escape' })
      expect(screen.queryByRole('tooltip')).toBeNull()
    })
  })

  describe('trigger press', () => {
    it('hides immediately on pointerdown, and the focus it causes does not reopen', () => {
      render(<DefaultTooltip defaultOpen />)
      fireEvent.pointerDown(trigger())
      expect(screen.queryByRole('tooltip')).toBeNull()

      act(() => trigger().focus())
      expect(screen.queryByRole('tooltip')).toBeNull()
    })

    it('hides on keyboard activation (Enter/Space fire click, no pointer events)', () => {
      render(<DefaultTooltip />)
      act(() => trigger().focus())
      expect(screen.queryByRole('tooltip')).not.toBeNull()

      fireEvent.click(trigger())
      expect(screen.queryByRole('tooltip')).toBeNull()
    })
  })

  describe('controlled open', () => {
    it('follows the open prop in both directions', () => {
      const { rerender } = render(<DefaultTooltip open={false} />)
      expect(screen.queryByRole('tooltip')).toBeNull()

      rerender(<DefaultTooltip open />)
      expect(screen.queryByRole('tooltip')).not.toBeNull()

      rerender(<DefaultTooltip open={false} />)
      expect(screen.queryByRole('tooltip')).toBeNull()
    })

    it('reports internal dismissal intent through onOpenChange', () => {
      const onOpenChange = vi.fn()
      render(<DefaultTooltip open onOpenChange={onOpenChange} />)
      fireEvent.keyDown(document.body, { key: 'Escape' })
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })
  })

  describe('callbacks', () => {
    it('fires onOpenChange with the new value on show and hide', () => {
      const onOpenChange = vi.fn()
      render(<DefaultTooltip onOpenChange={onOpenChange} />)

      act(() => trigger().focus())
      expect(onOpenChange).toHaveBeenLastCalledWith(true)

      act(() => trigger().blur())
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
      expect(onOpenChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('aria wiring', () => {
    it('content is the trigger description only while shown', () => {
      render(<DefaultTooltip />)
      expect(trigger().hasAttribute('aria-describedby')).toBe(false)

      act(() => trigger().focus())
      const tooltip = screen.getByRole('tooltip')
      expect(trigger().getAttribute('aria-describedby')).toBe(tooltip.id)
      expect(tooltip.textContent).toBe('Tip')
    })

    it('parts expose the full lifecycle as data-state', () => {
      render(<DefaultTooltip />)
      expect(trigger().getAttribute('data-state')).toBe('closed')

      hover(trigger())
      expect(trigger().getAttribute('data-state')).toBe('opening')

      elapse(OPEN_DELAY)
      expect(screen.getByRole('tooltip').getAttribute('data-state')).toBe('open')

      unhover(trigger())
      expect(screen.getByRole('tooltip').getAttribute('data-state')).toBe('closing')
    })
  })

  describe('portal', () => {
    it('teleports the content into document.body by default', () => {
      const { container } = render(<DefaultTooltip defaultOpen />)
      const tooltip = screen.getByRole('tooltip')
      expect(container.contains(tooltip)).toBe(false)
      expect(tooltip.parentElement).toBe(document.body)
    })

    it('teleports into a supplied container', () => {
      const panel = document.createElement('div')
      document.body.append(panel)

      render(
        <Tooltip defaultOpen>
          <Tooltip.Trigger>Trigger</Tooltip.Trigger>
          <Tooltip.Portal container={panel}>
            <Tooltip.Content>Tip</Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip>,
      )
      expect(screen.getByRole('tooltip').parentElement).toBe(panel)
      panel.remove()
    })
  })
})
