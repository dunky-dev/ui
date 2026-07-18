// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { trackInteractOutside } from '@dunky.dev/dom-interact-outside'
import type { TrackInteractOutsideOptions } from '@dunky.dev/dom-interact-outside'

let release: (() => void) | undefined

const mount = (options: TrackInteractOutsideOptions): void => {
  document.body.innerHTML =
    '<div id="container"><button type="button" id="inside">inside</button></div>' +
    '<button type="button" id="outside">outside</button>'
  const container = document.getElementById('container') as HTMLElement
  release = trackInteractOutside(container, options)
}

const pressPointer = (id: string): void => {
  document.getElementById(id)?.dispatchEvent(new Event('pointerdown', { bubbles: true }))
}

// jsdom has no PointerEvent constructor, so the touch pointerType is grafted
// onto a plain Event.
const pressTouch = (id: string): void => {
  const event = new Event('pointerdown', { bubbles: true })
  Object.defineProperty(event, 'pointerType', { value: 'touch' })
  document.getElementById(id)?.dispatchEvent(event)
}

const click = (id: string): void => {
  document.getElementById(id)?.dispatchEvent(new Event('click', { bubbles: true }))
}

afterEach(() => {
  release?.()
  release = undefined
  document.body.innerHTML = ''
})

describe('trackInteractOutside', () => {
  it('fires on a pointer press outside the container, not on one inside', () => {
    const onInteractOutside = vi.fn()
    mount({ onInteractOutside })

    pressPointer('inside')
    expect(onInteractOutside).not.toHaveBeenCalled()

    pressPointer('outside')
    expect(onInteractOutside).toHaveBeenCalledTimes(1)
    expect(onInteractOutside.mock.calls[0]?.[0]?.target?.id).toBe('outside')
  })

  it('fires when focus lands outside the container', () => {
    const onInteractOutside = vi.fn()
    mount({ onInteractOutside })

    document.getElementById('outside')?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(onInteractOutside).toHaveBeenCalledTimes(1)
  })

  it('fires once for a press that also moves focus outside', () => {
    const onInteractOutside = vi.fn()
    mount({ onInteractOutside })

    pressPointer('outside')
    document.getElementById('outside')?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(onInteractOutside).toHaveBeenCalledTimes(1)
  })

  it('hears focus again once the press settles', async () => {
    const onInteractOutside = vi.fn()
    mount({ onInteractOutside })

    pressPointer('outside')
    document.getElementById('outside')?.dispatchEvent(new Event('pointerup', { bubbles: true }))
    await new Promise(resolve => setTimeout(resolve, 0))

    document.getElementById('outside')?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(onInteractOutside).toHaveBeenCalledTimes(2)
  })

  it('does not fire for a target the ignore predicate excuses', () => {
    const onInteractOutside = vi.fn()
    mount({ onInteractOutside, ignore: target => (target as Element).id === 'outside' })

    pressPointer('outside')
    expect(onInteractOutside).not.toHaveBeenCalled()
  })

  it('reports a touch press only once its click confirms a tap', () => {
    const onInteractOutside = vi.fn()
    mount({ onInteractOutside })

    pressTouch('outside')
    expect(onInteractOutside).not.toHaveBeenCalled()

    click('outside')
    expect(onInteractOutside).toHaveBeenCalledTimes(1)
    // The press is what gets reported — the click only confirms it.
    expect(onInteractOutside.mock.calls[0]?.[0]?.type).toBe('pointerdown')
  })

  it('never reports a touch gesture the browser turns into a scroll', () => {
    const onInteractOutside = vi.fn()
    mount({ onInteractOutside })

    pressTouch('outside')
    // The browser takes the gesture over for scrolling: `pointercancel`, no
    // gesture click — and the wait is disarmed, so even a later click (e.g.
    // keyboard-activated, with no press of its own) reports nothing.
    document.dispatchEvent(new Event('pointercancel'))
    click('outside')
    expect(onInteractOutside).not.toHaveBeenCalled()
  })

  it('detects an outside press even when its propagation is stopped', () => {
    const onInteractOutside = vi.fn()
    mount({ onInteractOutside })

    const outside = document.getElementById('outside') as HTMLElement
    outside.addEventListener('pointerdown', event => event.stopPropagation())
    pressPointer('outside')
    expect(onInteractOutside).toHaveBeenCalledTimes(1)
  })

  it('stops firing once released', () => {
    const onInteractOutside = vi.fn()
    mount({ onInteractOutside })

    release?.()
    pressPointer('outside')
    expect(onInteractOutside).not.toHaveBeenCalled()
  })
})
