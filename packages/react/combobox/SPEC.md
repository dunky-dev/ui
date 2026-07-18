# SPEC / React / Combobox

The React implementation of the [core spec](../../core/combobox/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/combobox`](https://dunky.dev/ui/components/combobox).

## Install

```sh
npm install @dunky.dev/react-combobox
```

## Usage

```tsx
import { useState } from 'react'
import { Combobox } from '@dunky.dev/react-combobox'

const fruits = ['Apple', 'Banana', 'Cherry']

function FruitPicker() {
  // Filtering is the consumer's: render the Items that match the input text.
  const [query, setQuery] = useState('')
  const matches = fruits.filter(fruit => fruit.toLowerCase().includes(query.toLowerCase()))
  return (
    <Combobox inputValue={query} onInputValueChange={setQuery}>
      <Combobox.Input aria-label='Fruit' />
      <Combobox.Trigger aria-label='Show fruits'>v</Combobox.Trigger>
      <Combobox.Listbox>
        {matches.map(fruit => (
          <Combobox.Item key={fruit} value={fruit.toLowerCase()} label={fruit}>
            {fruit} <Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
          </Combobox.Item>
        ))}
      </Combobox.Listbox>
    </Combobox>
  )
}
```

React-specific notes on top of the core contract:

- **`Input`** renders a controlled `<input>` whose text the machine owns —
  edits flow back as machine events. A disabled combobox renders the native
  `disabled` attribute (on top of `aria-disabled`) so the text really is
  uneditable.
- **`Trigger`** renders with `tabIndex={-1}` and hands focus to the input on
  press, per the APG editable-combobox pattern — the input is the one tab
  stop.
- **`Listbox`** stays mounted while closed — hidden with the native `hidden`
  attribute and removed from the accessibility tree — so items keep their
  registration and ids stable. While open it registers with the shared
  overlay layer stack. There is no portal or positioning: the consumer
  positions the popup relative to the input; `data-state` (`open` /
  `closed`) is the styling and animation hook.
- **`Item`** registers itself with the machine — reporting its position among
  the rendered options after every render, so navigation order survives
  filter-driven unmounts and remounts as well as keyed re-sorts that move
  items in place — and unregisters on unmount, per the core items contract.
  Its display label defaults to its string children; pass `label` when the
  children aren't plain text.
- Everything ships headless — parts carry behavior, ARIA wiring, and data
  attributes (`data-state`, `data-highlighted`, `data-disabled`); styling is
  the consumer's.

## API

### `Combobox`

The root: owns value + input text + open state, renders no DOM. Accepts the
core `ComboboxOptions`.

| Prop                 | Type                              | Default        | Description                                                               |
| -------------------- | --------------------------------- | -------------- | ------------------------------------------------------------------------- |
| `value`              | `string \| null`                  | —              | Controlled value; every change is reported via `onValueChange`.           |
| `defaultValue`       | `string`                          | —              | Initial value for the uncontrolled combobox.                              |
| `inputValue`         | `string`                          | —              | Controlled input text; every change is reported via `onInputValueChange`. |
| `defaultInputValue`  | `string`                          | `''`           | Initial input text for the uncontrolled combobox.                         |
| `open`               | `boolean`                         | —              | Controlled open state.                                                    |
| `defaultOpen`        | `boolean`                         | `false`        | Initial open state for the uncontrolled combobox.                         |
| `disabled`           | `boolean`                         | `false`        | Disables the whole combobox; the listbox can't open.                      |
| `loop`               | `boolean`                         | `false`        | Whether arrow-key navigation wraps around the ends.                       |
| `onValueChange`      | `(value: string \| null) => void` | —              | Fired on every value change with the new value.                           |
| `onInputValueChange` | `(value: string) => void`         | —              | Fired on every input-text change with the new text.                       |
| `onOpenChange`       | `(open: boolean) => void`         | —              | Fired on every open/close transition with the new value.                  |
| `onHighlightChange`  | `(value: string \| null) => void` | —              | Fired on every highlight move with the highlighted value.                 |
| `onEscapeKeyDown`    | `(event) => void`                 | —              | Fired before an Escape dismissal; `preventDefault()` vetoes.              |
| `onInteractOutside`  | `(event?) => void`                | —              | Fired before an outside-interaction dismissal; `preventDefault()` vetoes. |
| `id`                 | `string`                          | auto (`useId`) | Base id for the parts; per-part ids are derived from it.                  |
| `children`           | `ReactNode`                       | —              | The combobox's parts.                                                     |

### `Combobox.Input`

The text field (`role="combobox"`); DOM focus lives here the whole time. The
text is machine-owned — pass `inputValue`/`onInputValueChange` on the root to
control it, not `value` here.

| Prop       | Type                      | Default | Description                          |
| ---------- | ------------------------- | ------- | ------------------------------------ |
| `...props` | `ComponentProps<'input'>` | —       | Forwarded to the rendered `<input>`. |

### `Combobox.Trigger`

The optional disclosure button: toggles the list, keeps out of the tab order,
and hands focus to the input on press.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `Combobox.Listbox`

The popup list (`role="listbox"`); always mounted, hidden while closed.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `Combobox.Item`

One suggestion (`role="option"`). Registers itself with the machine; carries
`data-state` (`selected` / `unselected`), `data-highlighted`, and
`data-disabled`.

| Prop       | Type                    | Default                           | Description                                            |
| ---------- | ----------------------- | --------------------------------- | ------------------------------------------------------ |
| `value`    | `string`                | —                                 | The suggestion's value. Required, unique per combobox. |
| `disabled` | `boolean`               | `false`                           | Disables this suggestion: skipped and unselectable.    |
| `label`    | `string`                | string children, else the `value` | The text committed to the input on selection.          |
| `...props` | `ComponentProps<'div'>` | —                                 | Forwarded to the rendered `<div>`.                     |

### `Combobox.ItemIndicator`

The selection mark; renders only inside the selected item, hidden from
assistive tech (the selection is announced via `aria-selected`).

| Prop       | Type                     | Default | Description                         |
| ---------- | ------------------------ | ------- | ----------------------------------- |
| `...props` | `ComponentProps<'span'>` | —       | Forwarded to the rendered `<span>`. |
