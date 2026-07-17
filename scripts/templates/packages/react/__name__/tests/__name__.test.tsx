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
  it('activates on press under StrictMode', () => {
    const onActivate = vi.fn()
    render(
      <StrictMode>
        <Default__Name__ onActivate={onActivate} />
      </StrictMode>,
    )
    act(() => screen.getByRole('button').click())
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('gates activation while disabled, and re-syncs the flag across renders', () => {
    const onActivate = vi.fn()
    const { rerender } = render(<Default__Name__ onActivate={onActivate} disabled />)
    act(() => screen.getByRole('button').click())
    expect(onActivate).not.toHaveBeenCalled()

    rerender(<Default__Name__ onActivate={onActivate} />)
    act(() => screen.getByRole('button').click())
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('translates the core bindings onto the element', () => {
    render(<Default__Name__ disabled />)
    const root = screen.getByRole('button')
    expect(root.getAttribute('data-state')).toBe('idle')
    expect(root.hasAttribute('disabled')).toBe(true)
  })
})
