// @vitest-environment jsdom
// The React edge of the Collapsible — behavior only; the machine's own contract
// is covered in @dunky.dev/collapsible's tests.
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Collapsible, type CollapsibleProps } from '@dunky.dev/react-collapsible'

const DefaultCollapsible = (props: CollapsibleProps) => (
  <Collapsible {...props}>
    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
    <Collapsible.Content data-testid='content'>Content</Collapsible.Content>
  </Collapsible>
)

const trigger = (): HTMLElement => screen.getByRole('button', { name: 'Toggle' })
const content = (): HTMLElement => screen.getByTestId('content')
const pressTrigger = (): void => {
  act(() => trigger().click())
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Collapsible', () => {
  describe('open / close', () => {
    it('opens on trigger press and closes on a second press', () => {
      render(<DefaultCollapsible />)
      expect(content().hasAttribute('hidden')).toBe(true)

      pressTrigger()
      expect(content().hasAttribute('hidden')).toBe(false)

      pressTrigger()
      expect(content().hasAttribute('hidden')).toBe(true)
    })

    it('renders open when defaultOpen', () => {
      render(<DefaultCollapsible defaultOpen />)
      expect(content().hasAttribute('hidden')).toBe(false)
    })

    it('fires onOpenChange with the new value on open and close', () => {
      const onOpenChange = vi.fn()
      render(<DefaultCollapsible onOpenChange={onOpenChange} />)

      pressTrigger()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)

      pressTrigger()
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })
  })

  describe('disabled', () => {
    it('blocks toggling and marks the parts', () => {
      const onOpenChange = vi.fn()
      render(<DefaultCollapsible disabled onOpenChange={onOpenChange} />)

      pressTrigger()
      expect(content().hasAttribute('hidden')).toBe(true)
      expect(onOpenChange).not.toHaveBeenCalled()

      expect(trigger().getAttribute('aria-disabled')).toBe('true')
      expect(trigger().hasAttribute('data-disabled')).toBe(true)
      expect(content().hasAttribute('data-disabled')).toBe(true)
    })

    it('keeps the trigger focusable so the state stays perceivable', () => {
      render(<DefaultCollapsible disabled />)
      expect(trigger().hasAttribute('disabled')).toBe(false)
      act(() => trigger().focus())
      expect(document.activeElement).toBe(trigger())
    })

    it('released at runtime, the trigger toggles again and the marks lift', () => {
      const { rerender } = render(<DefaultCollapsible disabled />)
      rerender(<DefaultCollapsible />)

      expect(trigger().hasAttribute('data-disabled')).toBe(false)
      pressTrigger()
      expect(content().hasAttribute('hidden')).toBe(false)
    })
  })

  describe('controlled open', () => {
    it('follows the open prop in both directions', () => {
      const { rerender } = render(<DefaultCollapsible open={false} />)
      expect(content().hasAttribute('hidden')).toBe(true)

      rerender(<DefaultCollapsible open />)
      expect(content().hasAttribute('hidden')).toBe(false)

      rerender(<DefaultCollapsible open={false} />)
      expect(content().hasAttribute('hidden')).toBe(true)
    })

    // Pins the follow + report contract (see the core SPEC): a user toggle
    // still moves state even when the prop is constant — the primitive never
    // re-asserts it; the consumer feeds the reported value back into `open`.
    it('reports user intent through onOpenChange and still moves', () => {
      const onOpenChange = vi.fn()
      render(<DefaultCollapsible open onOpenChange={onOpenChange} />)
      pressTrigger()
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
      expect(content().hasAttribute('hidden')).toBe(true)
    })
  })

  describe('aria wiring', () => {
    it('trigger exposes the disclosure relationship', () => {
      render(<DefaultCollapsible />)
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(trigger().getAttribute('aria-controls')).toBe(content().id)

      pressTrigger()
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(trigger().getAttribute('aria-controls')).toBe(content().id)
    })

    it('content is hidden from the accessibility tree only while closed', () => {
      render(<DefaultCollapsible />)
      expect(content().getAttribute('aria-hidden')).toBe('true')

      pressTrigger()
      expect(content().hasAttribute('aria-hidden')).toBe(false)
    })

    it('parts expose data-state for styling/animation', () => {
      render(<DefaultCollapsible />)
      expect(trigger().getAttribute('data-state')).toBe('closed')
      expect(content().getAttribute('data-state')).toBe('closed')

      pressTrigger()
      expect(trigger().getAttribute('data-state')).toBe('open')
      expect(content().getAttribute('data-state')).toBe('open')
    })
  })
})
