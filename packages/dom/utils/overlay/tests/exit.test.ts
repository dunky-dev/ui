// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { hideExitingLayer, watchExitAnimation } from '@dunky.dev/dom-overlay'

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('watchExitAnimation', () => {
  const mount = (): HTMLElement => {
    document.body.innerHTML = '<dialog id="content"><button type="button">in</button></dialog>'
    return document.getElementById('content') as HTMLElement
  }

  it("completes once on the element's own transition/animation end", () => {
    const element = mount()
    const onComplete = vi.fn()
    watchExitAnimation(element, onComplete)

    element.dispatchEvent(new Event('transitionend'))
    element.dispatchEvent(new Event('animationend'))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("ignores ends bubbling from descendants — the exit is the element's own", () => {
    const element = mount()
    const onComplete = vi.fn()
    watchExitAnimation(element, onComplete)

    element.querySelector('button')?.dispatchEvent(new Event('transitionend', { bubbles: true }))
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('falls back to a timeout so a missing exit style cannot hang the close', () => {
    vi.useFakeTimers()
    const element = mount()
    const onComplete = vi.fn()
    watchExitAnimation(element, onComplete)

    vi.runAllTimers()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('cancelling stops both the listeners and the fallback', () => {
    vi.useFakeTimers()
    const element = mount()
    const onComplete = vi.fn()
    const cancel = watchExitAnimation(element, onComplete)

    cancel()
    element.dispatchEvent(new Event('transitionend'))
    vi.runAllTimers()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('completes immediately when the user prefers reduced motion', () => {
    const element = mount()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true } as unknown as MediaQueryList),
    )

    const onComplete = vi.fn()
    watchExitAnimation(element, onComplete)
    expect(onComplete).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
})

describe('hideExitingLayer', () => {
  it('hides the outermost portalled ancestor and the backdrop, and undoes exactly that', () => {
    document.body.innerHTML =
      '<div id="backdrop"></div><div id="viewport"><dialog id="content"></dialog></div>'
    const backdrop = document.getElementById('backdrop') as HTMLElement
    const viewport = document.getElementById('viewport') as HTMLElement
    const content = document.getElementById('content') as HTMLElement

    const undo = hideExitingLayer(content, document.body, backdrop)
    expect(viewport.hasAttribute('inert')).toBe(true)
    expect(viewport.getAttribute('aria-hidden')).toBe('true')
    expect(backdrop.hasAttribute('inert')).toBe(true)
    expect(content.hasAttribute('inert')).toBe(false) // covered by the viewport

    undo()
    expect(viewport.hasAttribute('inert')).toBe(false)
    expect(viewport.hasAttribute('aria-hidden')).toBe(false)
    expect(backdrop.hasAttribute('inert')).toBe(false)
  })

  it('hides the content itself when it is portalled bare', () => {
    document.body.innerHTML = '<dialog id="content"></dialog>'
    const content = document.getElementById('content') as HTMLElement

    hideExitingLayer(content, document.body)
    expect(content.hasAttribute('inert')).toBe(true)
  })

  it('skips a backdrop already inside the hidden root, and author-hidden elements', () => {
    document.body.innerHTML =
      '<div id="viewport"><div id="backdrop"></div><dialog id="content"></dialog></div>'
    const viewport = document.getElementById('viewport') as HTMLElement
    const backdrop = document.getElementById('backdrop') as HTMLElement
    viewport.setAttribute('aria-hidden', 'false')

    const undo = hideExitingLayer(
      document.getElementById('content') as HTMLElement,
      document.body,
      backdrop,
    )
    expect(backdrop.hasAttribute('inert')).toBe(false) // inside the root — covered
    expect(viewport.hasAttribute('inert')).toBe(false) // the author's aria-hidden is theirs

    undo()
    expect(viewport.getAttribute('aria-hidden')).toBe('false')
  })
})
