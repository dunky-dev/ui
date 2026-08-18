// @vitest-environment jsdom
// The Vue lifecycle around @dunky.dev/dom-focus-trap — the wrap/no-op/enabled
// behavior itself is covered in the util's own tests.
import { defineComponent, h, nextTick, shallowRef } from 'vue'
import { cleanup, render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it } from 'vitest'
import { useFocusTrap } from '@dunky.dev/vue-use-focus-trap'

const Trap = defineComponent({
  props: {
    enabled: { type: Function, default: undefined },
  },
  setup(props) {
    const target = shallowRef<HTMLElement | null>(null)
    useFocusTrap(target, { enabled: props.enabled as (() => boolean) | undefined })
    return () =>
      h('div', { ref: target, tabindex: -1, 'data-testid': 'container' }, [
        h('button', { type: 'button' }, 'first'),
        h('button', { type: 'button' }, 'last'),
      ])
  },
})

// dispatchEvent returns false when a handler called preventDefault — the trap
// is synchronous, so no Vue flush is involved. (Vue TL's fireEvent resolves
// void, unlike React TL's, so it can't report this.)
const pressTab = (): boolean =>
  screen
    .getByTestId('container')
    .dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))

// Auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('useFocusTrap', () => {
  it('traps while mounted and releases on unmount', async () => {
    const { unmount } = render(Trap)
    // The trap follows the template ref, which fills one flush after mount.
    await nextTick()
    screen.getByText('last').focus()

    expect(pressTab()).toBe(false)
    expect(document.activeElement).toBe(screen.getByText('first'))

    const container = screen.getByTestId('container')
    const last = screen.getByText('last')
    last.focus()
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
    render(Trap, { props: { enabled: () => false } })
    const last = screen.getByText('last')
    last.focus()

    expect(pressTab()).toBe(true)
    expect(document.activeElement).toBe(last)
  })
})
