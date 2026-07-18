// @vitest-environment jsdom
// The React edge of the popover — behavior only; the machine's own contract is
// covered in @dunky.dev/popover's tests.
import { useRef } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Popover, type PopoverProps } from '@dunky.dev/react-popover'

const DefaultPopover = (props: PopoverProps) => (
  <Popover {...props}>
    <Popover.Trigger>Trigger</Popover.Trigger>
    <Popover.Portal>
      <Popover.Content data-testid='content'>
        <Popover.Title>Title</Popover.Title>
        <Popover.Description>Description</Popover.Description>
        <button type='button'>Action</button>
        <Popover.Close>Close</Popover.Close>
      </Popover.Content>
    </Popover.Portal>
  </Popover>
)

const openPopover = (): void => {
  act(() => screen.getByText('Trigger').click())
}

const pressEscape = (): void => {
  fireEvent.keyDown(document.body, { key: 'Escape' })
}

const pressOutside = (): void => {
  fireEvent.pointerDown(document.body)
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Popover', () => {
  describe('open / close', () => {
    it('opens on trigger press and closes on close press', () => {
      render(<DefaultPopover />)
      expect(screen.queryByRole('dialog')).toBeNull()

      openPopover()
      expect(screen.queryByRole('dialog')).not.toBeNull()

      act(() => screen.getByText('Close').click())
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('renders open when defaultOpen', () => {
      render(<DefaultPopover defaultOpen />)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('fires onOpenChange with the new value on open and close', () => {
      const onOpenChange = vi.fn()
      render(<DefaultPopover onOpenChange={onOpenChange} />)

      openPopover()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)

      act(() => screen.getByText('Close').click())
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })

    it('a trigger press while open toggles closed in one motion — no dismiss-then-reopen', () => {
      const onOpenChange = vi.fn()
      render(<DefaultPopover defaultOpen onOpenChange={onOpenChange} />)
      const trigger = screen.getByText('Trigger')

      // A real press is pointerdown (outside-detection territory) then click.
      fireEvent.pointerDown(trigger)
      act(() => trigger.click())

      expect(screen.queryByRole('dialog')).toBeNull()
      expect(onOpenChange).toHaveBeenCalledTimes(1)
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })
  })

  describe('escape key', () => {
    it('closes on Escape', () => {
      render(<DefaultPopover defaultOpen />)
      act(pressEscape)
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('stays open when closeOnEscape=false', () => {
      render(<DefaultPopover defaultOpen closeOnEscape={false} />)
      act(pressEscape)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('stays open when onEscapeKeyDown prevents default', () => {
      const onEscapeKeyDown = vi.fn(event => event.preventDefault())
      render(<DefaultPopover defaultOpen onEscapeKeyDown={onEscapeKeyDown} />)
      act(pressEscape)
      expect(onEscapeKeyDown).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })
  })

  describe('outside interaction', () => {
    it('closes on a press outside the panel', () => {
      render(<DefaultPopover defaultOpen />)
      act(pressOutside)
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('does not close on a press inside the panel', () => {
      render(<DefaultPopover defaultOpen />)
      fireEvent.pointerDown(screen.getByText('Action'))
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('closes when focus moves outside the panel', () => {
      render(
        <>
          <DefaultPopover defaultOpen />
          <button type='button'>Elsewhere</button>
        </>,
      )
      act(() => screen.getByText('Elsewhere').focus())
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('stays open when closeOnInteractOutside=false', () => {
      render(<DefaultPopover defaultOpen closeOnInteractOutside={false} />)
      act(pressOutside)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('stays open when onInteractOutside prevents default', () => {
      const onInteractOutside = vi.fn(event => event?.preventDefault())
      render(<DefaultPopover defaultOpen onInteractOutside={onInteractOutside} />)
      act(pressOutside)
      expect(onInteractOutside).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    // Focus-out rides `focusin`, which is not cancelable — the veto must work
    // through the payload, not the native event.
    it('honors the onInteractOutside veto for a focus-out dismissal', () => {
      const onInteractOutside = vi.fn(event => event?.preventDefault())
      render(
        <>
          <DefaultPopover defaultOpen onInteractOutside={onInteractOutside} />
          <button type='button'>Elsewhere</button>
        </>,
      )
      act(() => screen.getByText('Elsewhere').focus())
      expect(onInteractOutside).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })
  })

  describe('controlled open', () => {
    it('follows the open prop in both directions', () => {
      const { rerender } = render(<DefaultPopover open={false} />)
      expect(screen.queryByRole('dialog')).toBeNull()

      rerender(<DefaultPopover open />)
      expect(screen.queryByRole('dialog')).not.toBeNull()

      rerender(<DefaultPopover open={false} />)
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('reports a dismissal intent but stays open until the prop closes it', () => {
      const onOpenChange = vi.fn()
      render(<DefaultPopover open onOpenChange={onOpenChange} />)
      act(pressEscape)
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
      // The consumer didn't update `open` — that's the veto.
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('reports a trigger press without opening until the prop does', () => {
      const onOpenChange = vi.fn()
      render(<DefaultPopover open={false} onOpenChange={onOpenChange} />)
      openPopover()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  describe('aria wiring', () => {
    it('trigger exposes the popup relationship', () => {
      render(<DefaultPopover />)
      const trigger = screen.getByText('Trigger')
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')

      openPopover()
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(trigger.getAttribute('aria-controls')).toBe(screen.getByRole('dialog').id)
    })

    it('content renders a div with the dialog role and no aria-modal by default', () => {
      render(<DefaultPopover defaultOpen />)
      const content = screen.getByRole('dialog')
      expect(content.tagName).toBe('DIV')
      expect(content.hasAttribute('aria-modal')).toBe(false)
    })

    it('content carries aria-modal when modal', () => {
      render(<DefaultPopover defaultOpen modal />)
      expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true')
    })

    it('content is labelled by the Title and described by the Description', () => {
      render(<DefaultPopover defaultOpen />)
      const content = screen.getByRole('dialog', { name: 'Title' })

      const describedBy = content.getAttribute('aria-describedby')
      expect(describedBy).not.toBeNull()
      expect(document.getElementById(describedBy as string)?.textContent).toBe('Description')
    })

    it('supports aria-label on Content when no Title is rendered', () => {
      render(
        <Popover defaultOpen>
          <Popover.Portal>
            <Popover.Content aria-label='Filters'>content</Popover.Content>
          </Popover.Portal>
        </Popover>,
      )
      const content = screen.getByRole('dialog', { name: 'Filters' })
      expect(content.hasAttribute('aria-labelledby')).toBe(false)
      expect(content.hasAttribute('aria-describedby')).toBe(false)
    })
  })

  describe('focus management', () => {
    it('moves focus to the first focusable element on open and restores the trigger on close', () => {
      render(<DefaultPopover />)
      const trigger = screen.getByText('Trigger')
      act(() => trigger.focus())

      openPopover()
      expect(document.activeElement).toBe(screen.getByText('Action'))

      act(pressEscape)
      expect(document.activeElement).toBe(trigger)
    })

    it('leaves focus where the user sent it on a focus-out dismissal', () => {
      render(
        <>
          <DefaultPopover defaultOpen />
          <button type='button'>Elsewhere</button>
        </>,
      )
      const elsewhere = screen.getByText('Elsewhere')
      act(() => elsewhere.focus())
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(document.activeElement).toBe(elsewhere)
    })

    it('moves focus to the initialFocus element on open', () => {
      const InitialFocusPopover = () => {
        const initialFocus = useRef<HTMLButtonElement>(null)
        return (
          <Popover defaultOpen>
            <Popover.Portal>
              <Popover.Content aria-label='Filters' initialFocus={initialFocus}>
                <button type='button'>First</button>
                <button type='button' ref={initialFocus}>
                  Designated
                </button>
              </Popover.Content>
            </Popover.Portal>
          </Popover>
        )
      }
      render(<InitialFocusPopover />)
      expect(document.activeElement).toBe(screen.getByText('Designated'))
    })

    it('falls back to the first focusable when the initialFocus target cannot take focus', () => {
      const DisabledInitialFocus = () => {
        const initialFocus = useRef<HTMLButtonElement>(null)
        return (
          <Popover defaultOpen>
            <Popover.Portal>
              <Popover.Content aria-label='Filters' initialFocus={initialFocus}>
                <button type='button'>First</button>
                <button type='button' disabled ref={initialFocus}>
                  Designated
                </button>
              </Popover.Content>
            </Popover.Portal>
          </Popover>
        )
      }
      render(<DisabledInitialFocus />)
      expect(document.activeElement).toBe(screen.getByText('First'))
    })

    it('falls back to the panel itself when it has no focusables', () => {
      render(
        <Popover defaultOpen>
          <Popover.Portal>
            <Popover.Content aria-label='Note'>plain text</Popover.Content>
          </Popover.Portal>
        </Popover>,
      )
      expect(document.activeElement).toBe(screen.getByRole('dialog'))
    })

    it('does not trap Tab while non-modal', () => {
      render(<DefaultPopover defaultOpen />)
      const close = screen.getByText('Close')
      act(() => close.focus())

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })
      expect(document.activeElement).toBe(close) // no wrap — the browser owns Tab
    })

    it('traps Tab inside the panel while modal', () => {
      render(<DefaultPopover defaultOpen modal />)
      act(() => screen.getByText('Close').focus())

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })
      expect(document.activeElement).toBe(screen.getByText('Action')) // wrapped
    })
  })

  describe('assistive-tech containment', () => {
    it('hides the page around the panel only while modal', () => {
      const { container } = render(<DefaultPopover defaultOpen modal />)
      expect(container.getAttribute('aria-hidden')).toBe('true')
      expect(container.hasAttribute('inert')).toBe(true)
    })

    it('hides nothing while non-modal', () => {
      const { container } = render(<DefaultPopover defaultOpen />)
      expect(container.hasAttribute('aria-hidden')).toBe(false)
      expect(container.hasAttribute('inert')).toBe(false)
    })
  })

  describe('portal', () => {
    it('teleports the panel into a supplied container', () => {
      const host = document.createElement('div')
      document.body.append(host)

      render(
        <Popover defaultOpen>
          <Popover.Portal container={host}>
            <Popover.Content aria-label='Scoped'>content</Popover.Content>
          </Popover.Portal>
        </Popover>,
      )
      expect(host.contains(screen.getByRole('dialog'))).toBe(true)
      host.remove()
    })
  })

  describe('nesting', () => {
    const NestedPopover = () => (
      <Popover defaultOpen>
        <Popover.Trigger>Outer trigger</Popover.Trigger>
        <Popover.Portal>
          <Popover.Content aria-label='Outer' data-testid='outer'>
            <Popover defaultOpen>
              <Popover.Trigger>Inner trigger</Popover.Trigger>
              <Popover.Portal>
                <Popover.Content aria-label='Inner' data-testid='inner'>
                  <button type='button'>Inner action</button>
                </Popover.Content>
              </Popover.Portal>
            </Popover>
          </Popover.Content>
        </Popover.Portal>
      </Popover>
    )

    it('Escape dismisses the topmost popover only, one layer per press', () => {
      render(<NestedPopover />)
      expect(screen.queryByTestId('inner')).not.toBeNull()

      act(pressEscape)
      expect(screen.queryByTestId('inner')).toBeNull()
      expect(screen.queryByTestId('outer')).not.toBeNull()

      act(pressEscape)
      expect(screen.queryByTestId('outer')).toBeNull()
    })

    it('a press inside the nested panel is not outside the one beneath', () => {
      render(<NestedPopover />)
      fireEvent.pointerDown(screen.getByText('Inner action'))
      expect(screen.queryByTestId('inner')).not.toBeNull()
      expect(screen.queryByTestId('outer')).not.toBeNull()
    })

    it('an outside press dismisses the topmost popover only, one layer per press', () => {
      render(<NestedPopover />)

      act(pressOutside)
      expect(screen.queryByTestId('inner')).toBeNull()
      expect(screen.queryByTestId('outer')).not.toBeNull()

      act(pressOutside)
      expect(screen.queryByTestId('outer')).toBeNull()
    })
  })
})
