import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select, type SelectProps } from '@dunky.dev/react-select'

const meta: Meta<typeof Select> = {
  title: 'Primitives/Select',
  component: Select,
}

export default meta
type StoryType = StoryObj<typeof Select>

// The primitive ships headless — the story is the consumer, so it brings the
// styles AND the positioning: the wrapper anchors the listbox under the
// trigger. `data-state` / `data-highlighted` / `data-disabled` are the real
// styling hooks.
const anchor: CSSProperties = {
  position: 'relative',
  display: 'inline-block',
}
const trigger: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 180,
  justifyContent: 'space-between',
  padding: '8px 12px',
  border: '1px solid #ccc',
  borderRadius: 6,
  background: 'white',
  font: 'inherit',
  cursor: 'pointer',
}
const listbox: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  minWidth: '100%',
  marginTop: 4,
  padding: 4,
  border: '1px solid #ccc',
  borderRadius: 6,
  background: 'white',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
  zIndex: 1,
}
const item: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '6px 10px',
  borderRadius: 4,
  cursor: 'default',
}
// The state hooks, inlined as a <style> tag since stories bring their own CSS.
const stateStyles = `
  [data-highlighted] { background: #e8f0fe; }
  [data-disabled] { color: #aaa; }
  [data-placeholder] { color: #888; }
`

interface FruitSelectProps extends SelectProps {
  placeholder?: string
}

const FruitSelect = ({ placeholder = 'Pick a fruit', ...props }: FruitSelectProps) => (
  <div style={anchor}>
    <style>{stateStyles}</style>
    <Select {...props}>
      <Select.Trigger style={trigger}>
        <Select.Value placeholder={placeholder} />
        <span aria-hidden>▾</span>
      </Select.Trigger>
      <Select.Listbox style={listbox}>
        {['Apple', 'Banana', 'Blueberry', 'Cherry', 'Date'].map(label => (
          <Select.Item key={label} value={label.toLowerCase()} label={label} style={item}>
            {label} <Select.ItemIndicator>✓</Select.ItemIndicator>
          </Select.Item>
        ))}
      </Select.Listbox>
    </Select>
  </div>
)

export const standard: StoryType = {
  render: () => <FruitSelect onValueChange={value => console.log('value:', value)} />,
}

export const preselected: StoryType = {
  render: () => <FruitSelect defaultValue='banana' />,
}

export const looping: StoryType = {
  render: () => <FruitSelect loop placeholder='Arrows wrap around' />,
}

export const disabledOptions: StoryType = {
  render: () => (
    <div style={anchor}>
      <style>{stateStyles}</style>
      <Select>
        <Select.Trigger style={trigger}>
          <Select.Value placeholder='Some options are out of stock' />
          <span aria-hidden>▾</span>
        </Select.Trigger>
        <Select.Listbox style={listbox}>
          <Select.Item value='apple' style={item}>
            Apple <Select.ItemIndicator>✓</Select.ItemIndicator>
          </Select.Item>
          <Select.Item value='banana' disabled style={item}>
            Banana (out of stock)
          </Select.Item>
          <Select.Item value='cherry' disabled style={item}>
            Cherry (out of stock)
          </Select.Item>
          <Select.Item value='date' style={item}>
            Date <Select.ItemIndicator>✓</Select.ItemIndicator>
          </Select.Item>
        </Select.Listbox>
      </Select>
    </div>
  ),
}

export const disabled: StoryType = {
  render: () => <FruitSelect disabled placeholder='Disabled — announced, still focusable' />,
}

// The controlled form: the story owns the value and pushes it back in — the
// select reports every change through onValueChange.
const ControlledSelect = () => {
  const [value, setValue] = useState<string | null>('cherry')
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <FruitSelect value={value} onValueChange={setValue} />
      <button type='button' onClick={() => setValue(null)}>
        Clear ({String(value)})
      </button>
    </div>
  )
}

export const controlled: StoryType = {
  render: () => <ControlledSelect />,
}

export const typeahead: StoryType = {
  render: () => (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <p style={{ margin: 0, maxWidth: 420 }}>
        Open the list and type: a character jumps to the next matching option, repeating it cycles
        (b, b → Banana, Blueberry), and a growing prefix refines the match (b, l → Blueberry).
      </p>
      <FruitSelect />
    </div>
  ),
}
