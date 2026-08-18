// @vitest-environment jsdom
// The Vue edge of the Dialog — behavior only; the machine's own contract is
// covered in @dunky.dev/dialog's tests.
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dialog } from '@dunky.dev/vue-dialog'

// Spreads its attrs onto the root, so tests drive props and listeners through
// TL's `render(..., { props })` / `rerender` on this wrapper.
const DefaultDialog = defineComponent({
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return () =>
      h(
        Dialog,
        { ...attrs },
        {
          default: () => [
            h(Dialog.Trigger, null, { default: () => 'Trigger' }),
            h(Dialog.Portal, null, {
              default: () => [
                h(Dialog.Backdrop, { 'data-testid': 'backdrop' }),
                h(
                  Dialog.Viewport,
                  { 'data-testid': 'viewport' },
                  {
                    default: () => [
                      h(Dialog.Content, null, {
                        default: () => [
                          h(Dialog.Title, null, { default: () => 'Title' }),
                          h(Dialog.Description, null, { default: () => 'Description' }),
                          h('button', { type: 'button' }, 'Action'),
                          h(Dialog.Close, null, { default: () => 'Close' }),
                        ],
                      }),
                    ],
                  },
                ),
              ],
            }),
          ],
        },
      )
  },
})

// The document-level effects (layer registration, focus, history guard) run in
// a post-flush watcher one microtask after mount — settle it before asserting.
const renderSettled = async (
  props?: Record<string, unknown>,
): Promise<ReturnType<typeof render>> => {
  const utils = render(DefaultDialog, props ? { props } : undefined)
  await nextTick()
  return utils
}

const openDialog = (): Promise<unknown> => fireEvent.click(screen.getByText('Trigger'))

const pressEscape = (): Promise<unknown> => fireEvent.keyDown(document.body, { key: 'Escape' })

// Auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('Dialog', () => {
  describe('open / close', () => {
    it('opens on trigger press and closes on close press', async () => {
      await renderSettled()
      expect(screen.queryByRole('dialog')).toBeNull()

      await openDialog()
      expect(screen.queryByRole('dialog')).not.toBeNull()

      await fireEvent.click(screen.getByText('Close'))
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('renders open when defaultOpen', async () => {
      await renderSettled({ defaultOpen: true })
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('emits update:open with the new value on open and close', async () => {
      const onUpdateOpen = vi.fn()
      await renderSettled({ 'onUpdate:open': onUpdateOpen })

      await openDialog()
      expect(onUpdateOpen).toHaveBeenLastCalledWith(true)

      await fireEvent.click(screen.getByText('Close'))
      expect(onUpdateOpen).toHaveBeenLastCalledWith(false)
    })
  })

  describe('escape key', () => {
    it('closes on Escape', async () => {
      await renderSettled({ defaultOpen: true })
      await pressEscape()
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('stays open when closeOnEscape=false', async () => {
      await renderSettled({ defaultOpen: true, closeOnEscape: false })
      await pressEscape()
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('stays open when the escapeKeyDown listener prevents default', async () => {
      const onEscapeKeyDown = vi.fn((event: KeyboardEvent) => event.preventDefault())
      await renderSettled({ defaultOpen: true, onEscapeKeyDown })
      await pressEscape()
      expect(onEscapeKeyDown).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })
  })

  describe('outside interaction', () => {
    it('closes on backdrop press', async () => {
      await renderSettled({ defaultOpen: true })
      await fireEvent.click(screen.getByTestId('backdrop'))
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    // The backdrop is portalled alongside the viewport, outside the content's
    // subtree — the containment walk must except it, or `inert` would swallow
    // real pointer presses on it (jsdom's .click() bypasses hit-testing, so
    // only the attributes can assert this).
    it('keeps its own backdrop pressable while the page around it is inert', async () => {
      const { container } = await renderSettled({ defaultOpen: true })
      expect(container.hasAttribute('inert')).toBe(true)

      const backdrop = screen.getByTestId('backdrop')
      expect(backdrop.hasAttribute('aria-hidden')).toBe(false)
      expect(backdrop.hasAttribute('inert')).toBe(false)
    })

    it('stays open when closeOnInteractOutside=false', async () => {
      await renderSettled({ defaultOpen: true, closeOnInteractOutside: false })
      await fireEvent.click(screen.getByTestId('backdrop'))
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('stays open when the interactOutside listener prevents default', async () => {
      const onInteractOutside = vi.fn((event?: { preventDefault: () => void }) =>
        event?.preventDefault(),
      )
      await renderSettled({ defaultOpen: true, onInteractOutside })
      await fireEvent.click(screen.getByTestId('backdrop'))
      expect(onInteractOutside).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('alertdialog does not dismiss on backdrop press by default', async () => {
      await renderSettled({ defaultOpen: true, role: 'alertdialog' })
      await fireEvent.click(screen.getByTestId('backdrop'))
      expect(screen.queryByRole('alertdialog')).not.toBeNull()
    })

    it('closes on a press on the viewport around the content', async () => {
      await renderSettled({ defaultOpen: true })
      await fireEvent.click(screen.getByTestId('viewport'))
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('does not close when a press inside the content bubbles to the viewport', async () => {
      await renderSettled({ defaultOpen: true })
      await fireEvent.click(screen.getByText('Action'))
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('renders no backdrop when modal=false', async () => {
      await renderSettled({ defaultOpen: true, modal: false })
      expect(screen.queryByTestId('backdrop')).toBeNull()
    })
  })

  describe('controlled open', () => {
    it('follows the open prop in both directions', async () => {
      const { rerender } = await renderSettled({ open: false })
      expect(screen.queryByRole('dialog')).toBeNull()

      await rerender({ open: true })
      expect(screen.queryByRole('dialog')).not.toBeNull()

      await rerender({ open: false })
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('a dismissal neither closes nor emits update:open — nothing changed', async () => {
      const onUpdateOpen = vi.fn()
      await renderSettled({ open: true, 'onUpdate:open': onUpdateOpen })
      await pressEscape()
      expect(onUpdateOpen).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).not.toBeNull()
    })

    it('a trigger press neither opens nor emits update:open', async () => {
      const onUpdateOpen = vi.fn()
      await renderSettled({ open: false, 'onUpdate:open': onUpdateOpen })
      await openDialog()
      expect(onUpdateOpen).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('reports a prop-driven change through update:open', async () => {
      const onUpdateOpen = vi.fn()
      const { rerender } = await renderSettled({ open: false, 'onUpdate:open': onUpdateOpen })
      await rerender({ open: true })
      expect(onUpdateOpen).toHaveBeenLastCalledWith(true)
      expect(onUpdateOpen).toHaveBeenCalledTimes(1)
    })

    // The controlled contract's consumer side: the dialog never moves on its
    // own, so the consumer's own handlers on the parts and the dismissal
    // emits are what drive the prop.
    it('a controlled stack closes through handlers wired at the source', async () => {
      const ControlledStack = defineComponent({
        setup() {
          const outerOpen = ref(true)
          const innerOpen = ref(false)
          return () =>
            h(
              Dialog,
              {
                open: outerOpen.value,
                'onUpdate:open': (open: boolean) => (outerOpen.value = open),
                onEscapeKeyDown: () => (outerOpen.value = false),
              },
              {
                default: () => [
                  h(Dialog.Portal, null, {
                    default: () => [
                      h(Dialog.Viewport, null, {
                        default: () => [
                          h(Dialog.Content, null, {
                            default: () => [
                              h(Dialog.Title, null, { default: () => 'Outer' }),
                              h(
                                Dialog,
                                {
                                  open: innerOpen.value,
                                  'onUpdate:open': (open: boolean) => (innerOpen.value = open),
                                  onEscapeKeyDown: () => (innerOpen.value = false),
                                },
                                {
                                  default: () => [
                                    h(
                                      Dialog.Trigger,
                                      { onClick: () => (innerOpen.value = true) },
                                      {
                                        default: () => 'Open inner',
                                      },
                                    ),
                                    h(Dialog.Portal, null, {
                                      default: () => [
                                        h(Dialog.Viewport, null, {
                                          default: () => [
                                            h(Dialog.Content, null, {
                                              default: () => [
                                                h(Dialog.Title, null, { default: () => 'Inner' }),
                                                h(
                                                  Dialog.Close,
                                                  {
                                                    onClick: () => (innerOpen.value = false),
                                                  },
                                                  { default: () => 'Close inner' },
                                                ),
                                              ],
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                },
                              ),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              },
            )
        },
      })

      render(ControlledStack)
      await nextTick()
      await fireEvent.click(screen.getByText('Open inner'))
      expect(screen.queryByText('Inner')).not.toBeNull()

      await fireEvent.click(screen.getByText('Close inner'))
      expect(screen.queryByText('Inner')).toBeNull()

      await fireEvent.click(screen.getByText('Open inner'))
      await pressEscape() // reaches the topmost layer only
      expect(screen.queryByText('Inner')).toBeNull()
      expect(screen.queryByText('Outer')).not.toBeNull()
    })

    it('dropping the open prop rewires the dialog uncontrolled where it stands', async () => {
      const onUpdateOpen = vi.fn()
      const { rerender } = await renderSettled({ open: true, 'onUpdate:open': onUpdateOpen })
      await rerender({ open: undefined })
      expect(screen.queryByRole('dialog')).not.toBeNull() // stays where it was

      await pressEscape() // uncontrolled now: dismissal works again
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(onUpdateOpen).toHaveBeenLastCalledWith(false)
    })
  })

  describe('aria wiring', () => {
    it('trigger exposes the popup relationship', async () => {
      await renderSettled()
      const trigger = screen.getByText('Trigger')
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')

      await openDialog()
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(trigger.getAttribute('aria-controls')).toBe(screen.getByRole('dialog').id)
    })

    it('renders the native dialog element, marked open', async () => {
      await renderSettled({ defaultOpen: true })
      const dialog = screen.getByRole('dialog')
      expect(dialog.tagName).toBe('DIALOG')
      expect(dialog.hasAttribute('open')).toBe(true)
    })

    it('content is labelled by the Title and described by the Description', async () => {
      await renderSettled({ defaultOpen: true })
      const dialog = screen.getByRole('dialog', { name: 'Title' })
      expect(dialog.getAttribute('aria-modal')).toBe('true')

      const describedBy = dialog.getAttribute('aria-describedby')
      expect(describedBy).not.toBeNull()
      expect(document.getElementById(describedBy as string)?.textContent).toBe('Description')
    })

    it('supports aria-label on Content when no Title is rendered', async () => {
      render(
        defineComponent(
          () => () =>
            h(
              Dialog,
              { defaultOpen: true },
              {
                default: () => [
                  h(Dialog.Portal, null, {
                    default: () => [
                      h(Dialog.Content, { 'aria-label': 'Settings' }, { default: () => 'content' }),
                    ],
                  }),
                ],
              },
            ),
        ),
      )
      await nextTick()
      const dialog = screen.getByRole('dialog', { name: 'Settings' })
      expect(dialog.hasAttribute('aria-labelledby')).toBe(false)
      expect(dialog.hasAttribute('aria-describedby')).toBe(false)
    })

    it('renders role=alertdialog when requested', async () => {
      await renderSettled({ defaultOpen: true, role: 'alertdialog' })
      expect(screen.queryByRole('alertdialog')).not.toBeNull()
    })

    it('omits aria-modal when modal=false', async () => {
      await renderSettled({ defaultOpen: true, modal: false })
      expect(screen.getByRole('dialog').hasAttribute('aria-modal')).toBe(false)
    })
  })

  describe('focus management', () => {
    it('moves focus into the dialog window on open and restores it on close', async () => {
      await renderSettled()
      const trigger = screen.getByText('Trigger')
      trigger.focus()

      await openDialog()
      expect(document.activeElement).toBe(screen.getByRole('dialog'))

      await pressEscape()
      expect(document.activeElement).toBe(trigger)
    })

    // jsdom does no layout, so the scroll jump can't be reproduced — assert the
    // mechanism that prevents it: focus never scrolls the locked surface.
    it('moves focus without scrolling the locked surface', async () => {
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')
      await renderSettled({ defaultOpen: true })

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
      focusSpy.mockRestore()
    })

    it('moves focus to the first form field when the dialog contains one', async () => {
      render(
        defineComponent(
          () => () =>
            h(
              Dialog,
              { defaultOpen: true },
              {
                default: () => [
                  h(Dialog.Portal, null, {
                    default: () => [
                      h(
                        Dialog.Content,
                        { 'aria-label': 'Form' },
                        {
                          default: () => [
                            h('button', { type: 'button' }, 'Action'),
                            h('input', { 'aria-label': 'Name' }),
                          ],
                        },
                      ),
                    ],
                  }),
                ],
              },
            ),
        ),
      )
      await nextTick()
      expect(document.activeElement).toBe(screen.getByLabelText('Name'))
    })

    it('wraps Tab from the last focusable to the first', async () => {
      await renderSettled({ defaultOpen: true })
      const dialog = screen.getByRole('dialog')

      screen.getByText('Close').focus()
      await fireEvent.keyDown(dialog, { key: 'Tab' })
      expect(document.activeElement).toBe(screen.getByText('Action'))
    })

    it('wraps Shift+Tab from the first focusable to the last', async () => {
      await renderSettled({ defaultOpen: true })
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
      render(
        defineComponent(
          () => () =>
            h(
              Dialog,
              { defaultOpen: true },
              {
                default: () => [
                  h(Dialog.Portal, null, {
                    default: () => [
                      h(Dialog.Viewport, null, {
                        default: () => [
                          h(Dialog.Content, null, {
                            default: () => [
                              h(Dialog.Close, null, { default: () => 'Close' }),
                              h('button', { type: 'button' }, 'Content'),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              },
            ),
        ),
      )
      await nextTick()
      const dialog = screen.getByRole('dialog')

      dialog.focus() // the dialog window — where focus opens
      await fireEvent.keyDown(dialog, { key: 'Tab' })
      expect(document.activeElement).toBe(screen.getByText('Content')) // not Close

      dialog.focus()
      await fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
      expect(document.activeElement).toBe(screen.getByText('Close')) // last, backward
    })

    const InitialFocusDialog = defineComponent({
      props: { disabled: { type: Boolean, default: false } },
      setup(props) {
        // The ref itself is the prop — Content resolves it at open time, so the
        // template ref filling after setup is fine.
        const initialFocus = shallowRef<HTMLElement | null>(null)
        return () =>
          h(
            Dialog,
            { defaultOpen: true },
            {
              default: () => [
                h(Dialog.Portal, null, {
                  default: () => [
                    h(Dialog.Viewport, null, {
                      default: () => [
                        h(
                          Dialog.Content,
                          { 'aria-label': 'Form', initialFocus },
                          {
                            default: () => [
                              h('input', {
                                ref: initialFocus,
                                disabled: props.disabled,
                                'aria-label': 'Name',
                              }),
                            ],
                          },
                        ),
                      ],
                    }),
                  ],
                }),
              ],
            },
          )
      },
    })

    it('moves focus to the initialFocus element on open', async () => {
      render(InitialFocusDialog)
      await nextTick()
      expect(document.activeElement).toBe(screen.getByLabelText('Name'))
    })

    it('falls back to the dialog panel when the initialFocus target cannot take focus', async () => {
      render(InitialFocusDialog, { props: { disabled: true } })
      await nextTick()
      expect(document.activeElement).toBe(screen.getByRole('dialog'))
    })
  })

  describe('scroll lock', () => {
    it('locks body scroll while a modal dialog is open', async () => {
      await renderSettled()
      await openDialog()
      expect(document.body.style.overflow).toBe('hidden')

      await pressEscape()
      expect(document.body.style.overflow).not.toBe('hidden')
    })

    it('does not lock scroll when modal=false', async () => {
      await renderSettled({ defaultOpen: true, modal: false })
      expect(document.body.style.overflow).not.toBe('hidden')
    })

    it('locks the portal container, not the body, when scoped', async () => {
      const panel = document.createElement('div')
      document.body.append(panel)

      render(
        defineComponent(
          () => () =>
            h(
              Dialog,
              { defaultOpen: true },
              {
                default: () => [
                  h(
                    Dialog.Portal,
                    { container: panel },
                    {
                      default: () => [
                        h(Dialog.Content, { 'aria-label': 'Scoped' }, { default: () => 'content' }),
                      ],
                    },
                  ),
                ],
              },
            ),
        ),
      )
      await nextTick()

      expect(panel.style.overflow).toBe('hidden')
      expect(document.body.style.overflow).not.toBe('hidden')

      await pressEscape()
      expect(panel.style.overflow).not.toBe('hidden')
      panel.remove()
    })
  })

  describe('back navigation', () => {
    // jsdom's history traversal is asynchronous — await the popstate itself.
    const nextPop = (): Promise<void> =>
      new Promise(resolve => {
        window.addEventListener('popstate', () => resolve(), { once: true })
      })

    it('closes on the browser Back instead of navigating', async () => {
      const before: unknown = window.history.state
      await renderSettled({ closeOnBack: true })
      await openDialog()
      expect(window.history.state).not.toEqual(before) // the guard entry is planted

      const pop = nextPop()
      window.history.back()
      await pop
      await nextTick()
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(window.history.state).toEqual(before) // consumed by the press itself
    })

    it('closing any other way consumes the guard entry', async () => {
      const before: unknown = window.history.state
      await renderSettled({ closeOnBack: true, defaultOpen: true })
      expect(window.history.state).not.toEqual(before)

      const pop = nextPop()
      await pressEscape()
      await pop
      expect(window.history.state).toEqual(before) // no leftover to swallow a Back
    })

    it('plants no history entry without the flag', async () => {
      const before: unknown = window.history.state
      await renderSettled({ defaultOpen: true })
      expect(window.history.state).toEqual(before)
    })
  })

  describe('exit animation', () => {
    const fireTransitionEnd = async (element: Element): Promise<void> => {
      element.dispatchEvent(new Event('transitionend', { bubbles: true }))
      await nextTick()
    }

    it('stays mounted through the exit and unmounts when its transition ends', async () => {
      await renderSettled({ defaultOpen: true, animated: true })
      await pressEscape()

      // Mid-exit: still in the tree, styled by data-state, hidden from AT.
      const dialog = screen.getByRole('dialog', { hidden: true })
      expect(dialog.getAttribute('data-state')).toBe('closing')

      await fireTransitionEnd(dialog)
      expect(screen.queryByRole('dialog', { hidden: true })).toBeNull()
    })

    it('releases focus, containment, and interaction the moment the exit starts', async () => {
      const { container } = await renderSettled({ animated: true })
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
      await renderSettled({ animated: true })
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
    const NestedDialog = defineComponent({
      inheritAttrs: false,
      setup(_props, { attrs }) {
        return () =>
          h(
            Dialog,
            { defaultOpen: true, ...attrs },
            {
              default: () => [
                h(Dialog.Portal, null, {
                  default: () => [
                    h(Dialog.Backdrop, { 'data-testid': 'outer-backdrop' }),
                    h(
                      Dialog.Viewport,
                      { 'data-testid': 'outer-viewport' },
                      {
                        default: () => [
                          h(Dialog.Content, null, {
                            default: () => [
                              h(Dialog.Title, null, { default: () => 'Outer' }),
                              h(
                                Dialog,
                                { defaultOpen: true },
                                {
                                  default: () => [
                                    h(Dialog.Portal, null, {
                                      default: () => [
                                        h(Dialog.Backdrop, { 'data-testid': 'inner-backdrop' }),
                                        h(
                                          Dialog.Viewport,
                                          { 'data-testid': 'inner-viewport' },
                                          {
                                            default: () => [
                                              h(Dialog.Content, null, {
                                                default: () => [
                                                  h(Dialog.Title, null, { default: () => 'Inner' }),
                                                ],
                                              }),
                                            ],
                                          },
                                        ),
                                      ],
                                    }),
                                  ],
                                },
                              ),
                            ],
                          }),
                        ],
                      },
                    ),
                  ],
                }),
              ],
            },
          )
      },
    })

    const renderNested = async (
      props?: Record<string, unknown>,
    ): Promise<ReturnType<typeof render>> => {
      const utils = render(NestedDialog, props ? { props } : undefined)
      await nextTick()
      return utils
    }

    it('Escape dismisses the topmost dialog only, one layer per press', async () => {
      await renderNested()
      expect(screen.queryByText('Outer')).not.toBeNull()
      expect(screen.queryByText('Inner')).not.toBeNull()

      await pressEscape()
      expect(screen.queryByText('Inner')).toBeNull()
      expect(screen.queryByText('Outer')).not.toBeNull()

      await pressEscape()
      expect(screen.queryByText('Outer')).toBeNull()
    })

    it('hides the dialog beneath the topmost from assistive tech and makes it inert', async () => {
      await renderNested()
      const outer = screen.getByTestId('outer-viewport')
      expect(outer.getAttribute('aria-hidden')).toBe('true')
      expect(outer.hasAttribute('inert')).toBe(true)

      const inner = screen.getByTestId('inner-viewport')
      expect(inner.hasAttribute('aria-hidden')).toBe(false)
      expect(inner.hasAttribute('inert')).toBe(false)
    })

    it("hides the lower dialog's backdrop but never the topmost's own", async () => {
      await renderNested()
      expect(screen.getByTestId('outer-backdrop').hasAttribute('inert')).toBe(true)
      expect(screen.getByTestId('inner-backdrop').hasAttribute('inert')).toBe(false)

      await pressEscape() // the outer dialog is topmost again — its backdrop re-excepted
      expect(screen.getByTestId('outer-backdrop').hasAttribute('inert')).toBe(false)
    })

    it('restores the layer beneath once the top dialog closes', async () => {
      await renderNested()
      expect(screen.getByTestId('outer-viewport').getAttribute('aria-hidden')).toBe('true')

      await pressEscape() // close the inner dialog
      const outer = screen.getByTestId('outer-viewport')
      expect(outer.hasAttribute('aria-hidden')).toBe(false)
      expect(outer.hasAttribute('inert')).toBe(false)
    })

    it('ignores an outside press on a lower layer — only the topmost dismisses', async () => {
      await renderNested()
      await fireEvent.click(screen.getByTestId('outer-viewport'))
      expect(screen.queryByText('Outer')).not.toBeNull()
      expect(screen.queryByText('Inner')).not.toBeNull()

      await fireEvent.click(screen.getByTestId('inner-viewport'))
      expect(screen.queryByText('Inner')).toBeNull()
      expect(screen.queryByText('Outer')).not.toBeNull()
    })

    it('cleans up containment and scroll lock when the parent closes over an open child', async () => {
      const { container, rerender } = await renderNested({ open: true })
      expect(screen.queryByText('Inner')).not.toBeNull()
      expect(container.hasAttribute('inert')).toBe(true)

      await rerender({ open: false })
      await nextTick()
      expect(screen.queryByText('Outer')).toBeNull()
      expect(screen.queryByText('Inner')).toBeNull()
      expect(document.body.style.overflow).not.toBe('hidden')
      expect(container.hasAttribute('aria-hidden')).toBe(false)
      expect(container.hasAttribute('inert')).toBe(false)
    })
  })
})
