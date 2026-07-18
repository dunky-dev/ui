// @vitest-environment jsdom
import { StrictMode } from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { use__Name__ } from '@dunky.dev/react-__name__'
import type { __Name__Options } from '@dunky.dev/react-__name__'

function Component(props: __Name__Options) {
  const { ref } = use__Name__(props)
  return <button ref={ref}>go</button>
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('use__Name__', () => {
  it('activates on click under StrictMode', () => {
    const onActivate = vi.fn()
    const { getByRole } = render(
      <StrictMode>
        <Component onActivate={onActivate} />
      </StrictMode>,
    )
    act(() => {
      getByRole('button').click()
    })
    expect(onActivate).toHaveBeenCalledTimes(1)
  })
})
