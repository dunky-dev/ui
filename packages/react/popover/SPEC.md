# SPEC / React / Popover

The React implementation of the [core spec](../../core/popover/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/popover`](https://dunky.dev/ui/components/popover).

## Install

```sh
npm install @dunky.dev/react-popover
```

## Usage

```tsx
import { Popover } from '@dunky.dev/react-popover'
;<Popover>
  <Popover.Trigger>Filters</Popover.Trigger>
  <Popover.Portal>
    <Popover.Content>
      <Popover.Title>Filters</Popover.Title>
      <Popover.Description>Narrow down the results.</Popover.Description>
      <Popover.Close>Close</Popover.Close>
    </Popover.Content>
  </Popover.Portal>
</Popover>
```

React-specific notes on top of the core contract:

- **`Portal`** teleports the panel to `document.body`, or to a `container` you
  supply. Nothing is kept mounted while closed.
- **`Content`** renders a plain `<div>` carrying `role="dialog"` — the panel
  is positioned by the consumer (no engine, no anchor/arrow in v0), typically
  absolutely against the trigger.
- Everything ships headless — parts carry behavior and ARIA wiring, and the
  Trigger and Content carry a `data-state` attribute (`open` / `closed`);
  styling and positioning are the consumer's.

## API

### `Popover`

The root: owns open/close state, renders no DOM. Accepts the core
`PopoverOptions`.

| Prop                     | Type                      | Default        | Description                                                               |
| ------------------------ | ------------------------- | -------------- | ------------------------------------------------------------------------- |
| `open`                   | `boolean`                 | —              | Controlled open state.                                                    |
| `defaultOpen`            | `boolean`                 | `false`        | Initial open state for the uncontrolled popover.                          |
| `onOpenChange`           | `(open: boolean) => void` | —              | Fired on every open/close transition with the new value.                  |
| `modal`                  | `boolean`                 | `false`        | `aria-modal`, focus trap, and hiding the outside from assistive tech.     |
| `closeOnEscape`          | `boolean`                 | `true`         | Whether Escape closes the popover.                                        |
| `closeOnInteractOutside` | `boolean`                 | `true`         | Whether an interaction outside the panel closes the popover.              |
| `onEscapeKeyDown`        | `(event) => void`         | —              | Fired before an Escape dismissal; `preventDefault()` vetoes.              |
| `onInteractOutside`      | `(event?) => void`        | —              | Fired before an outside-interaction dismissal; `preventDefault()` vetoes. |
| `id`                     | `string`                  | auto (`useId`) | Base id for the parts; per-part ids are derived from it.                  |
| `children`               | `ReactNode`               | —              | The popover's parts.                                                      |

### `Popover.Trigger`

Toggles the popover; focus returns here on close.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `Popover.Portal`

Teleports the panel out of the tree while open; unmounts it while closed.

| Prop        | Type                  | Default         | Description                 |
| ----------- | --------------------- | --------------- | --------------------------- |
| `container` | `HTMLElement \| null` | `document.body` | The element to portal into. |
| `children`  | `ReactNode`           | —               | The panel to teleport.      |

### `Popover.Content`

The floating panel; renders a `<div>` with `role="dialog"`.

| Prop           | Type                             | Default                                     | Description                                  |
| -------------- | -------------------------------- | ------------------------------------------- | -------------------------------------------- |
| `initialFocus` | `RefObject<HTMLElement \| null>` | the panel's first focusable, else the panel | The element to focus when the popover opens. |
| `...props`     | `ComponentProps<'div'>`          | —                                           | Forwarded to the rendered `<div>`.           |

### `Popover.Title`

Names the popover (wires `aria-labelledby` on Content).

| Prop       | Type                   | Default | Description                       |
| ---------- | ---------------------- | ------- | --------------------------------- |
| `...props` | `ComponentProps<'h2'>` | —       | Forwarded to the rendered `<h2>`. |

### `Popover.Description`

Describes the popover (wires `aria-describedby` on Content).

| Prop       | Type                  | Default | Description                      |
| ---------- | --------------------- | ------- | -------------------------------- |
| `...props` | `ComponentProps<'p'>` | —       | Forwarded to the rendered `<p>`. |

### `Popover.Close`

Dismisses the popover from inside.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |
