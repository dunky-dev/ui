import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Accordion } from '@dunky.dev/react-accordion'

const meta: Meta<typeof Accordion> = {
  title: 'Primitives/Accordion',
  component: Accordion,
}

export default meta
type StoryType = StoryObj<typeof Accordion>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` / `data-disabled` on every part are the real styling hooks.
const list: CSSProperties = {
  width: 360,
  border: '1px solid #ccc',
  borderRadius: 8,
  overflow: 'hidden',
}
const item: CSSProperties = {
  borderBottom: '1px solid #ccc',
}
const header: CSSProperties = {
  margin: 0,
}
const trigger: CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  padding: '12px 16px',
  border: 'none',
  background: 'white',
  font: 'inherit',
  fontWeight: 600,
  textAlign: 'start',
  cursor: 'pointer',
}
const content: CSSProperties = {
  padding: '0 16px 12px',
  color: '#444',
}
const horizontalList: CSSProperties = {
  display: 'flex',
  border: '1px solid #ccc',
  borderRadius: 8,
  overflow: 'hidden',
}
const horizontalItem: CSSProperties = {
  borderInlineEnd: '1px solid #ccc',
}

const Section = ({
  value,
  title,
  children,
  disabled = false,
}: {
  value: string
  title: string
  children: ReactNode
  disabled?: boolean
}) => (
  <Accordion.Item value={value} disabled={disabled} style={item}>
    <Accordion.Header style={header}>
      <Accordion.Trigger style={trigger}>{title}</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content style={content}>{children}</Accordion.Content>
  </Accordion.Item>
)

export const single: StoryType = {
  render: () => (
    <div style={list}>
      <Accordion type='single' defaultValue='shipping'>
        <Section value='shipping' title='Shipping'>
          Orders ship within 2 business days; delivery takes 3-5 more.
        </Section>
        <Section value='returns' title='Returns'>
          Free returns within 30 days — one open section at a time, and it stays open
          (non-collapsible is the single-mode default).
        </Section>
        <Section value='support' title='Support'>
          Reach support any time; ArrowUp/ArrowDown, Home, and End move between headers.
        </Section>
      </Accordion>
    </div>
  ),
}

export const collapsible: StoryType = {
  render: () => (
    <div style={list}>
      <Accordion type='single' collapsible>
        <Section value='what' title='What does collapsible change?'>
          Re-pressing the open header closes it, so the accordion can be fully closed.
        </Section>
        <Section value='why' title='Why is it opt-in?'>
          Keeping one section open by default matches the APG single-expansion pattern.
        </Section>
      </Accordion>
    </div>
  ),
}

export const multiple: StoryType = {
  render: () => (
    <div style={list}>
      <Accordion type='multiple' defaultValue={['a', 'b']}>
        <Section value='a' title='Independent sections'>
          Any number of sections can be open at once.
        </Section>
        <Section value='b' title='Value is an array'>
          The multiple mode speaks string[] in value, defaultValue, and onValueChange.
        </Section>
        <Section value='c' title='Toggle freely'>
          Every item collapses on re-press — collapsibility is inherent to multiple mode.
        </Section>
      </Accordion>
    </div>
  ),
}

export const disabledItems: StoryType = {
  render: () => (
    <div style={list}>
      <Accordion type='single'>
        <Section value='a' title='Enabled'>
          Arrow navigation skips the disabled header below.
        </Section>
        <Section value='b' title='Disabled (aria-disabled)' disabled>
          Never opens; presses are ignored by the machine.
        </Section>
        <Section value='c' title='Also enabled'>
          ArrowDown from the first header lands here.
        </Section>
      </Accordion>
    </div>
  ),
}

export const horizontal: StoryType = {
  render: () => (
    <Accordion type='single' orientation='horizontal' defaultValue='a'>
      <div style={horizontalList}>
        <div style={horizontalItem}>
          <Section value='a' title='Pane A'>
            Horizontal orientation swaps the navigation axis to ArrowLeft/ArrowRight.
          </Section>
        </div>
        <div style={horizontalItem}>
          <Section value='b' title='Pane B'>
            The vertical arrows are left alone for the page to handle.
          </Section>
        </div>
      </div>
    </Accordion>
  ),
}

// Controlled: the consumer owns the value; every press reports through
// onValueChange and the accordion follows the prop.
const ControlledAccordion = () => {
  const [value, setValue] = useState<string | null>('a')
  return (
    <div style={list}>
      <p style={{ padding: '0 16px' }}>
        Open section: <code>{value ?? 'none'}</code>
      </p>
      <Accordion type='single' collapsible value={value} onValueChange={setValue}>
        <Section value='a' title='Section A'>
          The open value lives in the consumer&apos;s state.
        </Section>
        <Section value='b' title='Section B'>
          Presses report intent; the prop drives the machine.
        </Section>
      </Accordion>
    </div>
  )
}

export const controlled: StoryType = {
  render: () => <ControlledAccordion />,
}
