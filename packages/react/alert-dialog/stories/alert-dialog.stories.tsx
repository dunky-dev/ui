import { useRef, useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlertDialog } from '@dunky.dev/react-alert-dialog'

const meta: Meta<typeof AlertDialog> = {
  title: 'Primitives/AlertDialog',
  component: AlertDialog,
}

export default meta
type StoryType = StoryObj<typeof AlertDialog>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` on every stateful part is the real styling hook.
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
const destructive: CSSProperties = {
  background: '#c0392b',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  padding: '6px 12px',
  cursor: 'pointer',
}

export const standard: StoryType = {
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialog.Trigger>Delete board</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop style={backdrop} />
        <AlertDialog.Viewport style={viewport}>
          <AlertDialog.Content style={content}>
            <AlertDialog.Title>Delete board?</AlertDialog.Title>
            <AlertDialog.Description>
              This permanently deletes the board and its content for every member. This can&apos;t
              be undone. An outside press does not dismiss — choose an answer. Focus starts on
              Cancel, the least destructive one.
            </AlertDialog.Description>
            <div style={actions}>
              <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
              <AlertDialog.Action style={destructive}>Delete</AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog>
  ),
}

export const trigger: StoryType = {
  render: () => (
    <AlertDialog>
      <AlertDialog.Trigger>Discard draft</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop style={backdrop} />
        <AlertDialog.Viewport style={viewport}>
          <AlertDialog.Content style={content}>
            <AlertDialog.Title>Discard draft?</AlertDialog.Title>
            <AlertDialog.Description>
              Only the trigger renders until it is pressed; focus returns to it on close.
            </AlertDialog.Description>
            <div style={actions}>
              <AlertDialog.Cancel>Keep editing</AlertDialog.Cancel>
              <AlertDialog.Action style={destructive}>Discard</AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog>
  ),
}

// The one case where focus should NOT start on Cancel: the confirming action
// is safe (or the least destructive answer isn't the Cancel part).
const InitialFocusAlertDialog = () => {
  const initialFocus = useRef<HTMLButtonElement>(null)
  return (
    <AlertDialog defaultOpen>
      <AlertDialog.Trigger>Restore backup</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop style={backdrop} />
        <AlertDialog.Viewport style={viewport}>
          <AlertDialog.Content style={content} initialFocus={initialFocus}>
            <AlertDialog.Title>Restore backup?</AlertDialog.Title>
            <AlertDialog.Description>
              The `initialFocus` ref on Content overrides the Cancel default — here the confirming
              answer takes focus instead.
            </AlertDialog.Description>
            <div style={actions}>
              <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
              <AlertDialog.Action ref={initialFocus}>Restore</AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}

export const initialFocus: StoryType = {
  render: () => <InitialFocusAlertDialog />,
}

// The confirmed work lives on the consumer's own Action handler; the part
// closes after it ran.
const ControlledAlertDialog = () => {
  const [status, setStatus] = useState('idle')
  const [open, setOpen] = useState(true)
  return (
    <>
      <p>status: {status}</p>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialog.Trigger>Empty trash</AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop style={backdrop} />
          <AlertDialog.Viewport style={viewport}>
            <AlertDialog.Content style={content}>
              <AlertDialog.Title>Empty trash?</AlertDialog.Title>
              <AlertDialog.Description>
                Controlled from outside: the `open` prop drives the state and every intent reports
                through `onOpenChange`.
              </AlertDialog.Description>
              <div style={actions}>
                <AlertDialog.Cancel onClick={() => setStatus('cancelled')}>
                  Cancel
                </AlertDialog.Cancel>
                <AlertDialog.Action style={destructive} onClick={() => setStatus('emptied')}>
                  Empty trash
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog>
    </>
  )
}

export const controlled: StoryType = {
  render: () => <ControlledAlertDialog />,
}

export const nested: StoryType = {
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialog.Trigger>Delete account</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop style={backdrop} />
        <AlertDialog.Viewport style={viewport}>
          <AlertDialog.Content style={content}>
            <AlertDialog.Title>Delete account?</AlertDialog.Title>
            <AlertDialog.Description>
              Escape dismisses the topmost layer only — the stack unwinds one layer at a time.
            </AlertDialog.Description>
            <div style={actions}>
              <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
              <AlertDialog>
                <AlertDialog.Trigger style={destructive}>Delete</AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Backdrop style={backdrop} />
                  <AlertDialog.Viewport style={viewport}>
                    <AlertDialog.Content style={content}>
                      <AlertDialog.Title>Really delete?</AlertDialog.Title>
                      <AlertDialog.Description>
                        While open, everything beneath — including the outer alert dialog — is inert
                        and hidden from assistive tech.
                      </AlertDialog.Description>
                      <div style={actions}>
                        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                        <AlertDialog.Action style={destructive}>
                          Delete everything
                        </AlertDialog.Action>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Viewport>
                </AlertDialog.Portal>
              </AlertDialog>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog>
  ),
}
