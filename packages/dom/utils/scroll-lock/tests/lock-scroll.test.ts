// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { lockScroll } from '@dunky.dev/dom-scroll-lock'

describe('lockScroll', () => {
  it('locks body scroll by default and releases it', () => {
    const release = lockScroll()
    expect(document.body.style.overflow).toBe('hidden')

    release()
    expect(document.body.style.overflow).toBe('')
  })

  it('holds the lock until the last holder releases, in any order', () => {
    const releaseFirst = lockScroll()
    const releaseSecond = lockScroll()

    releaseFirst()
    expect(document.body.style.overflow).toBe('hidden')

    releaseSecond()
    expect(document.body.style.overflow).toBe('')
  })

  it('ignores a double release', () => {
    const releaseFirst = lockScroll()
    const releaseSecond = lockScroll()

    releaseFirst()
    releaseFirst()
    expect(document.body.style.overflow).toBe('hidden')

    releaseSecond()
    expect(document.body.style.overflow).toBe('')
  })

  it('compensates both vanished scrollbars and clears them on release', () => {
    // jsdom reports window sizes but zero client sizes, so both scrollbar
    // footprints measure > 0 and both compensation branches run.
    const release = lockScroll()
    expect(document.body.style.paddingRight).not.toBe('')
    expect(document.body.style.paddingBottom).not.toBe('')

    release()
    expect(document.body.style.paddingRight).toBe('')
    expect(document.body.style.paddingBottom).toBe('')
  })

  it('restores the inline styles the target already had', () => {
    document.body.style.overflow = 'auto'
    document.body.style.paddingRight = '7px'
    document.body.style.paddingBottom = '9px'

    const release = lockScroll()
    expect(document.body.style.overflow).toBe('hidden')

    release()
    expect(document.body.style.overflow).toBe('auto')
    expect(document.body.style.paddingRight).toBe('7px')
    expect(document.body.style.paddingBottom).toBe('9px')

    document.body.style.removeProperty('overflow')
    document.body.style.removeProperty('padding-right')
    document.body.style.removeProperty('padding-bottom')
  })

  it('locks an element target independently of the body', () => {
    const container = document.createElement('div')
    document.body.append(container)

    const releaseContainer = lockScroll(container)
    expect(container.style.overflow).toBe('hidden')
    expect(document.body.style.overflow).toBe('')

    const releaseBody = lockScroll()
    releaseContainer()
    expect(container.style.overflow).toBe('')
    expect(document.body.style.overflow).toBe('hidden')

    releaseBody()
    expect(document.body.style.overflow).toBe('')
    container.remove()
  })
})
