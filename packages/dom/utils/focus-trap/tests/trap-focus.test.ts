// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { trapFocus } from '@dunky.dev/focus-trap'

let release: (() => void) | undefined

const mount = (html: string, enabled?: () => boolean): HTMLElement => {
  document.body.innerHTML = `<div id="container" tabindex="-1">${html}</div>`
  const container = document.getElementById('container') as HTMLElement
  release = trapFocus(container, { enabled })
  return container
}

// dispatchEvent returns false when a handler called preventDefault.
const pressTab = (container: HTMLElement, shiftKey = false): boolean =>
  container.dispatchEvent(
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

  it('lets Tab move naturally between inner focusables', () => {
    const container = mount(BUTTONS)
    document.getElementById('first')?.focus()

    expect(pressTab(container)).toBe(true)
  })

  it('turns Tab into a no-op when the container has no focusables', () => {
    const container = mount('')
    container.focus()

    expect(pressTab(container)).toBe(false)
    expect(document.activeElement).toBe(container)
  })

  it('does not trap while enabled() returns false', () => {
    const container = mount(BUTTONS, () => false)
    document.getElementById('last')?.focus()

    expect(pressTab(container)).toBe(true)
    expect(document.activeElement?.id).toBe('last')
  })

  it('stops trapping once released', () => {
    const container = mount(BUTTONS)
    document.getElementById('last')?.focus()

    release?.()
    expect(pressTab(container)).toBe(true)
    expect(document.activeElement?.id).toBe('last')
  })
})
