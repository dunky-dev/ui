import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Radio } from '@dunky.dev/react-radio'

const meta: Meta<typeof Radio> = {
  title: 'Primitives/Radio',
  component: Radio,
}

export default meta
type StoryType = StoryObj<typeof Radio>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` and `data-disabled` on every part are the real styling
// hooks; the indicator's presence (checked only) drives the dot.
const groupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
}
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}
const itemStyle: CSSProperties = {
  width: 20,
  height: 20,
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #4662d2',
  borderRadius: '50%',
  background: 'white',
  cursor: 'pointer',
}
const indicatorStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: '#4662d2',
}
const labelStyle: CSSProperties = {
  cursor: 'pointer',
  userSelect: 'none',
}
// Attribute hooks need a stylesheet — inline styles can't select [data-disabled].
const disabledHook = '[data-disabled] { opacity: 0.4; cursor: not-allowed; }'

const Option = ({
  value,
  disabled,
  children,
}: {
  value: string
  disabled?: boolean
  children: ReactNode
}) => (
  <div style={rowStyle}>
    <Radio.Item value={value} disabled={disabled} style={itemStyle}>
      <Radio.ItemIndicator style={indicatorStyle} />
    </Radio.Item>
    <Radio.ItemLabel value={value} style={labelStyle}>
      {children}
    </Radio.ItemLabel>
  </div>
)

export const standard: StoryType = {
  render: () => (
    <Radio defaultValue='comfortable'>
      <Radio.Group aria-label='Density' style={groupStyle}>
        <Option value='compact'>Compact</Option>
        <Option value='comfortable'>Comfortable</Option>
        <Option value='spacious'>Spacious</Option>
      </Radio.Group>
    </Radio>
  ),
}

export const horizontal: StoryType = {
  render: () => (
    <Radio defaultValue='monthly' orientation='horizontal'>
      <Radio.Group
        aria-label='Billing period'
        style={{ ...groupStyle, flexDirection: 'row', gap: 16 }}
      >
        <Option value='monthly'>Monthly</Option>
        <Option value='yearly'>Yearly</Option>
      </Radio.Group>
    </Radio>
  ),
}

export const disabledItem: StoryType = {
  render: () => (
    <>
      <style>{disabledHook}</style>
      <Radio>
        <Radio.Group aria-label='Plan' style={groupStyle}>
          <Option value='free'>Free</Option>
          <Option value='pro'>Pro</Option>
          <Option value='enterprise' disabled>
            Enterprise (contact sales)
          </Option>
        </Radio.Group>
      </Radio>
    </>
  ),
}

export const disabledGroup: StoryType = {
  render: () => (
    <>
      <style>{disabledHook}</style>
      <Radio defaultValue='pro' disabled>
        <Radio.Group aria-label='Plan' style={groupStyle}>
          <Option value='free'>Free</Option>
          <Option value='pro'>Pro</Option>
        </Radio.Group>
      </Radio>
    </>
  ),
}

// The consumer owns the value: presses report intent through onValueChange and
// the group follows the `value` prop.
const ControlledRadio = () => {
  const [value, setValue] = useState<string | null>('paste')
  return (
    <div style={groupStyle}>
      <Radio value={value} onValueChange={setValue}>
        <Radio.Group aria-label='Paste behavior' style={groupStyle}>
          <Option value='paste'>Paste as is</Option>
          <Option value='plain'>Paste as plain text</Option>
        </Radio.Group>
      </Radio>
      <button type='button' onClick={() => setValue(null)}>
        Clear ({String(value)})
      </button>
    </div>
  )
}

export const controlled: StoryType = {
  render: () => <ControlledRadio />,
}
