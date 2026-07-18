// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isTopmostLayer, layerContainsTarget, registerLayer } from '@dunky.dev/dom-layer-stack'
import type { LayerInit } from '@dunky.dev/dom-layer-stack'

let disposers: (() => void)[] = []

const register = (layer: LayerInit): (() => void) => {
  const unregister = registerLayer(layer)
  disposers.push(unregister)
  return unregister
}

// Each panel gets its own body-level host, mimicking a portal: the host is on
// the panel's kept path, everything else at body level is outside.
const mountPanel = (id: string): HTMLElement => {
  const host = document.createElement('div')
  host.id = `${id}-host`
  const panel = document.createElement('div')
  panel.id = id
  host.append(panel)
  document.body.append(host)
  return panel
}

const hiddenAndInert = (element: Element): boolean =>
  element.getAttribute('aria-hidden') === 'true' && element.hasAttribute('inert')

let page: HTMLElement

beforeEach(() => {
  page = document.createElement('main')
  document.body.append(page)
})

afterEach(() => {
  for (const dispose of disposers) dispose()
  disposers = []
  document.body.innerHTML = ''
})

describe('topmost ownership', () => {
  it('the deepest layer is topmost, regardless of registration order', () => {
    register({ id: 'nested', depth: 2, element: mountPanel('nested'), modal: true })
    register({ id: 'root', depth: 1, element: mountPanel('root'), modal: true })

    expect(isTopmostLayer('nested')).toBe(true)
    expect(isTopmostLayer('root')).toBe(false)
  })

  it('open order breaks ties between layers at the same depth', () => {
    register({ id: 'first', depth: 1, element: mountPanel('first'), modal: true })
    register({ id: 'second', depth: 1, element: mountPanel('second'), modal: true })

    expect(isTopmostLayer('second')).toBe(true)
  })

  it('unregistering the top layer promotes the one beneath', () => {
    register({ id: 'root', depth: 1, element: mountPanel('root'), modal: true })
    const unregister = register({
      id: 'nested',
      depth: 2,
      element: mountPanel('nested'),
      modal: true,
    })

    unregister()
    expect(isTopmostLayer('root')).toBe(true)
    expect(isTopmostLayer('nested')).toBe(false)
  })

  it('no layer is topmost while nothing is registered', () => {
    expect(isTopmostLayer('anything')).toBe(false)
  })
})

describe('assistive-tech containment', () => {
  it('a modal layer hides everything outside its subtree, with an exact undo', () => {
    const panel = mountPanel('modal')
    const unregister = register({ id: 'modal', depth: 1, element: panel, modal: true })

    expect(hiddenAndInert(page)).toBe(true)
    expect(panel.hasAttribute('aria-hidden')).toBe(false)
    expect(panel.parentElement?.hasAttribute('aria-hidden')).toBe(false)

    unregister()
    expect(page.hasAttribute('aria-hidden')).toBe(false)
    expect(page.hasAttribute('inert')).toBe(false)
  })

  it('a non-modal layer hides nothing', () => {
    register({ id: 'popover', depth: 1, element: mountPanel('popover'), modal: false })
    expect(page.hasAttribute('aria-hidden')).toBe(false)
  })

  it('skips content-less tags and author-controlled attributes', () => {
    const script = document.createElement('script')
    const authored = document.createElement('div')
    authored.setAttribute('aria-hidden', 'false')
    document.body.append(script, authored)

    const unregister = register({
      id: 'modal',
      depth: 1,
      element: mountPanel('modal'),
      modal: true,
    })

    expect(script.hasAttribute('aria-hidden')).toBe(false)
    expect(authored.getAttribute('aria-hidden')).toBe('false')
    expect(authored.hasAttribute('inert')).toBe(false)

    unregister()
    expect(authored.getAttribute('aria-hidden')).toBe('false')
  })

  it('a modal layer above another hides the lower layer, and closing restores it', () => {
    const rootPanel = mountPanel('root')
    register({ id: 'root', depth: 1, element: rootPanel, modal: true })
    const unregister = register({
      id: 'nested',
      depth: 2,
      element: mountPanel('nested'),
      modal: true,
    })

    expect(hiddenAndInert(rootPanel.parentElement as Element)).toBe(true)

    unregister()
    expect(rootPanel.parentElement?.hasAttribute('aria-hidden')).toBe(false)
    expect(hiddenAndInert(page)).toBe(true)
  })

  it('keeps a non-modal layer above a modal one reachable while the page stays hidden', () => {
    const dialogPanel = mountPanel('dialog')
    const popoverPanel = mountPanel('popover')
    register({ id: 'dialog', depth: 1, element: dialogPanel, modal: true })
    register({ id: 'popover', depth: 2, element: popoverPanel, modal: false })

    expect(hiddenAndInert(page)).toBe(true)
    expect(dialogPanel.parentElement?.hasAttribute('aria-hidden')).toBe(false)
    expect(popoverPanel.parentElement?.hasAttribute('aria-hidden')).toBe(false)
  })

  it('hides nothing new for a layer nested inside the anchoring subtree', () => {
    const dialogPanel = mountPanel('dialog')
    const inlinePopover = document.createElement('div')
    const siblingButton = document.createElement('button')
    dialogPanel.append(siblingButton, inlinePopover)
    register({ id: 'dialog', depth: 1, element: dialogPanel, modal: true })
    register({ id: 'popover', depth: 2, element: inlinePopover, modal: false })

    expect(siblingButton.hasAttribute('aria-hidden')).toBe(false)
  })
})

describe('layerContainsTarget', () => {
  it('reports a target inside its own subtree', () => {
    const panel = mountPanel('dialog')
    const inside = document.createElement('button')
    panel.append(inside)
    register({ id: 'dialog', depth: 1, element: panel, modal: true })

    expect(layerContainsTarget('dialog', inside)).toBe(true)
    expect(layerContainsTarget('dialog', page)).toBe(false)
  })

  it('reports a target inside a layer stacked above, but not one beneath', () => {
    const rootPanel = mountPanel('root')
    const nestedPanel = mountPanel('nested')
    register({ id: 'root', depth: 1, element: rootPanel, modal: true })
    register({ id: 'nested', depth: 2, element: nestedPanel, modal: false })

    expect(layerContainsTarget('root', nestedPanel)).toBe(true)
    expect(layerContainsTarget('nested', rootPanel)).toBe(false)
  })

  it('reports an independent sibling at the same depth as outside', () => {
    const firstPanel = mountPanel('first')
    const secondPanel = mountPanel('second')
    register({ id: 'first', depth: 1, element: firstPanel, modal: false })
    register({ id: 'second', depth: 1, element: secondPanel, modal: false })

    expect(layerContainsTarget('first', secondPanel)).toBe(false)
  })

  it('reports nothing for an unregistered id', () => {
    const panel = mountPanel('dialog')
    register({ id: 'dialog', depth: 1, element: panel, modal: true })

    expect(layerContainsTarget('unknown', panel)).toBe(false)
  })
})
