// @vitest-environment jsdom
// The React edge of the Toast — behavior only; the machine's own contract is
// covered in @dunky.dev/toast's tests.
import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toast, type ToastProps, type ToastProviderProps } from '@dunky.dev/react-toast'

interface FixtureProps extends ToastProps {
  provider?: Omit<ToastProviderProps, 'children'>
  /** Renders a second toast next to the first one. */
  sibling?: boolean
}

const DefaultToast = ({ provider, sibling, ...props }: FixtureProps) => (
  <Toast.Provider {...provider}>
    <Toast.Viewport data-testid='viewport'>
      <Toast {...props}>
        <Toast.Root data-testid='root'>
          <Toast.Title>Saved</Toast.Title>
          <Toast.Description>Your changes are safe.</Toast.Description>
          <Toast.Close>Dismiss</Toast.Close>
        </Toast.Root>
      </Toast>
      {sibling && (
        <Toast>
          <Toast.Root data-testid='sibling'>Second</Toast.Root>
        </Toast>
      )}
    </Toast.Viewport>
  </Toast.Provider>
)

const advance = (ms: number): void => {
  act(() => vi.advanceTimersByTime(ms))
}

// React synthesizes onPointerEnter/Leave from over/out pairs.
const hoverViewport = (): void => {
  fireEvent.pointerOver(screen.getByTestId('viewport'))
}
const unhoverViewport = (): void => {
  fireEvent.pointerOut(screen.getByTestId('viewport'))
}

// The auto-dismiss timer is the component's clock — every test runs on a fake one.
beforeEach(() => vi.useFakeTimers())

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Toast', () => {
  describe('rendering / aria', () => {
    it('shows an open toast as an assertive status live region by default', () => {
      render(<DefaultToast />)
      const root = screen.getByRole('status')
      expect(root.tagName).toBe('LI')
      expect(root.getAttribute('aria-live')).toBe('assertive')
      expect(root.getAttribute('aria-atomic')).toBe('true')
      expect(root.getAttribute('data-state')).toBe('open')
    })

    it('announces a background toast politely', () => {
      render(<DefaultToast type='background' />)
      expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite')
    })

    it('is labelled by the Title and described by the Description', () => {
      render(<DefaultToast />)
      const root = screen.getByRole('status', { name: 'Saved' })
      const describedBy = root.getAttribute('aria-describedby')
      expect(describedBy).not.toBeNull()
      expect(document.getElementById(describedBy as string)?.textContent).toBe(
        'Your changes are safe.',
      )
    })

    it('lists the toasts in a labelled region landmark', () => {
      render(<DefaultToast />)
      const region = screen.getByRole('region', { name: 'Notifications' })
      expect(region.tagName).toBe('OL')
      expect(region.contains(screen.getByTestId('root'))).toBe(true)
    })

    it('names the region from the provider label', () => {
      render(<DefaultToast provider={{ label: 'Alerts' }} />)
      expect(screen.queryByRole('region', { name: 'Alerts' })).not.toBeNull()
    })

    it('renders nothing while closed', () => {
      render(<DefaultToast defaultOpen={false} />)
      expect(screen.queryByTestId('root')).toBeNull()
    })
  })

  describe('dismissal', () => {
    it('dismisses on Close press and reports it', () => {
      const onOpenChange = vi.fn()
      render(<DefaultToast onOpenChange={onOpenChange} />)
      act(() => screen.getByText('Dismiss').click())
      expect(screen.queryByTestId('root')).toBeNull()
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })

    it('dismisses on Action press, after the consumer handler runs', () => {
      const onUndo = vi.fn()
      render(
        <Toast.Provider>
          <Toast.Viewport>
            <Toast>
              <Toast.Root>
                <Toast.Action onClick={onUndo}>Undo</Toast.Action>
              </Toast.Root>
            </Toast>
          </Toast.Viewport>
        </Toast.Provider>,
      )
      act(() => screen.getByText('Undo').click())
      expect(onUndo).toHaveBeenCalledTimes(1)
      expect(screen.queryByText('Undo')).toBeNull()
    })

    it('a consumer onClick that prevents default keeps the toast open', () => {
      const onOpenChange = vi.fn()
      render(
        <Toast.Provider>
          <Toast.Viewport>
            <Toast onOpenChange={onOpenChange}>
              <Toast.Root>
                <Toast.Action onClick={event => event.preventDefault()}>Undo</Toast.Action>
              </Toast.Root>
            </Toast>
          </Toast.Viewport>
        </Toast.Provider>,
      )
      act(() => screen.getByText('Undo').click())
      expect(screen.queryByText('Undo')).not.toBeNull()
      expect(onOpenChange).not.toHaveBeenCalled()
    })

    it('parks focus on the viewport when the toast holding focus dismisses', () => {
      render(<DefaultToast sibling />)
      const close = screen.getByText('Dismiss')
      act(() => close.focus())
      act(() => close.click())
      expect(screen.queryByTestId('root')).toBeNull()
      expect(document.activeElement).toBe(screen.getByTestId('viewport'))

      // Focus genuinely sits in the viewport, so the sibling stays paused...
      advance(60_000)
      expect(screen.queryByTestId('sibling')).not.toBeNull()

      // ...and blurring out still resumes — the standing pause is not stranded.
      fireEvent.focusOut(screen.getByTestId('viewport'), { relatedTarget: document.body })
      advance(5000)
      expect(screen.queryByTestId('sibling')).toBeNull()
    })
  })

  describe('auto-dismiss', () => {
    it('dismisses when the default duration elapses, under StrictMode', () => {
      const onOpenChange = vi.fn()
      render(
        <StrictMode>
          <DefaultToast onOpenChange={onOpenChange} />
        </StrictMode>,
      )
      advance(4999)
      expect(screen.queryByTestId('root')).not.toBeNull()

      advance(1)
      expect(screen.queryByTestId('root')).toBeNull()
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })

    it('uses the provider duration when the toast has none', () => {
      render(<DefaultToast provider={{ duration: 1000 }} />)
      advance(1000)
      expect(screen.queryByTestId('root')).toBeNull()
    })

    it('the toast duration overrides the provider default', () => {
      render(<DefaultToast provider={{ duration: 1000 }} duration={3000} />)
      advance(2999)
      expect(screen.queryByTestId('root')).not.toBeNull()

      advance(1)
      expect(screen.queryByTestId('root')).toBeNull()
    })

    it('duration=Infinity makes the toast persistent', () => {
      render(<DefaultToast duration={Infinity} />)
      advance(60_000)
      expect(screen.queryByTestId('root')).not.toBeNull()
    })
  })

  describe('pause / resume', () => {
    it('hovering the viewport pauses the timer; leaving restarts the full duration', () => {
      render(<DefaultToast />)
      advance(3000)
      hoverViewport()
      advance(60_000)
      expect(screen.queryByTestId('root')).not.toBeNull()

      unhoverViewport()
      advance(4999)
      expect(screen.queryByTestId('root')).not.toBeNull()

      advance(1)
      expect(screen.queryByTestId('root')).toBeNull()
    })

    it('focus within the viewport pauses the timer; blurring out resumes', () => {
      render(<DefaultToast />)
      fireEvent.focusIn(screen.getByText('Dismiss'))
      advance(60_000)
      expect(screen.queryByTestId('root')).not.toBeNull()

      fireEvent.focusOut(screen.getByText('Dismiss'), { relatedTarget: document.body })
      advance(5000)
      expect(screen.queryByTestId('root')).toBeNull()
    })

    it('does not resume on pointer leave while focus stays inside', () => {
      render(<DefaultToast />)
      // Real focus: the leave check reads document.activeElement.
      act(() => screen.getByText('Dismiss').focus())
      hoverViewport()
      unhoverViewport()
      advance(60_000)
      expect(screen.queryByTestId('root')).not.toBeNull()
    })

    it('does not resume on a blur that moves focus within the viewport', () => {
      render(<DefaultToast />)
      fireEvent.focusIn(screen.getByText('Dismiss'))
      fireEvent.focusOut(screen.getByText('Dismiss'), {
        relatedTarget: screen.getByTestId('viewport'),
      })
      advance(60_000)
      expect(screen.queryByTestId('root')).not.toBeNull()
    })

    it('pointer movement inside the viewport pauses the timer', () => {
      render(<DefaultToast />)
      // No enter: a resume can land while the pointer is already resting
      // inside, and the next jitter must re-pause.
      fireEvent.pointerMove(screen.getByTestId('viewport'))
      advance(60_000)
      expect(screen.queryByTestId('root')).not.toBeNull()
    })

    it('a toast that opens while the viewport is hovered joins paused', () => {
      const { rerender } = render(<DefaultToast open={false} />)
      hoverViewport()
      rerender(<DefaultToast open />)
      advance(60_000)
      expect(screen.queryByTestId('root')).not.toBeNull()

      unhoverViewport()
      advance(5000)
      expect(screen.queryByTestId('root')).toBeNull()
    })

    it('a toast that mounts while the viewport is hovered joins paused', () => {
      const { rerender } = render(<DefaultToast />)
      hoverViewport()
      rerender(<DefaultToast sibling />)
      advance(60_000)
      expect(screen.queryByTestId('sibling')).not.toBeNull()

      unhoverViewport()
      advance(5000)
      expect(screen.queryByTestId('sibling')).toBeNull()
    })
  })

  describe('controlled open', () => {
    it('follows the open prop in both directions', () => {
      const { rerender } = render(<DefaultToast open={false} />)
      expect(screen.queryByTestId('root')).toBeNull()

      rerender(<DefaultToast open />)
      expect(screen.queryByTestId('root')).not.toBeNull()

      rerender(<DefaultToast open={false} />)
      expect(screen.queryByTestId('root')).toBeNull()
    })

    it('reports auto-dismiss intent through onOpenChange while controlled', () => {
      const onOpenChange = vi.fn()
      render(<DefaultToast open onOpenChange={onOpenChange} />)
      advance(5000)
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
      // The controlled prop is a synced input, not a gate: the dismissal
      // closes the toast, and the report is how the consumer stays in sync.
      expect(screen.queryByTestId('root')).toBeNull()
    })
  })
})
