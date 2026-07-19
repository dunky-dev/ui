// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { getInitialFocus, isTopmostLayer, registerLayer } from '@dunky.dev/dom-overlay'
import type { Layer } from '@dunky.dev/dom-overlay'

interface MountedLayer {
  backdrop: HTMLElement
  viewport: HTMLElement
  content: HTMLElement
}

// The anatomy every substrate portals to the body: backdrop and viewport as
// flat siblings, the overlay window inside the viewport.
const mountLayer = (): MountedLayer => {
  const backdrop = document.createElement('div')
  const viewport = document.createElement('div')
  const content = document.createElement('dialog')
  viewport.append(content)
  document.body.append(backdrop, viewport)
  return { backdrop, viewport, content }
}

const registered: Array<() => void> = []

const register = (layer: Layer): (() => void) => {
  const unregister = registerLayer(layer)
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

describe('registerLayer containment', () => {
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
    expect(isTopmostLayer('inner')).toBe(true)

    unregisterInner()
    expect(outer.backdrop.hasAttribute('inert')).toBe(false)
    expect(hiddenFrom(inner.viewport)).toBe(true)
    expect(isTopmostLayer('outer')).toBe(true)
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
