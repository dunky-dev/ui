import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toast } from '@dunky.dev/react-toast'

const meta: Meta<typeof Toast> = {
  title: 'Primitives/Toast',
  component: Toast,
}

export default meta
type StoryType = StoryObj<typeof Toast>

// The primitive ships headless — the story is the consumer, so it brings the
// styles (including the viewport's position). `data-state` is the styling hook.
const viewport: CSSProperties = {
  position: 'fixed',
  bottom: 24,
  insetInlineEnd: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  width: 320,
  margin: 0,
  padding: 0,
  listStyle: 'none',
  zIndex: 1,
}
const root: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: '4px 12px',
  alignItems: 'center',
  padding: 12,
  background: 'white',
  border: '1px solid #ccc',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.16)',
}
const title: CSSProperties = { fontWeight: 600 }
const description: CSSProperties = { gridColumn: 1, margin: 0, color: '#555' }

const ToastBody = () => (
  <>
    <Toast.Title style={title}>Board renamed</Toast.Title>
    <Toast.Close aria-label='Dismiss'>&times;</Toast.Close>
    <Toast.Description style={description}>
      Hover or focus the toast to pause its timer; leave to restart it.
    </Toast.Description>
  </>
)

export const standard: StoryType = {
  render: () => (
    <Toast.Provider>
      <Toast.Viewport style={viewport}>
        <Toast onOpenChange={open => console.log('open:', open)}>
          <Toast.Root style={root}>
            <ToastBody />
          </Toast.Root>
        </Toast>
      </Toast.Viewport>
    </Toast.Provider>
  ),
}

// A controlled toast re-shown from a trigger: the consumer owns `open` and
// follows every dismissal — timer, Close, Action — through onOpenChange.
const ControlledToast = () => {
  const [open, setOpen] = useState(false)
  return (
    <Toast.Provider>
      <button type='button' onClick={() => setOpen(true)}>
        Delete file
      </button>
      <Toast.Viewport style={viewport}>
        <Toast open={open} onOpenChange={setOpen}>
          <Toast.Root style={root}>
            <Toast.Title style={title}>File deleted</Toast.Title>
            <Toast.Action onClick={() => console.log('undo!')}>Undo</Toast.Action>
            <Toast.Description style={description}>
              Pressing Undo runs your handler, then dismisses.
            </Toast.Description>
          </Toast.Root>
        </Toast>
      </Toast.Viewport>
    </Toast.Provider>
  )
}

export const controlled: StoryType = {
  render: () => <ControlledToast />,
}

export const background: StoryType = {
  render: () => (
    <Toast.Provider duration={8000} label='Background updates'>
      <Toast.Viewport style={viewport}>
        <Toast type='background'>
          <Toast.Root style={root}>
            <Toast.Title style={title}>Export ready</Toast.Title>
            <Toast.Close aria-label='Dismiss'>&times;</Toast.Close>
            <Toast.Description style={description}>
              A background toast announces politely and uses the provider&apos;s 8s duration.
            </Toast.Description>
          </Toast.Root>
        </Toast>
      </Toast.Viewport>
    </Toast.Provider>
  ),
}

export const persistent: StoryType = {
  render: () => (
    <Toast.Provider>
      <Toast.Viewport style={viewport}>
        <Toast duration={Infinity}>
          <Toast.Root style={root}>
            <Toast.Title style={title}>Connection lost</Toast.Title>
            <Toast.Close aria-label='Dismiss'>&times;</Toast.Close>
            <Toast.Description style={description}>
              duration=Infinity never auto-dismisses — only the Close button does.
            </Toast.Description>
          </Toast.Root>
        </Toast>
      </Toast.Viewport>
    </Toast.Provider>
  ),
}

export const stacked: StoryType = {
  render: () => (
    <Toast.Provider>
      <Toast.Viewport style={viewport}>
        {['First', 'Second', 'Third'].map((label, index) => (
          <Toast key={label} duration={4000 + index * 2000}>
            <Toast.Root style={root}>
              <Toast.Title style={title}>{label} toast</Toast.Title>
              <Toast.Close aria-label='Dismiss'>&times;</Toast.Close>
              <Toast.Description style={description}>
                Hovering the viewport pauses every toast at once.
              </Toast.Description>
            </Toast.Root>
          </Toast>
        ))}
      </Toast.Viewport>
    </Toast.Provider>
  ),
}
