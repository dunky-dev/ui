// @vitest-environment jsdom
// The DOM half of the Dialog, driven directly — no substrate, no framework.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  guardBackNavigation,
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
// the core's, covered by the core's own tests. Every armed listener is
// disposed after the test: the listener is document-level, so one left over
// — a vetoing one above all — would answer the next test's Escape too.
const armed: (() => void)[] = []
const armEscape = (
  service: DialogService,
  props: DialogOptions = {},
  effects = domDialogEffects,
): (() => void) => {
  const [effect] = effects[effects.length - 1] as (typeof effects)[number]
  const dispose = effect(service, props) ?? ((): void => {})
  armed.push(dispose)
  return dispose
}

const pressEscape = (): boolean =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }))

// A user's key press, as a browser delivers it: one listener at a time, with a
// microtask checkpoint after each, where a binding flushes the close the
// listener made. jsdom's dispatchEvent runs listeners back to back, so the
// press drives the document's keydown listeners by hand, in the order added.
const keydownListeners: EventListenerOrEventListenerObject[] = []
const captureKeydownListeners = (): void => {
  keydownListeners.length = 0
  const add = document.addEventListener.bind(document)
  const remove = document.removeEventListener.bind(document)
  vi.spyOn(document, 'addEventListener').mockImplementation((type, listener, options) => {
    if (type === 'keydown') keydownListeners.push(listener)
    add(type, listener, options)
  })
  vi.spyOn(document, 'removeEventListener').mockImplementation((type, listener, options) => {
    const index = keydownListeners.indexOf(listener)
    if (type === 'keydown' && index !== -1) keydownListeners.splice(index, 1)
    remove(type, listener, options)
  })
}

const pressEscapeAsUser = async (): Promise<void> => {
  const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
  for (const listener of keydownListeners.slice()) {
    // A listener removed mid-press is skipped, as in a real dispatch.
    if (!keydownListeners.includes(listener)) continue
    if (typeof listener === 'function') listener(event)
    else listener.handleEvent(event)
    // The checkpoint drains every microtask, those queued while draining too
    // (a re-render queuing the release); a task boundary is how a test gets
    // that far.
    await new Promise(resolve => setTimeout(resolve))
  }
}

// The layer stack is a realm-global that outlives a test — every registration
// has to be undone or the next test inherits a stale topmost.
const registered: (() => void)[] = []

// A dialog run the way a binding runs it: open, its window in the stack — and
// out of it on the microtask after the machine leaves `open`, when the
// framework flushes the change, never synchronously.
const openLayer = (options: DialogOptions & { id: string }, depth: number): DialogService => {
  const service = build({ defaultOpen: true, ...options })
  const content = document.createElement('div')
  document.body.append(content)
  const release = registerLayer({
    id: options.id,
    depth,
    element: content,
    modal: true,
    backdrop: () => null,
    dismiss: () => service.send({ type: 'close' }),
  })
  registered.push(release)
  const stop = service.subscribe(() => {
    if (service.matches('open')) return
    stop()
    queueMicrotask(release)
  })
  return service
}

// A stack of dialogs, bottom first, whose Escape listeners are armed in
// `order` — the order a browser runs them in.
type ListenerOrder = 'top-first' | 'bottom-first'
const openStack = (
  order: ListenerOrder,
  ...dialogs: Array<DialogOptions & { id: string }>
): DialogService[] => {
  const stack = dialogs.map((options, index) => openLayer(options, index + 1))
  const arming = [...stack.keys()]
  if (order === 'top-first') arming.reverse()
  for (const index of arming) armEscape(stack[index], dialogs[index])
  return stack
}

// A layer, mounted and registered, standing in for a rendered dialog window.
const mountLayer = (id: string, depth: number, html = '', dismiss?: () => void): HTMLElement => {
  const content = document.createElement('div')
  content.tabIndex = -1
  content.innerHTML = html
  document.body.append(content)
  registered.push(
    registerLayer({ id, depth, element: content, modal: true, backdrop: () => null, dismiss }),
  )
  return content
}

afterEach(() => {
  while (armed.length > 0) (armed.pop() as () => void)()
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

  // escapeScope: 'stack' — the receiving dialog gates and vetoes, and only an
  // Escape it allowed gives the layers beneath their plain close.
  it('leaves the stack alone when the topmost dialog vetoes its stack-scoped Escape', () => {
    const lower = build({ defaultOpen: true, id: 'lower' })
    const upper = build({ defaultOpen: true, id: 'upper', escapeScope: 'stack' })
    mountLayer('lower', 1, '', () => lower.send({ type: 'close' }))
    mountLayer('upper', 2, '', () => upper.send({ type: 'close' }))
    armEscape(upper, { onEscapeKeyDown: event => event.preventDefault?.() })

    pressEscape()
    expect([upper.matches('open'), lower.matches('open')]).toEqual([true, true])
  })

  // A popup library prevents the default of the Escape it closes on; the press
  // was the popup's, so it never reaches the consumer's guard.
  it('stands down for a press another handler already consumed', () => {
    const onEscapeKeyDown = vi.fn()
    const service = build({ defaultOpen: true })
    mountLayer('dlg', 1)
    const consume = (event: KeyboardEvent): void => event.preventDefault()
    window.addEventListener('keydown', consume, true)
    armed.push(() => window.removeEventListener('keydown', consume, true))
    armEscape(service, { onEscapeKeyDown })

    pressEscape()
    expect(service.matches('open')).toBe(true)
    expect(onEscapeKeyDown).not.toHaveBeenCalled()
  })

  it('detaches its listener on dispose', () => {
    const service = build({ defaultOpen: true })
    mountLayer('dlg', 1)
    armEscape(service)()

    pressEscape()
    expect(service.matches('open')).toBe(true)
  })

  // A popup inside the dialog owns Escape while it holds focus — read from
  // ARIA, so a popup that never registers in the stack counts too.
  it('stands down while a popup inside the dialog holds focus', () => {
    const service = build({ defaultOpen: true })
    const content = mountLayer(
      'dlg',
      1,
      '<ul role="listbox"><li id="option" role="option" tabindex="0">a</li></ul>',
    )
    ;(content.querySelector('#option') as HTMLElement).focus()
    armEscape(service)

    pressEscape()
    expect(service.matches('open')).toBe(true)
  })

  it('stands down while a control with an expanded popup holds focus', () => {
    const service = build({ defaultOpen: true })
    const content = mountLayer(
      'dlg',
      1,
      '<input id="combo" role="combobox" aria-haspopup="listbox" aria-expanded="true" />',
    )
    ;(content.querySelector('#combo') as HTMLElement).focus()
    armEscape(service)

    pressEscape()
    expect(service.matches('open')).toBe(true)
  })

  // Escape answers wherever focus is. A non-modal dialog leaves the page live,
  // so focus out there is the page's — not a popup the dialog must yield to.
  it('closes a non-modal dialog while focus sits on the page', () => {
    const service = build({ defaultOpen: true, modal: false })
    const content = document.createElement('div')
    content.tabIndex = -1
    document.body.append(content)
    registered.push(
      registerLayer({ id: 'dlg', depth: 1, element: content, modal: false, backdrop: () => null }),
    )
    const page = document.createElement('button')
    document.body.append(page)
    page.focus()
    armEscape(service)

    pressEscape()
    expect(service.matches('open')).toBe(false)
  })
})

// One press, one answer — from the dialog topmost when it arrived, however
// soon a closed dialog leaves the stack.
describe('domDialogEffects — one answer per Escape press', () => {
  beforeEach(captureKeydownListeners)

  // Top-first from here on: the topmost dialog's listener runs first, so its
  // close has flushed by the time the one beneath asks who is topmost.
  it('closes only the topmost dialog — the one beneath never hears the press', async () => {
    const lowerEscape = vi.fn()
    const [lower, upper] = openStack(
      'top-first',
      { id: 'lower', onEscapeKeyDown: lowerEscape },
      { id: 'upper' },
    )

    await pressEscapeAsUser()
    expect([upper.matches('open'), lower.matches('open')]).toEqual([false, true])
    expect(lowerEscape).not.toHaveBeenCalled()
  })

  // A confirm-then-close guard: it vetoes the dismissal and closes its dialog
  // itself, which leaves the stack all the same.
  it('ends a vetoed press at the topmost dialog', async () => {
    const lowerEscape = vi.fn()
    const [lower, upper] = openStack(
      'top-first',
      { id: 'lower', onEscapeKeyDown: lowerEscape },
      {
        id: 'upper',
        onEscapeKeyDown: event => {
          event.preventDefault?.()
          upper.send({ type: 'close' })
        },
      },
    )

    await pressEscapeAsUser()
    expect(lower.matches('open')).toBe(true)
    expect(lowerEscape).not.toHaveBeenCalled()
  })

  // A controlled dialog only records the intent; it closes when its consumer
  // echoes `open={false}` back — on the checkpoint, as a re-render would.
  it('ends the press at a controlled topmost dialog, before its consumer follows', async () => {
    const lowerEscape = vi.fn()
    const [lower, upper] = openStack(
      'top-first',
      { id: 'lower', onEscapeKeyDown: lowerEscape },
      {
        id: 'upper',
        open: true,
        onEscapeKeyDown: () =>
          queueMicrotask(() => upper.send({ type: 'controlled.sync', value: false })),
      },
    )

    await pressEscapeAsUser()
    expect([upper.matches('open'), lower.matches('open')]).toEqual([false, true])
    expect(lowerEscape).not.toHaveBeenCalled()
  })

  // The layers beneath get a plain close, never the press itself.
  it('unwinds a stack-scoped press through every layer, once', async () => {
    const beneathEscape = vi.fn()
    const stack = openStack(
      'top-first',
      { id: 'bottom', onEscapeKeyDown: beneathEscape },
      { id: 'middle', onEscapeKeyDown: beneathEscape },
      { id: 'top', escapeScope: 'stack' },
    )

    await pressEscapeAsUser()
    expect(stack.map(dialog => dialog.matches('open'))).toEqual([false, false, false])
    expect(beneathEscape).not.toHaveBeenCalled()
  })

  // Only the dialog that takes the press marks it: a lower dialog that hears
  // it first, before anything closed, must leave it to the topmost.
  it('leaves the press to the topmost dialog when the one beneath hears it first', async () => {
    const [lower, upper] = openStack('bottom-first', { id: 'lower' }, { id: 'upper' })

    await pressEscapeAsUser()
    expect([upper.matches('open'), lower.matches('open')]).toEqual([false, true])
  })
})

describe('domDialogEffects — a duplicate copy of the package', () => {
  beforeEach(captureKeydownListeners)

  // A monorepo or micro-frontend can load the package twice: a press one copy
  // answered must count as answered for the other too.
  it('honors a press another copy of the package already answered', async () => {
    vi.resetModules()
    const copy = await import('@dunky.dev/dom-dialog')
    const lower = openLayer({ id: 'lower' }, 1)
    const upper = openLayer({ id: 'upper' }, 2)
    armEscape(upper)
    armEscape(lower, {}, copy.domDialogEffects)

    await pressEscapeAsUser()
    expect([upper.matches('open'), lower.matches('open')]).toEqual([false, true])
  })
})

