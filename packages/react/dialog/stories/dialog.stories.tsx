import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Dialog } from '@dunky.dev/react-dialog'

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
  padding: 24,
}
const content: CSSProperties = {
  // Reset the UA <dialog> styles so the viewport's flex centering owns position.
  position: 'static',
  border: 'none',
  margin: 'auto',
  maxWidth: 480,
  padding: 24,
  background: 'white',
  borderRadius: 8,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
}
const actions: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 16,
}
const closeIcon: CSSProperties = {
  position: 'absolute',
  top: 12,
  insetInlineEnd: 12,
  width: 28,
  height: 28,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 6,
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 18,
  lineHeight: 1,
}
const field: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginTop: 12,
}
const input: CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #ccc',
  borderRadius: 6,
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
  height: 320,
  overflow: 'hidden',
  border: '1px solid #ccc',
  borderRadius: 8,
}
const scopedScroller: CSSProperties = { height: '100%', overflow: 'auto', padding: 16 }
const scopedBackdrop: CSSProperties = { ...backdrop, position: 'absolute' }
const scopedViewport: CSSProperties = { ...viewport, position: 'absolute' }

const DialogActions = () => (
  <div style={actions}>
    <Dialog.Close>Cancel</Dialog.Close>
    <Dialog.Close>Confirm</Dialog.Close>
  </div>
)

export const standard: StoryType = {
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdrop} />
        <Dialog.Viewport style={viewport}>
          <Dialog.Content style={content}>
            <Dialog.Title>Rename board</Dialog.Title>
            <Dialog.Description>
              The new name is visible to everyone with access to this board.
            </Dialog.Description>
            <DialogActions />
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ),
}

export const alertDialog: StoryType = {
  render: () => (
    <Dialog defaultOpen role='alertdialog'>
      <Dialog.Trigger>Delete board</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdrop} />
        <Dialog.Viewport style={viewport}>
          <Dialog.Content style={content}>
            <Dialog.Title>Delete board?</Dialog.Title>
            <Dialog.Description>
              This permanently deletes the board and its content for every member. This can&apos;t
              be undone. An outside press does not dismiss an alert dialog — choose an action.
            </Dialog.Description>
            <div style={actions}>
              <Dialog.Close>Cancel</Dialog.Close>
              <Dialog.Close>Delete</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ),
}

export const longContent: StoryType = {
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Trigger>Open terms</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdrop} />
        <Dialog.Viewport style={viewport}>
          <Dialog.Content style={content}>
            <Dialog.Title>Terms of service</Dialog.Title>
            <Dialog.Description>
              Content taller than the screen scrolls within the viewport layer.
            </Dialog.Description>
            {Array.from({ length: 20 }, (_, index) => (
              <p key={index}>
                {index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua.
              </p>
            ))}
            <DialogActions />
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ),
}

export const withCloseButton: StoryType = {
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdrop} />
        <Dialog.Viewport style={viewport}>
          <Dialog.Content style={{ ...content, position: 'relative' }}>
            <Dialog.Close aria-label='Close' style={closeIcon}>
              &times;
            </Dialog.Close>
            <Dialog.Title>Share board</Dialog.Title>
            <Dialog.Description>
              Anyone with the link can view this board. The corner button and Escape both dismiss.
            </Dialog.Description>
            <DialogActions />
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ),
}

export const loginForm: StoryType = {
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Trigger>Sign in</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdrop} />
        <Dialog.Viewport style={viewport}>
          <Dialog.Content style={content}>
            <Dialog.Title>Sign in</Dialog.Title>
            <Dialog.Description>
              Focus moves to the first field on open, and stays trapped inside while the dialog is
              open.
            </Dialog.Description>
            <form
              method='dialog'
              onSubmit={event => {
                event.preventDefault()
              }}
            >
              <label style={field}>
                Login
                <input style={input} name='login' type='text' autoComplete='username' />
              </label>
              <label style={field}>
                Password
                <input
                  style={input}
                  name='password'
                  type='password'
                  autoComplete='current-password'
                />
              </label>
              <div style={actions}>
                <Dialog.Close>Cancel</Dialog.Close>
                <button type='submit'>Sign in</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ),
}

export const trigger: StoryType = {
  render: () => (
    <Dialog>
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdrop} />
        <Dialog.Viewport style={viewport}>
          <Dialog.Content style={content}>
            <Dialog.Title>Closed by default</Dialog.Title>
            <Dialog.Description>Only the trigger renders until it is pressed.</Dialog.Description>
            <DialogActions />
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ),
}

// The container ref lives in state so setting it re-renders — the portal reads
// a real element on the second render instead of null. The Dialog subtree waits
// for the container so an open dialog never briefly falls back to document.body.
const ScopedDialog = () => {
  const [boundary, setBoundary] = useState<HTMLElement | null>(null)
  return (
    <div ref={setBoundary} style={scopedBoundary}>
      <div style={scopedScroller}>
        {Array.from({ length: 12 }, (_, index) => (
          <p key={index} style={{ margin: '0 0 8px' }}>
            {index + 1}. Background content scrolls inside the panel; the trigger sits at the end.
          </p>
        ))}
        {boundary && (
          <Dialog>
            <Dialog.Trigger>Open in panel</Dialog.Trigger>
            <Dialog.Portal container={boundary}>
              <Dialog.Backdrop style={scopedBackdrop} />
              <Dialog.Viewport style={scopedViewport}>
                <Dialog.Content style={content}>
                  <Dialog.Title>Scoped dialog</Dialog.Title>
                  <Dialog.Description>
                    Portaled into the panel boundary; the backdrop and viewport are `absolute`, so
                    the overlay fills the panel&apos;s visible box and stays put while the
                    background scrolls behind it.
                  </Dialog.Description>
                  <DialogActions />
                </Dialog.Content>
              </Dialog.Viewport>
            </Dialog.Portal>
          </Dialog>
        )}
      </div>
    </div>
  )
}

export const scoped: StoryType = {
  render: () => <ScopedDialog />,
}

export const nested: StoryType = {
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Trigger>Open outer</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdrop} />
        <Dialog.Viewport style={viewport}>
          <Dialog.Content style={content}>
            <Dialog.Title>Outer dialog</Dialog.Title>
            <Dialog.Description>
              Escape and outside presses dismiss the topmost dialog only — the stack unwinds one
              layer at a time.
            </Dialog.Description>
            <Dialog>
              <Dialog.Trigger>Open inner</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop style={backdrop} />
                <Dialog.Viewport style={viewport}>
                  <Dialog.Content style={content}>
                    <Dialog.Title>Inner dialog</Dialog.Title>
                    <Dialog.Description>
                      While open, everything beneath — including the outer dialog — is inert and
                      hidden from assistive tech.
                    </Dialog.Description>
                    <DialogActions />
                  </Dialog.Content>
                </Dialog.Viewport>
              </Dialog.Portal>
            </Dialog>
            <DialogActions />
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ),
}
