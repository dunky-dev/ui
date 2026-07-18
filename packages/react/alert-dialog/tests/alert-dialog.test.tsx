// @vitest-environment jsdom
// The React edge of the AlertDialog — behavior only; the machine's own
// contract is covered in @dunky.dev/alert-dialog's tests.
import { useRef } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AlertDialog, type AlertDialogProps } from '@dunky.dev/react-alert-dialog'

const DefaultAlertDialog = (props: AlertDialogProps) => (
  <AlertDialog {...props}>
    <AlertDialog.Trigger>Trigger</AlertDialog.Trigger>
    <AlertDialog.Portal>
      <AlertDialog.Backdrop data-testid='backdrop' />
      <AlertDialog.Viewport data-testid='viewport'>
        <AlertDialog.Content>
          <AlertDialog.Title>Title</AlertDialog.Title>
          <AlertDialog.Description>Description</AlertDialog.Description>
          <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
          <AlertDialog.Action>Confirm</AlertDialog.Action>
        </AlertDialog.Content>
      </AlertDialog.Viewport>
    </AlertDialog.Portal>
  </AlertDialog>
)

const openAlertDialog = (): void => {
  act(() => screen.getByText('Trigger').click())
}

const pressEscape = (): void => {
  fireEvent.keyDown(document.body, { key: 'Escape' })
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('AlertDialog', () => {
  describe('open / close', () => {
    it('opens on trigger press and closes on cancel press', () => {
      render(<DefaultAlertDialog />)
      expect(screen.queryByRole('alertdialog')).toBeNull()

      openAlertDialog()
      expect(screen.queryByRole('alertdialog')).not.toBeNull()

      act(() => screen.getByText('Cancel').click())
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })

    it('closes on action press, after the consumer handler ran', () => {
      const onConfirm = vi.fn()
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Portal>
            <AlertDialog.Content aria-label='Confirm'>
              <AlertDialog.Action onClick={onConfirm}>Confirm</AlertDialog.Action>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>,
      )
      act(() => screen.getByText('Confirm').click())
      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })

    it('renders open when defaultOpen', () => {
      render(<DefaultAlertDialog defaultOpen />)
      expect(screen.queryByRole('alertdialog')).not.toBeNull()
    })

    it('fires onOpenChange with the new value on open and close', () => {
      const onOpenChange = vi.fn()
      render(<DefaultAlertDialog onOpenChange={onOpenChange} />)

      openAlertDialog()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)

      act(() => screen.getByText('Cancel').click())
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })
  })

  describe('escape key', () => {
    it('closes on Escape', () => {
      render(<DefaultAlertDialog defaultOpen />)
      act(pressEscape)
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })

    it('stays open when onEscapeKeyDown prevents default', () => {
      const onEscapeKeyDown = vi.fn(event => event.preventDefault())
      render(<DefaultAlertDialog defaultOpen onEscapeKeyDown={onEscapeKeyDown} />)
      act(pressEscape)
      expect(onEscapeKeyDown).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('alertdialog')).not.toBeNull()
    })
  })

  describe('outside interaction', () => {
    it('stays open on a backdrop press — outside never dismisses', () => {
      render(<DefaultAlertDialog defaultOpen />)
      act(() => screen.getByTestId('backdrop').click())
      expect(screen.queryByRole('alertdialog')).not.toBeNull()
    })

    it('stays open on a press on the viewport around the content', () => {
      render(<DefaultAlertDialog defaultOpen />)
      act(() => screen.getByTestId('viewport').click())
      expect(screen.queryByRole('alertdialog')).not.toBeNull()
    })
  })

  describe('controlled open', () => {
    it('follows the open prop in both directions', () => {
      const { rerender } = render(<DefaultAlertDialog open={false} />)
      expect(screen.queryByRole('alertdialog')).toBeNull()

      rerender(<DefaultAlertDialog open />)
      expect(screen.queryByRole('alertdialog')).not.toBeNull()

      rerender(<DefaultAlertDialog open={false} />)
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })

    it('reports a dismissal intent but stays open until the prop closes it', () => {
      const onOpenChange = vi.fn()
      render(<DefaultAlertDialog open onOpenChange={onOpenChange} />)
      act(pressEscape)
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
      // The consumer didn't update `open` — that's the veto.
      expect(screen.queryByRole('alertdialog')).not.toBeNull()
    })

    it('reports a trigger press without opening until the prop does', () => {
      const onOpenChange = vi.fn()
      render(<DefaultAlertDialog open={false} onOpenChange={onOpenChange} />)
      openAlertDialog()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })
  })

  describe('aria wiring', () => {
    it('trigger exposes the popup relationship', () => {
      render(<DefaultAlertDialog />)
      const trigger = screen.getByText('Trigger')
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')

      openAlertDialog()
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(trigger.getAttribute('aria-controls')).toBe(screen.getByRole('alertdialog').id)
    })

    it('renders the native dialog element as a modal alertdialog, marked open', () => {
      render(<DefaultAlertDialog defaultOpen />)
      const content = screen.getByRole('alertdialog')
      expect(content.tagName).toBe('DIALOG')
      expect(content.hasAttribute('open')).toBe(true)
      expect(content.getAttribute('aria-modal')).toBe('true')
    })

    it('content is labelled by the Title and described by the Description', () => {
      render(<DefaultAlertDialog defaultOpen />)
      const content = screen.getByRole('alertdialog', { name: 'Title' })

      const describedBy = content.getAttribute('aria-describedby')
      expect(describedBy).not.toBeNull()
      expect(document.getElementById(describedBy as string)?.textContent).toBe('Description')
    })

    it('supports aria-label on Content when no Title is rendered', () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Portal>
            <AlertDialog.Content aria-label='Delete file'>content</AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>,
      )
      const content = screen.getByRole('alertdialog', { name: 'Delete file' })
      expect(content.hasAttribute('aria-labelledby')).toBe(false)
      expect(content.hasAttribute('aria-describedby')).toBe(false)
    })
  })

  describe('focus management', () => {
    it('moves focus to the Cancel action on open and restores the trigger on close', () => {
      render(<DefaultAlertDialog />)
      const trigger = screen.getByText('Trigger')
      act(() => trigger.focus())

      openAlertDialog()
      expect(document.activeElement).toBe(screen.getByText('Cancel'))

      act(pressEscape)
      expect(document.activeElement).toBe(trigger)
    })

    it('falls back to the alert dialog window when no Cancel is rendered', () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Portal>
            <AlertDialog.Content aria-label='Notice'>
              <AlertDialog.Action>OK</AlertDialog.Action>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>,
      )
      expect(document.activeElement).toBe(screen.getByRole('alertdialog'))
    })

    it('falls back to the alert dialog window when Cancel cannot take focus', () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Portal>
            <AlertDialog.Content aria-label='Notice'>
              <AlertDialog.Cancel disabled>Cancel</AlertDialog.Cancel>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>,
      )
      expect(document.activeElement).toBe(screen.getByRole('alertdialog'))
    })

    const InitialFocusAlertDialog = () => {
      const initialFocus = useRef<HTMLButtonElement>(null)
      return (
        <AlertDialog defaultOpen>
          <AlertDialog.Portal>
            <AlertDialog.Content aria-label='Confirm' initialFocus={initialFocus}>
              <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
              <AlertDialog.Action ref={initialFocus}>Confirm</AlertDialog.Action>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>
      )
    }

    it('initialFocus overrides the Cancel default', () => {
      render(<InitialFocusAlertDialog />)
      expect(document.activeElement).toBe(screen.getByText('Confirm'))
    })

    it('traps Tab within the alert dialog window', () => {
      render(<DefaultAlertDialog defaultOpen />)
      const content = screen.getByRole('alertdialog')

      act(() => screen.getByText('Confirm').focus())
      fireEvent.keyDown(content, { key: 'Tab' })
      expect(document.activeElement).toBe(screen.getByText('Cancel'))
    })
  })

  describe('scroll lock', () => {
    it('locks body scroll while open', () => {
      render(<DefaultAlertDialog />)
      openAlertDialog()
      expect(document.body.style.overflow).toBe('hidden')

      act(pressEscape)
      expect(document.body.style.overflow).not.toBe('hidden')
    })

    it('locks the portal container, not the body, when scoped', () => {
      const panel = document.createElement('div')
      document.body.append(panel)

      render(
        <AlertDialog defaultOpen>
          <AlertDialog.Portal container={panel}>
            <AlertDialog.Content aria-label='Scoped'>content</AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog>,
      )

      expect(panel.style.overflow).toBe('hidden')
      expect(document.body.style.overflow).not.toBe('hidden')

      act(pressEscape)
      expect(panel.style.overflow).not.toBe('hidden')
      panel.remove()
    })
  })

  describe('nesting', () => {
    const NestedAlertDialogs = (props: AlertDialogProps) => (
      <AlertDialog defaultOpen {...props}>
        <AlertDialog.Portal>
          <AlertDialog.Viewport data-testid='outer-viewport'>
            <AlertDialog.Content aria-label='Outer'>
              <AlertDialog defaultOpen>
                <AlertDialog.Portal>
                  <AlertDialog.Viewport data-testid='inner-viewport'>
                    <AlertDialog.Content aria-label='Inner'>
                      <AlertDialog.Cancel>Inner cancel</AlertDialog.Cancel>
                    </AlertDialog.Content>
                  </AlertDialog.Viewport>
                </AlertDialog.Portal>
              </AlertDialog>
              <AlertDialog.Cancel>Outer cancel</AlertDialog.Cancel>
            </AlertDialog.Content>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog>
    )

    it('Escape dismisses the topmost layer only, one per press', () => {
      render(<NestedAlertDialogs />)
      expect(screen.queryByText('Inner cancel')).not.toBeNull()
      expect(screen.queryByText('Outer cancel')).not.toBeNull()

      act(pressEscape)
      expect(screen.queryByText('Inner cancel')).toBeNull()
      expect(screen.queryByText('Outer cancel')).not.toBeNull()

      act(pressEscape)
      expect(screen.queryByText('Outer cancel')).toBeNull()
    })

    it('hides the layer beneath the topmost from assistive tech and restores it on close', () => {
      render(<NestedAlertDialogs />)
      const outer = screen.getByTestId('outer-viewport')
      expect(outer.getAttribute('aria-hidden')).toBe('true')
      expect(outer.hasAttribute('inert')).toBe(true)

      act(pressEscape) // close the inner alert dialog
      expect(outer.hasAttribute('aria-hidden')).toBe(false)
      expect(outer.hasAttribute('inert')).toBe(false)
    })

    it('cleans up containment and scroll lock when the parent closes over an open child', () => {
      const { container, rerender } = render(<NestedAlertDialogs open />)
      expect(screen.queryByText('Inner cancel')).not.toBeNull()
      expect(container.hasAttribute('inert')).toBe(true)

      rerender(<NestedAlertDialogs open={false} />)
      expect(screen.queryByText('Outer cancel')).toBeNull()
      expect(screen.queryByText('Inner cancel')).toBeNull()
      expect(document.body.style.overflow).not.toBe('hidden')
      expect(container.hasAttribute('aria-hidden')).toBe(false)
      expect(container.hasAttribute('inert')).toBe(false)
    })
  })
})
