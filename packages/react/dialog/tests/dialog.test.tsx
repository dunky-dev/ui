// @vitest-environment jsdom
// The React edge of the Dialog — behavior only; the machine's own contract is
// covered in @dunky.dev/dialog's tests.
import { useRef } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dialog, type DialogProps } from '@dunky.dev/react-dialog'

const DefaultDialog = (props: DialogProps) => (
  <Dialog {...props}>
    <Dialog.Trigger>Trigger</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop data-testid='backdrop' />
      <Dialog.Viewport data-testid='viewport'>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
          <button type='button'>Action</button>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
)

const openDialog = (): void => {
  act(() => screen.getByText('Trigger').click())
}

const pressEscape = (): void => {
  fireEvent.keyDown(document.body, { key: 'Escape' })
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Dialog', () => {
  describe('open / close', () => {
    it('opens on trigger press and closes on close press', () => {
      render(<DefaultDialog />)
      expect(screen.queryByRole('dialog')).toBeNull()

      openDialog()
      expect(screen.queryByRole('dialog')).not.toBeNull()

      act(() => screen.getByText('Close').click())
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('renders open when defaultOpen', () => {
      render(<DefaultDialog defaultOpen />)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('fires onOpenChange with the new value on open and close', () => {
      const onOpenChange = vi.fn()
      render(<DefaultDialog onOpenChange={onOpenChange} />)

      openDialog()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)

      act(() => screen.getByText('Close').click())
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })
  })

  describe('escape key', () => {
    it('closes on Escape', () => {
      render(<DefaultDialog defaultOpen />)
      act(pressEscape)
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('stays open when closeOnEscape=false', () => {
      render(<DefaultDialog defaultOpen closeOnEscape={false} />)
      act(pressEscape)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('stays open when onEscapeKeyDown prevents default', () => {
      const onEscapeKeyDown = vi.fn(event => event.preventDefault())
      render(<DefaultDialog defaultOpen onEscapeKeyDown={onEscapeKeyDown} />)
      act(pressEscape)
      expect(onEscapeKeyDown).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })
  })

  describe('outside interaction', () => {
    it('closes on backdrop press', () => {
      render(<DefaultDialog defaultOpen />)
      act(() => screen.getByTestId('backdrop').click())
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    // The backdrop is portalled alongside the viewport, outside the content's
    // subtree — the containment walk must except it, or `inert` would swallow
    // real pointer presses on it (jsdom's .click() bypasses hit-testing, so
    // only the attributes can assert this).
    it('keeps its own backdrop pressable while the page around it is inert', () => {
      const { container } = render(<DefaultDialog defaultOpen />)
      expect(container.hasAttribute('inert')).toBe(true)

      const backdrop = screen.getByTestId('backdrop')
      expect(backdrop.hasAttribute('aria-hidden')).toBe(false)
      expect(backdrop.hasAttribute('inert')).toBe(false)
    })

    it('stays open when closeOnInteractOutside=false', () => {
      render(<DefaultDialog defaultOpen closeOnInteractOutside={false} />)
      act(() => screen.getByTestId('backdrop').click())
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('stays open when onInteractOutside prevents default', () => {
      const onInteractOutside = vi.fn(event => event?.preventDefault())
      render(<DefaultDialog defaultOpen onInteractOutside={onInteractOutside} />)
      act(() => screen.getByTestId('backdrop').click())
      expect(onInteractOutside).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('alertdialog does not dismiss on backdrop press by default', () => {
      render(<DefaultDialog defaultOpen role='alertdialog' />)
      act(() => screen.getByTestId('backdrop').click())
      expect(screen.queryByRole('alertdialog')).not.toBeNull()
    })

    it('closes on a press on the viewport around the content', () => {
      render(<DefaultDialog defaultOpen />)
      act(() => screen.getByTestId('viewport').click())
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('does not close when a press inside the content bubbles to the viewport', () => {
      render(<DefaultDialog defaultOpen />)
      act(() => screen.getByText('Action').click())
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('renders no backdrop when modal=false', () => {
      render(<DefaultDialog defaultOpen modal={false} />)
      expect(screen.queryByTestId('backdrop')).toBeNull()
    })
  })

  describe('controlled open', () => {
    it('follows the open prop in both directions', () => {
      const { rerender } = render(<DefaultDialog open={false} />)
      expect(screen.queryByRole('dialog')).toBeNull()

      rerender(<DefaultDialog open />)
      expect(screen.queryByRole('dialog')).not.toBeNull()

      rerender(<DefaultDialog open={false} />)
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('a dismissal neither closes nor fires onOpenChange — nothing changed', () => {
      const onOpenChange = vi.fn()
      render(<DefaultDialog open onOpenChange={onOpenChange} />)
      act(pressEscape)
      expect(onOpenChange).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('a trigger press neither opens nor fires onOpenChange', () => {
      const onOpenChange = vi.fn()
      render(<DefaultDialog open={false} onOpenChange={onOpenChange} />)
      openDialog()
      expect(onOpenChange).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('reports a prop-driven change through onOpenChange', () => {
      const onOpenChange = vi.fn()
      const { rerender } = render(<DefaultDialog open={false} onOpenChange={onOpenChange} />)
      rerender(<DefaultDialog open onOpenChange={onOpenChange} />)
      expect(onOpenChange).toHaveBeenLastCalledWith(true)
      expect(onOpenChange).toHaveBeenCalledTimes(1)
    })

    it('dropping the open prop rewires the dialog uncontrolled where it stands', () => {
      const onOpenChange = vi.fn()
      const { rerender } = render(<DefaultDialog open onOpenChange={onOpenChange} />)
      rerender(<DefaultDialog onOpenChange={onOpenChange} />)
      expect(screen.queryByRole('dialog')).not.toBeNull() // stays where it was

      act(pressEscape) // uncontrolled now: dismissal works again
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })
  })

  describe('aria wiring', () => {
    it('trigger exposes the popup relationship', () => {
      render(<DefaultDialog />)
      const trigger = screen.getByText('Trigger')
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')

      openDialog()
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(trigger.getAttribute('aria-controls')).toBe(screen.getByRole('dialog').id)
    })

    it('renders the native dialog element, marked open', () => {
      render(<DefaultDialog defaultOpen />)
      const dialog = screen.getByRole('dialog')
      expect(dialog.tagName).toBe('DIALOG')
      expect(dialog.hasAttribute('open')).toBe(true)
    })

    it('content is labelled by the Title and described by the Description', () => {
      render(<DefaultDialog defaultOpen />)
      const dialog = screen.getByRole('dialog', { name: 'Title' })
      expect(dialog.getAttribute('aria-modal')).toBe('true')

      const describedBy = dialog.getAttribute('aria-describedby')
      expect(describedBy).not.toBeNull()
      expect(document.getElementById(describedBy as string)?.textContent).toBe('Description')
    })

    it('supports aria-label on Content when no Title is rendered', () => {
      render(
        <Dialog defaultOpen>
          <Dialog.Portal>
            <Dialog.Content aria-label='Settings'>content</Dialog.Content>
          </Dialog.Portal>
        </Dialog>,
      )
      const dialog = screen.getByRole('dialog', { name: 'Settings' })
      expect(dialog.hasAttribute('aria-labelledby')).toBe(false)
      expect(dialog.hasAttribute('aria-describedby')).toBe(false)
    })

    it('renders role=alertdialog when requested', () => {
      render(<DefaultDialog defaultOpen role='alertdialog' />)
      expect(screen.queryByRole('alertdialog')).not.toBeNull()
    })

    it('omits aria-modal when modal=false', () => {
      render(<DefaultDialog defaultOpen modal={false} />)
      expect(screen.getByRole('dialog').hasAttribute('aria-modal')).toBe(false)
    })
  })

  describe('focus management', () => {
    it('moves focus into the dialog window on open and restores it on close', () => {
      render(<DefaultDialog />)
      const trigger = screen.getByText('Trigger')
      act(() => trigger.focus())

      openDialog()
      expect(document.activeElement).toBe(screen.getByRole('dialog'))

      act(pressEscape)
      expect(document.activeElement).toBe(trigger)
    })

    // jsdom does no layout, so the scroll jump can't be reproduced — assert the
    // mechanism that prevents it: focus never scrolls the locked surface.
    it('moves focus without scrolling the locked surface', () => {
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')
      render(<DefaultDialog defaultOpen />)

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
      focusSpy.mockRestore()
    })

    it('moves focus to the first form field when the dialog contains one', () => {
      render(
        <Dialog defaultOpen>
          <Dialog.Portal>
            <Dialog.Content aria-label='Form'>
              <button type='button'>Action</button>
              <input aria-label='Name' />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>,
      )
      expect(document.activeElement).toBe(screen.getByLabelText('Name'))
    })

    it('wraps Tab from the last focusable to the first', () => {
      render(<DefaultDialog defaultOpen />)
      const dialog = screen.getByRole('dialog')

      act(() => screen.getByText('Close').focus())
      fireEvent.keyDown(dialog, { key: 'Tab' })
      expect(document.activeElement).toBe(screen.getByText('Action'))
    })

    it('wraps Shift+Tab from the first focusable to the last', () => {
      render(<DefaultDialog defaultOpen />)
      const dialog = screen.getByRole('dialog')

      act(() => screen.getByText('Action').focus())
      fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
      expect(document.activeElement).toBe(screen.getByText('Close'))
    })

    it('keeps Close last in the cycle even when it renders first', () => {
      // Close first in the DOM, then content. Tabbing FROM the dialog window
      // (off-cycle, where focus lands on open) is the discriminating case: a
      // pure forward cycle hides the wrap point, but entry from off-cycle
      // reveals whether Close leads (bug) or trails (fixed).
      render(
        <Dialog defaultOpen>
          <Dialog.Portal>
            <Dialog.Viewport>
              <Dialog.Content>
                <Dialog.Close>Close</Dialog.Close>
                <button type='button'>Content</button>
              </Dialog.Content>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog>,
      )
      const dialog = screen.getByRole('dialog')

      act(() => dialog.focus()) // the dialog window — where focus opens
      fireEvent.keyDown(dialog, { key: 'Tab' })
      expect(document.activeElement).toBe(screen.getByText('Content')) // not Close

      act(() => dialog.focus())
      fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
      expect(document.activeElement).toBe(screen.getByText('Close')) // last, backward
    })

    const InitialFocusDialog = ({ disabled = false }: { disabled?: boolean }) => {
      const initialFocus = useRef<HTMLInputElement>(null)
      return (
        <Dialog defaultOpen>
          <Dialog.Portal>
            <Dialog.Viewport>
              <Dialog.Content aria-label='Form' initialFocus={initialFocus}>
                <input ref={initialFocus} disabled={disabled} aria-label='Name' />
              </Dialog.Content>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog>
      )
    }

    it('moves focus to the initialFocus element on open', () => {
      render(<InitialFocusDialog />)
      expect(document.activeElement).toBe(screen.getByLabelText('Name'))
    })

    it('falls back to the dialog panel when the initialFocus target cannot take focus', () => {
      render(<InitialFocusDialog disabled />)
      expect(document.activeElement).toBe(screen.getByRole('dialog'))
    })
  })

  describe('scroll lock', () => {
    it('locks body scroll while a modal dialog is open', () => {
      render(<DefaultDialog />)
      openDialog()
      expect(document.body.style.overflow).toBe('hidden')

      act(pressEscape)
      expect(document.body.style.overflow).not.toBe('hidden')
    })

    it('does not lock scroll when modal=false', () => {
      render(<DefaultDialog defaultOpen modal={false} />)
      expect(document.body.style.overflow).not.toBe('hidden')
    })

    it('locks the portal container, not the body, when scoped', () => {
      const panel = document.createElement('div')
      document.body.append(panel)

      render(
        <Dialog defaultOpen>
          <Dialog.Portal container={panel}>
            <Dialog.Content aria-label='Scoped'>content</Dialog.Content>
          </Dialog.Portal>
        </Dialog>,
      )

      expect(panel.style.overflow).toBe('hidden')
      expect(document.body.style.overflow).not.toBe('hidden')

      act(pressEscape)
      expect(panel.style.overflow).not.toBe('hidden')
      panel.remove()
    })
  })

  describe('exit animation', () => {
    const fireTransitionEnd = (element: Element): void => {
      act(() => {
        element.dispatchEvent(new Event('transitionend', { bubbles: true }))
      })
    }

    it('stays mounted through the exit and unmounts when its transition ends', () => {
      render(<DefaultDialog defaultOpen animated />)
      act(pressEscape)

      // Mid-exit: still in the tree, styled by data-state, hidden from AT.
      const dialog = screen.getByRole('dialog', { hidden: true })
      expect(dialog.getAttribute('data-state')).toBe('closing')

      fireTransitionEnd(dialog)
      expect(screen.queryByRole('dialog', { hidden: true })).toBeNull()
    })

    it('releases focus, containment, and interaction the moment the exit starts', () => {
      const { container } = render(<DefaultDialog animated />)
      const trigger = screen.getByText('Trigger')
      act(() => trigger.focus())
      openDialog()
      expect(container.hasAttribute('inert')).toBe(true)

      act(pressEscape)
      // The page is live and focus is home before the visual finishes…
      expect(container.hasAttribute('inert')).toBe(false)
      expect(document.activeElement).toBe(trigger)
      // …while the still-painting layer is out of the interaction instead.
      expect(screen.getByTestId('viewport').hasAttribute('inert')).toBe(true)
      expect(screen.getByTestId('backdrop').hasAttribute('inert')).toBe(true)
    })

    it('reopening mid-exit interrupts it and restores the layer', () => {
      render(<DefaultDialog animated />)
      openDialog()
      act(pressEscape)
      openDialog()

      const dialog = screen.getByRole('dialog')
      expect(dialog.getAttribute('data-state')).toBe('open')
      expect(screen.getByTestId('viewport').hasAttribute('inert')).toBe(false)
      expect(document.activeElement).toBe(dialog)

      // The interrupted exit's end must not close the reopened dialog.
      fireTransitionEnd(dialog)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })
  })

  describe('nesting', () => {
    const NestedDialog = (props: DialogProps) => (
      <Dialog defaultOpen {...props}>
        <Dialog.Portal>
          <Dialog.Backdrop data-testid='outer-backdrop' />
          <Dialog.Viewport data-testid='outer-viewport'>
            <Dialog.Content>
              <Dialog.Title>Outer</Dialog.Title>
              <Dialog defaultOpen>
                <Dialog.Portal>
                  <Dialog.Backdrop data-testid='inner-backdrop' />
                  <Dialog.Viewport data-testid='inner-viewport'>
                    <Dialog.Content>
                      <Dialog.Title>Inner</Dialog.Title>
                    </Dialog.Content>
                  </Dialog.Viewport>
                </Dialog.Portal>
              </Dialog>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    )

    it('Escape dismisses the topmost dialog only, one layer per press', () => {
      render(<NestedDialog />)
      expect(screen.queryByText('Outer')).not.toBeNull()
      expect(screen.queryByText('Inner')).not.toBeNull()

      act(pressEscape)
      expect(screen.queryByText('Inner')).toBeNull()
      expect(screen.queryByText('Outer')).not.toBeNull()

      act(pressEscape)
      expect(screen.queryByText('Outer')).toBeNull()
    })

    it('hides the dialog beneath the topmost from assistive tech and makes it inert', () => {
      render(<NestedDialog />)
      const outer = screen.getByTestId('outer-viewport')
      expect(outer.getAttribute('aria-hidden')).toBe('true')
      expect(outer.hasAttribute('inert')).toBe(true)

      const inner = screen.getByTestId('inner-viewport')
      expect(inner.hasAttribute('aria-hidden')).toBe(false)
      expect(inner.hasAttribute('inert')).toBe(false)
    })

    it("hides the lower dialog's backdrop but never the topmost's own", () => {
      render(<NestedDialog />)
      expect(screen.getByTestId('outer-backdrop').hasAttribute('inert')).toBe(true)
      expect(screen.getByTestId('inner-backdrop').hasAttribute('inert')).toBe(false)

      act(pressEscape) // the outer dialog is topmost again — its backdrop re-excepted
      expect(screen.getByTestId('outer-backdrop').hasAttribute('inert')).toBe(false)
    })

    it('restores the layer beneath once the top dialog closes', () => {
      render(<NestedDialog />)
      expect(screen.getByTestId('outer-viewport').getAttribute('aria-hidden')).toBe('true')

      act(pressEscape) // close the inner dialog
      const outer = screen.getByTestId('outer-viewport')
      expect(outer.hasAttribute('aria-hidden')).toBe(false)
      expect(outer.hasAttribute('inert')).toBe(false)
    })

    it('ignores an outside press on a lower layer — only the topmost dismisses', () => {
      render(<NestedDialog />)
      act(() => screen.getByTestId('outer-viewport').click())
      expect(screen.queryByText('Outer')).not.toBeNull()
      expect(screen.queryByText('Inner')).not.toBeNull()

      act(() => screen.getByTestId('inner-viewport').click())
      expect(screen.queryByText('Inner')).toBeNull()
      expect(screen.queryByText('Outer')).not.toBeNull()
    })

    it('cleans up containment and scroll lock when the parent closes over an open child', () => {
      const { container, rerender } = render(<NestedDialog open />)
      expect(screen.queryByText('Inner')).not.toBeNull()
      expect(container.hasAttribute('inert')).toBe(true)

      rerender(<NestedDialog open={false} />)
      expect(screen.queryByText('Outer')).toBeNull()
      expect(screen.queryByText('Inner')).toBeNull()
      expect(document.body.style.overflow).not.toBe('hidden')
      expect(container.hasAttribute('aria-hidden')).toBe(false)
      expect(container.hasAttribute('inert')).toBe(false)
    })
  })
})
