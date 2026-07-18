import { useState, type CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Combobox, type ComboboxProps } from '@dunky.dev/react-combobox'

const meta: Meta<typeof Combobox> = {
  title: 'Primitives/Combobox',
  component: Combobox,
}

export default meta
type StoryType = StoryObj<typeof Combobox>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. The data attributes on every part are the real styling hooks; the
// interaction-driven ones (highlight, disabled, selected) need selectors, so
// the story ships a tiny stylesheet.
const anchor: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  gap: 4,
  alignItems: 'center',
}
const inputStyle: CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #ccc',
  borderRadius: 6,
  font: 'inherit',
  width: 220,
}
const triggerStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: 4,
}
// No positioning engine on purpose: the consumer anchors the popup — here an
// absolutely-positioned list under a relative wrapper.
const listboxStyle: CSSProperties = {
  position: 'absolute',
  top: '100%',
  insetInlineStart: 0,
  marginTop: 4,
  width: 220,
  maxHeight: 240,
  overflow: 'auto',
  padding: 4,
  background: 'white',
  border: '1px solid #ccc',
  borderRadius: 6,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
}
const itemStyle: CSSProperties = {
  padding: '6px 8px',
  borderRadius: 4,
  cursor: 'default',
  display: 'flex',
  justifyContent: 'space-between',
}
const sheet = `
  [data-dunky-combobox-item][data-highlighted] { background: #e0ecff; }
  [data-dunky-combobox-item][data-disabled] { color: #b3b3b3; }
  [data-dunky-combobox-item][data-state='selected'] { font-weight: 600; }
`

const fruits = [
  'Apple',
  'Apricot',
  'Banana',
  'Blueberry',
  'Cherry',
  'Date',
  'Grape',
  'Mango',
  'Peach',
  'Pear',
]

const Item = ({ fruit, disabled = false }: { fruit: string; disabled?: boolean }) => (
  <Combobox.Item
    value={fruit.toLowerCase()}
    label={fruit}
    disabled={disabled}
    data-dunky-combobox-item=''
    style={itemStyle}
  >
    {fruit} <Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
  </Combobox.Item>
)

interface FilteredComboboxProps extends ComboboxProps {
  disabledFruits?: string[]
  defaultQuery?: string
}

// The canonical wiring: filtering is the consumer's — mirror the input text
// into state and render only the matching items.
const FilteredCombobox = ({
  disabledFruits = [],
  defaultQuery = '',
  ...options
}: FilteredComboboxProps) => {
  const [query, setQuery] = useState(defaultQuery)
  const matches = fruits.filter(fruit => fruit.toLowerCase().includes(query.toLowerCase()))
  return (
    <Combobox inputValue={query} onInputValueChange={setQuery} {...options}>
      <style>{sheet}</style>
      <div style={anchor}>
        <Combobox.Input aria-label='Fruit' placeholder='Search fruits…' style={inputStyle} />
        <Combobox.Trigger aria-label='Show fruits' style={triggerStyle}>
          ▾
        </Combobox.Trigger>
        <Combobox.Listbox style={listboxStyle}>
          {matches.map(fruit => (
            <Item key={fruit} fruit={fruit} disabled={disabledFruits.includes(fruit)} />
          ))}
        </Combobox.Listbox>
      </div>
    </Combobox>
  )
}

export const standard: StoryType = {
  render: () => <FilteredCombobox />,
}

export const loop: StoryType = {
  render: () => <FilteredCombobox loop />,
}

export const disabledItems: StoryType = {
  render: () => <FilteredCombobox disabledFruits={['Banana', 'Date']} />,
}

export const preselected: StoryType = {
  render: () => <FilteredCombobox defaultValue='cherry' defaultQuery='Cherry' />,
}

export const disabled: StoryType = {
  render: () => <FilteredCombobox disabled />,
}

// Value and open state driven from outside; every internal intent is still
// reported, so the controls stay in sync.
const ControlledCombobox = () => {
  const [value, setValue] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <FilteredCombobox value={value} onValueChange={setValue} open={open} onOpenChange={setOpen} />
      <button type='button' onClick={() => setOpen(current => !current)}>
        {open ? 'Close' : 'Open'} the list
      </button>
      <output>value: {value ?? '—'}</output>
    </div>
  )
}

export const controlled: StoryType = {
  render: () => <ControlledCombobox />,
}
