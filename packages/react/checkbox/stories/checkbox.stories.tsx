import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox, type CheckboxCheckedState } from '@dunky.dev/react-checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
}

export default meta
type StoryType = StoryObj<typeof Checkbox>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` / `data-disabled` on every part are the real styling
// hooks; inline styles here keep the harness dependency-free.
const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}
const control: CSSProperties = {
  width: 20,
  height: 20,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: '1px solid #888',
  borderRadius: 4,
  background: 'white',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 14,
  lineHeight: 1,
}
const label: CSSProperties = {
  cursor: 'pointer',
  userSelect: 'none',
}
const disabledSurface: CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
}

export const standard: StoryType = {
  render: () => (
    <div style={row}>
      <Checkbox onCheckedChange={console.log}>
        <Checkbox.Control style={control}>
          <Checkbox.Indicator>✓</Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label style={label}>Accept terms and conditions</Checkbox.Label>
      </Checkbox>
    </div>
  ),
}

export const defaultChecked: StoryType = {
  render: () => (
    <div style={row}>
      <Checkbox defaultChecked>
        <Checkbox.Control style={control}>
          <Checkbox.Indicator>✓</Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label style={label}>Subscribed from the start</Checkbox.Label>
      </Checkbox>
    </div>
  ),
}

export const disabled: StoryType = {
  render: () => (
    <div style={row}>
      <Checkbox defaultChecked disabled>
        <Checkbox.Control style={{ ...control, ...disabledSurface }}>
          <Checkbox.Indicator>✓</Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label style={{ ...label, ...disabledSurface }}>
          Locked by your workspace admin
        </Checkbox.Label>
      </Checkbox>
    </div>
  ),
}

// A bulk-selection header: the parent is controlled and shows `indeterminate`
// while the group is partially selected; toggling it drives the whole group.
const SelectAll = () => {
  const [selected, setSelected] = useState([true, false, false])
  const count = selected.filter(Boolean).length
  const parentChecked: CheckboxCheckedState =
    count === selected.length ? true : count > 0 ? 'indeterminate' : false

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={row}>
        <Checkbox
          checked={parentChecked}
          onCheckedChange={checked => setSelected(selected.map(() => checked === true))}
        >
          <Checkbox.Control style={control}>
            <Checkbox.Indicator>{parentChecked === 'indeterminate' ? '−' : '✓'}</Checkbox.Indicator>
          </Checkbox.Control>
          <Checkbox.Label style={label}>Select all</Checkbox.Label>
        </Checkbox>
      </div>
      {selected.map((checked, index) => (
        <div key={index} style={{ ...row, paddingInlineStart: 24 }}>
          <Checkbox
            checked={checked}
            onCheckedChange={next =>
              setSelected(selected.map((value, i) => (i === index ? next === true : value)))
            }
          >
            <Checkbox.Control style={control}>
              <Checkbox.Indicator>✓</Checkbox.Indicator>
            </Checkbox.Control>
            <Checkbox.Label style={label}>Board {index + 1}</Checkbox.Label>
          </Checkbox>
        </div>
      ))}
    </div>
  )
}

export const indeterminate: StoryType = {
  render: () => <SelectAll />,
}
