---
'@dunky.dev/drawer': minor
'@dunky.dev/react-drawer': minor
---

Add the Drawer primitive — a modal panel that slides in from a screen edge,
semantically a dialog with a placement, shipped as an agnostic core
(`@dunky.dev/drawer`) plus a React binding (`@dunky.dev/react-drawer`).

The dialog contract carries over — focus trap, scroll lock, Escape and
outside-press dismissal (each gateable and vetoable), topmost-layer-first
stacking through the shared layer stack, and the controlled `open` contract:
a controlled drawer reports every open/close intent through `onOpenChange`
but only moves when the prop does, so ignoring a report is a working veto.
`placement` picks the edge the panel is anchored to
(`left | right | top | bottom`, defaulting to `right`).
Placement is pure configuration: it never gates behavior, it rides along as a
`data-placement` styling hook on the visual layers (Backdrop, Viewport,
Content) next to `data-state`, so slide animations key off attributes. A
drawer is always modal in v0 — there is no `modal` or `role` switch; snap
points and swipe gestures are out of scope by decision.

```tsx
import { Drawer } from '@dunky.dev/react-drawer'

function App() {
  return (
    <Drawer placement='right' onOpenChange={console.log}>
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
