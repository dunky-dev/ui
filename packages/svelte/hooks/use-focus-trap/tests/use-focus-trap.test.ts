// @vitest-environment jsdom
// The Svelte lifecycle around @dunky.dev/dom-focus-trap — the wrap/no-op/enabled
// behavior itself is covered in the util's own tests.
import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import Trap from './fixtures/trap.svelte'

const tab = (target: EventTarget): boolean =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
  )

// dispatchEvent returns false when a handler called preventDefault.
const pressTab = (): boolean => tab(screen.getByTestId('container'))

describe('useFocusTrap', () => {
  it('traps while mounted and releases on unmount', () => {
    const { unmount } = render(Trap)
    screen.getByText('last').focus()

    expect(pressTab()).toBe(false)
    expect(document.activeElement).toBe(screen.getByText('first'))

    const container = screen.getByTestId('container')
    screen.getByText('last').focus()
    unmount()
    // The listener is gone with the unmount — a Tab on the detached container
    // is no longer intercepted.
    expect(tab(container)).toBe(true)
  })

  it('forwards enabled() to the trap without re-binding', () => {
    render(Trap, { enabled: () => false })
    const last = screen.getByText('last')
    last.focus()

    expect(pressTab()).toBe(true)
    expect(document.activeElement).toBe(last)
  })

  // The target is a getter: when the `$state` behind it fills with a new
  // element, the trap moves to it.
  it('re-arms on the element a reactive target yields next', async () => {
    const { rerender } = render(Trap)
    await rerender({ swapped: true })
    screen.getByText('second last').focus()

    expect(pressTab()).toBe(false)
    expect(document.activeElement).toBe(screen.getByText('second first'))
  })
})
