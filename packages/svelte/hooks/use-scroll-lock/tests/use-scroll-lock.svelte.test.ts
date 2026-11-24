// @vitest-environment jsdom
// The Svelte lifecycle around @dunky.dev/dom-scroll-lock — the refcount/restore
// behavior itself is covered in the util's own tests.
import { flushSync } from 'svelte'
import { describe, expect, it } from 'vitest'
import { useScrollLock } from '@dunky.dev/svelte-use-scroll-lock'

// A hook's effect needs an owner: an effect root stands in for the component,
// and disposing it stands in for the unmount.
const mountHook = (hook: () => void): (() => void) => {
  const dispose = $effect.root(hook)
  flushSync()
  return dispose
}

describe('useScrollLock', () => {
  it('locks body scroll while mounted and releases on unmount', () => {
    const unmount = mountHook(() => useScrollLock())
    expect(document.body.style.overflowY).toBe('hidden')

    unmount()
    expect(document.body.style.overflowY).toBe('')
  })

  it('does not lock when locked=false', () => {
    const unmount = mountHook(() => useScrollLock(false))
    expect(document.body.style.overflowY).toBe('')
    unmount()
  })

  it('locks nothing when target is null — a target not yet resolved', () => {
    const unmount = mountHook(() => useScrollLock(true, () => null))
    expect(document.body.style.overflowY).toBe('')
    unmount()
  })
})
