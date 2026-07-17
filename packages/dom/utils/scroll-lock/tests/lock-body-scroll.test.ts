// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { lockBodyScroll } from '@dunky.dev/scroll-lock'

describe('lockBodyScroll', () => {
  it('locks body scroll and releases it', () => {
    const release = lockBodyScroll()
    expect(document.body.style.overflow).toBe('hidden')

    release()
    expect(document.body.style.overflow).toBe('')
  })

  it('holds the lock until the last holder releases, in any order', () => {
    const releaseFirst = lockBodyScroll()
    const releaseSecond = lockBodyScroll()

    releaseFirst()
    expect(document.body.style.overflow).toBe('hidden')

    releaseSecond()
    expect(document.body.style.overflow).toBe('')
  })

  it('ignores a double release', () => {
    const releaseFirst = lockBodyScroll()
    const releaseSecond = lockBodyScroll()

    releaseFirst()
    releaseFirst()
    expect(document.body.style.overflow).toBe('hidden')

    releaseSecond()
    expect(document.body.style.overflow).toBe('')
  })

  it('restores the inline styles the body already had', () => {
    document.body.style.overflow = 'auto'
    document.body.style.paddingRight = '7px'

    const release = lockBodyScroll()
    expect(document.body.style.overflow).toBe('hidden')

    release()
    expect(document.body.style.overflow).toBe('auto')
    expect(document.body.style.paddingRight).toBe('7px')

    document.body.style.removeProperty('overflow')
    document.body.style.removeProperty('padding-right')
  })
})
