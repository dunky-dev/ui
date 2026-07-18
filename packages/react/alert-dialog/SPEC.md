# SPEC / React / AlertDialog

The React implementation of the [core spec](../../core/alert-dialog/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/alert-dialog`](https://dunky.dev/ui/components/alert-dialog).

## Install

```sh
npm install @dunky.dev/react-alert-dialog
```

## Usage

```tsx
import { AlertDialog } from '@dunky.dev/react-alert-dialog'
;<AlertDialog>
  <AlertDialog.Trigger>Delete</AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Backdrop />
    <AlertDialog.Viewport>
      <AlertDialog.Content>
        <AlertDialog.Title>Delete file?</AlertDialog.Title>
        <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action>Delete</AlertDialog.Action>
      </AlertDialog.Content>
    </AlertDialog.Viewport>
  </AlertDialog.Portal>
</AlertDialog>
```

React-specific notes on top of the core contract:

- **`Portal`** teleports the layers to `document.body`, or to a `container`
  you supply. Nothing is kept mounted while closed. When scoped to a
  `container`, the scroll lock applies to that container instead of the page,
  and the backdrop/viewport must be positioned `absolute` (not `fixed`) so the
  overlay pins to the container (see the dialog's scoped-container guidance —
  the same CSS constraint applies).
- **`Content`** renders the native `<dialog>` element with
  `role="alertdialog"`, always with the `open` attribute since it only mounts
  while the alert dialog is open. It is shown without `showModal()` on
  purpose: modality, dismissal, and focus stay driven by the core contract,
  consistent across browsers.
- **Initial focus** lands on `Cancel` when one is rendered, else on the alert
  dialog window; the `initialFocus` ref on `Content` overrides both.
- Everything ships headless — parts carry behavior, ARIA wiring, and a
  `data-state` attribute (`open` / `closed`); styling is the consumer's.

## API

### `AlertDialog`

The root: owns open/close state, renders no DOM. Accepts the core
`AlertDialogOptions`.

| Prop              | Type                      | Default        | Description                                                      |
| ----------------- | ------------------------- | -------------- | ---------------------------------------------------------------- |
| `open`            | `boolean`                 | —              | Controlled open state; the alert dialog only moves when it does. |
| `defaultOpen`     | `boolean`                 | `false`        | Initial open state for the uncontrolled alert dialog.            |
| `onOpenChange`    | `(open: boolean) => void` | —              | Fired on every open/close intent with the new value.             |
| `onEscapeKeyDown` | `(event) => void`         | —              | Fired before an Escape dismissal; `preventDefault()` vetoes.     |
| `id`              | `string`                  | auto (`useId`) | Base id for the parts; per-part ids are derived from it.         |
| `children`        | `ReactNode`               | —              | The alert dialog's parts.                                        |

### `AlertDialog.Trigger`

Opens the alert dialog; focus returns here on close.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `AlertDialog.Portal`

Teleports the layers out of the tree while open; unmounts them while closed.

| Prop        | Type                  | Default         | Description                 |
| ----------- | --------------------- | --------------- | --------------------------- |
| `container` | `HTMLElement \| null` | `document.body` | The element to portal into. |
| `children`  | `ReactNode`           | —               | The layers to teleport.     |

### `AlertDialog.Backdrop`

The layer behind the alert dialog window; pressing it never dismisses.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `AlertDialog.Viewport`

The positioning + scroll layer around the alert dialog window; pressing it
never dismisses.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `AlertDialog.Content`

The alert dialog window; renders the native `<dialog>` with
`role="alertdialog"`.

| Prop           | Type                             | Default             | Description                                       |
| -------------- | -------------------------------- | ------------------- | ------------------------------------------------- |
| `initialFocus` | `RefObject<HTMLElement \| null>` | the rendered Cancel | The element to focus when the alert dialog opens. |
| `...props`     | `ComponentProps<'dialog'>`       | —                   | Forwarded to the rendered `<dialog>`.             |

### `AlertDialog.Title`

Names the alert dialog (wires `aria-labelledby` on Content).

| Prop       | Type                   | Default | Description                       |
| ---------- | ---------------------- | ------- | --------------------------------- |
| `...props` | `ComponentProps<'h2'>` | —       | Forwarded to the rendered `<h2>`. |

### `AlertDialog.Description`

Describes the alert dialog (wires `aria-describedby` on Content).

| Prop       | Type                  | Default | Description                      |
| ---------- | --------------------- | ------- | -------------------------------- |
| `...props` | `ComponentProps<'p'>` | —       | Forwarded to the rendered `<p>`. |

### `AlertDialog.Cancel`

The least destructive answer: closes the alert dialog and takes initial focus
on open.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `AlertDialog.Action`

The confirming answer: closes the alert dialog; put the confirmed work in its
`onClick`.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |
