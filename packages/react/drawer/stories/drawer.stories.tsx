import type { CSSProperties } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Drawer, type DrawerPlacement } from '@dunky.dev/react-drawer'

const meta: Meta<typeof Drawer> = {
  title: 'Primitives/Drawer',
  component: Drawer,
}

export default meta
type StoryType = StoryObj<typeof Drawer>

// The primitive ships headless — the story is the consumer, so it brings the
// styles. `data-state` and `data-placement` on the parts are the real styling
// hooks: the panel slides from the edge `data-placement` names.
const backdrop: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.4)',
}
const viewport: CSSProperties = {
  position: 'fixed',
  inset: 0,
}
// Keyed by data-placement: each edge pins the panel and sizes the slide axis.
const panelByPlacement: Record<DrawerPlacement, CSSProperties> = {
  left: { top: 0, bottom: 0, left: 0, width: 320 },
  right: { top: 0, bottom: 0, right: 0, width: 320 },
  top: { top: 0, left: 0, right: 0, height: 240 },
  bottom: { bottom: 0, left: 0, right: 0, height: 240 },
}
const content = (placement: DrawerPlacement): CSSProperties => ({
  // Reset the UA <dialog> styles so the viewport's edge pinning owns position.
  position: 'absolute',
  margin: 0,
  border: 'none',
  maxWidth: 'none',
  maxHeight: 'none',
  padding: 24,
  overflow: 'auto',
  boxSizing: 'border-box',
  background: 'white',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
  ...panelByPlacement[placement],
})
const actions: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 16,
}
const field: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginTop: 12,
}
const input: CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #ccc',
  borderRadius: 6,
  font: 'inherit',
}

const DrawerActions = () => (
  <div style={actions}>
    <Drawer.Close>Cancel</Drawer.Close>
    <Drawer.Close>Apply</Drawer.Close>
  </div>
)

const PlacementDrawer = ({ placement }: { placement: DrawerPlacement }) => (
  <Drawer defaultOpen placement={placement}>
    <Drawer.Trigger>Open drawer</Drawer.Trigger>
    <Drawer.Portal>
      <Drawer.Backdrop style={backdrop} />
      <Drawer.Viewport style={viewport}>
        <Drawer.Content style={content(placement)}>
          <Drawer.Title>Board settings</Drawer.Title>
          <Drawer.Description>
            The panel is anchored to the {placement} edge — data-placement is the styling hook.
          </Drawer.Description>
          <DrawerActions />
        </Drawer.Content>
      </Drawer.Viewport>
    </Drawer.Portal>
  </Drawer>
)

export const standard: StoryType = {
  render: () => <PlacementDrawer placement='right' />,
}

export const left: StoryType = {
  render: () => <PlacementDrawer placement='left' />,
}

export const top: StoryType = {
  render: () => <PlacementDrawer placement='top' />,
}

export const bottom: StoryType = {
  render: () => <PlacementDrawer placement='bottom' />,
}

export const trigger: StoryType = {
  render: () => (
    <Drawer>
      <Drawer.Trigger>Open drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop style={backdrop} />
        <Drawer.Viewport style={viewport}>
          <Drawer.Content style={content('right')}>
            <Drawer.Title>Closed by default</Drawer.Title>
            <Drawer.Description>Only the trigger renders until it is pressed.</Drawer.Description>
            <DrawerActions />
          </Drawer.Content>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer>
  ),
}

export const filtersForm: StoryType = {
  render: () => (
    <Drawer defaultOpen>
      <Drawer.Trigger>Filters</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop style={backdrop} />
        <Drawer.Viewport style={viewport}>
          <Drawer.Content style={content('right')}>
            <Drawer.Title>Filters</Drawer.Title>
            <Drawer.Description>
              Focus moves to the first field on open, and stays trapped inside while the drawer is
              open.
            </Drawer.Description>
            <label style={field}>
              Owner
              <input style={input} name='owner' type='text' />
            </label>
            <label style={field}>
              Updated after
              <input style={input} name='updated' type='date' />
            </label>
            <DrawerActions />
          </Drawer.Content>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer>
  ),
}

export const nested: StoryType = {
  render: () => (
    <Drawer defaultOpen>
      <Drawer.Trigger>Open outer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop style={backdrop} />
        <Drawer.Viewport style={viewport}>
          <Drawer.Content style={content('right')}>
            <Drawer.Title>Outer drawer</Drawer.Title>
            <Drawer.Description>
              Escape and outside presses dismiss the topmost layer only — the stack unwinds one
              layer at a time.
            </Drawer.Description>
            <Drawer placement='bottom'>
              <Drawer.Trigger>Open inner</Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Backdrop style={backdrop} />
                <Drawer.Viewport style={viewport}>
                  <Drawer.Content style={content('bottom')}>
                    <Drawer.Title>Inner drawer</Drawer.Title>
                    <Drawer.Description>
                      While open, everything beneath — including the outer drawer — is inert and
                      hidden from assistive tech.
                    </Drawer.Description>
                    <DrawerActions />
                  </Drawer.Content>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer>
            <DrawerActions />
          </Drawer.Content>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer>
  ),
}
