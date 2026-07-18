# SPEC / React / Radio

The React implementation of the [core spec](../../core/radio/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/radio`](https://dunky.dev/ui/components/radio).

## Install

```sh
npm install @dunky.dev/react-radio
```

## Usage

```tsx
import { Radio } from '@dunky.dev/react-radio'
;<Radio defaultValue='comfortable'>
  <Radio.Group aria-label='Density'>
    <Radio.Item value='compact'>
      <Radio.ItemIndicator />
    </Radio.Item>
    <Radio.ItemLabel value='compact'>Compact</Radio.ItemLabel>
    <Radio.Item value='comfortable'>
      <Radio.ItemIndicator />
    </Radio.Item>
    <Radio.ItemLabel value='comfortable'>Comfortable</Radio.ItemLabel>
  </Radio.Group>
</Radio>
```

React-specific notes on top of the core contract:

- **`Item`** renders a `<button type="button">` with `role="radio"` — not a
  native `<input type="radio">` — so the checked state, roving tabindex, and
  disabled gating stay driven by the core machine, consistent across
  substrates. Disabled items carry `aria-disabled` and leave the tab order
  instead of taking the native `disabled` attribute, staying perceivable to
  assistive tech.
- **`ItemIndicator`** must be rendered inside its `Item` (it reads the item's
  context) and renders nothing while the item is unchecked, per the core
  presence contract.
- **`ItemLabel`** associates by `value`, so it can sit anywhere under the
  root — next to its item, not inside it.
- Everything ships headless — parts carry behavior, ARIA wiring, and a
  `data-state` attribute (`checked` / `unchecked`) plus `data-disabled`;
  styling is the consumer's.

## API

### `Radio`

The root: owns the checked value, renders no DOM. Accepts the core
`RadioOptions`.

| Prop            | Type                              | Default        | Description                                                            |
| --------------- | --------------------------------- | -------------- | ---------------------------------------------------------------------- |
| `value`         | `string \| null`                  | —              | Controlled checked value; `null` means no selection.                   |
| `defaultValue`  | `string \| null`                  | `null`         | Initial checked value for the uncontrolled group.                      |
| `onValueChange` | `(value: string \| null) => void` | —              | Fired on every value change with the new value.                        |
| `disabled`      | `boolean`                         | `false`        | Disables the whole group: no selection, no tabbable item.              |
| `orientation`   | `'horizontal' \| 'vertical'`      | —              | Layout hint (`aria-orientation`); all four arrow keys work regardless. |
| `id`            | `string`                          | auto (`useId`) | Base id for the parts; per-item ids are derived from it.               |
| `children`      | `ReactNode`                       | —              | The radio group's parts.                                               |

### `Radio.Group`

The radio group surface (`role="radiogroup"`). Needs an accessible name from
the consumer (`aria-label` or `aria-labelledby`).

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `Radio.Item`

One option (`role="radio"`); selects on press, participates in the roving
tabindex.

| Prop       | Type                       | Default | Description                                          |
| ---------- | -------------------------- | ------- | ---------------------------------------------------- |
| `value`    | `string`                   | —       | The value this item represents. Required, unique.    |
| `disabled` | `boolean`                  | `false` | Disables just this item; navigation skips it.        |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>` (sans `value`). |

### `Radio.ItemIndicator`

The visual checked mark; renders only while its item is checked. Must be
rendered inside a `Radio.Item`.

| Prop       | Type                     | Default | Description                         |
| ---------- | ------------------------ | ------- | ----------------------------------- |
| `...props` | `ComponentProps<'span'>` | —       | Forwarded to the rendered `<span>`. |

### `Radio.ItemLabel`

Names its item (wires `aria-labelledby` on the item); pressing it selects and
focuses the item.

| Prop       | Type                     | Default | Description                         |
| ---------- | ------------------------ | ------- | ----------------------------------- |
| `value`    | `string`                 | —       | The value of the item this labels.  |
| `...props` | `ComponentProps<'span'>` | —       | Forwarded to the rendered `<span>`. |
