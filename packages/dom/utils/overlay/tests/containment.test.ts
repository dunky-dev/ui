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
    authored.setAttribute('aria-hidden', 'true')
    const script = document.createElement('script')
    document.body.append(authored, script)
    const layer = mountLayer()

    const unregister = register({ id: 'a', depth: 1, element: layer.content, modal: true })
    expect(authored.hasAttribute('inert')).toBe(false)
    expect(script.hasAttribute('inert')).toBe(false)

    unregister()
    expect(authored.getAttribute('aria-hidden')).toBe('true')
  })

  it('hides an aria-hidden="false" sibling and restores the value on unregister', () => {
    // "false" asserts visible — the opposite of author-hidden — so the skip
    // for authored hiding must not cover it.
    const asserted = document.createElement('main')
    asserted.setAttribute('aria-hidden', 'false')
    document.body.append(asserted)
    const layer = mountLayer()

    const unregister = register({ id: 'a', depth: 1, element: layer.content, modal: true })
    expect(hiddenFrom(asserted)).toBe(true)

    unregister()
    expect(asserted.getAttribute('aria-hidden')).toBe('false')
    expect(asserted.hasAttribute('inert')).toBe(false)
  })

  it('hides nothing for a layer at the body — there is no outside', () => {
    const outside = document.createElement('main')
    document.body.append(outside)

    register({ id: 'a', depth: 1, element: document.body, modal: true })
    expect(outside.hasAttribute('inert')).toBe(false)
    expect(document.body.hasAttribute('inert')).toBe(false)
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

describe('containment under a non-modal layer', () => {
  // The ordinary layers — select menu, combobox list, tooltip, context menu —
  // are non-modal and portal to the body, so inside a dialog they land as a
  // sibling of it rather than a descendant.
  const setup = (): {
    outside: HTMLElement
    dialog: MountedLayer
    menu: MountedLayer
    unregisterMenu: () => void
  } => {
    const outside = document.createElement('main')
    document.body.append(outside)
    const dialog = mountLayer()
    const menu = mountLayer()

    register({
      id: 'dialog',
      depth: 1,
      element: dialog.content,
      modal: true,
      backdrop: () => dialog.backdrop,
    })
    const unregisterMenu = register({ id: 'menu', depth: 2, element: menu.content, modal: false })
    return { outside, dialog, menu, unregisterMenu }
  }

  it("keeps the modal layer's containment while a non-modal layer is topmost", () => {
    const { outside } = setup()

    // The decoupling: topmost has moved to the non-modal layer — it owns
    // Escape and the trap — yet containment stays with the modal layer.
    expect(isTopmostLayer('menu')).toBe(true)
    expect(hiddenFrom(outside)).toBe(true)
  })

  it('leaves the non-modal layer above reachable through its portal wrapper', () => {
    const { outside, menu } = setup()

    // Asserted against live containment: the menu's own portal wrapper is what
    // turns up as the sibling on the walk, so an identity-only exclude check
    // would inert the menu along with it.
    expect(hiddenFrom(outside)).toBe(true)
    expect(menu.viewport.hasAttribute('inert')).toBe(false)
    expect(menu.content.hasAttribute('inert')).toBe(false)
  })

  it('holds containment through the non-modal layer closing', () => {
    const { outside, unregisterMenu } = setup()

    unregisterMenu()
    expect(hiddenFrom(outside)).toBe(true)
  })

  it('hides page content sitting beside a layer portalled into an app branch', () => {
    // `container` on every overlay's Portal part is public API, so a layer can
    // land on an app branch rather than the body. Skipping that whole branch to
    // spare the layer would leave the page content beside it reachable.
    const app = document.createElement('div')
    const pageContent = document.createElement('article')
    const menuPortal = document.createElement('div')
    const menu = document.createElement('div')
    menuPortal.append(menu)
    app.append(pageContent, menuPortal)
    document.body.append(app)
    const dialog = mountLayer()

    register({ id: 'dialog', depth: 1, element: dialog.content, modal: true })
    register({ id: 'menu', depth: 2, element: menu, modal: false })

    expect(hiddenFrom(pageContent)).toBe(true)
    expect(app.hasAttribute('inert')).toBe(false)
    expect(menuPortal.hasAttribute('inert')).toBe(false)
    expect(menu.hasAttribute('inert')).toBe(false)
  })

  it('follows the upper modal layer when a non-modal layer sits above both', () => {
    const outer = mountLayer()
    const inner = mountLayer()
    const menu = mountLayer()
    register({ id: 'outer', depth: 1, element: outer.content, modal: true })
    register({ id: 'inner', depth: 2, element: inner.content, modal: true })
    register({ id: 'menu', depth: 3, element: menu.content, modal: false })

    expect(hiddenFrom(outer.viewport)).toBe(true)
    expect(inner.viewport.hasAttribute('inert')).toBe(false)
    expect(menu.viewport.hasAttribute('inert')).toBe(false)
  })
})

describe('layer stack global anchoring', () => {
  it('shares its stack with a duplicate module copy via the realm global', () => {
    // A second bundled copy of this module resolves the same stack through this
    // well-known global symbol; a layer registered through the public API must
    // therefore be visible on the globally-anchored store, not a rival stack.
    const layer = mountLayer()
    register({ id: 'a', depth: 1, element: layer.content, modal: true })

    const store = (globalThis as unknown as Record<symbol, unknown>)[
      Symbol.for('@dunky.dev/dom-overlay#overlay-store')
    ] as { stack: { isTopmost: (id: string) => boolean } } | undefined

    expect(store?.stack.isTopmost('a')).toBe(true)
  })
})

describe('getInitialFocus', () => {
  // Mounted, not detached: a candidate has to be rendered to be picked, and a
  // detached element renders nowhere.
  const mountContent = (html: string): HTMLElement => {
    const content = document.createElement('div')
    content.innerHTML = html
    document.body.append(content)
    return content
  }

  it('resolves the first form field that can take focus', () => {
    const content = mountContent(
      '<button type="button">action</button>' +
        '<input disabled />' +
        '<input type="hidden" />' +
        '<select id="field"></select>',
    )

    expect(getInitialFocus(content).id).toBe('field')
  })

  it('falls back to the content itself without form fields', () => {
    const content = mountContent('<button type="button">action</button>')

    expect(getInitialFocus(content)).toBe(content)
  })

  it('skips a field that does not render for one that does', () => {
    // A field in a collapsed section satisfies the selector but cannot take
    // focus, and it fails silently — so taking it would spend the candidate
    // and drop focus to the overlay window with nothing reporting the miss.
    const content = mountContent(
      '<div style="display: none"><input id="collapsed" /></div><input id="field" />',
    )

    expect(getInitialFocus(content).id).toBe('field')
  })

  it('hands over to the fields when the designated element does not render', () => {
    // The contract conditions the designated element on being able to take
    // focus, so an unrendered one must not consume the chain down to the
    // window.
    const content = mountContent('<input id="designated" hidden /><input id="field" />')
    const designated = document.getElementById('designated') as HTMLElement

    expect(getInitialFocus(content, designated).id).toBe('field')
  })
})
