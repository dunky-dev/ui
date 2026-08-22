// @vitest-environment jsdom
// The DOM half of the Dialog, driven directly — no substrate, no framework.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { machine, type Machine } from '@dunky.dev/state-machine'
import { dialogMachine } from '@dunky.dev/dialog'
import type {
  DialogContext,
  DialogMachineEvent,
  DialogOptions,
  DialogStateName,
} from '@dunky.dev/dialog'
import { registerLayer } from '@dunky.dev/dom-overlay'
import {
  acceptsBackdropPress,
  acceptsViewportPress,
  dialogTrapOptions,
  domDialogEffects,
  openDialogLayer,
  startExitWindow,
} from '@dunky.dev/dom-dialog'

type DialogService = Machine<DialogStateName, DialogContext, DialogMachineEvent>

const build = (options: DialogOptions = {}): DialogService => {
  const service = machine(dialogMachine({ id: 'dlg', ...options }))
  service.start()
  return service
}

// The Escape listener is the last effect in the list; the ones before it are
// the core's, covered by the core's own tests.
const armEscape = (service: DialogService, props: DialogOptions = {}): (() => void) => {
  const [effect] = domDialogEffects[
    domDialogEffects.length - 1
  ] as (typeof domDialogEffects)[number]
  return effect(service, props) ?? ((): void => {})
}

const pressEscape = (): boolean =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }))

// The layer stack is a realm-global that outlives a test — every registration
// has to be undone or the next test inherits a stale topmost.
const registered: (() => void)[] = []

// A layer, mounted and registered, standing in for a rendered dialog window.
const mountLayer = (id: string, depth: number, html = ''): HTMLElement => {
  const content = document.createElement('div')
  content.tabIndex = -1
  content.innerHTML = html
  document.body.append(content)
  registered.push(registerLayer({ id, depth, element: content, modal: true, backdrop: () => null }))
  return content
}

