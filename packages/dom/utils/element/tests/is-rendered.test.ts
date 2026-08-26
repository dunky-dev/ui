// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { isRendered } from '@dunky.dev/dom-element'

const mount = (html: string): HTMLElement => {
  document.body.innerHTML = html
  return document.getElementById('subject') as HTMLElement
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('isRendered', () => {
  it('is true for an element that renders', () => {
    expect(isRendered(mount('<input id="subject" />'))).toBe(true)
  })

  it('is false for a detached element', () => {
    expect(isRendered(document.createElement('input'))).toBe(false)
  })

  it('is false when the element itself does not render', () => {
    expect(isRendered(mount('<input id="subject" hidden />'))).toBe(false)
    expect(isRendered(mount('<input id="subject" style="display: none" />'))).toBe(false)
    expect(isRendered(mount('<input id="subject" style="visibility: hidden" />'))).toBe(false)
  })

  it('is false inside a collapsed ancestor — display does not inherit', () => {
    expect(isRendered(mount('<div style="display: none"><input id="subject" /></div>'))).toBe(false)
    expect(isRendered(mount('<div hidden><input id="subject" /></div>'))).toBe(false)
  })

  it('is true under a transparent ancestor — opacity still renders', () => {
    expect(isRendered(mount('<div style="opacity: 0"><input id="subject" /></div>'))).toBe(true)
  })
})
