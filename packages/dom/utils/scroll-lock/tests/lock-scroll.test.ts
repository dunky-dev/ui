// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { lockScroll } from '@dunky.dev/dom-scroll-lock'

// Both axes by name, never the `overflow` shorthand: the shorthand can't
// express a one-axis declaration, and jsdom doesn't link it to its longhands,
// so asserting it would pass whatever the axes actually hold.
function expectOverflow(target: HTMLElement, value: 'hidden' | ''): void {
  expect(target.style.overflowX).toBe(value)
  expect(target.style.overflowY).toBe(value)
}

// Browsers resolve computed lengths on a rendered element to `Npx`; jsdom
// returns '' for logical longhands, so tests exercising the padding math hand
// lockScroll the values a browser would compute. One-shot: lockScroll reads
// computed style exactly once per body lock, and everything else keeps the
// real implementation.
function mockComputedStyleOnce(values: Partial<CSSStyleDeclaration>): void {
  vi.spyOn(window, 'getComputedStyle').mockImplementationOnce(() => values as CSSStyleDeclaration)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('lockScroll', () => {
  it('locks body scroll by default and releases it', () => {
    const release = lockScroll()
    expectOverflow(document.body, 'hidden')

    release()
    expectOverflow(document.body, '')
  })

  it('holds the lock until the last holder releases, in any order', () => {
    const releaseFirst = lockScroll()
    const releaseSecond = lockScroll()

    releaseFirst()
    expectOverflow(document.body, 'hidden')

    releaseSecond()
    expectOverflow(document.body, '')
  })

  it('ignores a double release', () => {
    const releaseFirst = lockScroll()
    const releaseSecond = lockScroll()

    releaseFirst()
    releaseFirst()
    expectOverflow(document.body, 'hidden')

    releaseSecond()
    expectOverflow(document.body, '')
  })

  it('compensates both vanished scrollbars logically and clears them on release', () => {
    // jsdom reports window sizes but zero client sizes, so both scrollbar
    // footprints measure > 0 and both compensation branches run.
    mockComputedStyleOnce({ paddingInlineEnd: '0px', paddingBlockEnd: '0px' })
    const release = lockScroll()
    expect(document.body.style.paddingInlineEnd).not.toBe('')
    expect(document.body.style.paddingBlockEnd).not.toBe('')

    release()
    expect(document.body.style.paddingInlineEnd).toBe('')
    expect(document.body.style.paddingBlockEnd).toBe('')
  })

  it('restores the inline styles the target already had', () => {
    document.body.style.overflow = 'auto'
    document.body.style.paddingInlineEnd = '7px'
    document.body.style.paddingBlockEnd = '9px'
    mockComputedStyleOnce({ paddingInlineEnd: '7px', paddingBlockEnd: '9px' })

    const release = lockScroll()
    expectOverflow(document.body, 'hidden')

    release()
    // The shorthand, not the axes: this test declared the shorthand, and
    // that's the inline state restore must hand back.
    expect(document.body.style.overflow).toBe('auto')
    expect(document.body.style.paddingInlineEnd).toBe('7px')
    expect(document.body.style.paddingBlockEnd).toBe('9px')

    document.body.style.removeProperty('overflow')
    document.body.style.removeProperty('padding-inline-end')
    document.body.style.removeProperty('padding-block-end')
  })

  it('adds the footprint on top of the computed padding instead of overwriting it', () => {
    document.body.style.paddingInlineEnd = '20px'
    document.body.style.paddingBlockEnd = '30px'
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const scrollbarHeight = window.innerHeight - document.documentElement.clientHeight
    mockComputedStyleOnce({ paddingInlineEnd: '20px', paddingBlockEnd: '30px' })

    const release = lockScroll()
    expect(document.body.style.paddingInlineEnd).toBe(`${20 + scrollbarWidth}px`)
    expect(document.body.style.paddingBlockEnd).toBe(`${30 + scrollbarHeight}px`)

    release()
    expect(document.body.style.paddingInlineEnd).toBe('20px')
    expect(document.body.style.paddingBlockEnd).toBe('30px')

    document.body.style.removeProperty('padding-inline-end')
    document.body.style.removeProperty('padding-block-end')
  })

  it('anchors its lock registry on the realm global so duplicate module copies share it', () => {
    // A second bundled copy of this module resolves the same registry through
    // this well-known global symbol instead of holding a rival Map that would
    // double-lock or leak the lock.
    const release = lockScroll()
    const locks = (globalThis as unknown as Record<symbol, Map<unknown, unknown> | undefined>)[
      Symbol.for('@dunky.dev/dom-scroll-lock#locks')
    ]
    expect(locks?.has(document.body)).toBe(true)

    release()
    expect(locks?.has(document.body)).toBe(false)
  })

  it('locks an element target independently of the body', () => {
    const container = document.createElement('div')
    document.body.append(container)

    const releaseContainer = lockScroll(container)
    expectOverflow(container, 'hidden')
    expectOverflow(document.body, '')

    const releaseBody = lockScroll()
    releaseContainer()
    expectOverflow(container, '')
    expectOverflow(document.body, 'hidden')

    releaseBody()
    expectOverflow(document.body, '')
    container.remove()
  })

  it('restores a container that declares its scrolling on one axis only', () => {
    // The `overflow` shorthand serializes back to '' unless both longhands
    // are set, so a one-axis container has to be saved and restored per axis
    // or release removes the consumer's own declaration.
    const container = document.createElement('div')
    container.style.overflowY = 'auto'
    document.body.append(container)

    const release = lockScroll(container)
    expectOverflow(container, 'hidden')

    release()
    expect(container.style.overflowY).toBe('auto')

    container.remove()
  })
})
