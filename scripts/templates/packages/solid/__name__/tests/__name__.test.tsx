// @vitest-environment jsdom
// The Solid edge of the __name__ — behavior only; the machine's own contract
// is covered in @dunky.dev/__name__'s tests.
import { createSignal, flush } from 'solid-js'
import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { __Name__, type __Name__Props } from '@dunky.dev/solid-__name__'

const Default__Name__ = (props: __Name__Props) => (
  <__Name__ {...props}>
    <__Name__.Root>go</__Name__.Root>
  </__Name__>
)

// Auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('__Name__', () => {
  it('disables on press', () => {
    const disable = vi.fn()
    render(() => <Default__Name__ disable={disable} />)
    screen.getByRole('button').click()
    expect(disable).toHaveBeenCalledTimes(1)
  })

  it('fires disable when the controlled disabled prop turns on', () => {
    const disable = vi.fn()
    const [disabled, setDisabled] = createSignal(false)
    render(() => <Default__Name__ disable={disable} disabled={disabled()} />)
    expect(disable).not.toHaveBeenCalled()

    setDisabled(true)
    flush() // Solid 2.0 defers prop propagation to the microtask queue
    expect(disable).toHaveBeenCalledTimes(1)
  })

  it('translates the core bindings onto the element', () => {
    render(() => <Default__Name__ disabled />)
    const root = screen.getByRole('button')
    expect(root.getAttribute('data-state')).toBe('idle')
    expect(root.getAttribute('aria-disabled')).toBe('true')
  })
})
