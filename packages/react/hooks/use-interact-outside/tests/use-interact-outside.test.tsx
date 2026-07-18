// @vitest-environment jsdom
// The React lifecycle around @dunky.dev/dom-interact-outside — the
// detection/ignore behavior itself is covered in the util's own tests.
import { useRef } from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useInteractOutside } from '@dunky.dev/react-use-interact-outside'
import type { UseInteractOutsideOptions } from '@dunky.dev/react-use-interact-outside'

function Tracker(options: UseInteractOutsideOptions) {
  const target = useRef<HTMLDivElement>(null)
  useInteractOutside(target, options)
  return (
    <div ref={target}>
      <button type='button'>inside</button>
    </div>
  )
}

// RTL auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('useInteractOutside', () => {
  it('detects while mounted and stops after unmount', () => {
    const onInteractOutside = vi.fn()
    const { unmount } = render(<Tracker onInteractOutside={onInteractOutside} />)

    fireEvent.pointerDown(document.body)
    expect(onInteractOutside).toHaveBeenCalledTimes(1)

    unmount()
    fireEvent.pointerDown(document.body)
    expect(onInteractOutside).toHaveBeenCalledTimes(1)
  })

  it('forwards ignore to the tracker without re-binding', () => {
    const onInteractOutside = vi.fn()
    render(<Tracker onInteractOutside={onInteractOutside} ignore={() => true} />)

    fireEvent.pointerDown(document.body)
    expect(onInteractOutside).not.toHaveBeenCalled()
  })
})
