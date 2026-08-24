// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { trapFocus, type TrapFocusOptions } from '@dunky.dev/dom-focus-trap'

let release: (() => void) | undefined

const mount = (html: string, options?: TrapFocusOptions): HTMLElement => {
  document.body.innerHTML = `<div id="container" tabindex="-1">${html}</div>`
  const container = document.getElementById('container') as HTMLElement
  release = trapFocus(container, options)
  return container
}

// dispatchEvent returns false when a handler called preventDefault.
const pressTab = (target: HTMLElement, shiftKey = false): boolean =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true }),
  )

afterEach(() => {
  release?.()
  release = undefined
  document.body.innerHTML = ''
})

describe('trapFocus', () => {
  const BUTTONS =
    '<button type="button" id="first">first</button>' +
    '<button type="button" disabled>skipped</button>' +
    '<button type="button" id="last">last</button>'

  it('wraps Tab from the last focusable to the first', () => {
    const container = mount(BUTTONS)
    document.getElementById('last')?.focus()

    expect(pressTab(container)).toBe(false)
    expect(document.activeElement?.id).toBe('first')
  })

  it('wraps Shift+Tab from the first focusable to the last, skipping non-focusables', () => {
    const container = mount(BUTTONS)
    document.getElementById('first')?.focus()

    expect(pressTab(container, true)).toBe(false)
    expect(document.activeElement?.id).toBe('last')
  })

  it('wraps Shift+Tab from the container itself to the last focusable', () => {
    const container = mount(BUTTONS)
    container.focus()

    expect(pressTab(container, true)).toBe(false)
    expect(document.activeElement?.id).toBe('last')
  })

  it('steps Tab through the focusables itself, in cycle order', () => {
    const container = mount(BUTTONS)
    document.getElementById('first')?.focus()

    expect(pressTab(container)).toBe(false)
    expect(document.activeElement?.id).toBe('last')
  })

  it('sorts the `last` element to the end of the cycle', () => {
    const container = mount(
      '<button type="button" id="close">x</button>' +
        '<button type="button" id="a">a</button>' +
        '<button type="button" id="b">b</button>',
      { last: () => document.getElementById('close') },
    )

    document.getElementById('b')?.focus()
    pressTab(container) // b is DOM-last but not cycle-last
    expect(document.activeElement?.id).toBe('close')

    pressTab(container) // the `last` element is the wrap point
    expect(document.activeElement?.id).toBe('a')

    pressTab(container, true) // and backward wraps onto it
    expect(document.activeElement?.id).toBe('close')
  })

  it('turns Tab into a no-op when the container has no focusables', () => {
    const container = mount('')
    container.focus()

    expect(pressTab(container)).toBe(false)
    expect(document.activeElement).toBe(container)
  })

  it('does not trap while enabled() returns false', () => {
    const container = mount(BUTTONS, { enabled: () => false })
    document.getElementById('last')?.focus()

    expect(pressTab(container)).toBe(true)
    expect(document.activeElement?.id).toBe('last')
  })

  it('intercepts Tab pressed while focus is outside the container', () => {
    mount(BUTTONS)
    const outside = document.createElement('button')
    outside.type = 'button'
    document.body.appendChild(outside)
    outside.focus()

    expect(pressTab(outside)).toBe(false)
    expect(document.activeElement?.id).toBe('first')
  })

  it('excludes non-rendered elements from the cycle', () => {
    const container = mount(
      '<button type="button" id="first">first</button>' +
        '<button type="button" hidden>hidden</button>' +
        '<button type="button" style="display: none">display none</button>' +
        '<button type="button" style="visibility: hidden">visibility hidden</button>' +
        '<div style="display: none"><button type="button">wrapped</button></div>' +
        '<div hidden><button type="button">wrapped</button></div>' +
        '<button type="button" id="last">last</button>',
    )
    document.getElementById('first')?.focus()

    pressTab(container)
    expect(document.activeElement?.id).toBe('last')
  })

  it('collapses a same-name radio group to its checked radio', () => {
    const container = mount(
      '<button type="button" id="before">before</button>' +
        '<input type="radio" name="choice" id="r1" />' +
        '<input type="radio" name="choice" id="r2" checked />' +
        '<input type="radio" name="choice" id="r3" />' +
        '<button type="button" id="after">after</button>',
    )
    document.getElementById('before')?.focus()

    pressTab(container)
    expect(document.activeElement?.id).toBe('r2')

    pressTab(container)
    expect(document.activeElement?.id).toBe('after')
  })

  it('collapses a same-name radio group with no checked radio to its first', () => {
    const container = mount(
      '<button type="button" id="before">before</button>' +
        '<input type="radio" name="choice" id="r1" />' +
        '<input type="radio" name="choice" id="r2" />' +
        '<input type="radio" name="choice" id="r3" />' +
        '<button type="button" id="after">after</button>',
    )
    document.getElementById('before')?.focus()

    pressTab(container)
    expect(document.activeElement?.id).toBe('r1')

    pressTab(container)
    expect(document.activeElement?.id).toBe('after')
  })

  it('stops trapping once released', () => {
    const container = mount(BUTTONS)
    document.getElementById('last')?.focus()

    release?.()
    expect(pressTab(container)).toBe(true)
    expect(document.activeElement?.id).toBe('last')
  })
})