afterEach(() => {
  while (registered.length > 0) (registered.pop() as () => void)()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('domDialogEffects — Escape', () => {
  it('closes the dialog through the machine', () => {
    const service = build({ defaultOpen: true })
    mountLayer('dlg', 1)
    armEscape(service)

    pressEscape()
    expect(service.matches('open')).toBe(false)
  })

  it('offers the consumer a veto before the machine moves', () => {
    const service = build({ defaultOpen: true })
    mountLayer('dlg', 1)
    armEscape(service, { onEscapeKeyDown: event => event.preventDefault?.() })

    pressEscape()
    expect(service.matches('open')).toBe(true)
  })

  it('is ignored by a dialog that is not topmost — one layer per press', () => {
    const service = build({ defaultOpen: true })
    mountLayer('dlg', 1)
    mountLayer('above', 2)
    armEscape(service)

    pressEscape()
    expect(service.matches('open')).toBe(true)
  })

  it('detaches its listener on dispose', () => {
    const service = build({ defaultOpen: true })
    mountLayer('dlg', 1)
    armEscape(service)()

    pressEscape()
    expect(service.matches('open')).toBe(true)
  })
})

describe('openDialogLayer', () => {
  const options = { id: 'dlg', depth: 1, modal: true, backdrop: () => null }

  // Mounts a dialog window and opens it, tracking the close so a test that
  // never calls it still leaves the stack clean. Closing twice is a no-op.
  const open = (
    html: string,
    extra: Partial<typeof options> & { initialFocus?: HTMLElement | null } = {},
  ): { content: HTMLElement; close: () => void } => {
    const content = document.createElement('div')
    content.tabIndex = -1
    content.innerHTML = html
    document.body.append(content)

    const dispose = openDialogLayer(content, { ...options, ...extra })
    let closed = false
    const close = (): void => {
      if (closed) return
      closed = true
      dispose()
    }
    registered.push(close)
    return { content, close }
  }

  it('moves focus to the first form field, without scrolling the locked surface', () => {
    const content = document.createElement('div')
    content.tabIndex = -1
    content.innerHTML = '<input id="field" />'
    document.body.append(content)
    const field = document.getElementById('field') as HTMLInputElement
    const focus = vi.spyOn(field, 'focus')

    registered.push(openDialogLayer(content, options))

    expect(document.activeElement).toBe(field)
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('honors an explicit initialFocus over the overlay default', () => {
    const content = document.createElement('div')
    content.tabIndex = -1
    content.innerHTML = '<input id="field" /><button id="pick">pick</button>'
    document.body.append(content)
    const pick = content.querySelector('#pick') as HTMLButtonElement

    registered.push(openDialogLayer(content, { ...options, initialFocus: pick }))

    expect(document.activeElement).toBe(pick)
  })

  it('falls back to the dialog window when the target refuses focus', () => {
    const content = document.createElement('div')
    content.tabIndex = -1
    content.innerHTML = '<input id="field" disabled />'
    document.body.append(content)
    const field = content.querySelector('#field') as HTMLInputElement

    registered.push(openDialogLayer(content, { ...options, initialFocus: field }))

    expect(document.activeElement).toBe(content)
  })

  it('restores focus to whatever held it before the dialog opened', () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()

    open('').close()

    expect(document.activeElement).toBe(trigger)
  })

  it('releases the layer beneath before focus returns to it', () => {
    // The ordering contract. jsdom doesn't enforce `inert`, so a focus
    // assertion wouldn't discriminate — observe the order directly instead:
    // by the time focus is restored, the layer below must already be free.
    const below = mountLayer('below', 1, '<button id="beneath">beneath</button>')
    const beneath = below.querySelector('#beneath') as HTMLButtonElement
    beneath.focus()

    const { close } = open('', { depth: 2 })
    expect(below.hasAttribute('inert')).toBe(true)

    let inertWhenRestored: boolean | undefined
    vi.spyOn(beneath, 'focus').mockImplementation(() => {
      inertWhenRestored = below.hasAttribute('inert')
    })
    close()

    expect(inertWhenRestored).toBe(false)
  })
})

describe('startExitWindow', () => {
  const mountExiting = (): HTMLElement => {
    const content = document.createElement('div')
    document.body.append(content)
    return content
  }

  it('takes the still-painting layer out of interaction and reports its end', () => {
    const content = mountExiting()
    const onComplete = vi.fn()
    startExitWindow(content, { onComplete })

    expect(content.hasAttribute('inert')).toBe(true)
    content.dispatchEvent(new Event('transitionend'))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('undoes the hide and stops watching when the exit is interrupted', () => {
    const content = mountExiting()
    const onComplete = vi.fn()
    startExitWindow(content, { onComplete })()

    expect(content.hasAttribute('inert')).toBe(false)
    content.dispatchEvent(new Event('transitionend'))
    expect(onComplete).not.toHaveBeenCalled()
  })
})

describe('outside-press gating', () => {
  it('lets only the topmost dialog answer a backdrop press', () => {
    mountLayer('dlg', 1)
    expect(acceptsBackdropPress('dlg')).toBe(true)

    mountLayer('above', 2)
    expect(acceptsBackdropPress('dlg')).toBe(false)
  })

  it('ignores a viewport press that bubbled up from the content', () => {
    mountLayer('dlg', 1)
    const viewport = document.createElement('div')
    const content = document.createElement('div')

    expect(acceptsViewportPress('dlg', { target: viewport, currentTarget: viewport })).toBe(true)
    expect(acceptsViewportPress('dlg', { target: content, currentTarget: viewport })).toBe(false)
  })
})

describe('dialogTrapOptions', () => {
  it('traps only while modal and topmost', () => {
    const service = build({ defaultOpen: true })
    mountLayer('dlg', 1)
    const { enabled } = dialogTrapOptions(service, () => 'dlg-close')

    expect(enabled?.()).toBe(true)
    mountLayer('above', 2)
    expect(enabled?.()).toBe(false)
  })

  it('never traps a non-modal dialog', () => {
    const service = build({ defaultOpen: true, modal: false })
    mountLayer('dlg', 1)
    const { enabled } = dialogTrapOptions(service, () => 'dlg-close')

    expect(enabled?.()).toBe(false)
  })

  it('resolves Close as the cycle’s last stop, wherever it renders', () => {
    const service = build({ defaultOpen: true })
    mountLayer('dlg', 1, '<button id="dlg-close">close</button>')
    const { last } = dialogTrapOptions(service, () => 'dlg-close')

    expect(last?.()).toBe(document.getElementById('dlg-close'))
  })
})
