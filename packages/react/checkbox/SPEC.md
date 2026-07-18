# SPEC / React / Checkbox

The React implementation of the [core spec](../../core/checkbox/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/checkbox`](https://dunky.dev/ui/components/checkbox).

## Install

```sh
npm install @dunky.dev/react-checkbox
```

## Usage

```tsx
import { Checkbox } from '@dunky.dev/react-checkbox'
;<Checkbox>
  <Checkbox.Control>
    <Checkbox.Indicator>✓</Checkbox.Indicator>
  </Checkbox.Control>
  <Checkbox.Label>Accept terms</Checkbox.Label>
</Checkbox>
```

React-specific notes on top of the core contract:

- **`Control`** renders a `<button type="button">` with `role="checkbox"` —
  Space and pointer activation come from the native button; the core suppresses
  Enter per the APG.
- **`Indicator`** is unmounted while unchecked, per the core parts contract —
  render the glyph for `data-state="checked"` vs `"indeterminate"` inside it.
- Everything ships headless — parts carry behavior, ARIA wiring, and the
  `data-state` (`checked` / `unchecked` / `indeterminate`) and `data-disabled`
  attributes; styling is the consumer's.

## API

### `Checkbox`

The root: owns the checked state, renders no DOM. Accepts the core
`CheckboxOptions`.

| Prop              | Type                                            | Default        | Description                                                                                                         |
| ----------------- | ----------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `checked`         | `boolean \| 'indeterminate'`                    | —              | Controlled checked state.                                                                                           |
| `defaultChecked`  | `boolean \| 'indeterminate'`                    | `false`        | Initial checked state for the uncontrolled checkbox.                                                                |
| `onCheckedChange` | `(checked: boolean \| 'indeterminate') => void` | —              | Fired with the new value on user toggles and programmatic sets — never as an echo of the controlled `checked` prop. |
| `disabled`        | `boolean`                                       | `false`        | Blocks toggling; conveyed as `aria-disabled`.                                                                       |
| `id`              | `string`                                        | auto (`useId`) | Base id for the parts; per-part ids are derived from it.                                                            |
| `children`        | `ReactNode`                                     | —              | The checkbox's parts.                                                                                               |

### `Checkbox.Control`

The interactive element: `role="checkbox"`, `aria-checked`, toggles on press.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `Checkbox.Indicator`

The visual mark; renders only while checked or indeterminate.

| Prop       | Type                     | Default | Description                         |
| ---------- | ------------------------ | ------- | ----------------------------------- |
| `...props` | `ComponentProps<'span'>` | —       | Forwarded to the rendered `<span>`. |

### `Checkbox.Label`

Names the control (wires `aria-labelledby`); pressing it toggles too.

| Prop       | Type                     | Default | Description                         |
| ---------- | ------------------------ | ------- | ----------------------------------- |
| `...props` | `ComponentProps<'span'>` | —       | Forwarded to the rendered `<span>`. |
