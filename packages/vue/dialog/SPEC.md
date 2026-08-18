# SPEC / Vue / Dialog

The Vue implementation of the [core spec](../../core/dialog/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/dialog`](https://dunky.dev/ui/components/dialog).

## Install

```sh
npm install @dunky.dev/vue-dialog
```

## Usage

```vue
<script setup lang="ts">
import { Dialog } from '@dunky.dev/vue-dialog'
</script>

<template>
  <Dialog>
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
</template>
```

The parts hang off the root — `<Dialog.Trigger>` resolves through
`<script setup>`'s dot-notation component access, so one import brings the
whole compound.

Vue-specific notes on top of the core contract:

- **Callbacks are emits.** The core's `onOpenChange` is the `update:open`
  emit, so `v-model:open` is the controlled contract's native shape: the
  dialog follows the `open` prop alone and reports real transitions through
  `update:open`. The dismissal callbacks are emits too (`@escape-key-down`,
  `@interact-outside`, `@back-navigation`); their payloads carry
  `preventDefault()`, and listeners run synchronously, so the veto contract
  holds unchanged. Per the controlled contract, a dismissal on a controlled
  dialog emits no `update:open` — decide it at its source, in the dismissal
  emit.
- **`Portal`** teleports the layers to `document.body`, or to a `container`
  you supply. Nothing is kept mounted while closed; an `animated` dialog
  stays mounted through the core contract's `closing` state so its exit can
  play — see the exit-animation note below. When scoped to a
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
- **`Backdrop`** renders nothing when the dialog is non-modal (`:modal="false"`),
  per the core parts contract.
- **Exit animation** (`animated`): style the exit on the parts'
  `data-state="closing"` — a CSS transition or animation on **Content** (the
  element carrying the state, not a descendant) is what signals completion;
  a missing exit style falls back to a short ceiling, and
  `prefers-reduced-motion` skips the wait entirely. The exit is cosmetic:
  focus, the dialog stack, and page interaction release the moment closing
  starts, and the still-painting layer is made `inert` until it unmounts.
  Enter needs no state — the parts mount straight into `data-state="open"`,
  so a CSS animation (or a transition via `@starting-style`) plays from
  mount.
- **Back navigation** (`closeOnBack`): opening plants a guard entry in the
  session history, so the browser's Back closes the dialog instead of leaving
  the page — one layer per press in a nested stack, per the core contract. A
  dialog closed any other way consumes its entry, leaving nothing to swallow
  a later Back; an entry buried under in-app navigation while the dialog is
  open is left alone (Back then both navigates and closes the dialog).
- Everything ships headless, per the core contract's
  [Internals](../../core/dialog/SPEC.md#internals).

## API

### `Dialog`

The root: owns open/close state, renders no DOM. Accepts the core
`DialogOptions` as props; the core callbacks are emits.

| Prop                     | Type                        | Default                                   | Description                                                                                                                            |
| ------------------------ | --------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `open`                   | `boolean`                   | —                                         | Controlled open state (`v-model:open`) — the dialog follows it alone. Back to `undefined` hands the state over, uncontrolled in place. |
| `defaultOpen`            | `boolean`                   | `false`                                   | Initial open state for the uncontrolled dialog.                                                                                        |
| `modal`                  | `boolean`                   | `true`                                    | `aria-modal`, focus trap, scroll lock, backdrop.                                                                                       |
| `role`                   | `'dialog' \| 'alertdialog'` | `'dialog'`                                | The ARIA pattern.                                                                                                                      |
| `closeOnEscape`          | `boolean`                   | `true`                                    | Whether Escape closes the dialog.                                                                                                      |
| `escapeScope`            | `'layer' \| 'stack'`        | `'layer'`                                 | How far an allowed Escape reaches: this dialog, or its whole stack.                                                                    |
| `closeOnInteractOutside` | `boolean`                   | `true` — `false` for `role="alertdialog"` | Whether pressing the backdrop/viewport closes the dialog.                                                                              |
| `animated`               | `boolean`                   | `false`                                   | Keeps the dialog mounted through `data-state="closing"` while its exit animation plays.                                                |
| `closeOnBack`            | `boolean`                   | `false`                                   | The browser's Back closes the open dialog instead of navigating (a guard entry in the session history).                                |
| `id`                     | `string`                    | auto (`useId`)                            | Base id for the parts; per-part ids are derived from it.                                                                               |

| Emit              | Payload                  | Description                                                               |
| ----------------- | ------------------------ | ------------------------------------------------------------------------- |
| `update:open`     | `open: boolean`          | Fired on every open/close transition with the new value (`v-model:open`). |
| `escapeKeyDown`   | `event: KeyboardEvent`   | Fired before an Escape dismissal; `preventDefault()` vetoes.              |
| `interactOutside` | `event?: PointerPayload` | Fired before an outside-press dismissal; `preventDefault()` vetoes.       |
| `backNavigation`  | `event?`                 | Fired before a back-navigation dismissal; `preventDefault()` vetoes.      |

### `Dialog.Trigger`

Opens the dialog; focus returns here on close.

| Prop       | Type                  | Default | Description                           |
| ---------- | --------------------- | ------- | ------------------------------------- |
| `...attrs` | `<button>` attributes | —       | Forwarded to the rendered `<button>`. |

### `Dialog.Portal`

Teleports the layers out of the tree while open; unmounts them while closed.

| Prop        | Type                  | Default         | Description                 |
| ----------- | --------------------- | --------------- | --------------------------- |
| `container` | `HTMLElement \| null` | `document.body` | The element to portal into. |

### `Dialog.Backdrop`

The layer behind the dialog window; renders nothing when `:modal="false"`.

| Prop       | Type               | Default | Description                        |
| ---------- | ------------------ | ------- | ---------------------------------- |
| `...attrs` | `<div>` attributes | —       | Forwarded to the rendered `<div>`. |

### `Dialog.Viewport`

The positioning + scroll layer around the dialog window.

| Prop       | Type               | Default | Description                        |
| ---------- | ------------------ | ------- | ---------------------------------- |
| `...attrs` | `<div>` attributes | —       | Forwarded to the rendered `<div>`. |

### `Dialog.Content`

The dialog window; renders the native `<dialog>`.

| Prop           | Type                                    | Default           | Description                                                                                                           |
| -------------- | --------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `initialFocus` | `MaybeRefOrGetter<HTMLElement \| null>` | the dialog window | The element to focus when the dialog opens. A ref or getter is read at open time, so late-filling template refs work. |
| `...attrs`     | `<dialog>` attributes                   | —                 | Forwarded to the rendered `<dialog>`.                                                                                 |

### `Dialog.Title`

Names the dialog (wires `aria-labelledby` on Content).

| Prop       | Type              | Default | Description                       |
| ---------- | ----------------- | ------- | --------------------------------- |
| `...attrs` | `<h2>` attributes | —       | Forwarded to the rendered `<h2>`. |

### `Dialog.Description`

Describes the dialog (wires `aria-describedby` on Content).

| Prop       | Type               | Default | Description                        |
| ---------- | ------------------ | ------- | ---------------------------------- |
| `...attrs` | `<div>` attributes | —       | Forwarded to the rendered `<div>`. |

### `Dialog.Close`

Dismisses the dialog from inside — the single dismissal affordance (the
corner `×`), rendered once per dialog and kept the focus cycle's last stop per
the core contract. Action buttons (Cancel/Confirm) are your own `<button>`s
driving state, so they keep their natural Tab order.

| Prop       | Type                  | Default   | Description                                                    |
| ---------- | --------------------- | --------- | -------------------------------------------------------------- |
| `scope`    | `'layer' \| 'stack'`  | `'layer'` | Dismiss just its own dialog, or unwind the whole nested stack. |
| `...attrs` | `<button>` attributes | —         | Forwarded to the rendered `<button>`.                          |
