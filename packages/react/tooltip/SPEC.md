# SPEC / React / Tooltip

The React implementation of the [core spec](../../core/tooltip/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/tooltip`](https://dunky.dev/ui/components/tooltip).

## Install

```sh
npm install @dunky.dev/react-tooltip
```

## Usage

```tsx
import { Tooltip } from '@dunky.dev/react-tooltip'
;<Tooltip>
  <Tooltip.Trigger>Save</Tooltip.Trigger>
  <Tooltip.Portal>
    <Tooltip.Content>Save the board (⌘S)</Tooltip.Content>
  </Tooltip.Portal>
</Tooltip>
```

React-specific notes on top of the core contract:

- **`Portal`** teleports the content to `document.body`, or to a `container`
  you supply, and keeps nothing mounted while the tooltip is hidden. It stays
  mounted through the `closing` state, so a fade-out keyed on
  `data-state="closing"` has time to play. Skipping the Portal is fine too —
  the content then stays in the tree in every state and CSS on `data-state`
  owns its visibility.
- **Positioning is the consumer's** (out of scope in v0, per the core
  constraints): place the content relative to the trigger with your own CSS or
  positioning library.
- Everything ships headless — parts carry behavior, ARIA wiring, and a
  `data-state` attribute (`closed` / `opening` / `open` / `closing`); styling
  is the consumer's.

## API

### `Tooltip`

The root: owns the open lifecycle, renders no DOM. Accepts the core
`TooltipOptions`.

| Prop           | Type                      | Default        | Description                                                       |
| -------------- | ------------------------- | -------------- | ----------------------------------------------------------------- |
| `open`         | `boolean`                 | —              | Controlled open state.                                            |
| `defaultOpen`  | `boolean`                 | `false`        | Initial open state for the uncontrolled tooltip.                  |
| `onOpenChange` | `(open: boolean) => void` | —              | Fired on every show/hide with the new value.                      |
| `openDelay`    | `number`                  | `700`          | Milliseconds the pointer must rest on the trigger before showing. |
| `closeDelay`   | `number`                  | `300`          | Milliseconds the tooltip lingers after the pointer leaves.        |
| `id`           | `string`                  | auto (`useId`) | Base id for the parts; the content id is derived from it.         |
| `children`     | `ReactNode`               | —              | The tooltip's parts.                                              |

### `Tooltip.Trigger`

The element the tooltip describes; hover and focus open it, per the core
behavior.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `Tooltip.Portal`

Teleports the content out of the tree while shown; unmounts it while hidden.

| Prop        | Type                  | Default         | Description                 |
| ----------- | --------------------- | --------------- | --------------------------- |
| `container` | `HTMLElement \| null` | `document.body` | The element to portal into. |
| `children`  | `ReactNode`           | —               | The content to teleport.    |

### `Tooltip.Content`

The tooltip popup (`role="tooltip"`); hovering it keeps the tooltip open.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |
