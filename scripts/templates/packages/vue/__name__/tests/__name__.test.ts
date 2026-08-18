// @vitest-environment jsdom
// The Vue edge of the __name__ — behavior only; the machine's own contract
// is covered in @dunky.dev/__name__'s tests.
import { defineComponent, h } from 'vue'
import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { __Name__ } from '@dunky.dev/vue-__name__'

// Spreads its attrs onto the root, so tests drive props and listeners through
// TL's `render(..., { props })` / `rerender` on this wrapper.
const Default__Name__ = defineComponent({
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return () => h(__Name__, { ...attrs }, { default: () => h(__Name__.Root, null, { default: () => 'go' }) })
  },
})

// Auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('__Name__', () => {
  it('disables on press', async () => {
    const onDisable = vi.fn()
    render(Default__Name__, { props: { onDisable } })
    await fireEvent.click(screen.getByRole('button'))
    expect(onDisable).toHaveBeenCalledTimes(1)
  })

  it('emits disable when the controlled disabled prop turns on', async () => {
    const onDisable = vi.fn()
    const { rerender } = render(Default__Name__, { props: { onDisable } })
    expect(onDisable).not.toHaveBeenCalled()

    await rerender({ disabled: true })
    expect(onDisable).toHaveBeenCalledTimes(1)
  })

  it('translates the core bindings onto the element', async () => {
    render(Default__Name__, { props: { disabled: true } })
    const root = await screen.findByRole('button')
    expect(root.getAttribute('data-state')).toBe('idle')
    expect(root.getAttribute('aria-disabled')).toBe('true')
  })
})
