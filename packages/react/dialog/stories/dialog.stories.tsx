import type { CSSProperties } from 'react'
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
