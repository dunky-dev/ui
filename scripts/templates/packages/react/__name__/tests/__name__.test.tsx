// @vitest-environment jsdom
// The React edge of the __name__ — behavior only; the machine's own contract
// is covered in @dunky.dev/__name__'s tests.
import { StrictMode } from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { __Name__, type __Name__Props } from '@dunky.dev/react-__name__'

const Default__Name__ = (props: __Name__Props) => (
  <__Name__ {...props}>
    <__Name__.Root>go</__Name__.Root>
  </__Name__>
)

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('__Name__', () => {
  it('disables on press under StrictMode', () => {
    const disable = vi.fn()
    render(
      <StrictMode>
        <Default__Name__ disable={disable} />
      </StrictMode>,
    )
    act(() => screen.getByRole('button').click())
    expect(disable).toHaveBeenCalledTimes(1)
  })

  it('fires disable when the controlled disabled prop turns on', () => {
    const disable = vi.fn()
    const { rerender } = render(<Default__Name__ disable={disable} />)
    expect(disable).not.toHaveBeenCalled()

    rerender(<Default__Name__ disable={disable} disabled />)
    expect(disable).toHaveBeenCalledTimes(1)
  })

  it('translates the core bindings onto the element', () => {
    render(<Default__Name__ disabled />)
    const root = screen.getByRole('button')
    expect(root.getAttribute('data-state')).toBe('idle')
    expect(root.getAttribute('aria-disabled')).toBe('true')
  })
})
