# SPEC / React / Collapsible

The React implementation of the [core spec](../../core/collapsible/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/collapsible`](https://dunky.dev/ui/components/collapsible).

## Install

```sh
npm install @dunky.dev/react-collapsible
```

## Usage

```tsx
import { Collapsible } from '@dunky.dev/react-collapsible'
;<Collapsible>
  <Collapsible.Trigger>Show more</Collapsible.Trigger>
  <Collapsible.Content>Content</Collapsible.Content>
</Collapsible>
```

React-specific notes on top of the core contract:

- **`Content`** stays mounted while closed, per the core contract; the web
  realization of the core's logical "hidden" is the native `hidden` attribute
  (alongside `aria-hidden` from the shared bindings translation).
- Everything ships headless — parts carry behavior, ARIA wiring, and
  `data-state` (`open` / `closed`) / `data-disabled` attributes; styling is
  the consumer's.

## API

### `Collapsible`

The root: owns open/close state, renders no DOM. Accepts the core
`CollapsibleOptions`.

| Prop           | Type                      | Default        | Description                                              |
| -------------- | ------------------------- | -------------- | -------------------------------------------------------- |
| `open`         | `boolean`                 | —              | Controlled open state (follow + report, per core spec).  |
| `defaultOpen`  | `boolean`                 | `false`        | Initial open state for the uncontrolled collapsible.     |
| `onOpenChange` | `(open: boolean) => void` | —              | Fired on every open/close transition with the new value. |
| `disabled`     | `boolean`                 | `false`        | Blocks user toggling; parts carry `data-disabled`.       |
| `id`           | `string`                  | auto (`useId`) | Base id for the parts; the content id is derived.        |
| `children`     | `ReactNode`               | —              | The collapsible's parts.                                 |

### `Collapsible.Trigger`

Toggles the content; carries `aria-expanded` and `aria-controls`.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `Collapsible.Content`

The disclosed region; hidden while closed, never unmounted.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |
