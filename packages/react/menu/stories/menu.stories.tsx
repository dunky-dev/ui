import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Menu, type MenuProps } from '@dunky.dev/react-menu'

const meta: Meta<typeof Menu> = {
  title: 'Primitives/Menu',
  component: Menu,
}

export default meta
type StoryType = StoryObj<typeof Menu>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` on trigger/content and `data-highlighted` /
// `data-disabled` on items are the real styling hooks; the highlight has to be
// a selector-based style because it is an attribute, not :hover.
const stylesheet = `
  .menu-content {
    min-width: 180px;
    padding: 4px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
    outline: none;
  }
  .menu-item {
    padding: 6px 10px;
    border-radius: 6px;
    cursor: default;
    user-select: none;
  }
  .menu-item[data-highlighted] {
    background: #4666ff;
    color: white;
  }
  .menu-item[data-disabled] {
    color: #aaa;
  }
`
const triggerStyle: CSSProperties = {
  padding: '8px 14px',
  border: '1px solid #ccc',
  borderRadius: 8,
  background: 'white',
  cursor: 'pointer',
}
const groupLabelStyle: CSSProperties = {
  padding: '6px 10px',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#888',
}
const separatorStyle: CSSProperties = {
  height: 1,
  margin: '4px 0',
  background: '#eee',
}

// There is no positioning engine in v0 — anchoring is the consumer's concern.
// The story anchors the content by portaling it into an absolutely-positioned
// box right under the trigger. The anchor lives in state so the portal reads a
// real element on the second render instead of null.
const Anchored = ({
  menu,
  children,
}: {
  menu: (anchor: HTMLElement) => ReactNode
  children: ReactNode
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <style>{stylesheet}</style>
      {children}
      <div ref={setAnchor} style={{ position: 'absolute', top: '100%', left: 0, paddingTop: 4 }} />
      {anchor && menu(anchor)}
    </div>
  )
}

const StandardMenu = (props: MenuProps) => (
  <Menu {...props}>
    <Anchored
      menu={anchor => (
        <Menu.Portal container={anchor}>
          <Menu.Content className='menu-content'>
            <Menu.Item className='menu-item' value='rename' onSelect={() => console.log('rename')}>
              Rename
            </Menu.Item>
            <Menu.Item
              className='menu-item'
              value='duplicate'
              onSelect={() => console.log('duplicate')}
            >
              Duplicate
            </Menu.Item>
            <Menu.Item className='menu-item' value='archive' disabled>
              Archive (soon)
            </Menu.Item>
            <Menu.Separator style={separatorStyle} />
            <Menu.Group>
              <Menu.GroupLabel style={groupLabelStyle}>Danger zone</Menu.GroupLabel>
              <Menu.Item
                className='menu-item'
                value='delete'
                onSelect={() => console.log('delete')}
              >
                Delete
              </Menu.Item>
            </Menu.Group>
          </Menu.Content>
        </Menu.Portal>
      )}
    >
      <Menu.Trigger style={triggerStyle}>Board actions</Menu.Trigger>
    </Anchored>
  </Menu>
)

export const standard: StoryType = {
  render: () => <StandardMenu />,
}

export const openByDefault: StoryType = {
  render: () => <StandardMenu defaultOpen />,
}

const TypeaheadMenu = () => (
  <Menu>
    <Anchored
      menu={anchor => (
        <Menu.Portal container={anchor}>
          <Menu.Content className='menu-content'>
            {['Amsterdam', 'Berlin', 'Barcelona', 'Bergamo', 'Lisbon', 'London', 'Ljubljana'].map(
              city => (
                <Menu.Item
                  className='menu-item'
                  key={city}
                  value={city.toLowerCase()}
                  onSelect={() => console.log(city)}
                >
                  {city}
                </Menu.Item>
              ),
            )}
          </Menu.Content>
        </Menu.Portal>
      )}
    >
      <Menu.Trigger style={triggerStyle}>
        Pick a city (open, then type &quot;b&quot; repeatedly)
      </Menu.Trigger>
    </Anchored>
  </Menu>
)

export const typeahead: StoryType = {
  render: () => <TypeaheadMenu />,
}

// Controlled: the consumer owns the state; every intent — trigger press,
// Escape, Tab, outside press, item activation — reports through onOpenChange.
const ControlledMenu = () => {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Menu open={open} onOpenChange={setOpen}>
        <Anchored
          menu={anchor => (
            <Menu.Portal container={anchor}>
              <Menu.Content className='menu-content'>
                <Menu.Item className='menu-item' value='one' onSelect={() => console.log('one')}>
                  Action one
                </Menu.Item>
                <Menu.Item className='menu-item' value='two' onSelect={() => console.log('two')}>
                  Action two
                </Menu.Item>
              </Menu.Content>
            </Menu.Portal>
          )}
        >
          <Menu.Trigger style={triggerStyle}>Controlled menu</Menu.Trigger>
        </Anchored>
      </Menu>
      <span>open: {String(open)}</span>
    </div>
  )
}

export const controlled: StoryType = {
  render: () => <ControlledMenu />,
}
