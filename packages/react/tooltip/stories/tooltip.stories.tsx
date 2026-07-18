import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tooltip } from '@dunky.dev/react-tooltip'

const meta: Meta<typeof Tooltip> = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
}

export default meta
type StoryType = StoryObj<typeof Tooltip>

// The primitive ships headless — the story is the consumer, so it brings the
// styles and the positioning (out of scope in v0, per the core SPEC).
// `data-state` (closed/opening/open/closing) is the real styling hook: a
// non-portaled Content stays mounted in every state, so CSS on data-state
// owns its visibility and the fade-out.
const tooltipCss = `
  .tip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    translate: -50% -8px;
    padding: 6px 10px;
    border-radius: 6px;
    background: #222;
    color: white;
    font: 13px/1.4 sans-serif;
    white-space: nowrap;
    pointer-events: none;
    transition: opacity 160ms;
  }
  .tip[data-state="closed"], .tip[data-state="opening"] { visibility: hidden; }
  .tip[data-state="closing"] { opacity: 0; }
`
const anchor: CSSProperties = {
  position: 'relative',
  display: 'inline-block',
  margin: 48,
}

const Anchor = ({ children }: { children: ReactNode }) => (
  <span style={anchor}>
    <style>{tooltipCss}</style>
    {children}
  </span>
)

export const standard: StoryType = {
  render: () => (
    <Anchor>
      <Tooltip>
        <Tooltip.Trigger>Save</Tooltip.Trigger>
        <Tooltip.Content className='tip'>Save the board (⌘S)</Tooltip.Content>
      </Tooltip>
    </Anchor>
  ),
}

export const instant: StoryType = {
  render: () => (
    <Anchor>
      <Tooltip openDelay={0} closeDelay={0}>
        <Tooltip.Trigger>No delays</Tooltip.Trigger>
        <Tooltip.Content className='tip'>Shows and hides immediately</Tooltip.Content>
      </Tooltip>
    </Anchor>
  ),
}

// A portaled Content mounts only while shown (open/closing), so it needs no
// hidden-state CSS — the consumer still positions it.
export const portaled: StoryType = {
  render: () => (
    <Anchor>
      <Tooltip defaultOpen>
        <Tooltip.Trigger>Portaled</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className='tip' style={{ position: 'fixed', top: 12, left: 12 }}>
            Rendered into document.body — nothing stays mounted while hidden
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip>
    </Anchor>
  ),
}

const ControlledTooltip = () => {
  const [open, setOpen] = useState(true)
  return (
    <>
      <label style={{ display: 'block', margin: '16px 48px 0' }}>
        <input type='checkbox' checked={open} onChange={event => setOpen(event.target.checked)} />
        open
      </label>
      <Anchor>
        <Tooltip open={open} onOpenChange={setOpen}>
          <Tooltip.Trigger>Controlled</Tooltip.Trigger>
          <Tooltip.Content className='tip'>Driven by the checkbox and by intent</Tooltip.Content>
        </Tooltip>
      </Anchor>
    </>
  )
}

export const controlled: StoryType = {
  render: () => <ControlledTooltip />,
}
