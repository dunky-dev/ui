# SPEC / React / Select

The React implementation of the [core spec](../../core/select/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/select`](https://dunky.dev/ui/components/select).

## Install

```sh
npm install @dunky.dev/react-select
```

## Usage

```tsx
import { Select } from '@dunky.dev/react-select'
;<Select onValueChange={console.log}>
  <Select.Trigger>
    <Select.Value placeholder='Pick a fruit' />
  </Select.Trigger>
  <Select.Listbox>
    <Select.Item value='apple'>
      Apple <Select.ItemIndicator>✓</Select.ItemIndicator>
    </Select.Item>
    <Select.Item value='banana'>
      Banana <Select.ItemIndicator>✓</Select.ItemIndicator>
    </Select.Item>
  </Select.Listbox>
</Select>
```

React-specific notes on top of the core contract:

- **`Listbox`** stays mounted while closed — hidden with the native `hidden`
  attribute and removed from the accessibility tree — so items keep their
  registration and ids stable. There is no portal or positioning: the
  consumer positions the popup relative to the trigger; `data-state`
  (`open` / `closed`) is the styling and animation hook.
- **`Item`** registers itself with the machine on mount, re-registers in
  place when its `label` or `disabled` prop changes (keeping its navigation
  position), and unregisters on unmount, per the core items contract. Its
  typeahead/display label defaults to its string children; pass `label` when
  the children aren't plain text.
- **`Value`** renders the selected item's registered label, or `placeholder`
  while nothing is selected. The label resolves from the registered items, so
  on the very first client render (before items mount) it shows the
  placeholder.
- Everything ships headless — parts carry behavior, ARIA wiring, and data
  attributes (`data-state`, `data-highlighted`, `data-disabled`,
  `data-placeholder`); styling is the consumer's.

## API

### `Select`

The root: owns value + open state, renders no DOM. Accepts the core
`SelectOptions`.

| Prop                | Type                              | Default        | Description                                                     |
| ------------------- | --------------------------------- | -------------- | --------------------------------------------------------------- |
| `value`             | `string \| null`                  | —              | Controlled value; every change is reported via `onValueChange`. |
| `defaultValue`      | `string`                          | —              | Initial value for the uncontrolled select.                      |
| `open`              | `boolean`                         | —              | Controlled open state.                                          |
| `defaultOpen`       | `boolean`                         | `false`        | Initial open state for the uncontrolled select.                 |
| `disabled`          | `boolean`                         | `false`        | Disables the whole select; the listbox can't open.              |
| `loop`              | `boolean`                         | `false`        | Whether arrow-key navigation wraps around the ends.             |
| `onValueChange`     | `(value: string \| null) => void` | —              | Fired on every value change with the new value.                 |
| `onOpenChange`      | `(open: boolean) => void`         | —              | Fired on every open/close transition with the new value.        |
| `onHighlightChange` | `(value: string \| null) => void` | —              | Fired on every highlight move with the highlighted value.       |
| `id`                | `string`                          | auto (`useId`) | Base id for the parts; per-part ids are derived from it.        |
| `children`          | `ReactNode`                       | —              | The select's parts.                                             |

### `Select.Trigger`

The combobox button: shows the choice, opens the list, and keeps keyboard
focus the whole time.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `Select.Value`

Renders the selected item's label, or the placeholder. Carries
`data-placeholder` while nothing is selected.

| Prop          | Type                     | Default | Description                                                                             |
| ------------- | ------------------------ | ------- | --------------------------------------------------------------------------------------- |
| `placeholder` | `ReactNode`              | —       | What to render while nothing is selected.                                               |
| `...props`    | `ComponentProps<'span'>` | —       | Forwarded to the rendered `<span>` (no `children` — the content is the selected label). |

### `Select.Listbox`

The popup list (`role="listbox"`); always mounted, hidden while closed.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `Select.Item`

One option (`role="option"`). Registers itself with the machine; carries
`data-state` (`selected` / `unselected`), `data-highlighted`, and
`data-disabled`.

| Prop       | Type                    | Default                           | Description                                      |
| ---------- | ----------------------- | --------------------------------- | ------------------------------------------------ |
| `value`    | `string`                | —                                 | The option's value. Required, unique per select. |
| `disabled` | `boolean`               | `false`                           | Disables this option: skipped and unselectable.  |
| `label`    | `string`                | string children, else the `value` | The label used for typeahead and `Select.Value`. |
| `...props` | `ComponentProps<'div'>` | —                                 | Forwarded to the rendered `<div>`.               |

### `Select.ItemIndicator`

The selection mark; renders only inside the selected item, hidden from
assistive tech (the selection is announced via `aria-selected`).

| Prop       | Type                     | Default | Description                         |
| ---------- | ------------------------ | ------- | ----------------------------------- |
| `...props` | `ComponentProps<'span'>` | —       | Forwarded to the rendered `<span>`. |
