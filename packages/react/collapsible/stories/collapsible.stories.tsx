import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Collapsible } from '@dunky.dev/react-collapsible'

const meta: Meta<typeof Collapsible> = {
  title: 'Primitives/Collapsible',
  component: Collapsible,
}

export default meta
type StoryType = StoryObj<typeof Collapsible>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` / `data-disabled` on every part are the real styling
// hooks.
const trigger: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  border: '1px solid #ccc',
  borderRadius: 6,
  background: 'white',
  font: 'inherit',
  cursor: 'pointer',
}
const content: CSSProperties = {
  maxWidth: 420,
  marginTop: 8,
  padding: 12,
  border: '1px solid #eee',
  borderRadius: 6,
}

export const standard: StoryType = {
  render: () => (
    <Collapsible>
      <Collapsible.Trigger style={trigger}>Show more</Collapsible.Trigger>
      <Collapsible.Content style={content}>
        The content region stays mounted in both states — closed means hidden, not gone — so
        `data-state` can drive the open/close transition.
      </Collapsible.Content>
    </Collapsible>
  ),
}

export const defaultOpen: StoryType = {
  render: () => (
    <Collapsible defaultOpen>
      <Collapsible.Trigger style={trigger}>Hide details</Collapsible.Trigger>
      <Collapsible.Content style={content}>
        Seeded open through `defaultOpen`; the trigger still toggles freely.
      </Collapsible.Content>
    </Collapsible>
  ),
}

export const disabled: StoryType = {
  render: () => (
    <Collapsible disabled>
      <Collapsible.Trigger style={trigger}>Show more (disabled)</Collapsible.Trigger>
      <Collapsible.Content style={content}>
        A disabled collapsible swallows trigger presses. The trigger stays focusable and announces
        `aria-disabled`; both parts carry `data-disabled` for styling.
      </Collapsible.Content>
    </Collapsible>
  ),
}

// The consumer owns the state: the collapsible reports every intent through
// `onOpenChange` and follows the `open` prop.
const ControlledCollapsible = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type='button' style={trigger} onClick={() => setOpen(previous => !previous)}>
        External control: {open ? 'close' : 'open'}
      </button>
      <div style={{ marginTop: 12 }}>
        <Collapsible open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger style={trigger}>Toggle from inside</Collapsible.Trigger>
          <Collapsible.Content style={content}>
            Both the external button and the trigger drive the same state.
          </Collapsible.Content>
        </Collapsible>
      </div>
    </>
  )
}

export const controlled: StoryType = {
  render: () => <ControlledCollapsible />,
}

export const animated: StoryType = {
  render: () => (
    <>
      <style>
        {`
          .collapsible-animated {
            display: grid;
            transition: grid-template-rows 200ms ease-out;
          }
          .collapsible-animated[data-state='closed'] {
            grid-template-rows: 0fr;
            /* Override the native hidden display so the grid can animate the
               row to zero height; the a11y hiding still applies. */
            display: grid;
          }
          .collapsible-animated[data-state='open'] {
            grid-template-rows: 1fr;
          }
          .collapsible-animated > div {
            overflow: hidden;
          }
        `}
      </style>
      <Collapsible>
        <Collapsible.Trigger style={trigger}>Show more</Collapsible.Trigger>
        <Collapsible.Content className='collapsible-animated'>
          <div>
            <div style={content}>
              `data-state` drives a CSS grid-rows transition — no measuring, no JS animation.
            </div>
          </div>
        </Collapsible.Content>
      </Collapsible>
    </>
  ),
}
