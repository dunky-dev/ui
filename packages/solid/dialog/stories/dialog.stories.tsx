import { createSignal, Repeat } from 'solid-js'
import type { JSX } from '@solidjs/web'
import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { Dialog } from '@dunky.dev/solid-dialog'

const meta: Meta<typeof Dialog> = {
  title: 'Primitives/Dialog',
  component: Dialog,
}

export default meta
type StoryType = StoryObj<typeof Dialog>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` on every part is the real styling hook.
const backdrop: JSX.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.4)',
}
const viewport: JSX.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  overflow: 'auto',
  padding: '24px',
}
const content: JSX.CSSProperties = {
  // `margin: auto` inside the viewport's flex box does the centering;
  // `relative` makes the corner Close button pin to the window, not the page.
  position: 'relative',
  margin: 'auto',
  'max-width': '480px',
  padding: '24px',
  background: 'white',
  'border-radius': '8px',
  'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.24)',
}
const actions: JSX.CSSProperties = {
  display: 'flex',
  'justify-content': 'flex-end',
  gap: '8px',
  'margin-top': '16px',
}
const closeIcon: JSX.CSSProperties = {
  position: 'absolute',
  top: '12px',
  'inset-inline-end': '12px',
  width: '28px',
  height: '28px',
  display: 'inline-flex',
  'align-items': 'center',
  'justify-content': 'center',
  border: 'none',
  'border-radius': '6px',
  background: 'transparent',
  cursor: 'pointer',
  'font-size': '18px',
  'line-height': 1,
}
const field: JSX.CSSProperties = {
  display: 'flex',
  'flex-direction': 'column',
  gap: '4px',
  'margin-top': '12px',
}
const input: JSX.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #ccc',
  'border-radius': '6px',
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
const scopedBoundary: JSX.CSSProperties = {
  position: 'relative',
  height: '320px',
  overflow: 'hidden',
  border: '1px solid #ccc',
  'border-radius': '8px',
}
const scopedScroller: JSX.CSSProperties = {
  height: '100%',
  overflow: 'auto',
  padding: '16px',
  'box-sizing': 'border-box',
}
const scopedBackdrop: JSX.CSSProperties = { ...backdrop, position: 'absolute' }
const scopedViewport: JSX.CSSProperties = { ...viewport, position: 'absolute' }

// Dialog.Close is the dialog's single dismissal affordance — the corner `×`,
// kept the focus cycle's last stop by the core contract. Buttons that act
// (Cancel / Confirm / Delete) are the consumer's own, driving the dialog
// through state — see the alertDialog story.
const closableContent: JSX.CSSProperties = { ...content, position: 'relative' }

const CloseButton = () => (
  <Dialog.Close aria-label='Close' style={closeIcon}>
    &times;
  </Dialog.Close>
)

export const standard: StoryType = {
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdrop} />
        <Dialog.Viewport style={viewport}>
          <Dialog.Content style={closableContent}>
            <CloseButton />
            <Dialog.Title>Rename board</Dialog.Title>
            <Dialog.Description>
              The new name is visible to everyone with access to this board. The corner button,
              Escape, and an outside press all dismiss.
            </Dialog.Description>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ),
}

// The action row is the consumer's: Cancel/Delete do their work and close
// through state, so their Tab order is plain DOM order. Per the APG, a dialog
// confirming a destructive step starts focus on the least destructive action —
// `initialFocus` points at Cancel.
const AlertDialog = () => {
  const [open, setOpen] = createSignal(true)
  let cancel: HTMLButtonElement | undefined
  return (
    <Dialog
      role='alertdialog'
      open={open()}
      onOpenChange={setOpen}
      onEscapeKeyDown={() => setOpen(false)}
    >
      <Dialog.Trigger onClick={() => setOpen(true)}>Delete board</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdrop} />
        <Dialog.Viewport style={viewport}>
          <Dialog.Content style={content} initialFocus={() => cancel}>
            <Dialog.Title>Delete board?</Dialog.Title>
            <Dialog.Description>
              This permanently deletes the board and its content for every member. This can't be
              undone. An outside press does not dismiss an alert dialog — choose an action.
            </Dialog.Description>
            <div style={actions}>
              <button ref={el => (cancel = el)} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button onClick={() => setOpen(false)}>Delete</button>
            </div>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  )
}

export const alertDialog: StoryType = {
  render: () => <AlertDialog />,
}

export const longContent: StoryType = {
  render: () => (
    <Dialog defaultOpen>
      <Dialog.Trigger>Open terms</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdrop} />
        <Dialog.Viewport style={viewport}>
          <Dialog.Content style={closableContent}>
            <CloseButton />
            <Dialog.Title>Terms of service</Dialog.Title>
            <Dialog.Description>
              Content taller than the screen scrolls within the viewport layer.
            </Dialog.Description>
            <Repeat count={20}>
              {index => (
                <p>
                  {index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              )}
            </Repeat>
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
          <Dialog.Content style={closableContent}>
            <CloseButton />
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
                <input style={input} name='login' type='text' autocomplete='username' />
              </label>
              <label style={field}>
                Password
                <input
                  style={input}
                  name='password'
                  type='password'
                  autocomplete='current-password'
                />
              </label>
              <div style={actions}>
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
          <Dialog.Content style={closableContent}>
            <CloseButton />
            <Dialog.Title>Closed by default</Dialog.Title>
            <Dialog.Description>Only the trigger renders until it is pressed.</Dialog.Description>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ),
}

// The consumer owns `open`; a controlled dialog never moves on its own, so
// every dismissal is decided at its source.
const ControlledDialog = () => {
  const [open, setOpen] = createSignal(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open from outside</button>
      <Dialog open={open()} onOpenChange={setOpen} onInteractOutside={() => setOpen(false)}>
        <Dialog.Portal>
          <Dialog.Backdrop style={backdrop} />
          <Dialog.Viewport style={viewport}>
            <Dialog.Content style={content}>
              <Dialog.Title>Controlled</Dialog.Title>
              <Dialog.Description>
                The consumer owns `open`; dismissals are decided at their source.
              </Dialog.Description>
              <div style={actions}>
                <button onClick={() => setOpen(false)}>Close</button>
              </div>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}

export const controlled: StoryType = {
  render: () => <ControlledDialog />,
}

// The boundary element fills its ref during render, before the dialog's
// effects run — the portal reads a real element the moment it opens, so an
// open dialog never falls back to document.body.
const ScopedDialog = () => {
  const [boundary, setBoundary] = createSignal<HTMLElement | null>(null)
  return (
    <div ref={setBoundary} style={scopedBoundary}>
      <div style={scopedScroller}>
        <Repeat count={12}>
          {index => (
            <p style={{ margin: '0 0 8px' }}>
              {index + 1}. Background content scrolls inside the panel; the trigger sits at the end.
            </p>
          )}
        </Repeat>
        <Dialog>
          <Dialog.Trigger>Open in panel</Dialog.Trigger>
          <Dialog.Portal container={boundary()}>
            <Dialog.Backdrop style={scopedBackdrop} />
            <Dialog.Viewport style={scopedViewport}>
              <Dialog.Content style={closableContent}>
                <CloseButton />
                <Dialog.Title>Scoped dialog</Dialog.Title>
                <Dialog.Description>
                  Portaled into the panel boundary; the backdrop and viewport are `absolute`, so the
                  overlay fills the panel's visible box and stays put while the background scrolls
                  behind it.
                </Dialog.Description>
              </Dialog.Content>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog>
      </div>
    </div>
  )
}

export const scoped: StoryType = {
  render: () => <ScopedDialog />,
}

// "Close all" is consumer-side for now — `Close scope="stack"` is spec-only, so
// the three layers are controlled and one handler drops them together. And a
// controlled dialog never moves on its own: each layer decides its dismissals
// at the source — its Trigger handler, its own action buttons, and the
// dismissal callbacks (`onEscapeKeyDown` / `onInteractOutside`) — per the
// controlled contract; `onOpenChange` only reports changes that actually
// happened.
const NestedDialogs = () => {
  const [outerOpen, setOuterOpen] = createSignal(true)
  const [innerOpen, setInnerOpen] = createSignal(false)
  const [innermostOpen, setInnermostOpen] = createSignal(false)
  const closeAll = () => {
    setInnermostOpen(false)
    setInnerOpen(false)
    setOuterOpen(false)
  }
  return (
    <Dialog
      open={outerOpen()}
      onOpenChange={setOuterOpen}
      onEscapeKeyDown={() => setOuterOpen(false)}
      onInteractOutside={() => setOuterOpen(false)}
    >
      <Dialog.Trigger onClick={() => setOuterOpen(true)}>Open outer</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdrop} />
        <Dialog.Viewport style={viewport}>
          <Dialog.Content style={content}>
            <Dialog.Title>Outer dialog</Dialog.Title>
            <Dialog.Description>
              Escape and outside presses dismiss the topmost dialog only — the stack unwinds one
              layer at a time.
            </Dialog.Description>
            <Dialog
              open={innerOpen()}
              onOpenChange={setInnerOpen}
              onEscapeKeyDown={() => setInnerOpen(false)}
              onInteractOutside={() => setInnerOpen(false)}
            >
              <Dialog.Trigger onClick={() => setInnerOpen(true)}>Open inner</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop style={backdrop} />
                <Dialog.Viewport style={viewport}>
                  <Dialog.Content style={content}>
                    <Dialog.Title>Inner dialog</Dialog.Title>
                    <Dialog.Description>
                      While open, everything beneath — including the outer dialog — is inert and
                      hidden from assistive tech.
                    </Dialog.Description>
                    <Dialog
                      open={innermostOpen()}
                      onOpenChange={setInnermostOpen}
                      onEscapeKeyDown={() => setInnermostOpen(false)}
                      onInteractOutside={() => setInnermostOpen(false)}
                    >
                      <Dialog.Trigger onClick={() => setInnermostOpen(true)}>
                        Open innermost
                      </Dialog.Trigger>
                      <Dialog.Portal>
                        <Dialog.Backdrop style={backdrop} />
                        <Dialog.Viewport style={viewport}>
                          <Dialog.Content style={content}>
                            <Dialog.Title>Innermost dialog</Dialog.Title>
                            <Dialog.Description>
                              Three layers deep. Escape and Close dismiss this layer only; Close all
                              unwinds the whole stack at once.
                            </Dialog.Description>
                            <div style={actions}>
                              <button onClick={closeAll}>Close all</button>
                              <button onClick={() => setInnermostOpen(false)}>Close</button>
                            </div>
                          </Dialog.Content>
                        </Dialog.Viewport>
                      </Dialog.Portal>
                    </Dialog>
                    <div style={actions}>
                      <button onClick={() => setInnerOpen(false)}>Close</button>
                    </div>
                  </Dialog.Content>
                </Dialog.Viewport>
              </Dialog.Portal>
            </Dialog>
            <div style={actions}>
              <button onClick={() => setOuterOpen(false)}>Close</button>
            </div>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  )
}

export const nested: StoryType = {
  render: () => <NestedDialogs />,
}

// closeOnBack turns the host's Back into a dismissal: while the dialog is open,
// a guard entry sits in the session history, so the browser's Back closes the
// dialog instead of leaving the page — what mobile users expect from a
// full-screen overlay. The canvas has no browser chrome, so the in-dialog
// button stands in for a real Back press by calling `history.back()`.
export const closeOnBack: StoryType = {
  render: () => (
    <Dialog defaultOpen closeOnBack>
      <Dialog.Trigger>Open dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop style={backdrop} />
        <Dialog.Viewport style={viewport}>
          <Dialog.Content style={closableContent}>
            <CloseButton />
            <Dialog.Title>Rename board</Dialog.Title>
            <Dialog.Description>
              The browser's Back closes this dialog instead of navigating away. Press Back — or the
              button below, which stands in for it here — and the dialog dismisses while the page
              stays put.
            </Dialog.Description>
            <div style={actions}>
              <button onClick={() => window.history.back()}>Simulate browser Back</button>
            </div>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ),
}
