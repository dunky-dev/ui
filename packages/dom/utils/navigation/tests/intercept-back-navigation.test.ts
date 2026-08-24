// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { interceptBackNavigation } from '@dunky.dev/browser-navigation'

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

const pressForward = async (): Promise<void> => {
  const pop = nextPop()
  history.forward()
  await pop
}

// Releasing consumes a still-current entry through an async self-caused pop —
// await it so the next test starts from settled history.
const releaseAndSettle = async (release: () => void): Promise<void> => {
  const pop = nextPop()
  release()
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

  // Two sibling layers closing in the same commit: the first release's
  // deferred check must not detach the listener while the second release's
  // self-caused pop is still on its way.
  it('two releases in the same turn leave the next guard able to hear Back', async () => {
    const before: unknown = history.state
    const releaseLower = interceptBackNavigation(() => true)
    const releaseUpper = interceptBackNavigation(() => true)

    const pop = nextPop()
    releaseLower()
    releaseUpper()
    await pop // the upper release's self-caused pop lands

    const onBack = vi.fn(() => true)
    interceptBackNavigation(onBack)
    await pressBack()
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(history.state).toEqual(before)
  })

  it('a guard releasing itself inside onBack leaves the guard beneath armed', async () => {
    const before: unknown = history.state
    const lower = vi.fn(() => true)
    interceptBackNavigation(lower)
    let releaseUpper = (): void => undefined
    const upper = vi.fn(() => {
      releaseUpper()
      return true
    })
    releaseUpper = interceptBackNavigation(upper)

    await pressBack()
    expect(upper).toHaveBeenCalledTimes(1)
    expect(lower).not.toHaveBeenCalled()

    await pressBack()
    expect(lower).toHaveBeenCalledTimes(1)
    expect(history.state).toEqual(before)
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

  it('a Back-closed guard reopens on Forward and re-arms on the entry in place', async () => {
    const onBack = vi.fn(() => true)
    const onForward = vi.fn(() => true)
    const release = interceptBackNavigation(onBack, onForward)
    await pressBack()
    expect(onBack).toHaveBeenCalledTimes(1)

    const lengthBefore = history.length
    await pressForward()
    expect(onForward).toHaveBeenCalledTimes(1)
    expect(history.length).toBe(lengthBefore) // re-armed in place, nothing planted

    await pressBack() // the re-armed guard answers the next Back
    expect(onBack).toHaveBeenCalledTimes(2)
    release()
    await new Promise<void>(resolve => queueMicrotask(resolve))
  })

  it('a declined reopen keeps watching; a later Forward offers again', async () => {
    let accept = false
    const onForward = vi.fn(() => accept)
    const release = interceptBackNavigation(() => true, onForward)
    await pressBack()

    await pressForward()
    expect(onForward).toHaveBeenCalledTimes(1) // declined — still parked

    await pressBack() // a plain navigation off the declined entry
    accept = true
    await pressForward()
    expect(onForward).toHaveBeenCalledTimes(2)
    await releaseAndSettle(release) // accepted — armed again, entry current
  })

  it('release while parked ends the Forward watch', async () => {
    const onForward = vi.fn(() => true)
    const release = interceptBackNavigation(() => true, onForward)
    await pressBack()
    release()
    await new Promise<void>(resolve => queueMicrotask(resolve))

    await pressForward() // re-enters the now-unwatched entry
    expect(onForward).not.toHaveBeenCalled()
    await pressBack() // step off the stale entry
  })

  // A layer that tears itself down inside onBack is gone, not Back-closed:
  // parking it would offer a reopen to something that no longer exists.
  it('a guard releasing itself inside onBack never parks', async () => {
    const onForward = vi.fn(() => true)
    let release = (): void => undefined
    release = interceptBackNavigation(() => {
      release()
      return true
    }, onForward)

    await pressBack()
    await pressForward() // re-enters the spent entry, nobody watching
    expect(onForward).not.toHaveBeenCalled()
    await pressBack() // step off the stale entry
  })

  it('a newly planted entry ends the Forward watch of the layer before it', async () => {
    const firstForward = vi.fn(() => true)
    interceptBackNavigation(() => true, firstForward)
    await pressBack() // parked, entry in the forward stack

    const second = vi.fn(() => true)
    interceptBackNavigation(second) // planting truncates the parked entry
    await pressBack()
    expect(second).toHaveBeenCalledTimes(1)

    await pressForward() // lands on second's spent entry, nobody watching
    expect(firstForward).not.toHaveBeenCalled()
    await pressBack() // step off the stale entry
  })

  it('stacked Back-closed guards reopen one per Forward, lowest first', async () => {
    const lowerForward = vi.fn(() => true)
    const upperForward = vi.fn(() => true)
    const releaseLower = interceptBackNavigation(() => true, lowerForward)
    const releaseUpper = interceptBackNavigation(() => true, upperForward)
    await pressBack()
    await pressBack()

    await pressForward()
    expect(lowerForward).toHaveBeenCalledTimes(1)
    expect(upperForward).not.toHaveBeenCalled()

    await pressForward()
    expect(upperForward).toHaveBeenCalledTimes(1)

    await releaseAndSettle(releaseUpper)
    await releaseAndSettle(releaseLower)
  })
})
