# SPEC / React / Drawer

The React implementation of the [core spec](../../core/drawer/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/drawer`](https://dunky.dev/ui/components/drawer).

## Install

```sh
npm install @dunky.dev/react-drawer
```

## Usage

```tsx
import { Drawer } from '@dunky.dev/react-drawer'
;<Drawer placement='right'>
  <Drawer.Trigger>Open</Drawer.Trigger>
  <Drawer.Portal>
    <Drawer.Backdrop />
    <Drawer.Viewport>
      <Drawer.Content>
        <Drawer.Title>Title</Drawer.Title>
        <Drawer.Description>Description</Drawer.Description>
        <Drawer.Close>Close</Drawer.Close>
      </Drawer.Content>
    </Drawer.Viewport>
  </Drawer.Portal>
</Drawer>
```

React-specific notes on top of the core contract:

- **`Portal`** teleports the layers to `document.body`, or to a `container`
  you supply. Nothing is kept mounted while closed. When scoped to a
  `container`, the scroll lock applies to that container instead of the page,
  and the backdrop/viewport must be positioned `absolute` (not `fixed`) so the
  overlay pins to the container.
- **`Content`** renders the native `<dialog>` element, always with the `open`
  attribute since it only mounts while the drawer is open. It is shown without
  `showModal()` on purpose: modality, dismissal, and focus stay driven by the
  core contract, consistent across browsers, instead of splitting authority
  with the browser's built-in dialog behavior.
- Everything ships headless — parts carry behavior, ARIA wiring, and the
  styling hooks: `data-state` (`open` / `closed`) on the Trigger and the
  visual layers (Backdrop, Viewport, Content), plus `data-placement`
  (`left` / `right` / `top` / `bottom`) on the visual layers for
  edge-specific styling and slide animations. The panel doesn't slide by
  itself — the consumer keys the transition off those attributes.

## API

### `Drawer`

The root: owns open/close state, renders no DOM. Accepts the core
`DrawerOptions`.

| Prop                     | Type                                     | Default        | Description                                                         |
| ------------------------ | ---------------------------------------- | -------------- | ------------------------------------------------------------------- |
| `open`                   | `boolean`                                | —              | Controlled open state.                                              |
| `defaultOpen`            | `boolean`                                | `false`        | Initial open state for the uncontrolled drawer.                     |
| `onOpenChange`           | `(open: boolean) => void`                | —              | Fired on every open/close transition with the new value.            |
| `placement`              | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'`      | The screen edge the panel is anchored to.                           |
| `closeOnEscape`          | `boolean`                                | `true`         | Whether Escape closes the drawer.                                   |
| `closeOnInteractOutside` | `boolean`                                | `true`         | Whether pressing the backdrop/viewport closes the drawer.           |
| `onEscapeKeyDown`        | `(event) => void`                        | —              | Fired before an Escape dismissal; `preventDefault()` vetoes.        |
| `onInteractOutside`      | `(event?) => void`                       | —              | Fired before an outside-press dismissal; `preventDefault()` vetoes. |
| `id`                     | `string`                                 | auto (`useId`) | Base id for the parts; per-part ids are derived from it.            |
| `children`               | `ReactNode`                              | —              | The drawer's parts.                                                 |

### `Drawer.Trigger`

Opens the drawer; focus returns here on close.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `Drawer.Portal`

Teleports the layers out of the tree while open; unmounts them while closed.

| Prop        | Type                  | Default         | Description                 |
| ----------- | --------------------- | --------------- | --------------------------- |
| `container` | `HTMLElement \| null` | `document.body` | The element to portal into. |
| `children`  | `ReactNode`           | —               | The layers to teleport.     |

### `Drawer.Backdrop`

The layer behind the drawer panel, covering the page.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `Drawer.Viewport`

The positioning layer that anchors the panel to its edge.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `Drawer.Content`

The drawer panel; renders the native `<dialog>`.

| Prop           | Type                             | Default          | Description                                 |
| -------------- | -------------------------------- | ---------------- | ------------------------------------------- |
| `initialFocus` | `RefObject<HTMLElement \| null>` | the drawer panel | The element to focus when the drawer opens. |
| `...props`     | `ComponentProps<'dialog'>`       | —                | Forwarded to the rendered `<dialog>`.       |

### `Drawer.Title`

Names the drawer (wires `aria-labelledby` on Content).

| Prop       | Type                   | Default | Description                       |
| ---------- | ---------------------- | ------- | --------------------------------- |
| `...props` | `ComponentProps<'h2'>` | —       | Forwarded to the rendered `<h2>`. |

### `Drawer.Description`

Describes the drawer (wires `aria-describedby` on Content).

| Prop       | Type                  | Default | Description                      |
| ---------- | --------------------- | ------- | -------------------------------- |
| `...props` | `ComponentProps<'p'>` | —       | Forwarded to the rendered `<p>`. |

### `Drawer.Close`

Dismisses the drawer from inside.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |
