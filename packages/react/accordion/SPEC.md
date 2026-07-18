# SPEC / React / Accordion

The React implementation of the [core spec](../../core/accordion/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/accordion`](https://dunky.dev/ui/components/accordion).

## Install

```sh
npm install @dunky.dev/react-accordion
```

## Usage

```tsx
import { Accordion } from '@dunky.dev/react-accordion'
;<Accordion type='single' collapsible>
  <Accordion.Item value='shipping'>
    <Accordion.Header>
      <Accordion.Trigger>Shipping</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>Ships in 3-5 business days.</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value='returns'>
    <Accordion.Header>
      <Accordion.Trigger>Returns</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>Free returns within 30 days.</Accordion.Content>
  </Accordion.Item>
</Accordion>
```

React-specific notes on top of the core contract:

- **`Content`** stays mounted while closed and hides with the native `hidden`
  attribute — the DOM keeps the trigger's `aria-controls` reference resolvable
  and the content findable in-page.
- The value prop shape follows the `type` discriminant: `type="single"` takes
  `value` / `defaultValue` / `onValueChange` in `string | null`,
  `type="multiple"` takes them in `string[]`.
- Everything ships headless — parts carry behavior, ARIA wiring, and
  `data-state` / `data-disabled` / `data-orientation` attributes; styling is
  the consumer's.

## API

### `Accordion`

The root: owns the open value and keyboard focus, renders no DOM. Accepts the
core `AccordionOptions`.

| Prop            | Type                                                            | Default        | Description                                                                                           |
| --------------- | --------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `type`          | `'single' \| 'multiple'`                                        | —              | Whether one or many items can be open; picks the value shape. Required.                               |
| `value`         | `string \| null` (single) / `string[]` (multiple)               | —              | Controlled open value — authoritative; the accordion follows the prop.                                |
| `defaultValue`  | `string \| null` (single) / `string[]` (multiple)               | `null` / `[]`  | Initial open value for the uncontrolled accordion.                                                    |
| `onValueChange` | `(value: string \| null) => void` / `(value: string[]) => void` | —              | Reports the next value in the mode's shape: the change made (uncontrolled) or asked for (controlled). |
| `collapsible`   | `boolean` (single only)                                         | `false`        | Whether re-pressing the open item's trigger closes it.                                                |
| `disabled`      | `boolean`                                                       | `false`        | Disables every item.                                                                                  |
| `orientation`   | `'vertical' \| 'horizontal'`                                    | `'vertical'`   | The arrow-key navigation axis.                                                                        |
| `id`            | `string`                                                        | auto (`useId`) | Base id for the parts; per-item ids are derived from it.                                              |
| `children`      | `ReactNode`                                                     | —              | The accordion's items.                                                                                |

### `Accordion.Item`

One disclosure; registers itself with the machine and scopes the parts inside
to its `value`.

| Prop       | Type                    | Default | Description                                      |
| ---------- | ----------------------- | ------- | ------------------------------------------------ |
| `value`    | `string`                | —       | The item's identity in the open value. Required. |
| `disabled` | `boolean`               | `false` | Disables this item.                              |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`.               |

### `Accordion.Header`

The heading wrapper around the trigger.

| Prop       | Type                   | Default | Description                       |
| ---------- | ---------------------- | ------- | --------------------------------- |
| `...props` | `ComponentProps<'h3'>` | —       | Forwarded to the rendered `<h3>`. |

### `Accordion.Trigger`

Toggles its item; hosts the arrow-key navigation.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `Accordion.Content`

The section the trigger controls; natively `hidden` while closed.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |
