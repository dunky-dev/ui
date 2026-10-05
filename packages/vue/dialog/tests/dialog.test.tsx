// @vitest-environment jsdom
// The Vue edge of the Dialog — behavior only; the machine's own contract is
// covered in @dunky.dev/dialog's tests. Names mirror the React and Solid
// suites; where they cite a core callback, this binding's emit carries it
// (onOpenChange -> `update:open`, onEscapeKeyDown -> `escapeKeyDown`, ...).
import {
  KeepAlive,
  createSSRApp,
  defineComponent,
  nextTick,
  ref,
  type Component,
  type EmitsToProps,
} from 'vue'
import { renderToString } from 'vue/server-renderer'
import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dialog, type DialogEmits, type DialogProps } from '@dunky.dev/vue-dialog'

// The root's props plus its emits' listener props (`onUpdate:open`, ...).
type DialogAttrs = DialogProps & EmitsToProps<DialogEmits>

const DefaultDialog = (props: DialogAttrs) => (
  <Dialog {...props}>
    <Dialog.Trigger>Trigger</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop data-testid='backdrop' />
      <Dialog.Viewport data-testid='viewport'>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
          <button type='button'>Action</button>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
)

// Vue batches re-renders into a microtask, and the Portal's teleport arrives
// with the first update after mount — settle after every render and
// interaction before reading the tree.
const renderSettled = async (ui: Component): Promise<ReturnType<typeof render>> => {
  const result = render(ui)
  await nextTick()
  return result
}

const press = async (element: HTMLElement): Promise<void> => {
  element.click()
  await nextTick()
}

const openDialog = (): Promise<void> => press(screen.getByText('Trigger'))

const pressEscape = (): Promise<void> => fireEvent.keyDown(document.body, { key: 'Escape' })

// Runtime-compiled templates resolve components by registered name, so the
// dotted part names an SFC resolves from the `Dialog` import are registered
// as such.
const dialogComponents: Record<string, Component> = {
  Dialog,
  'Dialog.Trigger': Dialog.Trigger,
  'Dialog.Portal': Dialog.Portal,
  'Dialog.Backdrop': Dialog.Backdrop,
  'Dialog.Viewport': Dialog.Viewport,
  'Dialog.Content': Dialog.Content,
  'Dialog.Title': Dialog.Title,
  'Dialog.Description': Dialog.Description,
  'Dialog.Close': Dialog.Close,
}

// Auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Dialog', () => {
  describe('open / close', () => {
    it('opens on trigger press and closes on close press', async () => {
      await renderSettled(() => <DefaultDialog />)
      expect(screen.queryByRole('dialog')).toBeNull()

      await openDialog()
      expect(screen.queryByRole('dialog')).not.toBeNull()

      await press(screen.getByText('Close'))
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('renders open when defaultOpen', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen />)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('fires onOpenChange with the new value on open and close', async () => {
      const onOpenChange = vi.fn()
      await renderSettled(() => <DefaultDialog onUpdate:open={onOpenChange} />)

      await openDialog()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)

      await press(screen.getByText('Close'))
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })
  })

  describe('escape key', () => {
    it('closes on Escape', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen />)
      await pressEscape()
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('stays open when closeOnEscape=false', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen closeOnEscape={false} />)
      await pressEscape()
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('stays open when onEscapeKeyDown prevents default', async () => {
      const onEscapeKeyDown = vi.fn(event => event.preventDefault())
      await renderSettled(() => <DefaultDialog defaultOpen onEscapeKeyDown={onEscapeKeyDown} />)
      await pressEscape()
      expect(onEscapeKeyDown).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })
  })

  describe('outside interaction', () => {
    it('closes on backdrop press', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen />)
      await press(screen.getByTestId('backdrop'))
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    // The backdrop is portalled alongside the viewport, outside the content's
    // subtree — the containment walk must except it, or `inert` would swallow
    // real pointer presses on it (jsdom's .click() bypasses hit-testing, so
    // only the attributes can assert this).
    it('keeps its own backdrop pressable while the page around it is inert', async () => {
      const { container } = await renderSettled(() => <DefaultDialog defaultOpen />)
      expect(container.hasAttribute('inert')).toBe(true)

      const backdrop = screen.getByTestId('backdrop')
      expect(backdrop.hasAttribute('aria-hidden')).toBe(false)
      expect(backdrop.hasAttribute('inert')).toBe(false)
    })

    it('stays open when closeOnInteractOutside=false', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen closeOnInteractOutside={false} />)
      await press(screen.getByTestId('backdrop'))
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('stays open when onInteractOutside prevents default', async () => {
      const onInteractOutside = vi.fn(event => event?.preventDefault())
      await renderSettled(() => <DefaultDialog defaultOpen onInteractOutside={onInteractOutside} />)
      await press(screen.getByTestId('backdrop'))
      expect(onInteractOutside).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('alertdialog does not dismiss on backdrop press by default', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen role='alertdialog' />)
      await press(screen.getByTestId('backdrop'))
      expect(screen.queryByRole('alertdialog')).not.toBeNull()
    })

    it('closes on a press on the viewport around the content', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen />)
      await press(screen.getByTestId('viewport'))
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('does not close when a press inside the content bubbles to the viewport', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen />)
      await press(screen.getByText('Action'))
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('renders no backdrop when modal=false', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen modal={false} />)
      expect(screen.queryByTestId('backdrop')).toBeNull()
    })
  })

  describe('controlled open', () => {
    it('follows the open prop in both directions', async () => {
      const open = ref(false)
      await renderSettled(() => <DefaultDialog open={open.value} />)
      expect(screen.queryByRole('dialog')).toBeNull()

      open.value = true
      await nextTick()
      expect(screen.queryByRole('dialog')).not.toBeNull()

      open.value = false
      await nextTick()
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('a dismissal neither closes nor fires onOpenChange — nothing changed', async () => {
      const onOpenChange = vi.fn()
      await renderSettled(() => <DefaultDialog open onUpdate:open={onOpenChange} />)
      await pressEscape()
      expect(onOpenChange).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('a trigger press neither opens nor fires onOpenChange', async () => {
      const onOpenChange = vi.fn()
      await renderSettled(() => <DefaultDialog open={false} onUpdate:open={onOpenChange} />)
      await openDialog()
      expect(onOpenChange).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('reports a prop-driven change through onOpenChange', async () => {
      const onOpenChange = vi.fn()
      const open = ref(false)
      await renderSettled(() => <DefaultDialog open={open.value} onUpdate:open={onOpenChange} />)
      open.value = true
      await nextTick()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)
      expect(onOpenChange).toHaveBeenCalledTimes(1)
    })

    // The controlled contract's consumer side: the dialog never moves on its
    // own, so the consumer's own handlers on the parts and the dismissal
    // callbacks are what drive the prop.
    it('a controlled stack closes through handlers wired at the source', async () => {
      const ControlledStack = defineComponent(() => {
        const outerOpen = ref(true)
        const innerOpen = ref(false)
        return () => (
          <Dialog
            open={outerOpen.value}
            onUpdate:open={open => (outerOpen.value = open)}
            onEscapeKeyDown={() => (outerOpen.value = false)}
          >
            <Dialog.Portal>
              <Dialog.Viewport>
                <Dialog.Content>
                  <Dialog.Title>Outer</Dialog.Title>
                  <Dialog
                    open={innerOpen.value}
                    onUpdate:open={open => (innerOpen.value = open)}
                    onEscapeKeyDown={() => (innerOpen.value = false)}
                  >
                    <Dialog.Trigger onClick={() => (innerOpen.value = true)}>
                      Open inner
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Viewport>
                        <Dialog.Content>
                          <Dialog.Title>Inner</Dialog.Title>
                          <Dialog.Close onClick={() => (innerOpen.value = false)}>
                            Close inner
                          </Dialog.Close>
                        </Dialog.Content>
                      </Dialog.Viewport>
                    </Dialog.Portal>
                  </Dialog>
                </Dialog.Content>
              </Dialog.Viewport>
            </Dialog.Portal>
          </Dialog>
        )
      })

      await renderSettled(ControlledStack)
      await press(screen.getByText('Open inner'))
      expect(screen.queryByText('Inner')).not.toBeNull()

      await press(screen.getByText('Close inner'))
      expect(screen.queryByText('Inner')).toBeNull()

      await press(screen.getByText('Open inner'))
      await pressEscape() // reaches the topmost layer only
      expect(screen.queryByText('Inner')).toBeNull()
      expect(screen.queryByText('Outer')).not.toBeNull()
    })

    it('dropping the open prop rewires the dialog uncontrolled where it stands', async () => {
      const onOpenChange = vi.fn()
      const open = ref<boolean | undefined>(true)
      await renderSettled(() => <DefaultDialog open={open.value} onUpdate:open={onOpenChange} />)
      open.value = undefined
      await nextTick()
      expect(screen.queryByRole('dialog')).not.toBeNull() // stays where it was

      await pressEscape() // uncontrolled now: dismissal works again
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })
  })

  describe('aria wiring', () => {
    it('trigger exposes the popup relationship', async () => {
      await renderSettled(() => <DefaultDialog />)
      const trigger = screen.getByText('Trigger')
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')

      await openDialog()
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(trigger.getAttribute('aria-controls')).toBe(screen.getByRole('dialog').id)
    })

    // The window takes initial focus, so it carries tabindex — which HTML
    // forbids on <dialog>. Hence a neutral element with an explicit role.
    it('renders the dialog window as a scripted focus target outside the tab order', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen />)
      const dialog = screen.getByRole('dialog')
      expect(dialog.tagName).not.toBe('DIALOG')
      expect(dialog.tabIndex).toBe(-1)
    })

    it('content is labelled by the Title and described by the Description', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen />)
      const dialog = screen.getByRole('dialog', { name: 'Title' })
      expect(dialog.getAttribute('aria-modal')).toBe('true')

      const describedBy = dialog.getAttribute('aria-describedby')
      expect(describedBy).not.toBeNull()
      expect(document.getElementById(describedBy as string)?.textContent).toBe('Description')
    })

    it('supports aria-label on Content when no Title is rendered', async () => {
      await renderSettled(() => (
        <Dialog defaultOpen>
          <Dialog.Portal>
            <Dialog.Content aria-label='Settings'>content</Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      ))
      const dialog = screen.getByRole('dialog', { name: 'Settings' })
      expect(dialog.hasAttribute('aria-labelledby')).toBe(false)
      expect(dialog.hasAttribute('aria-describedby')).toBe(false)
    })

    it('renders role=alertdialog when requested', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen role='alertdialog' />)
      expect(screen.queryByRole('alertdialog')).not.toBeNull()
    })

    it('omits aria-modal when modal=false', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen modal={false} />)
      expect(screen.getByRole('dialog').hasAttribute('aria-modal')).toBe(false)
    })
  })

  describe('focus management', () => {
    it('moves focus into the dialog window on open and restores it on close', async () => {
      await renderSettled(() => <DefaultDialog />)
      const trigger = screen.getByText('Trigger')
      trigger.focus()

      await openDialog()
      expect(document.activeElement).toBe(screen.getByRole('dialog'))

      await pressEscape()
      expect(document.activeElement).toBe(trigger)
    })

    it('falls back to restoreFocus when nothing meaningful held focus before opening', async () => {
      const fallback = ref<HTMLButtonElement | null>(null)
      await renderSettled(() => (
        <>
          <button type='button' ref={fallback}>
            Fallback
          </button>
          <Dialog>
            <Dialog.Trigger>Trigger</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Content aria-label='Settings' restoreFocus={fallback}>
                <Dialog.Close>Close</Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>
        </>
      ))
      // A click without a focus move leaves the body focused — nothing
      // meaningful for the close to restore to.
      await openDialog()

      await press(screen.getByText('Close'))
      expect(document.activeElement).toBe(screen.getByText('Fallback'))
    })

    // jsdom does no layout, so the scroll jump can't be reproduced — assert the
    // mechanism that prevents it: focus never scrolls the locked surface.
    it('moves focus without scrolling the locked surface', async () => {
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')
      await renderSettled(() => <DefaultDialog defaultOpen />)

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
      focusSpy.mockRestore()
    })

    it('moves focus to the first form field when the dialog contains one', async () => {
      await renderSettled(() => (
        <Dialog defaultOpen>
          <Dialog.Portal>
            <Dialog.Content aria-label='Form'>
              <button type='button'>Action</button>
              <input aria-label='Name' />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      ))
      expect(document.activeElement).toBe(screen.getByLabelText('Name'))
    })

    it('wraps Tab from the last focusable to the first', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen />)
      const dialog = screen.getByRole('dialog')

      screen.getByText('Close').focus()
      await fireEvent.keyDown(dialog, { key: 'Tab' })
      expect(document.activeElement).toBe(screen.getByText('Action'))
    })

    it('wraps Shift+Tab from the first focusable to the last', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen />)
      const dialog = screen.getByRole('dialog')

      screen.getByText('Action').focus()
      await fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
      expect(document.activeElement).toBe(screen.getByText('Close'))
    })

    it('keeps Close last in the cycle even when it renders first', async () => {
      // Close first in the DOM, then content. Tabbing FROM the dialog window
      // (off-cycle, where focus lands on open) is the discriminating case: a
      // pure forward cycle hides the wrap point, but entry from off-cycle
      // reveals whether Close leads (bug) or trails (fixed).
      await renderSettled(() => (
        <Dialog defaultOpen>
          <Dialog.Portal>
            <Dialog.Viewport>
              <Dialog.Content>
                <Dialog.Close>Close</Dialog.Close>
                <button type='button'>Content</button>
              </Dialog.Content>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog>
      ))
      const dialog = screen.getByRole('dialog')

      dialog.focus() // the dialog window — where focus opens
      await fireEvent.keyDown(dialog, { key: 'Tab' })
      expect(document.activeElement).toBe(screen.getByText('Content')) // not Close

      dialog.focus()
      await fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
      expect(document.activeElement).toBe(screen.getByText('Close')) // last, backward
    })

    const InitialFocusDialog = defineComponent({
      props: { disabled: Boolean },
      setup(props) {
        const initialFocus = ref<HTMLInputElement | null>(null)
        return () => (
          <Dialog defaultOpen>
            <Dialog.Portal>
              <Dialog.Viewport>
                <Dialog.Content aria-label='Form' initialFocus={initialFocus}>
                  <input ref={initialFocus} disabled={props.disabled} aria-label='Name' />
                </Dialog.Content>
              </Dialog.Viewport>
            </Dialog.Portal>
          </Dialog>
        )
      },
    })

    it('moves focus to the initialFocus element on open', async () => {
      await renderSettled(() => <InitialFocusDialog />)
      expect(document.activeElement).toBe(screen.getByLabelText('Name'))
    })

    it('falls back to the dialog panel when the initialFocus target cannot take focus', async () => {
      await renderSettled(() => <InitialFocusDialog disabled />)
      expect(document.activeElement).toBe(screen.getByRole('dialog'))
    })
  })

  describe('scroll lock', () => {
    it('locks body scroll while a modal dialog is open', async () => {
      await renderSettled(() => <DefaultDialog />)
      await openDialog()
      expect(document.body.style.overflowY).toBe('hidden')

      await pressEscape()
      expect(document.body.style.overflowY).not.toBe('hidden')
    })

    it('does not lock scroll when modal=false', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen modal={false} />)
      expect(document.body.style.overflowY).not.toBe('hidden')
    })

    it('locks the portal container, not the body, when scoped', async () => {
      const panel = document.createElement('div')
      document.body.append(panel)

      await renderSettled(() => (
        <Dialog defaultOpen>
          <Dialog.Portal container={panel}>
            <Dialog.Content aria-label='Scoped'>content</Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      ))

      expect(panel.style.overflowY).toBe('hidden')
      expect(document.body.style.overflowY).not.toBe('hidden')

      await pressEscape()
      expect(panel.style.overflowY).not.toBe('hidden')
      panel.remove()
    })
  })

  describe('back navigation', () => {
    // jsdom's history traversal is asynchronous — await the popstate itself.
    const nextPop = (): Promise<void> =>
      new Promise(resolve => {
        window.addEventListener('popstate', () => resolve(), { once: true })
      })

    // The traversal, then the update it caused.
    const traverse = async (go: () => void): Promise<void> => {
      const pop = nextPop()
      go()
      await pop
      await nextTick()
    }

    it('closes on the browser Back instead of navigating', async () => {
      const before: unknown = window.history.state
      await renderSettled(() => <DefaultDialog closeOnBack />)
      await openDialog()
      expect(window.history.state).not.toEqual(before) // the guard entry is planted

      await traverse(() => window.history.back())
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(window.history.state).toEqual(before) // consumed by the press itself
    })

    it('closing any other way consumes the guard entry', async () => {
      const before: unknown = window.history.state
      await renderSettled(() => <DefaultDialog closeOnBack defaultOpen />)
      expect(window.history.state).not.toEqual(before)

      const pop = nextPop()
      await pressEscape()
      await pop
      expect(window.history.state).toEqual(before) // no leftover to swallow a Back
    })

    it('plants no history entry without the flag', async () => {
      const before: unknown = window.history.state
      await renderSettled(() => <DefaultDialog defaultOpen />)
      expect(window.history.state).toEqual(before)
    })

    it('the browser Forward reopens what Back closed, guarded again', async () => {
      await renderSettled(() => <DefaultDialog closeOnBack defaultOpen />)

      await traverse(() => window.history.back())
      expect(screen.queryByRole('dialog')).toBeNull()

      await traverse(() => window.history.forward())
      expect(screen.queryByRole('dialog')).not.toBeNull()

      // The reopened dialog is guarded again: the next Back closes it.
      await traverse(() => window.history.back())
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('Forward does not reopen a dialog closed any other way', async () => {
      await renderSettled(() => <DefaultDialog closeOnBack defaultOpen />)

      const consume = nextPop() // the released guard consumes its entry
      await pressEscape()
      await consume

      await traverse(() => window.history.forward())
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('onForwardNavigation preventDefault declines the reopen', async () => {
      await renderSettled(() => (
        <DefaultDialog
          closeOnBack
          defaultOpen
          onForwardNavigation={event => event?.preventDefault?.()}
        />
      ))

      await traverse(() => window.history.back())
      await traverse(() => window.history.forward())
      expect(screen.queryByRole('dialog')).toBeNull()

      // The decline left the still-watched entry current; unmounting consumes
      // it — settle that traversal here, not in the next test.
      const consume = nextPop()
      cleanup()
      await consume
    })

    // The nested round-trip: closing the outer takes the inner's whole
    // registration with it (unmounted with the content that held it), so the
    // inner that comes back with the outer is a different machine. It reopens
    // anyway — the entry it lost is still its own ground.
    const NestedGuards = () => (
      <Dialog defaultOpen closeOnBack>
        <Dialog.Portal>
          <Dialog.Viewport>
            <Dialog.Content aria-label='outer'>
              <Dialog closeOnBack>
                <Dialog.Trigger>open inner</Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Viewport>
                    <Dialog.Content aria-label='inner' />
                  </Dialog.Viewport>
                </Dialog.Portal>
              </Dialog>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    )

    const layers = (): string =>
      `${screen.queryByLabelText('outer') ? 'O' : '-'}${screen.queryByLabelText('inner') ? 'I' : '-'}`

    it('Back unwinds a nested stack one layer per press and Forward restores it the same way', async () => {
      await renderSettled(NestedGuards)
      await press(screen.getByText('open inner'))
      expect(layers()).toBe('OI')

      await traverse(() => window.history.back())
      expect(layers()).toBe('O-')
      await traverse(() => window.history.back())
      expect(layers()).toBe('--')

      await traverse(() => window.history.forward())
      expect(layers()).toBe('O-')
      await traverse(() => window.history.forward())
      expect(layers()).toBe('OI')

      // Both layers are armed again; unmounting frees their entries one
      // traversal at a time — settle both pops here, not in the next test.
      const consume = nextPop()
      cleanup()
      await consume
      await nextPop()
    })

    // Both layers guarded and closed in one update — a "close all" affordance,
    // or a route change that takes the whole stack with it.
    const GuardedStack = (props: { open: boolean }) => (
      <Dialog open={props.open} closeOnBack>
        <Dialog.Portal>
          <Dialog.Viewport>
            <Dialog.Content aria-label='outer'>
              <Dialog open={props.open} closeOnBack>
                <Dialog.Portal>
                  <Dialog.Viewport>
                    <Dialog.Content aria-label='inner' />
                  </Dialog.Viewport>
                </Dialog.Portal>
              </Dialog>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    )

    it('closing a whole stack at once leaves no entry to swallow a later Back', async () => {
      const before: unknown = window.history.state
      const open = ref(true)
      await renderSettled(() => <GuardedStack open={open.value} />)
      // The inner layer mounts with the outer's teleport, one update later.
      await nextTick()
      expect(window.history.state).not.toEqual(before)

      const consume = nextPop() // the chain spends the entries one pop at a time
      open.value = false
      await nextTick()
      await consume
      await nextPop()
      expect(window.history.state).toEqual(before)
    })

    it('reopening through the trigger plants a fresh guard, truncating the spent entry', async () => {
      await renderSettled(() => <DefaultDialog closeOnBack defaultOpen />)

      await traverse(() => window.history.back())
      expect(screen.queryByRole('dialog')).toBeNull()

      await openDialog()
      expect(screen.queryByRole('dialog')).not.toBeNull()

      await traverse(() => window.history.back())
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  describe('exit animation', () => {
    const fireTransitionEnd = async (element: Element): Promise<void> => {
      element.dispatchEvent(new Event('transitionend', { bubbles: true }))
      await nextTick()
    }

    it('stays mounted through the exit and unmounts when its transition ends', async () => {
      await renderSettled(() => <DefaultDialog defaultOpen animated />)
      await pressEscape()

      // Mid-exit: still in the tree, styled by data-state, hidden from AT.
      const dialog = screen.getByRole('dialog', { hidden: true })
      expect(dialog.getAttribute('data-state')).toBe('closing')

      await fireTransitionEnd(dialog)
      expect(screen.queryByRole('dialog', { hidden: true })).toBeNull()
    })

    it('releases focus, containment, and interaction the moment the exit starts', async () => {
      const { container } = await renderSettled(() => <DefaultDialog animated />)
      const trigger = screen.getByText('Trigger')
      trigger.focus()
      await openDialog()
      expect(container.hasAttribute('inert')).toBe(true)

      await pressEscape()
      // The page is live and focus is home before the visual finishes…
      expect(container.hasAttribute('inert')).toBe(false)
      expect(document.activeElement).toBe(trigger)
      // …while the still-painting layer is out of the interaction instead.
      expect(screen.getByTestId('viewport').hasAttribute('inert')).toBe(true)
      expect(screen.getByTestId('backdrop').hasAttribute('inert')).toBe(true)
    })

    it('reopening mid-exit interrupts it and restores the layer', async () => {
      await renderSettled(() => <DefaultDialog animated />)
      await openDialog()
      await pressEscape()
      await openDialog()

      const dialog = screen.getByRole('dialog')
      expect(dialog.getAttribute('data-state')).toBe('open')
      expect(screen.getByTestId('viewport').hasAttribute('inert')).toBe(false)
      expect(document.activeElement).toBe(dialog)

      // The interrupted exit's end must not close the reopened dialog.
      await fireTransitionEnd(dialog)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })
  })

  describe('nesting', () => {
    const NestedDialog = (props: DialogAttrs) => (
      <Dialog defaultOpen {...props}>
        <Dialog.Portal>
          <Dialog.Backdrop data-testid='outer-backdrop' />
          <Dialog.Viewport data-testid='outer-viewport'>
            <Dialog.Content>
              <Dialog.Title>Outer</Dialog.Title>
              <Dialog defaultOpen>
                <Dialog.Portal>
                  <Dialog.Backdrop data-testid='inner-backdrop' />
                  <Dialog.Viewport data-testid='inner-viewport'>
                    <Dialog.Content>
                      <Dialog.Title>Inner</Dialog.Title>
                    </Dialog.Content>
                  </Dialog.Viewport>
                </Dialog.Portal>
              </Dialog>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    )

    // Each layer's teleport arrives one update after its root mounts, so a
    // two-deep stack settles on the second update.
    const renderStack = async (ui: Component): Promise<ReturnType<typeof render>> => {
      const result = await renderSettled(ui)
      await nextTick()
      return result
    }

    it('Escape dismisses the topmost dialog only, one layer per press', async () => {
      await renderStack(() => <NestedDialog />)
      expect(screen.queryByText('Outer')).not.toBeNull()
      expect(screen.queryByText('Inner')).not.toBeNull()

      await pressEscape()
      expect(screen.queryByText('Inner')).toBeNull()
      expect(screen.queryByText('Outer')).not.toBeNull()

      await pressEscape()
      expect(screen.queryByText('Outer')).toBeNull()
    })

    it('a stack-scoped Escape on the topmost dialog unwinds every layer', async () => {
      await renderStack(() => (
        <Dialog defaultOpen>
          <Dialog.Portal>
            <Dialog.Viewport>
              <Dialog.Content>
                <Dialog.Title>Outer</Dialog.Title>
                <Dialog defaultOpen escapeScope='stack'>
                  <Dialog.Portal>
                    <Dialog.Viewport>
                      <Dialog.Content>
                        <Dialog.Title>Inner</Dialog.Title>
                      </Dialog.Content>
                    </Dialog.Viewport>
                  </Dialog.Portal>
                </Dialog>
              </Dialog.Content>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog>
      ))

      await pressEscape()
      expect(screen.queryByText('Inner')).toBeNull()
      expect(screen.queryByText('Outer')).toBeNull()
    })

    it('hides the dialog beneath the topmost from assistive tech and makes it inert', async () => {
      await renderStack(() => <NestedDialog />)
      const outer = screen.getByTestId('outer-viewport')
      expect(outer.getAttribute('aria-hidden')).toBe('true')
      expect(outer.hasAttribute('inert')).toBe(true)

      const inner = screen.getByTestId('inner-viewport')
      expect(inner.hasAttribute('aria-hidden')).toBe(false)
      expect(inner.hasAttribute('inert')).toBe(false)
    })

    it("hides the lower dialog's backdrop but never the topmost's own", async () => {
      await renderStack(() => <NestedDialog />)
      expect(screen.getByTestId('outer-backdrop').hasAttribute('inert')).toBe(true)
      expect(screen.getByTestId('inner-backdrop').hasAttribute('inert')).toBe(false)

      await pressEscape() // the outer dialog is topmost again — its backdrop re-excepted
      expect(screen.getByTestId('outer-backdrop').hasAttribute('inert')).toBe(false)
    })

    it('restores the layer beneath once the top dialog closes', async () => {
      await renderStack(() => <NestedDialog />)
      expect(screen.getByTestId('outer-viewport').getAttribute('aria-hidden')).toBe('true')

      await pressEscape() // close the inner dialog
      const outer = screen.getByTestId('outer-viewport')
      expect(outer.hasAttribute('aria-hidden')).toBe(false)
      expect(outer.hasAttribute('inert')).toBe(false)
    })

    it('ignores an outside press on a lower layer — only the topmost dismisses', async () => {
      await renderStack(() => <NestedDialog />)
      await press(screen.getByTestId('outer-viewport'))
      expect(screen.queryByText('Outer')).not.toBeNull()
      expect(screen.queryByText('Inner')).not.toBeNull()

      await press(screen.getByTestId('inner-viewport'))
      expect(screen.queryByText('Inner')).toBeNull()
      expect(screen.queryByText('Outer')).not.toBeNull()
    })

    it('cleans up containment and scroll lock when the parent closes over an open child', async () => {
      const open = ref<boolean | undefined>(true)
      const { container } = await renderStack(() => <NestedDialog open={open.value} />)
      expect(screen.queryByText('Inner')).not.toBeNull()
      expect(container.hasAttribute('inert')).toBe(true)

      open.value = false
      await nextTick()
      expect(screen.queryByText('Outer')).toBeNull()
      expect(screen.queryByText('Inner')).toBeNull()
      expect(document.body.style.overflowY).not.toBe('hidden')
      expect(container.hasAttribute('aria-hidden')).toBe(false)
      expect(container.hasAttribute('inert')).toBe(false)
    })
  })

  // What only a Vue host can get wrong: prop casting, the template idioms,
  // the emit channel, the lifecycle order, and server rendering.
  describe('vue bindings', () => {
    it('a bare template attribute switches an option on; an absent one keeps the core default', async () => {
      // Vue casts an absent Boolean prop to `false` unless it declares a
      // default — that would make every dialog controlled-closed and non-modal.
      await renderSettled(
        defineComponent({
          components: dialogComponents,
          template: `
            <Dialog default-open>
              <Dialog.Portal>
                <Dialog.Content aria-label="Settings">content</Dialog.Content>
              </Dialog.Portal>
            </Dialog>
          `,
        }),
      )
      const dialog = screen.getByRole('dialog') // `default-open` alone opened it
      expect(dialog.getAttribute('aria-modal')).toBe('true') // `modal` absent: modal

      await pressEscape() // `open` absent: uncontrolled, so Escape closes it
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('v-model:open is the controlled contract — the dialog follows the bound value alone', async () => {
      const open = ref(false)
      await renderSettled(
        defineComponent({
          components: dialogComponents,
          setup: () => ({ open }),
          template: `
            <Dialog v-model:open="open">
              <Dialog.Trigger @click="open = true">Trigger</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Content aria-label="Settings">
                  <button type="button" @click="open = false">Done</button>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog>
          `,
        }),
      )

      await openDialog() // the consumer's handler sets the model
      expect(open.value).toBe(true)
      expect(screen.queryByRole('dialog')).not.toBeNull()

      await pressEscape() // controlled: an unwired dismissal changes nothing
      expect(open.value).toBe(true)
      expect(screen.queryByRole('dialog')).not.toBeNull()

      await press(screen.getByText('Done'))
      expect(open.value).toBe(false)
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('a kebab-case template listener receives a dismissal emit and can veto it', async () => {
      const vetoed: string[] = []
      await renderSettled(
        defineComponent({
          components: dialogComponents,
          setup: () => ({
            veto: (kind: string, event?: { preventDefault?: () => void }) => {
              vetoed.push(kind)
              event?.preventDefault?.()
            },
          }),
          template: `
            <Dialog
              default-open
              @escape-key-down="veto('escape', $event)"
              @interact-outside="veto('outside', $event)"
            >
              <Dialog.Portal>
                <Dialog.Backdrop data-testid="backdrop" />
                <Dialog.Content aria-label="Settings">content</Dialog.Content>
              </Dialog.Portal>
            </Dialog>
          `,
        }),
      )

      await pressEscape()
      await press(screen.getByTestId('backdrop'))
      expect(vetoed).toEqual(['escape', 'outside'])
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    // A template unwraps a ref at render time — before the element mounts —
    // so it passes a getter, read when the dialog opens.
    it('a template passes initialFocus as a getter, resolved once the element has mounted', async () => {
      await renderSettled(
        defineComponent({
          components: dialogComponents,
          setup: () => ({ name: ref<HTMLInputElement | null>(null) }),
          template: `
            <Dialog default-open>
              <Dialog.Portal>
                <Dialog.Content aria-label="Form" :initial-focus="() => name">
                  <input aria-label="Email" />
                  <input ref="name" aria-label="Name" />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog>
          `,
        }),
      )
      expect(document.activeElement).toBe(screen.getByLabelText('Name'))
    })

    // Children mount before their parent, so a Title rendered with the root
    // (no Portal) reports itself before the root starts the machine.
    it('a Title mounted before the root starts its machine still labels the dialog', async () => {
      await renderSettled(() => (
        <Dialog defaultOpen>
          <Dialog.Content>
            <Dialog.Title>Inline</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      ))
      expect(screen.queryByRole('dialog', { name: 'Inline' })).not.toBeNull()
    })

    it('drops the labelling reference when the Title unmounts while open', async () => {
      const titled = ref(true)
      await renderSettled(() => (
        <Dialog defaultOpen>
          <Dialog.Portal>
            <Dialog.Content aria-label='Fallback'>
              {titled.value && <Dialog.Title>Title</Dialog.Title>}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      ))
      expect(screen.getByRole('dialog').hasAttribute('aria-labelledby')).toBe(true)

      titled.value = false
      await nextTick()
      expect(screen.getByRole('dialog').hasAttribute('aria-labelledby')).toBe(false)
    })

    // Every part renders exactly one root element, so a component ref is
    // the consumer's handle on it.
    it("a part's template ref reaches its element as $el", async () => {
      const content = ref<InstanceType<typeof Dialog.Content> | null>(null)
      await renderSettled(() => (
        <Dialog defaultOpen>
          <Dialog.Portal>
            <Dialog.Content ref={content} aria-label='Settings'>
              content
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      ))
      expect(content.value?.$el).toBe(screen.getByRole('dialog'))
    })

    it('derives the part ids from the id prop, and from useId when it is absent or undefined', async () => {
      await renderSettled(() => (
        <>
          <DefaultDialog id='settings' defaultOpen modal={false} />
          <DefaultDialog id={undefined} defaultOpen modal={false} />
          <DefaultDialog defaultOpen modal={false} />
        </>
      ))
      const ids = screen.getAllByRole('dialog').map(dialog => dialog.id)
      expect(ids[0]).toBe('settings-content')
      // Not the core's bare `dialog` fallback: each generated id is distinct.
      for (const id of ids.slice(1)) expect(id).toMatch(/^v-.+-content$/)
      expect(new Set(ids).size).toBe(3)
    })

    it('swapping the portal container while open re-creates the layer on the new target', async () => {
      const first = document.createElement('div')
      const second = document.createElement('div')
      document.body.append(first, second)
      const container = ref(first)

      await renderSettled(() => (
        <Dialog defaultOpen>
          <Dialog.Portal container={container.value}>
            <Dialog.Content aria-label='Scoped'>content</Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      ))
      expect(first.contains(screen.getByRole('dialog'))).toBe(true)

      container.value = second
      await nextTick()
      const dialog = screen.getByRole('dialog')
      expect(second.contains(dialog)).toBe(true)
      expect(document.activeElement).toBe(dialog) // the open edge ran again
      expect(first.style.overflowY).not.toBe('hidden')
      expect(second.style.overflowY).toBe('hidden')
      first.remove()
      second.remove()
    })

    // The adapter pauses a deactivated dialog's machine, as React's <Activity>
    // does — so its layers can't stay painted, holding the page, meanwhile.
    it('a KeepAlive deactivation takes the layers down and releases the page; reactivation restores them', async () => {
      const shown = ref(true)
      const Page = defineComponent(() => () => <DefaultDialog defaultOpen />)
      const Elsewhere = defineComponent(() => () => <button type='button'>Elsewhere</button>)
      const { container } = await renderSettled(() => (
        <KeepAlive>{shown.value ? <Page /> : <Elsewhere />}</KeepAlive>
      ))
      expect(container.hasAttribute('inert')).toBe(true)

      shown.value = false
      await nextTick()
      expect(screen.queryByRole('dialog', { hidden: true })).toBeNull()
      expect(container.hasAttribute('inert')).toBe(false)
      expect(document.body.style.overflowY).not.toBe('hidden')
      const elsewhere = screen.getByText('Elsewhere')
      elsewhere.focus()
      const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
      expect(elsewhere.dispatchEvent(tab)).toBe(true) // the trap let go

      shown.value = true
      await nextTick()
      const dialog = screen.getByRole('dialog') // still open: the state survived
      expect(document.activeElement).toBe(dialog)
      expect(document.body.style.overflowY).toBe('hidden')
    })

    it('hydrates server-rendered markup without a mismatch, keeping its ids', async () => {
      const App = () => <DefaultDialog defaultOpen />
      const html = await renderToString(createSSRApp(App))
      const host = document.createElement('div')
      host.innerHTML = html
      document.body.append(host)
      const serverControls = host.querySelector('button')?.getAttribute('aria-controls')

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      const app = createSSRApp(App)
      app.mount(host)
      await nextTick()
      expect(warn).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
      warn.mockRestore()
      error.mockRestore()

      // The portal arrives after hydration, under the id the server announced.
      expect(screen.getByRole('dialog').id).toBe(serverControls)
      app.unmount()
      host.remove()
    })
  })
})
