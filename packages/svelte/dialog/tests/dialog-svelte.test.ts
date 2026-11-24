// @vitest-environment jsdom
// The corners Svelte's lifecycle adds on top of the shared suite in
// dialog.test.ts: id minting, mount-effect ordering, the open edge, the
// mount()-based portal, and element access.
import { render, screen } from '@testing-library/svelte'
import { flushSync, hydrate, unmount } from 'svelte'
import { describe, expect, inject, it, onTestFinished, vi } from 'vitest'
import BackdropLastDialog from './fixtures/backdrop-last-dialog.svelte'
import DefaultDialog from './fixtures/default-dialog.svelte'
import HandlerDialog from './fixtures/handler-dialog.svelte'
import { press, pressEscape } from './fixtures/interact'
import PresenceDialog from './fixtures/presence-dialog.svelte'
import RefDialog from './fixtures/ref-dialog.svelte'
import ScopedDialog from './fixtures/scoped-dialog.svelte'
import TransitionDialog from './fixtures/transition-dialog.svelte'
import TypedButtonsDialog from './fixtures/typed-buttons-dialog.svelte'

describe('Dialog (Svelte)', () => {
  describe('ids', () => {
    it('names every part after an explicit id', () => {
      render(DefaultDialog, { defaultOpen: true, id: 'settings' })
      expect(screen.getByRole('dialog').id).toBe('settings-content')
      expect(screen.getByText('Trigger').getAttribute('aria-controls')).toBe('settings-content')
    })

    // `$props.id()` is the fallback; spreading props must not let an explicit
    // `undefined` replace it — ids also key the dialog stack.
    it('keeps a unique generated id when id is explicitly undefined', () => {
      render(DefaultDialog, { defaultOpen: true, id: undefined })
      render(DefaultDialog, { defaultOpen: true, id: undefined })
      const [first, second] = screen.getAllByRole('dialog', { hidden: true })
      expect(first?.id).not.toBe(second?.id)
    })
  })

  describe('part presence', () => {
    // A part's mount effect runs before its root's, so it reports to a
    // machine that has not started yet.
    it('labels Content from a Title that mounts before the machine starts', () => {
      render(PresenceDialog)
      const dialog = screen.getByRole('dialog', { name: 'Title' })
      expect(document.getElementById(dialog.getAttribute('aria-describedby') as string)).toBe(
        screen.getByText('Description'),
      )
    })

    it('drops and restores the references as the parts unmount and remount', async () => {
      const { rerender } = render(PresenceDialog)
      await rerender({ showTitle: false, showDescription: false })
      const dialog = screen.getByRole('dialog', { name: 'Fallback label' })
      expect(dialog.hasAttribute('aria-labelledby')).toBe(false)
      expect(dialog.hasAttribute('aria-describedby')).toBe(false)

      await rerender({ showTitle: true, showDescription: true })
      expect(screen.getByRole('dialog', { name: 'Title' }).hasAttribute('aria-describedby')).toBe(
        true,
      )
    })
  })

  describe('open edge', () => {
    // The machine publishes a fresh api on every change; only an open change
    // may re-run the focus sequence.
    it('leaves focus alone when the machine changes without an open change', async () => {
      const { rerender } = render(PresenceDialog)
      const action = screen.getByText('Action')
      action.focus()

      await rerender({ showTitle: false })
      expect(document.activeElement).toBe(action)
    })
  })

  describe('exit window', () => {
    // jsdom lets focus land inside an `inert` subtree; a browser refuses it.
    // So assert the order: the interrupted exit un-hides its layer before
    // the open sequence moves focus in.
    it('lifts the exit inertness before a reopen moves focus in', () => {
      render(DefaultDialog, { animated: true })
      press(screen.getByText('Trigger'))
      pressEscape()

      const viewport = screen.getByTestId('viewport')
      const inertAtFocus: boolean[] = []
      const focus = HTMLElement.prototype.focus
      const spy = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (
        this: HTMLElement,
        options?: FocusOptions,
      ) {
        inertAtFocus.push(viewport.hasAttribute('inert'))
        focus.call(this, options)
      })
      press(screen.getByText('Trigger'))
      spy.mockRestore()

      expect(inertAtFocus).toEqual([false])
    })
  })

  describe('portal', () => {
    // `bind:this` fills in tree order; the layer registers only once its
    // whole tree is bound, so render order inside the Portal doesn't matter.
    it('keeps a Backdrop rendered after the Viewport pressable', () => {
      render(BackdropLastDialog)
      const backdrop = screen.getByTestId('backdrop')
      expect(backdrop.hasAttribute('inert')).toBe(false)
      expect(backdrop.hasAttribute('aria-hidden')).toBe(false)
    })

    // The layers mount and unmount as a tree of their own, where an outro
    // can't hold the unmount; intros stay off too, so enter and exit agree —
    // both are animated through data-state (`animated` for the exit).
    it('runs no Svelte transitions on the portalled layers', () => {
      const onrun = vi.fn()
      render(TransitionDialog, { onrun })
      press(screen.getByText('Trigger'))
      expect(screen.queryByRole('dialog')).not.toBeNull()

      pressEscape()
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(onrun).not.toHaveBeenCalled()
    })

    it('re-mounts the layers in a new container while open', async () => {
      const first = document.createElement('div')
      const second = document.createElement('div')
      document.body.append(first, second)

      const { rerender } = render(ScopedDialog, { container: first })
      await rerender({ container: second })

      expect(second.contains(screen.getByRole('dialog'))).toBe(true)
      expect(first.childElementCount).toBe(0)
      expect(first.style.overflowY).not.toBe('hidden')
      expect(second.style.overflowY).toBe('hidden')

      pressEscape()
      first.remove()
      second.remove()
    })
  })

  describe('consumer props', () => {
    // Every part spreads your props with its bindings; a handler swapped on
    // re-render must reach the element, not stay the first one.
    it('forwards the latest non-delegated handler after a re-render', async () => {
      const first = vi.fn()
      const second = vi.fn()
      const { rerender } = render(HandlerDialog, { onfocus: first })
      await rerender({ onfocus: second })

      screen.getByText('Trigger').focus()
      expect(first).not.toHaveBeenCalled()
      expect(second).toHaveBeenCalledTimes(1)
    })

    // A `type` the consumer leaves undefined must not erase the default — a
    // typeless button inside a form submits it.
    it('keeps Trigger and Close type="button" unless given a type', async () => {
      const { rerender } = render(TypedButtonsDialog, { type: undefined })
      expect(screen.getByText('Trigger').getAttribute('type')).toBe('button')
      expect(screen.getByText('Close').getAttribute('type')).toBe('button')

      await rerender({ type: 'submit' })
      expect(screen.getByText('Trigger').getAttribute('type')).toBe('submit')
      expect(screen.getByText('Close').getAttribute('type')).toBe('submit')
    })
  })

  describe('hydration', () => {
    // The server render's ids come from `$props.id()`; hydration must adopt
    // them, or the trigger's aria-controls would dangle.
    it('hydrates the server render onto the same ids', () => {
      const warn = vi.spyOn(console, 'warn')
      const target = document.createElement('div')
      target.innerHTML = inject('defaultOpenServerMarkup')
      document.body.append(target)
      const serverTrigger = target.querySelector('button')
      const serverControls = serverTrigger?.getAttribute('aria-controls')

      const app = hydrate(DefaultDialog, { target, props: { defaultOpen: true } })
      onTestFinished(() => {
        void unmount(app)
        target.remove()
      })
      flushSync()
      const trigger = screen.getByText('Trigger')
      expect(trigger).toBe(serverTrigger)
      expect(screen.getByRole('dialog').id).toBe(serverControls)
      expect(trigger.getAttribute('aria-controls')).toBe(serverControls)
      expect(warn).not.toHaveBeenCalled()
    })
  })

  describe('element access', () => {
    it('binds each part element through bind:ref', () => {
      const onrefs = vi.fn()
      render(RefDialog, { onrefs })
      const refs = onrefs.mock.lastCall?.[0] as Record<string, HTMLElement | null>

      expect(refs.trigger).toBe(screen.getByText('Trigger'))
      expect(refs.content).toBe(screen.getByRole('dialog'))
      expect(refs.backdrop).toBe(screen.getByTestId('backdrop'))
      expect(refs.viewport).toBe(screen.getByTestId('viewport'))
      expect(refs.title).toBe(screen.getByText('Title'))
      expect(refs.description).toBe(screen.getByText('Description'))
      expect(refs.close).toBe(screen.getByText('Close'))
    })
  })
})
