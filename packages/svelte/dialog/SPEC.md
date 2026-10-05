# SPEC / Svelte / Dialog

The Svelte implementation of the [core spec](../../core/dialog/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/dialog`](https://dunky.dev/ui/components/dialog).

## Install

```sh
npm install @dunky.dev/svelte-dialog
```

Peer: `svelte@^5.40.0`.

## Usage

```svelte
<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'
</script>

<Dialog>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Viewport>
      <Dialog.Content>
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Description>Description</Dialog.Description>
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
```

Svelte-specific notes on top of the core contract:

- **Packaging**: the package ships its components uncompiled — `.svelte`
  files and `.svelte.js` rune modules under the `svelte` export condition —
  for your own Svelte compiler to compile, client and server alike. Svelte's
  compiled output targets its internal runtime, which is not a stable API
  across versions, so a precompiled build would pin you to one. Any
  Svelte-aware bundler setup resolves it (Vite with
  `@sveltejs/vite-plugin-svelte`, SvelteKit).
- **`Portal`** teleports the layers to `document.body`, or to a `container`
  you supply. Svelte has no portal of its own, so the layers `mount()` as a
  separate tree in the target, carrying the surrounding contexts with them —
  every part below still finds its dialog (and any context of yours). Nothing
  renders there on the server. Nothing is kept mounted while closed; an
  `animated` dialog stays mounted through the core contract's `closing` state
  so its exit can play — see the exit-animation note below. When scoped to a
  `container`, the scroll lock applies to that container instead of the page,
  and the backdrop/viewport must be positioned `absolute` (not `fixed`) so the
  overlay pins to the container. Because an `absolute` overlay can't stay fixed
  inside a scrolling element, a scoped container that needs a scrollable
  background should be a non-scrolling positioned boundary wrapping an inner
  scroller — portal into the boundary; the overlay fills its visible box and
  the backdrop blocks the scroller behind it (see the `scoped` story).
  Swapping `container` while the dialog is open re-mounts the layers on the
  new target.
- **`Content`** renders a `<div>` carrying the `dialog` (or `alertdialog`)
  role, not the native `<dialog>` element. The dialog window is the initial
  focus target — focusable in script, out of the tab order — which needs
  `tabindex="-1"`, and HTML states that
  [the `tabindex` attribute must not be specified on `dialog` elements](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element).
  The native element would only pay off through `showModal()`, and this
  contract deliberately keeps modality, dismissal, and focus with the core
  machine rather than splitting authority with the browser's built-in behavior
  (see the core spec's Internals). With the role explicit and the element
  neutral, there is nothing left to gain and one conformance rule left to
  break.
- **`Content`'s `initialFocus`** accepts an element or a getter resolved at
  open time. `bind:this` fills only after the component that declares it has
  initialized, so pass a getter — `initialFocus={() => cancelButton}` — or a
  `$state` element. `restoreFocus` takes the same shape (exported as
  `DialogFocusTarget`), resolved at close time.
- **Element access**: every part that renders an element takes a bindable
  `ref` — `<Dialog.Content bind:ref={panel}>`. `bind:this` on a component
  yields the component, not its element.
- **Controlled open**: `open` and the `onOpenChange` callback prop, as in the
  core contract. `open` is deliberately not `$bindable()`, so `bind:open` is
  rejected instead of quietly misbehaving. A component can't tell a bound prop
  from a passed one, and backing `bind:open` would mean the dialog writes
  `open` itself whenever its state should move. Unbound, Svelte keeps that
  write as a local override: a controlled dialog would move on its own, which
  the core contract forbids, and the first write to an uncontrolled dialog's
  `open` would make it controlled. Hold the state yourself —
  `open={isOpen} onOpenChange={next => (isOpen = next)}` — and decide
  dismissals at their source, in the dismissal callbacks.
- **Ids**: the base id is the root's `$props.id()` — unique per instance, and
  stable from the server render through hydration. An explicit `id` wins; an
  explicit `id={undefined}` keeps the generated one.
- **`Backdrop`** renders nothing when the dialog is non-modal (`modal={false}`),
  per the core parts contract. Render it ahead of the `Viewport`, in the
  anatomy's order: Svelte binds elements after mount in tree order, so the
  layer's registration — run by `Content` — only sees a backdrop bound before
  it, and a backdrop rendered after the viewport is contained (made inert)
  with the rest of the page.
- **Exit animation** (`animated`): style the exit on the parts'
  `data-state="closing"` — a CSS transition or animation on **Content** (the
  element carrying the state, not a descendant) is what signals completion;
  a missing exit style falls back to a short ceiling, and
  `prefers-reduced-motion` skips the wait entirely. The exit is cosmetic:
  focus, the dialog stack, and page interaction release the moment closing
  starts, and the still-painting layer is made `inert` until it unmounts.
  Enter needs no state — the parts mount straight into `data-state="open"`,
  so a CSS animation (or a transition via `@starting-style`) plays from
  mount.
- **Back navigation** (`closeOnBack`): opening plants a guard entry in the
  session history, so the browser's Back closes the dialog instead of leaving
  the page — one layer per press in a nested stack, per the core contract. A
  dialog closed any other way consumes its entry, leaving nothing to swallow
  a later Back; an entry buried under in-app navigation while the dialog is
  open is left alone (Back then both navigates and closes the dialog).
  The entry a Back press spends survives in the forward stack, so the
  browser's Forward reopens the dialog it closed (`onForwardNavigation`
  fires first; `preventDefault()` vetoes, per the core contract). Reopening
  through the trigger instead plants a fresh entry — the browser truncates
  the spent one, exactly like navigating after a Back. Two web-mechanics
  caveat: a controlled dialog's Back-close is completed by the consumer rather
  than by the press itself, so its entry is consumed and Forward has nothing to
  re-enter. A nested dialog unmounted along with the parent it was opened from
  does come back, and so does one whose page reloaded in between — the entry
  remembers the dialog's place in the stack, not the instance that planted it.
- Everything ships headless, per the core contract's
  [Internals](../../core/dialog/SPEC.md#internals).

## API

### `Dialog`

The root: owns open/close state, renders no DOM. Accepts the core
`DialogOptions`.

| Prop                     | Type                        | Default                                   | Description                                                                                                                                   |
| ------------------------ | --------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `open`                   | `boolean`                   | —                                         | Controlled open state — the dialog follows it alone. Back to `undefined` hands the state over, uncontrolled in place. Not bindable.           |
| `defaultOpen`            | `boolean`                   | `false`                                   | Initial open state for the uncontrolled dialog.                                                                                               |
| `onOpenChange`           | `(open: boolean) => void`   | —                                         | Fired on every open/close transition with the new value.                                                                                      |
| `modal`                  | `boolean`                   | `true`                                    | `aria-modal`, focus trap, scroll lock, backdrop.                                                                                              |
| `role`                   | `'dialog' \| 'alertdialog'` | `'dialog'`                                | The ARIA pattern.                                                                                                                             |
| `closeOnEscape`          | `boolean`                   | `true`                                    | Whether Escape closes the dialog.                                                                                                             |
| `escapeScope`            | `'layer' \| 'stack'`        | `'layer'`                                 | How far an allowed Escape reaches: this dialog, or its whole stack.                                                                           |
| `closeOnInteractOutside` | `boolean`                   | `true` — `false` for `role="alertdialog"` | Whether pressing the backdrop/viewport closes the dialog.                                                                                     |
| `animated`               | `boolean`                   | `false`                                   | Keeps the dialog mounted through `data-state="closing"` while its exit animation plays.                                                       |
| `closeOnBack`            | `boolean`                   | `false`                                   | The browser's Back closes the open dialog instead of navigating (a guard entry in the session history), and Forward reopens what Back closed. |
| `onBackNavigation`       | `(event?) => void`          | —                                         | Fired before a back-navigation dismissal; `preventDefault()` vetoes.                                                                          |
| `onForwardNavigation`    | `(event?) => void`          | —                                         | Fired before a forward-navigation reopen; `preventDefault()` vetoes.                                                                          |
| `onEscapeKeyDown`        | `(event) => void`           | —                                         | Fired before an Escape dismissal; `preventDefault()` vetoes.                                                                                  |
| `onInteractOutside`      | `(event?) => void`          | —                                         | Fired before an outside-press dismissal; `preventDefault()` vetoes.                                                                           |
| `id`                     | `string`                    | auto (`$props.id()`)                      | Base id for the parts; per-part ids are derived from it.                                                                                      |
| `children`               | `Snippet`                   | —                                         | The dialog's parts.                                                                                                                           |

### `Dialog.Trigger`

Opens the dialog; focus returns here on close.

| Prop       | Type                        | Default | Description                           |
| ---------- | --------------------------- | ------- | ------------------------------------- |
| `ref`      | `HTMLButtonElement \| null` | —       | Bindable: the rendered `<button>`.    |
| `children` | `Snippet`                   | —       | The trigger's content.                |
| `...props` | `HTMLButtonAttributes`      | —       | Forwarded to the rendered `<button>`. |

### `Dialog.Portal`

Teleports the layers out of the tree while open; unmounts them while closed.

| Prop        | Type                  | Default         | Description                 |
| ----------- | --------------------- | --------------- | --------------------------- |
| `container` | `HTMLElement \| null` | `document.body` | The element to portal into. |
| `children`  | `Snippet`             | —               | The layers to teleport.     |

### `Dialog.Backdrop`

The layer behind the dialog window; renders nothing when `modal={false}`.

| Prop       | Type                             | Default | Description                        |
| ---------- | -------------------------------- | ------- | ---------------------------------- |
| `ref`      | `HTMLDivElement \| null`         | —       | Bindable: the rendered `<div>`.    |
| `children` | `Snippet`                        | —       | The backdrop's content.            |
| `...props` | `HTMLAttributes<HTMLDivElement>` | —       | Forwarded to the rendered `<div>`. |

### `Dialog.Viewport`

The positioning + scroll layer around the dialog window.

| Prop       | Type                             | Default | Description                        |
| ---------- | -------------------------------- | ------- | ---------------------------------- |
| `ref`      | `HTMLDivElement \| null`         | —       | Bindable: the rendered `<div>`.    |
| `children` | `Snippet`                        | —       | The dialog window.                 |
| `...props` | `HTMLAttributes<HTMLDivElement>` | —       | Forwarded to the rendered `<div>`. |

### `Dialog.Content`

The dialog window; renders a `<div>` with the `dialog` role.

| Prop           | Type                                                              | Default           | Description                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialFocus` | `HTMLElement \| null \| (() => HTMLElement \| null \| undefined)` | the dialog window | The element to focus when the dialog opens — resolved at open time.                                                                                         |
| `restoreFocus` | `HTMLElement \| null \| (() => HTMLElement \| null \| undefined)` | —                 | Focused on close when nothing meaningful held focus before opening (the body, or an element since removed) — resolved at close time. Typically the trigger. |
| `ref`          | `HTMLDivElement \| null`                                          | —                 | Bindable: the rendered `<div>`.                                                                                                                             |
| `children`     | `Snippet`                                                         | —                 | The dialog's content.                                                                                                                                       |
| `...props`     | `HTMLAttributes<HTMLDivElement>`                                  | —                 | Forwarded to the rendered `<div>`.                                                                                                                          |

### `Dialog.Title`

Names the dialog (wires `aria-labelledby` on Content).

| Prop       | Type                                 | Default | Description                       |
| ---------- | ------------------------------------ | ------- | --------------------------------- |
| `ref`      | `HTMLHeadingElement \| null`         | —       | Bindable: the rendered `<h2>`.    |
| `children` | `Snippet`                            | —       | The title text.                   |
| `...props` | `HTMLAttributes<HTMLHeadingElement>` | —       | Forwarded to the rendered `<h2>`. |

### `Dialog.Description`

Describes the dialog (wires `aria-describedby` on Content).

| Prop       | Type                             | Default | Description                        |
| ---------- | -------------------------------- | ------- | ---------------------------------- |
| `ref`      | `HTMLDivElement \| null`         | —       | Bindable: the rendered `<div>`.    |
| `children` | `Snippet`                        | —       | The description.                   |
| `...props` | `HTMLAttributes<HTMLDivElement>` | —       | Forwarded to the rendered `<div>`. |

### `Dialog.Close`

Dismisses the dialog from inside — the single dismissal affordance (the
corner `×`), rendered once per dialog and kept the focus cycle's last stop per
the core contract. Action buttons (Cancel/Confirm) are your own `<button>`s
driving state, so they keep their natural Tab order.

| Prop       | Type                        | Default | Description                           |
| ---------- | --------------------------- | ------- | ------------------------------------- |
| `ref`      | `HTMLButtonElement \| null` | —       | Bindable: the rendered `<button>`.    |
| `children` | `Snippet`                   | —       | The affordance's content.             |
| `...props` | `HTMLButtonAttributes`      | —       | Forwarded to the rendered `<button>`. |
