// @vitest-environment jsdom
// The Vue edge of the __name__ — behavior only; the machine's own contract
// is covered in @dunky.dev/__name__'s tests.
import { nextTick, ref, type EmitsToProps } from 'vue'
import { cleanup, render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { __Name__, type __Name__Emits, type __Name__Props } from '@dunky.dev/vue-__name__'

const Default__Name__ = (props: __Name__Props & EmitsToProps<__Name__Emits>) => (
  <__Name__ {...props}>
    <__Name__.Root>go</__Name__.Root>
  </__Name__>
)

// Auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('__Name__', () => {
  it('disables on press', () => {
    const onDisable = vi.fn()
    render(() => <Default__Name__ onDisable={onDisable} />)
    screen.getByRole('button').click()
    expect(onDisable).toHaveBeenCalledTimes(1)
  })

  it('fires disable when the controlled disabled prop turns on', async () => {
    const onDisable = vi.fn()
    const disabled = ref(false)
    render(() => <Default__Name__ onDisable={onDisable} disabled={disabled.value} />)
    expect(onDisable).not.toHaveBeenCalled()

    disabled.value = true
    await nextTick() // Vue batches the update into a microtask
    expect(onDisable).toHaveBeenCalledTimes(1)
  })

  it('translates the core bindings onto the element', () => {
    render(() => <Default__Name__ disabled />)
    const root = screen.getByRole('button')
    expect(root.getAttribute('data-state')).toBe('idle')
    expect(root.getAttribute('aria-disabled')).toBe('true')
  })
})
