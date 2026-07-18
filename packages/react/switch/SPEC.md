# SPEC / React / Switch

The React implementation of the [core spec](../../core/switch/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/switch`](https://dunky.dev/ui/components/switch).

## Install

```sh
npm install @dunky.dev/react-switch
```

## Usage

```tsx
import { Switch } from '@dunky.dev/react-switch'
;<Switch>
  <Switch.Control>
    <Switch.Thumb />
  </Switch.Control>
  <Switch.Label>Airplane mode</Switch.Label>
</Switch>
```

React-specific notes on top of the core contract:

- **`Control`** renders a native `<button type="button">`, so Space and Enter
  toggle natively — keyboard activation and pointer presses arrive as the same
  click, and the machine's disabled guard gates both.
- **`Label`** renders a `<span>`, not a `<label>` — per the core design the
  name flows through `aria-labelledby` and the press-to-toggle binding is the
  part's own, so activation never double-fires.
- Everything ships headless — parts carry behavior, ARIA wiring, and the
  `data-state` (`checked` / `unchecked`) and `data-disabled` attributes;
  styling is the consumer's.

## API

### `Switch`

The root: owns the checked state, renders no DOM. Accepts the core
`SwitchOptions`.

| Prop              | Type                         | Default        | Description                                                     |
| ----------------- | ---------------------------- | -------------- | --------------------------------------------------------------- |
| `checked`         | `boolean`                    | —              | Controlled checked state.                                       |
| `defaultChecked`  | `boolean`                    | `false`        | Initial checked state for the uncontrolled switch.              |
| `onCheckedChange` | `(checked: boolean) => void` | —              | Fired on every checked/unchecked transition with the new value. |
| `disabled`        | `boolean`                    | `false`        | Blocks toggling; `aria-disabled` + `data-disabled` on parts.    |
| `id`              | `string`                     | auto (`useId`) | Base id for the parts; per-part ids are derived from it.        |
| `children`        | `ReactNode`                  | —              | The switch's parts.                                             |

### `Switch.Control`

The interactive element: `role="switch"`, `aria-checked`, toggles on press.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `Switch.Thumb`

The knob; purely visual, carries only the styling hooks.

| Prop       | Type                     | Default | Description                         |
| ---------- | ------------------------ | ------- | ----------------------------------- |
| `...props` | `ComponentProps<'span'>` | —       | Forwarded to the rendered `<span>`. |

### `Switch.Label`

Names the control (wires `aria-labelledby` on Control); pressing it toggles.

| Prop       | Type                     | Default | Description                         |
| ---------- | ------------------------ | ------- | ----------------------------------- |
| `...props` | `ComponentProps<'span'>` | —       | Forwarded to the rendered `<span>`. |
