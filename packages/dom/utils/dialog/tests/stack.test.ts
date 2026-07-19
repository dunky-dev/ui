// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { getInitialFocus, isTopmostDialog, registerDialog } from '@dunky.dev/dom-dialog'
import type { DialogLayer } from '@dunky.dev/dom-dialog'

interface MountedLayer {
  backdrop: HTMLElement
  viewport: HTMLElement
  content: HTMLElement
}

// The anatomy every substrate portals to the body: backdrop and viewport as
// flat siblings, the dialog window inside the viewport.
const mountLayer = (): MountedLayer => {
  const backdrop = document.createElement('div')
  const viewport = document.createElement('div')
  const content = document.createElement('dialog')
  viewport.append(content)
  document.body.append(backdrop, viewport)
  return { backdrop, viewport, content }
}

const registered: Array<() => void> = []

const register = (layer: Omit<DialogLayer, 'order'>): (() => void) => {
  const unregister = registerDialog(layer)
  registered.push(unregister)
  return unregister
}

const hiddenFrom = (element: Element): boolean =>
  element.getAttribute('aria-hidden') === 'true' && element.hasAttribute('inert')

afterEach(() => {
  for (const unregister of registered) unregister()
  registered.length = 0
  document.body.innerHTML = ''
})

describe('registerDialog containment', () => {
  it('hides everything outside the topmost modal layer and restores it on unregister', () => {
    const outside = document.createElement('main')
    document.body.append(outside)
    const layer = mountLayer()

    const unregister = register({ id: 'a', depth: 1, element: layer.content, modal: true })
    expect(hiddenFrom(outside)).toBe(true)

    unregister()
    expect(outside.hasAttribute('aria-hidden')).toBe(false)
    expect(outside.hasAttribute('inert')).toBe(false)
  })

  it("keeps the layer's own backdrop pressable", () => {
    const layer = mountLayer()
    register({
      id: 'a',
      depth: 1,
      element: layer.content,
      modal: true,
      backdrop: () => layer.backdrop,
    })

    expect(layer.backdrop.hasAttribute('aria-hidden')).toBe(false)
    expect(layer.backdrop.hasAttribute('inert')).toBe(false)
  })

  it('leaves pre-hidden elements and content-less tags to their author', () => {
    const authored = document.createElement('div')
    authored.setAttribute('aria-hidden', 'false')
    const script = document.createElement('script')
    document.body.append(authored, script)
    const layer = mountLayer()

    const unregister = register({ id: 'a', depth: 1, element: layer.content, modal: true })
    expect(authored.hasAttribute('inert')).toBe(false)
    expect(script.hasAttribute('inert')).toBe(false)

    unregister()
    expect(authored.getAttribute('aria-hidden')).toBe('false')
  })

  it('hides nothing for a non-modal layer', () => {
    const outside = document.createElement('main')
    document.body.append(outside)
    const layer = mountLayer()

    register({ id: 'a', depth: 1, element: layer.content, modal: false })
    expect(outside.hasAttribute('aria-hidden')).toBe(false)
    expect(outside.hasAttribute('inert')).toBe(false)
  })

  it("re-excepts the lower layer's backdrop the moment it becomes topmost again", () => {
    const outer = mountLayer()
    const inner = mountLayer()
    register({
      id: 'outer',
      depth: 1,
      element: outer.content,
      modal: true,
      backdrop: () => outer.backdrop,
    })
    const unregisterInner = register({
      id: 'inner',
      depth: 2,
      element: inner.content,
      modal: true,
      backdrop: () => inner.backdrop,
    })

    // While the inner layer is topmost, the outer layer is hidden whole —
    // backdrop included; only the topmost's own backdrop is excepted.
    expect(hiddenFrom(outer.backdrop)).toBe(true)
    expect(hiddenFrom(outer.viewport)).toBe(true)
    expect(inner.backdrop.hasAttribute('inert')).toBe(false)

    unregisterInner()
    expect(outer.backdrop.hasAttribute('inert')).toBe(false)
    expect(hiddenFrom(inner.viewport)).toBe(true)
  })
})

describe('isTopmostDialog', () => {
  it('deeper nesting wins regardless of registration order', () => {
    const shallow = mountLayer()
    const deep = mountLayer()
    register({ id: 'deep', depth: 2, element: deep.content, modal: true })
    register({ id: 'shallow', depth: 1, element: shallow.content, modal: true })

    expect(isTopmostDialog('deep')).toBe(true)
    expect(isTopmostDialog('shallow')).toBe(false)
  })

  it('open order breaks ties between layers at the same depth', () => {
    const first = mountLayer()
    const second = mountLayer()
    register({ id: 'first', depth: 1, element: first.content, modal: true })
    const unregisterSecond = register({
      id: 'second',
      depth: 1,
      element: second.content,
      modal: true,
    })
    expect(isTopmostDialog('second')).toBe(true)

    unregisterSecond()
    expect(isTopmostDialog('first')).toBe(true)
  })
})

describe('getInitialFocus', () => {
  it('resolves the first form field that can take focus', () => {
    const content = document.createElement('div')
    content.innerHTML =
      '<button type="button">action</button>' +
      '<input disabled />' +
      '<input type="hidden" />' +
      '<select id="field"></select>'

    expect(getInitialFocus(content).id).toBe('field')
  })

  it('falls back to the content itself without form fields', () => {
    const content = document.createElement('div')
    content.innerHTML = '<button type="button">action</button>'

    expect(getInitialFocus(content)).toBe(content)
  })
})
