// @vitest-environment jsdom
// The Svelte edge of the __name__ — behavior only; the machine's own contract
// is covered in @dunky.dev/__name__'s tests.
import { render, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import Default__Name__ from './fixtures/default-__name__.svelte'

describe('__Name__', () => {
  it('disables on press', () => {
    const disable = vi.fn()
    render(Default__Name__, { disable })
    screen.getByRole('button').click()
    flushSync() // Svelte batches updates into a microtask
    expect(disable).toHaveBeenCalledTimes(1)
  })

  it('fires disable when the controlled disabled prop turns on', async () => {
    const disable = vi.fn()
    const { rerender } = render(Default__Name__, { disable, disabled: false })
    expect(disable).not.toHaveBeenCalled()

    await rerender({ disabled: true })
    expect(disable).toHaveBeenCalledTimes(1)
  })

  it('translates the core bindings onto the element', () => {
    render(Default__Name__, { disabled: true })
    const root = screen.getByRole('button')
    expect(root.getAttribute('data-state')).toBe('idle')
    expect(root.getAttribute('aria-disabled')).toBe('true')
  })
})
