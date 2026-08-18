import { defineComponent, h, ref, shallowRef, type CSSProperties, type VNodeChild } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Dialog } from '@dunky.dev/vue-dialog'

const meta: Meta<typeof Dialog> = {
  title: 'Primitives/Dialog',
  component: Dialog,
}

export default meta
type StoryType = StoryObj<typeof Dialog>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` on every part is the real styling hook.
const backdrop: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.4)',
}
const viewport: CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  overflow: 'auto',
  padding: '24px',
}
const content: CSSProperties = {
  // Reset the UA <dialog> styles so the viewport's flex centering owns position.
  position: 'static',
  border: 'none',
  margin: 'auto',
  maxWidth: '480px',
  padding: '24px',
  background: 'white',
  borderRadius: '8px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
}
const actions: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '16px',
}
const closeIcon: CSSProperties = {
  position: 'absolute',
  top: '12px',
  insetInlineEnd: '12px',
  width: '28px',
  height: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: '6px',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '18px',
  lineHeight: 1,
}
const field: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginTop: '12px',
}
const input: CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #ccc',
  borderRadius: '6px',
  font: 'inherit',
}
// A scoped dialog opens inside a container instead of over the whole page: it
// portals into that element, and its overlay layers switch from `fixed`
// (viewport-pinned) to `absolute` (container-pinned).
//
// CSS constraint: an `absolute` overlay can't stay fixed inside a *scrolling*
// element — it's positioned against the scroll origin and scrolls away. So the
// scrollable background goes in an inner scroller, wrapped by a NON-scrolling
// positioned boundary; the overlay pins to the boundary's visible box and the
// backdrop (a sibling on top of the scroller) blocks scrolling behind it.
const scopedBoundary: CSSProperties = {
  position: 'relative',
  height: '320px',
  overflow: 'hidden',
  border: '1px solid #ccc',
  borderRadius: '8px',
}
const scopedScroller: CSSProperties = {
  height: '100%',
  overflow: 'auto',
  padding: '16px',
  boxSizing: 'border-box',
}
const scopedBackdrop: CSSProperties = { ...backdrop, position: 'absolute' }
const scopedViewport: CSSProperties = { ...viewport, position: 'absolute' }

// Dialog.Close is the dialog's single dismissal affordance — the corner `×`,
// kept the focus cycle's last stop by the core contract. Buttons that act
// (Cancel / Confirm / Delete) are the consumer's own, driving the dialog
// through state — see the alertDialog story.
const closableContent: CSSProperties = { ...content, position: 'relative' }

const closeButton = (): VNodeChild =>
  h(Dialog.Close, { 'aria-label': 'Close', style: closeIcon }, { default: () => '×' })

const slot = (children: () => VNodeChild): { default: () => VNodeChild } => ({ default: children })

export const standard: StoryType = {
  render: () => ({
    setup: () => () =>
      h(
        Dialog,
        { defaultOpen: true },
        slot(() => [
          h(
            Dialog.Trigger,
            null,
            slot(() => 'Open dialog'),
          ),
          h(
            Dialog.Portal,
            null,
            slot(() => [
              h(Dialog.Backdrop, { style: backdrop }),
              h(
                Dialog.Viewport,
                { style: viewport },
                slot(() => [
                  h(
                    Dialog.Content,
                    { style: closableContent },
                    slot(() => [
                      closeButton(),
                      h(
                        Dialog.Title,
                        null,
                        slot(() => 'Rename board'),
                      ),
                      h(
                        Dialog.Description,
                        null,
                        slot(
                          () =>
                            'The new name is visible to everyone with access to this board. ' +
                            'The corner button, Escape, and an outside press all dismiss.',
                        ),
                      ),
                    ]),
                  ),
                ]),
              ),
            ]),
          ),
        ]),
      ),
  }),
}

// The action row is the consumer's: Cancel/Delete do their work and close
// through state, so their Tab order is plain DOM order. Per the APG, a dialog
// confirming a destructive step starts focus on the least destructive action —
// `initialFocus` points at Cancel.
const AlertDialog = defineComponent({
  setup() {
    const open = ref(true)
    const cancel = shallowRef<HTMLElement | null>(null)
    return () =>
      h(
        Dialog,
        {
          role: 'alertdialog',
          open: open.value,
          'onUpdate:open': (next: boolean) => (open.value = next),
          onEscapeKeyDown: () => (open.value = false),
        },
        slot(() => [
          h(
            Dialog.Trigger,
            { onClick: () => (open.value = true) },
            slot(() => 'Delete board'),
          ),
          h(
            Dialog.Portal,
            null,
            slot(() => [
              h(Dialog.Backdrop, { style: backdrop }),
              h(
                Dialog.Viewport,
                { style: viewport },
                slot(() => [
                  h(
                    Dialog.Content,
                    { style: content, initialFocus: cancel },
                    slot(() => [
                      h(
                        Dialog.Title,
                        null,
                        slot(() => 'Delete board?'),
                      ),
                      h(
                        Dialog.Description,
                        null,
                        slot(
                          () =>
                            'This permanently deletes the board and its content for every member. ' +
                            "This can't be undone. An outside press does not dismiss an alert dialog — " +
                            'choose an action.',
                        ),
                      ),
                      h('div', { style: actions }, [
                        h('button', { ref: cancel, onClick: () => (open.value = false) }, 'Cancel'),
                        h('button', { onClick: () => (open.value = false) }, 'Delete'),
                      ]),
                    ]),
                  ),
                ]),
              ),
            ]),
          ),
        ]),
      )
  },
})

export const alertDialog: StoryType = {
  render: () => ({ setup: () => () => h(AlertDialog) }),
}

export const longContent: StoryType = {
  render: () => ({
    setup: () => () =>
      h(
        Dialog,
        { defaultOpen: true },
        slot(() => [
          h(
            Dialog.Trigger,
            null,
            slot(() => 'Open terms'),
          ),
          h(
            Dialog.Portal,
            null,
            slot(() => [
              h(Dialog.Backdrop, { style: backdrop }),
              h(
                Dialog.Viewport,
                { style: viewport },
                slot(() => [
                  h(
                    Dialog.Content,
                    { style: closableContent },
                    slot(() => [
                      closeButton(),
                      h(
                        Dialog.Title,
                        null,
                        slot(() => 'Terms of service'),
                      ),
                      h(
                        Dialog.Description,
                        null,
                        slot(
                          () => 'Content taller than the screen scrolls within the viewport layer.',
                        ),
                      ),
                      ...Array.from({ length: 20 }, (_, index) =>
                        h(
                          'p',
                          { key: index },
                          `${index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. ` +
                            'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                        ),
                      ),
                    ]),
                  ),
                ]),
              ),
            ]),
          ),
        ]),
      ),
  }),
}

export const loginForm: StoryType = {
  render: () => ({
    setup: () => () =>
      h(
        Dialog,
        { defaultOpen: true },
        slot(() => [
          h(
            Dialog.Trigger,
            null,
            slot(() => 'Sign in'),
          ),
          h(
            Dialog.Portal,
            null,
            slot(() => [
              h(Dialog.Backdrop, { style: backdrop }),
              h(
                Dialog.Viewport,
                { style: viewport },
                slot(() => [
                  h(
                    Dialog.Content,
                    { style: closableContent },
                    slot(() => [
                      closeButton(),
                      h(
                        Dialog.Title,
                        null,
                        slot(() => 'Sign in'),
                      ),
                      h(
                        Dialog.Description,
                        null,
                        slot(
                          () =>
                            'Focus moves to the first field on open, and stays trapped inside ' +
                            'while the dialog is open.',
                        ),
                      ),
                      h(
                        'form',
                        {
                          method: 'dialog',
                          onSubmit: (event: Event) => event.preventDefault(),
                        },
                        [
                          h('label', { style: field }, [
                            'Login',
                            h('input', {
                              style: input,
                              name: 'login',
                              type: 'text',
                              autocomplete: 'username',
                            }),
                          ]),
                          h('label', { style: field }, [
                            'Password',
                            h('input', {
                              style: input,
                              name: 'password',
                              type: 'password',
                              autocomplete: 'current-password',
                            }),
                          ]),
                          h('div', { style: actions }, [
                            h('button', { type: 'submit' }, 'Sign in'),
                          ]),
                        ],
                      ),
                    ]),
                  ),
                ]),
              ),
            ]),
          ),
        ]),
      ),
  }),
}

export const trigger: StoryType = {
  render: () => ({
    setup: () => () =>
      h(
        Dialog,
        null,
        slot(() => [
          h(
            Dialog.Trigger,
            null,
            slot(() => 'Open dialog'),
          ),
          h(
            Dialog.Portal,
            null,
            slot(() => [
              h(Dialog.Backdrop, { style: backdrop }),
              h(
                Dialog.Viewport,
                { style: viewport },
                slot(() => [
                  h(
                    Dialog.Content,
                    { style: closableContent },
                    slot(() => [
                      closeButton(),
                      h(
                        Dialog.Title,
                        null,
                        slot(() => 'Closed by default'),
                      ),
                      h(
                        Dialog.Description,
                        null,
                        slot(() => 'Only the trigger renders until it is pressed.'),
                      ),
                    ]),
                  ),
                ]),
              ),
            ]),
          ),
        ]),
      ),
  }),
}

// The consumer owns `open`; a controlled dialog never moves on its own, so
// every dismissal is decided at its source.
const ControlledDialog = defineComponent({
  setup() {
    const open = ref(false)
    return () =>
      h('div', [
        h('button', { onClick: () => (open.value = true) }, 'Open from outside'),
        h(
          Dialog,
          {
            open: open.value,
            'onUpdate:open': (next: boolean) => (open.value = next),
            onInteractOutside: () => (open.value = false),
          },
          slot(() => [
            h(
              Dialog.Portal,
              null,
              slot(() => [
                h(Dialog.Backdrop, { style: backdrop }),
                h(
                  Dialog.Viewport,
                  { style: viewport },
                  slot(() => [
                    h(
                      Dialog.Content,
                      { style: content },
                      slot(() => [
                        h(
                          Dialog.Title,
                          null,
                          slot(() => 'Controlled'),
                        ),
                        h(
                          Dialog.Description,
                          null,
                          slot(
                            () =>
                              'The consumer owns `open`; dismissals are decided at their source.',
                          ),
                        ),
                        h('div', { style: actions }, [
                          h('button', { onClick: () => (open.value = false) }, 'Close'),
                        ]),
                      ]),
                    ),
                  ]),
                ),
              ]),
            ),
          ]),
        ),
      ])
  },
})

export const controlled: StoryType = {
  render: () => ({ setup: () => () => h(ControlledDialog) }),
}

// The boundary element lives in a ref so setting it re-renders — the portal
// reads a real element on the second render instead of null. The Dialog
// subtree waits for the boundary so an open dialog never briefly falls back
// to document.body.
const ScopedDialog = defineComponent({
  setup() {
    const boundary = shallowRef<HTMLElement | null>(null)
    return () =>
      h('div', { ref: boundary, style: scopedBoundary }, [
        h('div', { style: scopedScroller }, [
          ...Array.from({ length: 12 }, (_, index) =>
            h(
              'p',
              { key: index, style: { margin: '0 0 8px' } },
              `${index + 1}. Background content scrolls inside the panel; the trigger sits at the end.`,
            ),
          ),
          boundary.value &&
            h(
              Dialog,
              null,
              slot(() => [
                h(
                  Dialog.Trigger,
                  null,
                  slot(() => 'Open in panel'),
                ),
                h(
                  Dialog.Portal,
                  { container: boundary.value },
                  slot(() => [
                    h(Dialog.Backdrop, { style: scopedBackdrop }),
                    h(
                      Dialog.Viewport,
                      { style: scopedViewport },
                      slot(() => [
                        h(
                          Dialog.Content,
                          { style: closableContent },
                          slot(() => [
                            closeButton(),
                            h(
                              Dialog.Title,
                              null,
                              slot(() => 'Scoped dialog'),
                            ),
                            h(
                              Dialog.Description,
                              null,
                              slot(
                                () =>
                                  'Portaled into the panel boundary; the backdrop and viewport are ' +
                                  "`absolute`, so the overlay fills the panel's visible box and stays " +
                                  'put while the background scrolls behind it.',
                              ),
                            ),
                          ]),
                        ),
                      ]),
                    ),
                  ]),
                ),
              ]),
            ),
        ]),
      ])
  },
})

export const scoped: StoryType = {
  render: () => ({ setup: () => () => h(ScopedDialog) }),
}

// "Close all" is consumer-side for now — `Close scope="stack"` is spec-only, so
// the three layers are controlled and one handler drops them together. And a
// controlled dialog never moves on its own: each layer decides its dismissals
// at the source — its Trigger handler, its own action buttons, and the
// dismissal emits (`escapeKeyDown` / `interactOutside`) — per the controlled
// contract; `update:open` only reports changes that actually happened.
const NestedDialogs = defineComponent({
  setup() {
    const outerOpen = ref(true)
    const innerOpen = ref(false)
    const innermostOpen = ref(false)
    const closeAll = (): void => {
      innermostOpen.value = false
      innerOpen.value = false
      outerOpen.value = false
    }
    return () =>
      h(
        Dialog,
        {
          open: outerOpen.value,
          'onUpdate:open': (next: boolean) => (outerOpen.value = next),
          onEscapeKeyDown: () => (outerOpen.value = false),
          onInteractOutside: () => (outerOpen.value = false),
        },
        slot(() => [
          h(
            Dialog.Trigger,
            { onClick: () => (outerOpen.value = true) },
            slot(() => 'Open outer'),
          ),
          h(
            Dialog.Portal,
            null,
            slot(() => [
              h(Dialog.Backdrop, { style: backdrop }),
              h(
                Dialog.Viewport,
                { style: viewport },
                slot(() => [
                  h(
                    Dialog.Content,
                    { style: content },
                    slot(() => [
                      h(
                        Dialog.Title,
                        null,
                        slot(() => 'Outer dialog'),
                      ),
                      h(
                        Dialog.Description,
                        null,
                        slot(
                          () =>
                            'Escape and outside presses dismiss the topmost dialog only — ' +
                            'the stack unwinds one layer at a time.',
                        ),
                      ),
                      h(
                        Dialog,
                        {
                          open: innerOpen.value,
                          'onUpdate:open': (next: boolean) => (innerOpen.value = next),
                          onEscapeKeyDown: () => (innerOpen.value = false),
                          onInteractOutside: () => (innerOpen.value = false),
                        },
                        slot(() => [
                          h(
                            Dialog.Trigger,
                            { onClick: () => (innerOpen.value = true) },
                            slot(() => 'Open inner'),
                          ),
                          h(
                            Dialog.Portal,
                            null,
                            slot(() => [
                              h(Dialog.Backdrop, { style: backdrop }),
                              h(
                                Dialog.Viewport,
                                { style: viewport },
                                slot(() => [
                                  h(
                                    Dialog.Content,
                                    { style: content },
                                    slot(() => [
                                      h(
                                        Dialog.Title,
                                        null,
                                        slot(() => 'Inner dialog'),
                                      ),
                                      h(
                                        Dialog.Description,
                                        null,
                                        slot(
                                          () =>
                                            'While open, everything beneath — including the outer dialog — ' +
                                            'is inert and hidden from assistive tech.',
                                        ),
                                      ),
                                      h(
                                        Dialog,
                                        {
                                          open: innermostOpen.value,
                                          'onUpdate:open': (next: boolean) =>
                                            (innermostOpen.value = next),
                                          onEscapeKeyDown: () => (innermostOpen.value = false),
                                          onInteractOutside: () => (innermostOpen.value = false),
                                        },
                                        slot(() => [
                                          h(
                                            Dialog.Trigger,
                                            { onClick: () => (innermostOpen.value = true) },
                                            slot(() => 'Open innermost'),
                                          ),
                                          h(
                                            Dialog.Portal,
                                            null,
                                            slot(() => [
                                              h(Dialog.Backdrop, { style: backdrop }),
                                              h(
                                                Dialog.Viewport,
                                                { style: viewport },
                                                slot(() => [
                                                  h(
                                                    Dialog.Content,
                                                    { style: content },
                                                    slot(() => [
                                                      h(
                                                        Dialog.Title,
                                                        null,
                                                        slot(() => 'Innermost dialog'),
                                                      ),
                                                      h(
                                                        Dialog.Description,
                                                        null,
                                                        slot(
                                                          () =>
                                                            'Three layers deep. Escape and Close dismiss this layer only; ' +
                                                            'Close all unwinds the whole stack at once.',
                                                        ),
                                                      ),
                                                      h('div', { style: actions }, [
                                                        h(
                                                          'button',
                                                          { onClick: closeAll },
                                                          'Close all',
                                                        ),
                                                        h(
                                                          'button',
                                                          {
                                                            onClick: () =>
                                                              (innermostOpen.value = false),
                                                          },
                                                          'Close',
                                                        ),
                                                      ]),
                                                    ]),
                                                  ),
                                                ]),
                                              ),
                                            ]),
                                          ),
                                        ]),
                                      ),
                                      h('div', { style: actions }, [
                                        h(
                                          'button',
                                          { onClick: () => (innerOpen.value = false) },
                                          'Close',
                                        ),
                                      ]),
                                    ]),
                                  ),
                                ]),
                              ),
                            ]),
                          ),
                        ]),
                      ),
                      h('div', { style: actions }, [
                        h('button', { onClick: () => (outerOpen.value = false) }, 'Close'),
                      ]),
                    ]),
                  ),
                ]),
              ),
            ]),
          ),
        ]),
      )
  },
})

export const nested: StoryType = {
  render: () => ({ setup: () => () => h(NestedDialogs) }),
}

// closeOnBack turns the host's Back into a dismissal: while the dialog is open,
// a guard entry sits in the session history, so the browser's Back closes the
// dialog instead of leaving the page — what mobile users expect from a
// full-screen overlay. The canvas has no browser chrome, so the in-dialog
// button stands in for a real Back press by calling `history.back()`.
export const closeOnBack: StoryType = {
  render: () => ({
    setup: () => () =>
      h(
        Dialog,
        { defaultOpen: true, closeOnBack: true },
        slot(() => [
          h(
            Dialog.Trigger,
            null,
            slot(() => 'Open dialog'),
          ),
          h(
            Dialog.Portal,
            null,
            slot(() => [
              h(Dialog.Backdrop, { style: backdrop }),
              h(
                Dialog.Viewport,
                { style: viewport },
                slot(() => [
                  h(
                    Dialog.Content,
                    { style: closableContent },
                    slot(() => [
                      closeButton(),
                      h(
                        Dialog.Title,
                        null,
                        slot(() => 'Rename board'),
                      ),
                      h(
                        Dialog.Description,
                        null,
                        slot(
                          () =>
                            "The browser's Back closes this dialog instead of navigating away. " +
                            'Press Back — or the button below, which stands in for it here — ' +
                            'and the dialog dismisses while the page stays put.',
                        ),
                      ),
                      h('div', { style: actions }, [
                        h(
                          'button',
                          { onClick: () => window.history.back() },
                          'Simulate browser Back',
                        ),
                      ]),
                    ]),
                  ),
                ]),
              ),
            ]),
          ),
        ]),
      ),
  }),
}
