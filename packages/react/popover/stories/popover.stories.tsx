import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Popover, type PopoverProps } from '@dunky.dev/react-popover'

const meta: Meta<typeof Popover> = {
  title: 'Primitives/Popover',
  component: Popover,
}

export default meta
type StoryType = StoryObj<typeof Popover>

// The primitive ships headless — the story is the consumer, so it brings the
// styles AND the positioning: there is no engine, so the consumer anchors the
// panel (here: a `relative` wrapper the Portal targets, an `absolute` panel).
// `data-state` on the trigger and panel is the real styling hook.
const anchor: CSSProperties = {
  position: 'relative',
  display: 'inline-block',
}
const panel: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  width: 280,
  padding: 16,
  background: 'white',
  border: '1px solid #ddd',
  borderRadius: 8,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
}
const title: CSSProperties = {
  margin: '0 0 4px',
  fontSize: 15,
}
const description: CSSProperties = {
  margin: '0 0 12px',
  fontSize: 13,
  color: '#555',
}
const field: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginBottom: 8,
  fontSize: 13,
}
const input: CSSProperties = {
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 6,
  font: 'inherit',
}
const actions: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 12,
}

// The wrapper ref lives in state so setting it re-renders — the Portal reads a
// real element on the second render instead of null, and the panel anchors to
// the wrapper instead of falling back to document.body.
const AnchoredPopover = ({ children, ...options }: PopoverProps): ReactNode => {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  return (
    <div ref={setContainer} style={anchor}>
      <Popover {...options}>
        <Popover.Trigger>Filters</Popover.Trigger>
        <Popover.Portal container={container}>
          <Popover.Content style={panel}>{children}</Popover.Content>
        </Popover.Portal>
      </Popover>
    </div>
  )
}

const FilterFields = () => (
  <>
    <Popover.Title style={title}>Filters</Popover.Title>
    <Popover.Description style={description}>
      Narrow down the results. Escape, an outside press, or focus leaving the panel dismisses.
    </Popover.Description>
    <label style={field}>
      Owner
      <input style={input} name='owner' type='text' />
    </label>
    <label style={field}>
      Updated after
      <input style={input} name='updated' type='date' />
    </label>
    <div style={actions}>
      <Popover.Close>Done</Popover.Close>
    </div>
  </>
)

export const standard: StoryType = {
  render: () => (
    <AnchoredPopover defaultOpen>
      <FilterFields />
    </AnchoredPopover>
  ),
}

export const trigger: StoryType = {
  render: () => (
    <AnchoredPopover>
      <FilterFields />
    </AnchoredPopover>
  ),
}

export const modal: StoryType = {
  render: () => (
    <AnchoredPopover defaultOpen modal>
      <Popover.Title style={title}>Modal popover</Popover.Title>
      <Popover.Description style={description}>
        Focus is trapped inside and the page around the panel is hidden from assistive tech until it
        closes.
      </Popover.Description>
      <div style={actions}>
        <Popover.Close>Close</Popover.Close>
      </div>
    </AnchoredPopover>
  ),
}

const ControlledPopover = () => {
  const [open, setOpen] = useState(false)
  const [container, setContainer] = useState<HTMLElement | null>(null)
  return (
    <>
      <p style={{ fontSize: 13 }}>The popover is {open ? 'open' : 'closed'}.</p>
      <div ref={setContainer} style={anchor}>
        <Popover open={open} onOpenChange={setOpen}>
          <Popover.Trigger>Quick settings</Popover.Trigger>
          <Popover.Portal container={container}>
            <Popover.Content style={panel}>
              <Popover.Title style={title}>Quick settings</Popover.Title>
              <Popover.Description style={description}>
                Every open/close intent — trigger, Escape, outside interaction — reports through
                onOpenChange, so the consumer stays in sync.
              </Popover.Description>
              <div style={actions}>
                <Popover.Close>Close</Popover.Close>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover>
      </div>
    </>
  )
}

export const controlled: StoryType = {
  render: () => <ControlledPopover />,
}

export const nested: StoryType = {
  render: () => (
    <AnchoredPopover defaultOpen>
      <Popover.Title style={title}>Outer popover</Popover.Title>
      <Popover.Description style={description}>
        Escape dismisses the topmost popover only — the stack unwinds one layer per press, and a
        press inside the nested panel never counts as outside this one.
      </Popover.Description>
      <Popover defaultOpen>
        <Popover.Trigger>More options</Popover.Trigger>
        <Popover.Portal>
          <Popover.Content style={{ ...panel, position: 'fixed', top: 220, left: 40 }}>
            <Popover.Title style={title}>Inner popover</Popover.Title>
            <Popover.Description style={description}>
              Portaled to the body and positioned by the consumer.
            </Popover.Description>
            <div style={actions}>
              <Popover.Close>Close</Popover.Close>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover>
      <div style={actions}>
        <Popover.Close>Done</Popover.Close>
      </div>
    </AnchoredPopover>
  ),
}
