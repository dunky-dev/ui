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
  guardBackNavigation,
  openDialogLayer,
  startExitWindow,
  trackPressOrigin,
  watchOutsidePress,
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
const mountLayer = (id: string, depth: number, html = '', dismiss?: () => void): HTMLElement => {
  const content = document.createElement('div')
  content.tabIndex = -1
  content.setAttribute('aria-label', 'Layer')
  content.innerHTML = html
  document.body.append(content)
  registered.push(
    registerLayer({ id, depth, element: content, modal: true, backdrop: () => null, dismiss }),
  )
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

  // escapeScope: 'stack' — the receiving dialog gates and vetoes, then the
  // layers beneath get a plain close, top-down.
  it('unwinds the whole stack when the topmost dialog scopes Escape to it', () => {
    const lower = build({ defaultOpen: true, id: 'lower' })
    const upper = build({ defaultOpen: true, id: 'upper', escapeScope: 'stack' })
    mountLayer('lower', 1, '', () => lower.send({ type: 'close' }))
    mountLayer('upper', 2, '', () => upper.send({ type: 'close' }))
    armEscape(upper)

    pressEscape()
    expect([upper.matches('open'), lower.matches('open')]).toEqual([false, false])
  })

  it('leaves the stack alone when the topmost dialog vetoes its stack-scoped Escape', () => {
    const lower = build({ defaultOpen: true, id: 'lower' })
    const upper = build({ defaultOpen: true, id: 'upper', escapeScope: 'stack' })
    mountLayer('lower', 1, '', () => lower.send({ type: 'close' }))
    mountLayer('upper', 2, '', () => upper.send({ type: 'close' }))
    armEscape(upper, { onEscapeKeyDown: event => event.preventDefault?.() })

    pressEscape()
    expect([upper.matches('open'), lower.matches('open')]).toEqual([true, true])
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
    content.setAttribute('aria-label', 'Dialog')
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
    content.setAttribute('aria-label', 'Dialog')
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
    content.setAttribute('aria-label', 'Dialog')
    content.innerHTML = '<input id="field" /><button id="pick">pick</button>'
    document.body.append(content)
    const pick = content.querySelector('#pick') as HTMLButtonElement

    registered.push(openDialogLayer(content, { ...options, initialFocus: pick }))

    expect(document.activeElement).toBe(pick)
  })

  it('falls back to the dialog window when the target refuses focus', () => {
    const content = document.createElement('div')
    content.tabIndex = -1
    content.setAttribute('aria-label', 'Dialog')
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

  it('warns when the dialog has neither a Title nor an accessible label', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const content = document.createElement('div')
    content.tabIndex = -1
    document.body.append(content)

    registered.push(openDialogLayer(content, options))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no accessible name'))
  })

  it('does not warn when the window carries aria-labelledby', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const content = document.createElement('div')
    content.tabIndex = -1
    content.setAttribute('aria-labelledby', 'dlg-title')
    content.innerHTML = '<h2 id="dlg-title">Title</h2>'
    document.body.append(content)

    registered.push(openDialogLayer(content, options))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('no accessible name'))
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
    expect(acceptsBackdropPress('dlg', false)).toBe(true)

    mountLayer('above', 2)
    expect(acceptsBackdropPress('dlg', false)).toBe(false)
  })

  it('ignores a viewport press that bubbled up from the content', () => {
    mountLayer('dlg', 1)
    const viewport = document.createElement('div')
    const content = document.createElement('div')

    expect(acceptsViewportPress('dlg', { target: viewport, currentTarget: viewport }, false)).toBe(
      true,
    )
    expect(acceptsViewportPress('dlg', { target: content, currentTarget: viewport }, false)).toBe(
      false,
    )
  })

  it('refuses a backdrop or viewport press whose gesture started inside the window', () => {
    mountLayer('dlg', 1)
    const viewport = document.createElement('div')

    expect(acceptsBackdropPress('dlg', true)).toBe(false)
    expect(acceptsViewportPress('dlg', { target: viewport, currentTarget: viewport }, true)).toBe(
      false,
    )
  })
})

describe('trackPressOrigin', () => {
  const dispatchPointerDown = (target: Element): void => {
    target.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  }

  it('reports whether the most recent press began inside the tracked element', () => {
    const content = document.createElement('div')
    const inner = document.createElement('button')
    content.append(inner)
    const outer = document.createElement('button')
    document.body.append(content, outer)

    const tracker = trackPressOrigin(content)
    expect(tracker.startedInside()).toBe(false)

    dispatchPointerDown(inner)
    expect(tracker.startedInside()).toBe(true)

    dispatchPointerDown(outer)
    expect(tracker.startedInside()).toBe(false)

    tracker.dispose()
  })

  it('stops updating once disposed', () => {
    const content = document.createElement('div')
    const inner = document.createElement('button')
    content.append(inner)
    document.body.append(content)

    const tracker = trackPressOrigin(content)
    tracker.dispose()
    dispatchPointerDown(inner)

    expect(tracker.startedInside()).toBe(false)
  })
})

describe('watchOutsidePress', () => {
  const click = (target: Element): void => {
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }

  const setup = (
    startedInside: () => boolean = () => false,
  ): {
    content: HTMLElement
    trigger: HTMLElement
    outside: HTMLElement
    onOutsidePress: () => void
  } => {
    const content = mountLayer('dlg', 1)
    const trigger = document.createElement('button')
    const outside = document.createElement('button')
    document.body.append(trigger, outside)
    const onOutsidePress = vi.fn()
    registered.push(watchOutsidePress('dlg', { content, trigger, startedInside, onOutsidePress }))
    return { content, trigger, outside, onOutsidePress }
  }

  it('fires for a press outside the window and the trigger', () => {
    const { outside, onOutsidePress } = setup()

    click(outside)

    expect(onOutsidePress).toHaveBeenCalledTimes(1)
  })

  it('ignores a press inside the window', () => {
    const { content, onOutsidePress } = setup()

    click(content)

    expect(onOutsidePress).not.toHaveBeenCalled()
  })

  it('ignores a press on the trigger — its own press stays a plain toggle', () => {
    const { trigger, onOutsidePress } = setup()

    click(trigger)

    expect(onOutsidePress).not.toHaveBeenCalled()
  })

  it('ignores a press once this dialog is no longer topmost', () => {
    const { outside, onOutsidePress } = setup()
    mountLayer('above', 2)

    click(outside)

    expect(onOutsidePress).not.toHaveBeenCalled()
  })

  it('ignores a press whose gesture started inside the window', () => {
    const { outside, onOutsidePress } = setup(() => true)

    click(outside)

    expect(onOutsidePress).not.toHaveBeenCalled()
  })

  it('stops watching once disposed', () => {
    const content = mountLayer('dlg', 1)
    const outside = document.createElement('button')
    document.body.append(outside)
    const onOutsidePress = vi.fn()

    const dispose = watchOutsidePress('dlg', {
      content,
      trigger: null,
      startedInside: () => false,
      onOutsidePress,
    })
    dispose()
    click(outside)

    expect(onOutsidePress).not.toHaveBeenCalled()
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
