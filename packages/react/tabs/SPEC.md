# SPEC / React / Tabs

The React implementation of the [core spec](../../core/tabs/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/tabs`](https://dunky.dev/ui/components/tabs).

## Install

```sh
npm install @dunky.dev/react-tabs
```

## Usage

```tsx
import { Tabs } from '@dunky.dev/react-tabs'
;<Tabs defaultValue='account'>
  <Tabs.List aria-label='Settings'>
    <Tabs.Trigger value='account'>Account</Tabs.Trigger>
    <Tabs.Trigger value='security'>Security</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value='account'>Account settings</Tabs.Content>
  <Tabs.Content value='security'>Security settings</Tabs.Content>
</Tabs>
```

React-specific notes on top of the core contract:

- **`Trigger`** renders a native `<button>`. Its `disabled` prop does double
  duty: it disables the button natively (no press, no click focus) and marks
  the tab disabled in the core registry, so keyboard navigation skips it.
- **`Content`** panels stay mounted while inactive and are hidden with the
  native `hidden` attribute, per the core parts contract — the panel's DOM
  (and consumer state inside it) survives switching tabs.
- The machine designates the focused tab by value; the Trigger moves real DOM
  focus to itself in response — the binding executes the decision, it never
  makes one.
- Everything ships headless — parts carry behavior and ARIA wiring; `Trigger`
  and `Content` carry `data-state` (`active` / `inactive`), and every part
  carries `data-orientation`; styling is the consumer's.
- `orientation` and `activationMode` are read once when the tabs mount (a v0
  exclusion in the core spec); `value` and the callbacks stay live across
  renders.

## API

### `Tabs`

The root: owns the selected value, renders no DOM. Accepts the core
`TabsOptions`.

| Prop             | Type                         | Default        | Description                                                     |
| ---------------- | ---------------------------- | -------------- | --------------------------------------------------------------- |
| `value`          | `string`                     | —              | Controlled selected value.                                      |
| `defaultValue`   | `string`                     | —              | Initial selected value for the uncontrolled tabs.               |
| `onValueChange`  | `(value: string) => void`    | —              | Fired on every selection change with the newly selected value.  |
| `orientation`    | `'horizontal' \| 'vertical'` | `'horizontal'` | The strip's axis: arrow-key pair and `aria-orientation`.        |
| `activationMode` | `'automatic' \| 'manual'`    | `'automatic'`  | Whether focusing a tab selects it, or Enter/Space is required.  |
| `id`             | `string`                     | auto (`useId`) | Base id for the parts; per-tab ids are derived from it + value. |
| `children`       | `ReactNode`                  | —              | The tabs' parts.                                                |

### `Tabs.List`

The tab strip (`role="tablist"`); the keyboard surface.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `Tabs.Trigger`

One tab (`role="tab"`), addressed by its value; renders a `<button>`.

| Prop       | Type                       | Default | Description                                                           |
| ---------- | -------------------------- | ------- | --------------------------------------------------------------------- |
| `value`    | `string`                   | —       | The tab's value — pairs it with the `Tabs.Content` of the same value. |
| `disabled` | `boolean`                  | `false` | Disables the tab: skipped by keyboard navigation, never selectable.   |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`.                                 |

### `Tabs.Content`

One panel (`role="tabpanel"`); hidden unless its value is selected.

| Prop       | Type                    | Default | Description                                                             |
| ---------- | ----------------------- | ------- | ----------------------------------------------------------------------- |
| `value`    | `string`                | —       | The panel's value — pairs it with the `Tabs.Trigger` of the same value. |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`.                                      |
