// @vitest-environment jsdom
// The React lifecycle around @dunky.dev/focus-trap — the wrap/no-op/enabled
// behavior itself is covered in the util's own tests.
import { useRef } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useFocusTrap } from '@dunky.dev/react-use-focus-trap'

function Trap({ enabled }: { enabled?: () => boolean }) {
  const target = useRef<HTMLDivElement>(null)
  useFocusTrap(target, { enabled })
  return (
    <div ref={target} tabIndex={-1} data-testid='container'>
      <button type='button'>first</button>
      <button type='button'>last</button>
    </div>
  )
}

// fireEvent returns false when a handler called preventDefault.
const pressTab = (): boolean => fireEvent.keyDown(screen.getByTestId('container'), { key: 'Tab' })

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('useFocusTrap', () => {
  it('traps while mounted and releases on unmount', () => {
    const { unmount } = render(<Trap />)
    act(() => screen.getByText('last').focus())

    expect(pressTab()).toBe(false)
    expect(document.activeElement).toBe(screen.getByText('first'))

    const container = screen.getByTestId('container')
    const last = screen.getByText('last')
    act(() => last.focus())
    unmount()
    // The listener is gone with the unmount — a Tab on the detached container
    // is no longer intercepted.
    expect(
      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
      ),
    ).toBe(true)
  })

  it('forwards enabled() to the trap without re-binding', () => {
    render(<Trap enabled={() => false} />)
    const last = screen.getByText('last')
    act(() => last.focus())

    expect(pressTab()).toBe(true)
    expect(document.activeElement).toBe(last)
  })
})
