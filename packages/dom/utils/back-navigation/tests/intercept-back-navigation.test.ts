// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { interceptBackNavigation } from '@dunky.dev/dom-back-navigation'

// jsdom's history traversal is asynchronous: back() returns immediately and
// the state change + popstate land on a later task — await the event itself.
const nextPop = (): Promise<void> =>
  new Promise(resolve => {
    window.addEventListener('popstate', () => resolve(), { once: true })
  })

const pressBack = async (): Promise<void> => {
  const pop = nextPop()
  history.back()
  await pop
}

describe('interceptBackNavigation', () => {
  it('plants a guard entry; Back pops it and fires onBack once', async () => {
    const before: unknown = history.state
    const onBack = vi.fn(() => true)
    interceptBackNavigation(onBack)
    expect(history.state).not.toEqual(before)

    await pressBack()
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(history.state).toEqual(before)
  })

  it('release consumes a still-current guard entry without firing onBack', async () => {
    const before: unknown = history.state
    const onBack = vi.fn(() => true)
    const release = interceptBackNavigation(onBack)

    const pop = nextPop()
    release()
    await pop
    expect(onBack).not.toHaveBeenCalled()
    expect(history.state).toEqual(before)
  })

  it('a declined close re-arms the guard so the next Back reaches it again', async () => {
    const before: unknown = history.state
    let accept = false
    const onBack = vi.fn(() => accept)
    interceptBackNavigation(onBack)

    await pressBack()
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(history.state).not.toEqual(before) // re-armed

    accept = true
    await pressBack()
    expect(onBack).toHaveBeenCalledTimes(2)
    expect(history.state).toEqual(before)
  })

  it('stacked guards unwind topmost-first, one layer per press', async () => {
    const lower = vi.fn(() => true)
    const upper = vi.fn(() => true)
    interceptBackNavigation(lower)
    interceptBackNavigation(upper)

    await pressBack()
    expect(upper).toHaveBeenCalledTimes(1)
    expect(lower).not.toHaveBeenCalled()

    await pressBack()
    expect(lower).toHaveBeenCalledTimes(1)
  })

  // The StrictMode shape: a synchronous release -> re-register (double-invoked
  // effect, same-commit reopen) must adopt the still-current entry in place —
  // zero traversals, so there is no self-caused pop to race or misread.
  it('a synchronous release + re-register adopts the entry with no traversal', async () => {
    const before: unknown = history.state
    const first = vi.fn(() => true)
    const second = vi.fn(() => true)

    const release = interceptBackNavigation(first)
    const lengthAfterFirst = history.length
    release()
    interceptBackNavigation(second)
    expect(history.length).toBe(lengthAfterFirst) // rewritten in place, not pushed

    // Flush the deferred consume — adoption must have cancelled it.
    await new Promise<void>(resolve => queueMicrotask(resolve))
    expect(second).not.toHaveBeenCalled()

    await pressBack()
    expect(second).toHaveBeenCalledTimes(1) // the user's Back still lands
    expect(first).not.toHaveBeenCalled()
    expect(history.state).toEqual(before)
  })
})
