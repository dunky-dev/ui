// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  expandedPopupControlHoldsFocus,
  foreignPopupHoldsFocus,
  registerLayer,
} from '@dunky.dev/dom-overlay'

const registered: Array<() => void> = []

// A registered layer window with the given markup inside it.
const mountLayer = (id: string, depth: number, html = ''): HTMLElement => {
  const content = document.createElement('div')
  content.tabIndex = -1
  content.innerHTML = html
  document.body.append(content)
  registered.push(registerLayer({ id, depth, element: content, modal: true }))
  return content
}

// Markup appended beside the layers, the way a portalled popup lands.
const mountBeside = (html: string): HTMLElement => {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.append(host)
  return host
}

const focus = (root: ParentNode, selector: string): void => {
  ;(root.querySelector(selector) as HTMLElement).focus()
}

afterEach(() => {
  for (const unregister of registered) unregister()
  registered.length = 0
  document.body.innerHTML = ''
})

describe('foreignPopupHoldsFocus', () => {
  it('is false while focus sits in the layer window itself', () => {
    const content = mountLayer('dlg', 1, '<button id="action">action</button>')
    focus(content, '#action')

    expect(foreignPopupHoldsFocus('dlg')).toBe(false)
  })

  it('is true while focus sits in a popup rendered inside the window', () => {
    const content = mountLayer(
      'dlg',
      1,
      '<ul role="listbox"><li id="option" role="option" tabindex="0">a</li></ul>',
    )
    focus(content, '#option')

    expect(foreignPopupHoldsFocus('dlg')).toBe(true)
  })

  it('is true while focus sits in a popup portalled beside the window', () => {
    mountLayer('dlg', 1)
    const beside = mountBeside('<div role="dialog"><button id="inside">inside</button></div>')
    focus(beside, '#inside')

    expect(foreignPopupHoldsFocus('dlg')).toBe(true)
  })

  // Outside the window and not in a popup role: the page is inert while a
  // modal layer is open, so whatever holds focus out there is a layer.
  it('is true while focus sits outside the window in an element with no popup role', () => {
    mountLayer('dlg', 1)
    const beside = mountBeside('<div><button id="floating">floating</button></div>')
    focus(beside, '#floating')

    expect(foreignPopupHoldsFocus('dlg')).toBe(true)
  })

  it('is false while focus sits in another registered layer', () => {
    const lower = mountLayer('lower', 1, '<button id="beneath">beneath</button>')
    mountLayer('upper', 2)
    focus(lower, '#beneath')

    expect(foreignPopupHoldsFocus('upper')).toBe(false)
  })

  it('is false while focus sits on the body', () => {
    mountLayer('dlg', 1)
    ;(document.activeElement as HTMLElement | null)?.blur()

    expect(foreignPopupHoldsFocus('dlg')).toBe(false)
  })

  it('is false for an id the stack does not know', () => {
    const beside = mountBeside('<div role="menu"><button id="item">item</button></div>')
    focus(beside, '#item')

    expect(foreignPopupHoldsFocus('nobody')).toBe(false)
  })
})

describe('expandedPopupControlHoldsFocus', () => {
  it('is true while focus sits on a control inside the window whose popup is expanded', () => {
    const content = mountLayer(
      'dlg',
      1,
      '<input id="combo" role="combobox" aria-haspopup="listbox" aria-expanded="true" />',
    )
    focus(content, '#combo')

    expect(expandedPopupControlHoldsFocus('dlg')).toBe(true)
  })

  it('is false once the popup collapses', () => {
    const content = mountLayer(
      'dlg',
      1,
      '<input id="combo" role="combobox" aria-haspopup="listbox" aria-expanded="false" />',
    )
    focus(content, '#combo')

    expect(expandedPopupControlHoldsFocus('dlg')).toBe(false)
  })

  // Expanded, but with no popup to close: a disclosure or accordion trigger.
  it('is false for an expanded control without a popup', () => {
    const content = mountLayer(
      'dlg',
      1,
      '<button id="disclosure" aria-expanded="true" aria-controls="more">more</button><div id="more"></div>',
    )
    focus(content, '#disclosure')

    expect(expandedPopupControlHoldsFocus('dlg')).toBe(false)
  })
})
