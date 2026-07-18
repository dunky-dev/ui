# @dunky.dev/react-drawer

React binding for [`@dunky.dev/drawer`](../../core/drawer): a compound
component — `Drawer` plus its parts — that drives the framework-free drawer
machine. The root owns the machine; parts translate the core's logical
bindings into DOM attributes and handlers, and wire the DOM-only concerns
(portal, focus trap, scroll lock, layer stack).

Behavior contract: [`../../core/drawer/SPEC.md`](../../core/drawer/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-drawer
```

## Usage

```tsx
import { Drawer } from '@dunky.dev/react-drawer'

function BoardSettings() {
  return (
    <Drawer placement='right'>
      <Drawer.Trigger>Settings</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Viewport>
          <Drawer.Content>
            <Drawer.Title>Board settings</Drawer.Title>
            <Drawer.Description>Configure this board.</Drawer.Description>
            <Drawer.Close>Done</Drawer.Close>
          </Drawer.Content>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer>
  )
}
```
