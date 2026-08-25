// @vitest-environment jsdom
// The React lifecycle around @dunky.dev/dom-scroll-lock — the refcount/restore
// behavior itself is covered in the util's own tests.
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useScrollLock } from '@dunky.dev/react-use-scroll-lock'

describe('useScrollLock', () => {
  it('locks body scroll while mounted and releases on unmount', () => {
    const { unmount } = renderHook(() => useScrollLock())
    expect(document.body.style.overflowY).toBe('hidden')

    unmount()
    expect(document.body.style.overflowY).toBe('')
  })

  it('does not lock when locked=false', () => {
    const { unmount } = renderHook(() => useScrollLock(false))
    expect(document.body.style.overflowY).toBe('')
    unmount()
  })

  it('locks nothing when target is null — a target not yet resolved', () => {
    const { unmount } = renderHook(() => useScrollLock(true, null))
    expect(document.body.style.overflowY).toBe('')
    unmount()
  })
})
