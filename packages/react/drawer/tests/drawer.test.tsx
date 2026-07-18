// @vitest-environment jsdom
// The React edge of the Drawer — behavior only; the machine's own contract is
// covered in @dunky.dev/drawer's tests.
import { useRef } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Drawer, type DrawerProps } from '@dunky.dev/react-drawer'

const DefaultDrawer = (props: DrawerProps) => (
  <Drawer {...props}>
    <Drawer.Trigger>Trigger</Drawer.Trigger>
    <Drawer.Portal>
      <Drawer.Backdrop data-testid='backdrop' />
      <Drawer.Viewport data-testid='viewport'>
        <Drawer.Content>
          <Drawer.Title>Title</Drawer.Title>
          <Drawer.Description>Description</Drawer.Description>
          <button type='button'>Action</button>
          <Drawer.Close>Close</Drawer.Close>
        </Drawer.Content>
      </Drawer.Viewport>
    </Drawer.Portal>
  </Drawer>
)

const openDrawer = (): void => {
  act(() => screen.getByText('Trigger').click())
}

const pressEscape = (): void => {
  fireEvent.keyDown(document.body, { key: 'Escape' })
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Drawer', () => {
  describe('open / close', () => {
    it('opens on trigger press and closes on close press', () => {
      render(<DefaultDrawer />)
      expect(screen.queryByRole('dialog')).toBeNull()

      openDrawer()
      expect(screen.queryByRole('dialog')).not.toBeNull()

      act(() => screen.getByText('Close').click())
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('renders open when defaultOpen', () => {
      render(<DefaultDrawer defaultOpen />)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('fires onOpenChange with the new value on open and close', () => {
      const onOpenChange = vi.fn()
      render(<DefaultDrawer onOpenChange={onOpenChange} />)

      openDrawer()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)

      act(() => screen.getByText('Close').click())
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })
  })

  describe('escape key', () => {
    it('closes on Escape', () => {
      render(<DefaultDrawer defaultOpen />)
      act(pressEscape)
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('stays open when closeOnEscape=false', () => {
      render(<DefaultDrawer defaultOpen closeOnEscape={false} />)
      act(pressEscape)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('stays open when onEscapeKeyDown prevents default', () => {
      const onEscapeKeyDown = vi.fn(event => event.preventDefault())
      render(<DefaultDrawer defaultOpen onEscapeKeyDown={onEscapeKeyDown} />)
      act(pressEscape)
      expect(onEscapeKeyDown).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })
  })

  describe('outside interaction', () => {
    it('closes on backdrop press', () => {
      render(<DefaultDrawer defaultOpen />)
      act(() => screen.getByTestId('backdrop').click())
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('stays open when closeOnInteractOutside=false', () => {
      render(<DefaultDrawer defaultOpen closeOnInteractOutside={false} />)
      act(() => screen.getByTestId('backdrop').click())
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('stays open when onInteractOutside prevents default', () => {
      const onInteractOutside = vi.fn(event => event?.preventDefault())
      render(<DefaultDrawer defaultOpen onInteractOutside={onInteractOutside} />)
      act(() => screen.getByTestId('backdrop').click())
      expect(onInteractOutside).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('closes on a press on the viewport around the panel', () => {
      render(<DefaultDrawer defaultOpen />)
      act(() => screen.getByTestId('viewport').click())
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('does not close when a press inside the panel bubbles to the viewport', () => {
      render(<DefaultDrawer defaultOpen />)
      act(() => screen.getByText('Action').click())
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })
  })

  describe('controlled open', () => {
    it('follows the open prop in both directions', () => {
      const { rerender } = render(<DefaultDrawer open={false} />)
      expect(screen.queryByRole('dialog')).toBeNull()

      rerender(<DefaultDrawer open />)
      expect(screen.queryByRole('dialog')).not.toBeNull()

      rerender(<DefaultDrawer open={false} />)
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('reports a dismissal intent but stays open until the prop closes it', () => {
      const onOpenChange = vi.fn()
      render(<DefaultDrawer open onOpenChange={onOpenChange} />)
      act(pressEscape)
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
      // The consumer didn't update `open` — that's the veto.
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('reports a trigger press without opening until the prop does', () => {
      const onOpenChange = vi.fn()
      render(<DefaultDrawer open={false} onOpenChange={onOpenChange} />)
      openDrawer()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  describe('placement', () => {
    it('stamps data-placement on the visual layers, defaulting to right', () => {
      render(<DefaultDrawer defaultOpen />)
      expect(screen.getByTestId('backdrop').getAttribute('data-placement')).toBe('right')
      expect(screen.getByTestId('viewport').getAttribute('data-placement')).toBe('right')
      expect(screen.getByRole('dialog').getAttribute('data-placement')).toBe('right')
    })

    it('carries the configured placement', () => {
      render(<DefaultDrawer defaultOpen placement='left' />)
      expect(screen.getByRole('dialog').getAttribute('data-placement')).toBe('left')
    })

    it('leaves the trigger without a placement hook', () => {
      render(<DefaultDrawer defaultOpen />)
      expect(screen.getByText('Trigger').hasAttribute('data-placement')).toBe(false)
    })
  })

  describe('aria wiring', () => {
    it('trigger exposes the popup relationship', () => {
      render(<DefaultDrawer />)
      const trigger = screen.getByText('Trigger')
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')

      openDrawer()
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(trigger.getAttribute('aria-controls')).toBe(screen.getByRole('dialog').id)
    })

    it('renders the native dialog element, marked open and modal', () => {
      render(<DefaultDrawer defaultOpen />)
      const panel = screen.getByRole('dialog')
      expect(panel.tagName).toBe('DIALOG')
      expect(panel.hasAttribute('open')).toBe(true)
      expect(panel.getAttribute('aria-modal')).toBe('true')
    })

    it('panel is labelled by the Title and described by the Description', () => {
      render(<DefaultDrawer defaultOpen />)
      const panel = screen.getByRole('dialog', { name: 'Title' })

      const describedBy = panel.getAttribute('aria-describedby')
      expect(describedBy).not.toBeNull()
      expect(document.getElementById(describedBy as string)?.textContent).toBe('Description')
    })

    it('supports aria-label on Content when no Title is rendered', () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Portal>
            <Drawer.Content aria-label='Settings'>content</Drawer.Content>
          </Drawer.Portal>
        </Drawer>,
      )
      const panel = screen.getByRole('dialog', { name: 'Settings' })
      expect(panel.hasAttribute('aria-labelledby')).toBe(false)
      expect(panel.hasAttribute('aria-describedby')).toBe(false)
    })
  })

  describe('focus management', () => {
    it('moves focus into the panel on open and restores it on close', () => {
      render(<DefaultDrawer />)
      const trigger = screen.getByText('Trigger')
      act(() => trigger.focus())

      openDrawer()
      expect(document.activeElement).toBe(screen.getByRole('dialog'))

      act(pressEscape)
      expect(document.activeElement).toBe(trigger)
    })

    // jsdom does no layout, so the scroll jump can't be reproduced — assert the
    // mechanism that prevents it: focus never scrolls the locked surface.
    it('moves focus without scrolling the locked surface', () => {
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')
      render(<DefaultDrawer defaultOpen />)

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
      focusSpy.mockRestore()
    })

    it('moves focus to the first form field when the drawer contains one', () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Portal>
            <Drawer.Content aria-label='Form'>
              <button type='button'>Action</button>
              <input aria-label='Name' />
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer>,
      )
      expect(document.activeElement).toBe(screen.getByLabelText('Name'))
    })

    it('wraps Tab from the last focusable to the first', () => {
      render(<DefaultDrawer defaultOpen />)
      const panel = screen.getByRole('dialog')

      act(() => screen.getByText('Close').focus())
      fireEvent.keyDown(panel, { key: 'Tab' })
      expect(document.activeElement).toBe(screen.getByText('Action'))
    })

    it('wraps Shift+Tab from the first focusable to the last', () => {
      render(<DefaultDrawer defaultOpen />)
      const panel = screen.getByRole('dialog')

      act(() => screen.getByText('Action').focus())
      fireEvent.keyDown(panel, { key: 'Tab', shiftKey: true })
      expect(document.activeElement).toBe(screen.getByText('Close'))
    })

    const InitialFocusDrawer = ({ disabled = false }: { disabled?: boolean }) => {
      const initialFocus = useRef<HTMLInputElement>(null)
      return (
        <Drawer defaultOpen>
          <Drawer.Portal>
            <Drawer.Viewport>
              <Drawer.Content aria-label='Form' initialFocus={initialFocus}>
                <input ref={initialFocus} disabled={disabled} aria-label='Name' />
              </Drawer.Content>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer>
      )
    }

    it('moves focus to the initialFocus element on open', () => {
      render(<InitialFocusDrawer />)
      expect(document.activeElement).toBe(screen.getByLabelText('Name'))
    })

    it('falls back to the panel when the initialFocus target cannot take focus', () => {
      render(<InitialFocusDrawer disabled />)
      expect(document.activeElement).toBe(screen.getByRole('dialog'))
    })
  })

  describe('scroll lock', () => {
    it('locks body scroll while the drawer is open', () => {
      render(<DefaultDrawer />)
      openDrawer()
      expect(document.body.style.overflow).toBe('hidden')

      act(pressEscape)
      expect(document.body.style.overflow).not.toBe('hidden')
    })

    it('locks the portal container, not the body, when scoped', () => {
      const panel = document.createElement('div')
      document.body.append(panel)

      render(
        <Drawer defaultOpen>
          <Drawer.Portal container={panel}>
            <Drawer.Content aria-label='Scoped'>content</Drawer.Content>
          </Drawer.Portal>
        </Drawer>,
      )

      expect(panel.style.overflow).toBe('hidden')
      expect(document.body.style.overflow).not.toBe('hidden')

      act(pressEscape)
      expect(panel.style.overflow).not.toBe('hidden')
      panel.remove()
    })
  })

  describe('layer stack', () => {
    const NestedOverlays = (props: DrawerProps) => (
      <Drawer defaultOpen {...props}>
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Viewport data-testid='outer-viewport'>
            <Drawer.Content>
              <Drawer.Title>Outer</Drawer.Title>
              <Drawer defaultOpen placement='left'>
                <Drawer.Portal>
                  <Drawer.Backdrop />
                  <Drawer.Viewport data-testid='inner-viewport'>
                    <Drawer.Content>
                      <Drawer.Title>Inner</Drawer.Title>
                    </Drawer.Content>
                  </Drawer.Viewport>
                </Drawer.Portal>
              </Drawer>
            </Drawer.Content>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer>
    )

    it('Escape dismisses the topmost layer only, one layer per press', () => {
      render(<NestedOverlays />)
      expect(screen.queryByText('Outer')).not.toBeNull()
      expect(screen.queryByText('Inner')).not.toBeNull()

      act(pressEscape)
      expect(screen.queryByText('Inner')).toBeNull()
      expect(screen.queryByText('Outer')).not.toBeNull()

      act(pressEscape)
      expect(screen.queryByText('Outer')).toBeNull()
    })

    it('hides the layer beneath the topmost from assistive tech and restores it on unwind', () => {
      render(<NestedOverlays />)
      const outer = screen.getByTestId('outer-viewport')
      expect(outer.getAttribute('aria-hidden')).toBe('true')
      expect(outer.hasAttribute('inert')).toBe(true)

      const inner = screen.getByTestId('inner-viewport')
      expect(inner.hasAttribute('aria-hidden')).toBe(false)

      act(pressEscape) // close the inner drawer
      expect(outer.hasAttribute('aria-hidden')).toBe(false)
      expect(outer.hasAttribute('inert')).toBe(false)
    })

    it('ignores an outside press on a lower layer — only the topmost dismisses', () => {
      render(<NestedOverlays />)
      act(() => screen.getByTestId('outer-viewport').click())
      expect(screen.queryByText('Outer')).not.toBeNull()
      expect(screen.queryByText('Inner')).not.toBeNull()

      act(() => screen.getByTestId('inner-viewport').click())
      expect(screen.queryByText('Inner')).toBeNull()
      expect(screen.queryByText('Outer')).not.toBeNull()
    })

    it('cleans up containment and scroll lock when the parent closes over an open child', () => {
      const { container, rerender } = render(<NestedOverlays open />)
      expect(screen.queryByText('Inner')).not.toBeNull()
      expect(container.hasAttribute('inert')).toBe(true)

      rerender(<NestedOverlays open={false} />)
      expect(screen.queryByText('Outer')).toBeNull()
      expect(screen.queryByText('Inner')).toBeNull()
      expect(document.body.style.overflow).not.toBe('hidden')
      expect(container.hasAttribute('aria-hidden')).toBe(false)
      expect(container.hasAttribute('inert')).toBe(false)
    })
  })
})
