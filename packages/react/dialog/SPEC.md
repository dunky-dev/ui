# SPEC / React / Dialog

The React implementation of the [core spec](../../core/dialog/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/dialog`](https://dunky.dev/ui/components/dialog).

## Install

```sh
npm install @dunky.dev/react-dialog
```

## Usage

```tsx
import { Dialog } from '@dunky.dev/react-dialog'
;<Dialog>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Viewport>
      <Dialog.Content>
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Description>Description</Dialog.Description>
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
```

React-specific notes on top of the core contract:

- **`Portal`** teleports the layers to `document.body`, or to a `container`
  you supply. Nothing is kept mounted while closed. When scoped to a
  `container`, the scroll lock applies to that container instead of the page,
  and the backdrop/viewport must be positioned `absolute` (not `fixed`) so the
  overlay pins to the container. Because an `absolute` overlay can't stay fixed
  inside a scrolling element, a scoped container that needs a scrollable
  background should be a non-scrolling positioned boundary wrapping an inner
  scroller — portal into the boundary; the overlay fills its visible box and
  the backdrop blocks the scroller behind it (see the `scoped` story).
- **`Content`** renders the native `<dialog>` element, always with the `open`
  attribute since it only mounts while the dialog is open. It is shown without
  `showModal()` on purpose: modality, dismissal, and focus stay driven by the
  core contract, consistent across browsers, instead of splitting authority
  with the browser's built-in dialog behavior.
- **`Backdrop`** renders nothing when the dialog is non-modal (`modal={false}`),
  per the core parts contract.
- Everything ships headless — parts carry behavior, ARIA wiring, and a
  `data-state` attribute (`open` / `closed`); styling is the consumer's.

## API

### `Dialog`

The root: owns open/close state, renders no DOM. Accepts the core
`DialogOptions`.

| Prop                     | Type                        | Default                                   | Description                                                                                                           |
| ------------------------ | --------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `open`                   | `boolean`                   | —                                         | Controlled open state — the dialog follows it alone. Back to `undefined` hands the state over, uncontrolled in place. |
| `defaultOpen`            | `boolean`                   | `false`                                   | Initial open state for the uncontrolled dialog.                                                                       |
| `onOpenChange`           | `(open: boolean) => void`   | —                                         | Fired on every open/close transition with the new value.                                                              |
| `modal`                  | `boolean`                   | `true`                                    | `aria-modal`, focus trap, scroll lock, backdrop.                                                                      |
| `role`                   | `'dialog' \| 'alertdialog'` | `'dialog'`                                | The ARIA pattern.                                                                                                     |
| `closeOnEscape`          | `boolean`                   | `true`                                    | Whether Escape closes the dialog.                                                                                     |
| `escapeScope`            | `'layer' \| 'stack'`        | `'layer'`                                 | How far an allowed Escape reaches: this dialog, or its whole stack.                                                   |
| `closeOnInteractOutside` | `boolean`                   | `true` — `false` for `role="alertdialog"` | Whether pressing the backdrop/viewport closes the dialog.                                                             |
| `onEscapeKeyDown`        | `(event) => void`           | —                                         | Fired before an Escape dismissal; `preventDefault()` vetoes.                                                          |
| `onInteractOutside`      | `(event?) => void`          | —                                         | Fired before an outside-press dismissal; `preventDefault()` vetoes.                                                   |
| `id`                     | `string`                    | auto (`useId`)                            | Base id for the parts; per-part ids are derived from it.                                                              |
| `children`               | `ReactNode`                 | —                                         | The dialog's parts.                                                                                                   |

### `Dialog.Trigger`

Opens the dialog; focus returns here on close.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `Dialog.Portal`

Teleports the layers out of the tree while open; unmounts them while closed.

| Prop        | Type                  | Default         | Description                 |
| ----------- | --------------------- | --------------- | --------------------------- |
| `container` | `HTMLElement \| null` | `document.body` | The element to portal into. |
| `children`  | `ReactNode`           | —               | The layers to teleport.     |

### `Dialog.Backdrop`

The layer behind the dialog window; renders nothing when `modal={false}`.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `Dialog.Viewport`

The positioning + scroll layer around the dialog window.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `Dialog.Content`

The dialog window; renders the native `<dialog>`.

| Prop           | Type                             | Default           | Description                                 |
| -------------- | -------------------------------- | ----------------- | ------------------------------------------- |
| `initialFocus` | `RefObject<HTMLElement \| null>` | the dialog window | The element to focus when the dialog opens. |
| `...props`     | `ComponentProps<'dialog'>`       | —                 | Forwarded to the rendered `<dialog>`.       |

### `Dialog.Title`

Names the dialog (wires `aria-labelledby` on Content).

| Prop       | Type                   | Default | Description                       |
| ---------- | ---------------------- | ------- | --------------------------------- |
| `...props` | `ComponentProps<'h2'>` | —       | Forwarded to the rendered `<h2>`. |

### `Dialog.Description`

Describes the dialog (wires `aria-describedby` on Content).

| Prop       | Type                  | Default | Description                      |
| ---------- | --------------------- | ------- | -------------------------------- |
| `...props` | `ComponentProps<'p'>` | —       | Forwarded to the rendered `<p>`. |

### `Dialog.Close`

Dismisses the dialog from inside.

| Prop       | Type                       | Default   | Description                                                    |
| ---------- | -------------------------- | --------- | -------------------------------------------------------------- |
| `scope`    | `'layer' \| 'stack'`       | `'layer'` | Dismiss just its own dialog, or unwind the whole nested stack. |
| `...props` | `ComponentProps<'button'>` | —         | Forwarded to the rendered `<button>`.                          |
