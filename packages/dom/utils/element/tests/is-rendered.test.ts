// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { isFocusable, isRendered } from '@dunky.dev/dom-element'

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

describe('isFocusable', () => {
  it('is true for a plain control', () => {
    expect(isFocusable(mount('<input id="subject" />'))).toBe(true)
  })

  it('is false for a disabled control — own or through an ancestor fieldset', () => {
    expect(isFocusable(mount('<input id="subject" disabled />'))).toBe(false)
    expect(isFocusable(mount('<fieldset disabled><input id="subject" /></fieldset>'))).toBe(false)
  })

  it("is true inside a disabled fieldset's first legend — the native exception", () => {
    expect(
      isFocusable(mount('<fieldset disabled><legend><input id="subject" /></legend></fieldset>')),
    ).toBe(true)
  })

  it('is false inside an inert element or subtree', () => {
    expect(isFocusable(mount('<input id="subject" inert />'))).toBe(false)
    expect(isFocusable(mount('<div inert><input id="subject" /></div>'))).toBe(false)
  })
})