describe('openDialogLayer', () => {
  const options = { id: 'dlg', depth: 1, modal: true, backdrop: () => null }

  // Mounts a dialog window and opens it, tracking the close so a test that
  // never calls it still leaves the stack clean. Closing twice is a no-op.
  const open = (
    html: string,
    extra: Partial<typeof options> & {
      initialFocus?: HTMLElement | null
      restoreFocus?: () => HTMLElement | null
    } = {},
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

  it('warns when focus cannot move into the dialog at all', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // A dialog window without tabindex can't take the fallback focus.
    const content = document.createElement('div')
    document.body.append(content)

    registered.push(openDialogLayer(content, options))

    expect(document.activeElement).not.toBe(content)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('tabindex="-1"'))
  })

  it('restores focus to whatever held it before the dialog opened', () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()

    open('').close()

    expect(document.activeElement).toBe(trigger)
  })

  it('prefers the element that held focus over the designated restore target', () => {
    const trigger = document.createElement('button')
    const designated = document.createElement('button')
    document.body.append(trigger, designated)
    trigger.focus()

    open('', { restoreFocus: () => designated }).close()

    expect(document.activeElement).toBe(trigger)
  })

  it('falls back to the restore target when focus sat on the body before opening', () => {
    // A pointer press can leave focus on the body — nothing meaningful to
    // restore to.
    const designated = document.createElement('button')
    document.body.append(designated)
    ;(document.activeElement as HTMLElement | null)?.blur()

    open('', { restoreFocus: () => designated }).close()

    expect(document.activeElement).toBe(designated)
  })

  it('falls back to the restore target when the previous holder left the document', () => {
    const trigger = document.createElement('button')
    const designated = document.createElement('button')
    document.body.append(trigger, designated)
    trigger.focus()

    const { close } = open('', { restoreFocus: () => designated })
    trigger.remove()
    close()

    expect(document.activeElement).toBe(designated)
  })

  it('leaves focus where it is when nothing meaningful preceded and no target is designated', () => {
    ;(document.activeElement as HTMLElement | null)?.blur()

    const { content, close } = open('')
    close()

    expect(document.activeElement).toBe(content)
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

describe('guardBackNavigation', () => {
  // jsdom's history traversal is asynchronous — await the popstate itself.
  const nextPop = (): Promise<void> =>
    new Promise(resolve => {
      window.addEventListener('popstate', () => resolve(), { once: true })
    })

  // A dialog reduced to what the guard reads: an open flag the core would
  // move, plus the host's job of reporting every change — and only a change,
  // the way an effect keyed on the open state does.
  const wire = (): {
    isOpen: () => boolean
    open: () => void
    close: () => void
    report: () => void
    release: () => void
  } => {
    let opened = false
    let reported = false
    const guard = guardBackNavigation({
      backNavigate: () => void (opened = false),
      forwardNavigate: () => void (opened = true),
      isOpen: () => opened,
      depth: 1,
    })
    const report = (): void => {
      if (opened === reported) return
      reported = opened
      guard.sync(opened)
    }
    return {
      isOpen: () => opened,
      open: () => {
        opened = true
        report()
      },
      close: () => {
        opened = false
        report()
      },
      report,
      release: guard.release,
    }
  }

  // A host traversal, then the report the substrate makes once it landed.
  const traverse = async (dialog: ReturnType<typeof wire>, go: () => void): Promise<void> => {
    const pop = nextPop()
    go()
    await pop
    dialog.report()
  }

  it('parks a Back-closed dialog so Forward reopens it, guarded again', async () => {
    const dialog = wire()
    dialog.open()

    await traverse(dialog, () => window.history.back())
    expect(dialog.isOpen()).toBe(false)

    await traverse(dialog, () => window.history.forward())
    expect(dialog.isOpen()).toBe(true)

    await traverse(dialog, () => window.history.back())
    expect(dialog.isOpen()).toBe(false)
    dialog.release() // parked, so nothing left to consume
  })

  it('releases on a close by any other means — Forward reopens nothing', async () => {
    const dialog = wire()
    dialog.open()

    // The release consumes the still-current guard entry through a real
    // traversal; settle it here rather than in the next test.
    const consume = nextPop()
    dialog.close()
    await consume

    await traverse(dialog, () => window.history.forward())
    expect(dialog.isOpen()).toBe(false)
  })

  it('release ends a parked episode — the Forward watch goes with it', async () => {
    const dialog = wire()
    dialog.open()

    await traverse(dialog, () => window.history.back())
    dialog.release()

    await traverse(dialog, () => window.history.forward())
    expect(dialog.isOpen()).toBe(false)
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

  it('stands down while a popup inside the dialog holds focus', () => {
    const service = build({ defaultOpen: true })
    const content = mountLayer(
      'dlg',
      1,
      '<ul role="listbox"><li id="option" role="option" tabindex="0">a</li></ul>',
    )
    const { enabled } = dialogTrapOptions(service, () => 'dlg-close')

    ;(content.querySelector('#option') as HTMLElement).focus()
    expect(enabled?.()).toBe(false)
    content.focus()
    expect(enabled?.()).toBe(true)
  })

  it('resolves Close as the cycle’s last stop, wherever it renders', () => {
    const service = build({ defaultOpen: true })
    mountLayer('dlg', 1, '<button id="dlg-close">close</button>')
    const { last } = dialogTrapOptions(service, () => 'dlg-close')

    expect(last?.()).toBe(document.getElementById('dlg-close'))
  })
})
