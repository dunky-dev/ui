// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { trackPressOrigin } from '@dunky.dev/dom-press-origin'

const dispatchPointerDown = (target: Element): void => {
  target.dispatchEvent(new Event('pointerdown', { bubbles: true }))
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('trackPressOrigin', () => {
  it('reports whether the most recent press began inside the tracked element', () => {
    const element = document.createElement('div')
    const inner = document.createElement('button')
    element.append(inner)
    const outer = document.createElement('button')
    document.body.append(element, outer)

    const tracker = trackPressOrigin(element)
    expect(tracker.startedInside()).toBe(false)

    dispatchPointerDown(inner)
    expect(tracker.startedInside()).toBe(true)

    dispatchPointerDown(outer)
    expect(tracker.startedInside()).toBe(false)

    tracker.dispose()
  })

  it('stops updating once disposed', () => {
    const element = document.createElement('div')
    const inner = document.createElement('button')
    element.append(inner)
    document.body.append(element)

    const tracker = trackPressOrigin(element)
    tracker.dispose()
    dispatchPointerDown(inner)

    expect(tracker.startedInside()).toBe(false)
  })
})
