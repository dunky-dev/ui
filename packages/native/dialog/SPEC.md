# SPEC / Native / Dialog

The React Native implementation of the [core spec](../../core/dialog/SPEC.md).

## Install

```sh
npm install @dunky.dev/native-dialog
```

## Usage

```tsx
import { Dialog } from '@dunky.dev/native-dialog'
;<Dialog>
  <Dialog.Trigger>
    <Text>Open</Text>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Viewport>
      <Dialog.Content>
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Description>Description</Dialog.Description>
        <Dialog.Close>
          <Text>Close</Text>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
```

Native-specific notes on top of the core contract:

- **`Portal` renders a React Native `Modal`** — the host's way to layer above
  the app. The `Modal` supplies presentation only (layering, blocking the
  view behind, accessibility containment); every decision still flows through
  the core machine. Nothing is kept mounted while closed.
- **Hardware Back is the host's back navigation.** The `Modal`'s
  `onRequestClose` (Android's back button/gesture; Escape under
  react-native-web) reports through the core `closeOnBack` contract:
  `onBackNavigation` fires first and can veto, the machine gates on
  `closeOnBack` (off by default), and a controlled dialog only records the
  intent.
- **Outside press** is a press on the Backdrop. The Viewport defaults to
  `pointerEvents="box-none"`, so a press on the empty area around the window
  falls through to the Backdrop behind it — same net contract as the web's
  viewport-press. Presses inside the Content never fall through.
- **No exit-animation window.** React Native has no `transitionend`; the
  substrate reports the exit visual as finished immediately, so an `animated`
  dialog passes through `closing` in the same frame. Entry/exit visuals
  belong to the consumer (e.g. the `animationType` prop on Portal).
- **Focus and scroll are the host's.** Touch platforms have no Tab cycle to
  trap and the `Modal` already blocks interaction and scroll behind itself;
  the binding adds neither. `accessibilityViewIsModal` carries the modal
  containment to assistive tech on iOS.

## API

### Dialog

The root. Owns the machine; renders no view of its own. Accepts every core
option as a prop.

| Prop                     | Type                        | Default    | Description                                              |
| ------------------------ | --------------------------- | ---------- | -------------------------------------------------------- |
| `open`                   | `boolean`                   | —          | Controlled open state; omit for uncontrolled.            |
| `defaultOpen`            | `boolean`                   | `false`    | Uncontrolled initial state.                              |
| `onOpenChange`           | `(open: boolean) => void`   | —          | Reports actual open ⇄ close changes.                     |
| `role`                   | `'dialog' \| 'alertdialog'` | `'dialog'` | The dialog flavor (see core spec for alert defaults).    |
| `modal`                  | `boolean`                   | `true`     | Modality; carried to assistive tech.                     |
| `closeOnEscape`          | `boolean`                   | `true`     | Kept for cross-substrate parity; no Escape key on touch. |
| `closeOnInteractOutside` | `boolean`                   | varies     | Whether a Backdrop press dismisses.                      |
| `closeOnBack`            | `boolean`                   | `false`    | Whether the hardware Back press dismisses.               |
| `onInteractOutside`      | `(event?) => void`          | —          | Outside-press report; `preventDefault()` vetoes.         |
| `onBackNavigation`       | `(event) => void`           | —          | Back report; `preventDefault()` vetoes.                  |
| `animated`               | `boolean`                   | `false`    | Core exit window; completes immediately on native.       |
| `id`                     | `string`                    | generated  | Base id the part ids derive from.                        |
| `children`               | `ReactNode`                 | —          | Parts.                                                   |

### Dialog.Trigger

A `Pressable` that toggles the dialog.

| Prop       | Type             | Default | Description               |
| ---------- | ---------------- | ------- | ------------------------- |
| `...props` | `PressableProps` | —       | Merged over the bindings. |

### Dialog.Portal

Renders the React Native `Modal` while the dialog is mounted; `null` when
closed.

| Prop            | Type                          | Default  | Description                                    |
| --------------- | ----------------------------- | -------- | ---------------------------------------------- |
| `animationType` | `'none' \| 'slide' \| 'fade'` | `'none'` | The `Modal`'s own entry animation.             |
| `children`      | `ReactNode`                   | —        | The layer parts (Backdrop, Viewport, Content). |

### Dialog.Backdrop

A `Pressable` behind the window; pressing it is the outside interaction.
Only rendered while modal.

| Prop       | Type             | Default | Description               |
| ---------- | ---------------- | ------- | ------------------------- |
| `...props` | `PressableProps` | —       | Merged over the bindings. |

### Dialog.Viewport

A layout `View` around the window. Defaults to `pointerEvents="box-none"` so
presses on the empty area reach the Backdrop.

| Prop       | Type        | Default | Description               |
| ---------- | ----------- | ------- | ------------------------- |
| `...props` | `ViewProps` | —       | Merged over the bindings. |

### Dialog.Content

The dialog window: a `View` carrying the dialog role, labels, and modal
containment for assistive tech.

| Prop       | Type        | Default | Description               |
| ---------- | ----------- | ------- | ------------------------- |
| `...props` | `ViewProps` | —       | Merged over the bindings. |

### Dialog.Title / Dialog.Description

`Text` parts that name and describe the window; their presence drives the
content's labels per the core contract.

| Prop       | Type        | Default | Description               |
| ---------- | ----------- | ------- | ------------------------- |
| `...props` | `TextProps` | —       | Merged over the bindings. |

### Dialog.Close

A `Pressable` that dismisses from inside.

| Prop       | Type             | Default | Description               |
| ---------- | ---------------- | ------- | ------------------------- |
| `...props` | `PressableProps` | —       | Merged over the bindings. |
