// @vitest-environment jsdom
// The Solid lifecycle around @dunky.dev/dom-focus-trap — the wrap/no-op/enabled
// behavior itself is covered in the util's own tests.
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { useFocusTrap } from '@dunky.dev/solid-use-focus-trap'

function Trap(props: { enabled?: () => boolean }) {
  let target: HTMLDivElement | undefined
  // The closure defers the props read to each Tab press — a direct
  // `props.enabled` here would be a top-level reactive read.
  useFocusTrap(() => target ?? null, { enabled: () => props.enabled?.() !== false })
  return (
    <div ref={el => (target = el)} tabindex={-1} data-testid='container'>
      <button type='button'>first</button>
      <button type='button'>last</button>
    </div>
  )
}

// fireEvent returns false when a handler called preventDefault.
const pressTab = (): boolean => fireEvent.keyDown(screen.getByTestId('container'), { key: 'Tab' })

// Auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('useFocusTrap', () => {
  it('traps while mounted and releases on unmount', () => {
    const { unmount } = render(() => <Trap />)
    screen.getByText('last').focus()

    expect(pressTab()).toBe(false)
    expect(document.activeElement).toBe(screen.getByText('first'))

    const container = screen.getByTestId('container')
    screen.getByText('last').focus()
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
    render(() => <Trap enabled={() => false} />)
    const last = screen.getByText('last')
    last.focus()

    expect(pressTab()).toBe(true)
    expect(document.activeElement).toBe(last)
  })
})
