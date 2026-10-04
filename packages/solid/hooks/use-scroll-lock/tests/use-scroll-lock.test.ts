// @vitest-environment jsdom
import { renderHook } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import { useScrollLock } from '@dunky.dev/solid-use-scroll-lock'

describe('useScrollLock', () => {
  it('locks body scroll while mounted and releases on unmount', () => {
    const { cleanup } = renderHook(() => useScrollLock())
    expect(document.body.style.overflowY).toBe('hidden')

    cleanup()
    expect(document.body.style.overflowY).toBe('')
  })

  it('does not lock when locked=false', () => {
    const { cleanup } = renderHook(() => useScrollLock(false))
    expect(document.body.style.overflowY).toBe('')
    cleanup()
  })

  it('locks nothing when target is null — a target not yet resolved', () => {
    const { cleanup } = renderHook(() => useScrollLock(true, () => null))
    expect(document.body.style.overflowY).toBe('')
    cleanup()
  })
})
