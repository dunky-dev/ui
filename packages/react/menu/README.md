# @dunky.dev/react-menu

React binding for [`@dunky.dev/menu`](../../core/menu): a compound component —
`Menu` plus its parts — that drives the framework-free menu machine. The root
owns the machine; parts translate the core's logical bindings into DOM
attributes and handlers, and wire the DOM-only concerns (portal, focus,
outside-interaction detection, layer stack).

Behavior contract: [`../../core/menu/SPEC.md`](../../core/menu/SPEC.md).
React-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/react-menu
```

## Usage

```tsx
import { Menu } from '@dunky.dev/react-menu'

function BoardActions() {
  return (
    <Menu>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Portal>
        <Menu.Content>
          <Menu.Item value='rename' onSelect={rename}>
            Rename
          </Menu.Item>
          <Menu.Item value='duplicate' onSelect={duplicate}>
            Duplicate
          </Menu.Item>
          <Menu.Separator />
          <Menu.Group>
            <Menu.GroupLabel>Danger zone</Menu.GroupLabel>
            <Menu.Item value='delete' onSelect={remove}>
              Delete
            </Menu.Item>
          </Menu.Group>
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  )
}
```
