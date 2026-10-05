// @vitest-environment jsdom
// The corners Svelte's lifecycle adds on top of the shared suite in
// dialog.test.ts: id minting, mount-effect ordering, the open edge, the
// mount()-based portal, and element access.
import { render, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import DefaultDialog from './fixtures/default-dialog.svelte'
import PresenceDialog from './fixtures/presence-dialog.svelte'
import RefDialog from './fixtures/ref-dialog.svelte'
import ScopedDialog from './fixtures/scoped-dialog.svelte'

const pressEscape = (): void => {
  document.body.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  )
  flushSync()
}

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

  describe('portal', () => {
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
