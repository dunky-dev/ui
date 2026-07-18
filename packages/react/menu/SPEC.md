# SPEC / React / Menu

The React implementation of the [core spec](../../core/menu/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/menu`](https://dunky.dev/ui/components/menu).

## Install

```sh
npm install @dunky.dev/react-menu
```

## Usage

```tsx
import { Menu } from '@dunky.dev/react-menu'
;<Menu>
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
```

React-specific notes on top of the core contract:

- **`Portal`** teleports the content to `document.body`, or to a `container`
  you supply. Nothing is kept mounted while closed.
- **`Content`** renders a `<div role="menu">` that holds real DOM focus while
  open (`tabIndex={-1}`); the highlighted item is exposed through
  `aria-activedescendant`, per the core focus model. There is no positioning
  engine — anchoring the content next to the trigger is the consumer's
  concern.
- **`Item`** renders a `<div role="menuitem">`. Its typeahead label comes from
  `textValue` when given, otherwise from the rendered text content.
- **`Group` / `GroupLabel`** wire `role="group"` and its `aria-labelledby`
  automatically — the group id is minted internally and the reference follows
  the rendered label.
- Everything ships headless — parts carry behavior, ARIA wiring, and the
  styling hooks: `data-state` (`open` / `closed`) on Trigger and Content,
  `data-highlighted` / `data-disabled` on items.

## API

### `Menu`

The root: owns open/close state and the highlight, renders no DOM. Accepts the
core `MenuOptions`.

| Prop                | Type                      | Default        | Description                                                               |
| ------------------- | ------------------------- | -------------- | ------------------------------------------------------------------------- |
| `open`              | `boolean`                 | —              | Controlled open state; the menu then moves only when this prop does.      |
| `defaultOpen`       | `boolean`                 | `false`        | Initial open state for the uncontrolled menu.                             |
| `onOpenChange`      | `(open: boolean) => void` | —              | Fired with every open/close intent. Controlled, ignoring it is the veto.  |
| `onEscapeKeyDown`   | `(event) => void`         | —              | Fired before an Escape dismissal; `preventDefault()` vetoes.              |
| `onInteractOutside` | `(event?) => void`        | —              | Fired before an outside-interaction dismissal; `preventDefault()` vetoes. |
| `id`                | `string`                  | auto (`useId`) | Base id for the parts; per-part ids are derived from it.                  |
| `children`          | `ReactNode`               | —              | The menu's parts.                                                         |

### `Menu.Trigger`

The button that opens the menu; focus returns here on close.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `Menu.Portal`

Teleports the content out of the tree while open; unmounts it while closed.

| Prop        | Type                  | Default         | Description                 |
| ----------- | --------------------- | --------------- | --------------------------- |
| `container` | `HTMLElement \| null` | `document.body` | The element to portal into. |
| `children`  | `ReactNode`           | —               | The content to teleport.    |

### `Menu.Content`

The menu surface; holds DOM focus while open.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `Menu.Item`

One action. Activating it fires `onSelect`, then the menu closes.

| Prop        | Type                    | Default           | Description                                                                                                                                                                        |
| ----------- | ----------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`     | `string`                | —                 | Required. Unique, id-safe identity of the item within the menu.                                                                                                                    |
| `disabled`  | `boolean`               | `false`           | Perceivable but never highlighted or activated.                                                                                                                                    |
| `textValue` | `string`                | the rendered text | The typeahead label. Pass it when the content isn't plain text or the text changes at runtime — the fallback is read from the DOM only when `value`/`textValue`/`disabled` change. |
| `onSelect`  | `() => void`            | —                 | Fired when the item is activated (press, or Enter/Space highlighted).                                                                                                              |
| `...props`  | `ComponentProps<'div'>` | —                 | Forwarded to the rendered `<div>`.                                                                                                                                                 |

### `Menu.Group`

Groups related items; labelled by its rendered `GroupLabel`.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `Menu.GroupLabel`

Names its enclosing `Group`.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `Menu.Separator`

Divides sets of items.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |
