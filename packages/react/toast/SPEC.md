# SPEC / React / Toast

The React implementation of the [core spec](../../core/toast/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/toast`](https://dunky.dev/ui/components/toast).

## Install

```sh
npm install @dunky.dev/react-toast
```

## Usage

```tsx
import { Toast } from '@dunky.dev/react-toast'
;<Toast.Provider label='Notifications'>
  {/* app */}
  <Toast.Viewport>
    <Toast>
      <Toast.Root>
        <Toast.Title>Saved</Toast.Title>
        <Toast.Description>Your changes are safe.</Toast.Description>
        <Toast.Action>Undo</Toast.Action>
        <Toast.Close>Dismiss</Toast.Close>
      </Toast.Root>
    </Toast>
  </Toast.Viewport>
</Toast.Provider>
```

React-specific notes on top of the core contract:

- **`Toast`** (the root) owns one toast's machine and renders no DOM;
  **`Toast.Root`** is the rendered surface — the `<li>` announced to assistive
  tech — and mounts only while the toast is open.
- **`Toast.Provider`** and **`Toast.Viewport`** are the core's substrate
  coordination surfaces: the provider carries the default duration and the
  region label; the viewport is the `role="region"` landmark (`<ol>`) that
  pauses every toast's timer on hover/focus and resumes on leave/blur. Every
  toast must live under a provider.
- The dismiss timer is a substrate effect wired to the machine state:
  entering `open` schedules a `setTimeout` for the toast's duration; leaving
  cancels it. Resuming restarts the full duration, per the core design.
- Everything ships headless — the consumer styles and positions the viewport;
  `data-state` (`open`) on Root is the styling and animation hook.

## API

### `Toast.Provider`

Shared configuration for every toast beneath it. Renders no DOM.

| Prop       | Type        | Default           | Description                                                      |
| ---------- | ----------- | ----------------- | ---------------------------------------------------------------- |
| `duration` | `number`    | `5000`            | Default auto-dismiss duration (ms) for toasts without their own. |
| `label`    | `string`    | `'Notifications'` | Accessible label of the viewport region.                         |
| `children` | `ReactNode` | —                 | The app and the viewport.                                        |

### `Toast.Viewport`

The landmark region listing the toasts; renders an `<ol role="region"
tabindex="-1">`. Hovering (entering or moving the pointer) or focusing it
pauses every toast's timer; leaving/blurring resumes. Dismissing the toast
that holds focus parks focus here, per the core spec — programmatically
focusable, never in the tab order.

| Prop       | Type                   | Default | Description                       |
| ---------- | ---------------------- | ------- | --------------------------------- |
| `...props` | `ComponentProps<'ol'>` | —       | Forwarded to the rendered `<ol>`. |

### `Toast`

The root of one toast: owns its machine, renders no DOM. Accepts the core
`ToastOptions`.

| Prop           | Type                           | Default        | Description                                                                   |
| -------------- | ------------------------------ | -------------- | ----------------------------------------------------------------------------- |
| `open`         | `boolean`                      | —              | Controlled open state.                                                        |
| `defaultOpen`  | `boolean`                      | `true`         | Initial open state for the uncontrolled toast.                                |
| `onOpenChange` | `(open: boolean) => void`      | —              | Fired on every open/close transition — including auto-dismiss.                |
| `type`         | `'foreground' \| 'background'` | `'foreground'` | Announcement politeness: `assertive` for foreground, `polite` for background. |
| `duration`     | `number`                       | the provider's | Auto-dismiss duration (ms); `Infinity` makes the toast persistent.            |
| `id`           | `string`                       | auto (`useId`) | Base id for the parts; per-part ids are derived from it.                      |
| `children`     | `ReactNode`                    | —              | The toast's parts.                                                            |

### `Toast.Root`

The toast surface: the `role="status"` live element. Renders an `<li>`, only
while the toast is open.

| Prop       | Type                   | Default | Description                       |
| ---------- | ---------------------- | ------- | --------------------------------- |
| `...props` | `ComponentProps<'li'>` | —       | Forwarded to the rendered `<li>`. |

### `Toast.Title`

Names the toast (wires `aria-labelledby` on Root). Renders a `<div>` — a
transient message carries no document-outline heading.

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `Toast.Description`

The toast's message body (wires `aria-describedby` on Root).

| Prop       | Type                    | Default | Description                        |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `...props` | `ComponentProps<'div'>` | —       | Forwarded to the rendered `<div>`. |

### `Toast.Action`

The toast's optional action (undo, retry); pressing it dismisses the toast.
The consumer's `onClick` carries what the action does and runs first — calling
`event.preventDefault()` in it keeps the toast open.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |

### `Toast.Close`

Dismisses the toast from inside.

| Prop       | Type                       | Default | Description                           |
| ---------- | -------------------------- | ------- | ------------------------------------- |
| `...props` | `ComponentProps<'button'>` | —       | Forwarded to the rendered `<button>`. |
