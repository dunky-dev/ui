# SPEC / Vue / Dialog

The Vue implementation of the [core spec](../../core/dialog/SPEC.md).

## Docs

🔗 [`dunky.dev/ui/components/dialog`](https://dunky.dev/ui/components/dialog).

## Install

```sh
npm install @dunky.dev/vue-dialog
```

## Usage

```vue
<script setup lang="ts">
import { Dialog } from '@dunky.dev/vue-dialog'
</script>

<template>
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
</template>
```

The parts hang off the root: `<script setup>` resolves `<Dialog.Trigger>`
from the one `Dialog` import.

Vue-specific notes on top of the core contract:

- **Callbacks are emits.** The core's `onOpenChange` is the `update:open`
  emit, so `v-model:open` binds the controlled pair; the dismissal callbacks
  are `escape-key-down`, `interact-outside`, `back-navigation`, and
  `forward-navigation`. Listeners run synchronously, so `preventDefault()` on
  a payload still vetoes, per the core contract. `update:open` reports a
  change, it never requests one: a controlled dialog — `v-model:open`
  included — doesn't move on its own Trigger, Close, Escape, or outside
  press. Wire the intent at its source: `@click` on the Trigger, a handler
  on `escape-key-down`, your own action buttons. A wrapper that forwards its
  own `defineModel('open')` through `v-model:open` makes the dialog
  controlled the moment that model holds a value, with the same obligation.
  The veto composes with plain listeners; a modifier listener
  (`@click.capture`, `.once`) is a separate DOM listener the part's handler
  doesn't consult. A listener that throws is caught by Vue's error handling,
  so it can't veto.
- **Boolean props follow the core defaults when absent.** Vue casts an absent
  Boolean prop to `false`; this root declares its booleans without that
  cast, so `<Dialog>` is modal and uncontrolled, and a bare attribute
  (`<Dialog default-open>`) switches the option on.
- **`Portal`** teleports the layers to `document.body`, or to a `container`
  element you supply. Nothing is kept mounted while closed; an `animated`
  dialog stays mounted through the core contract's `closing` state so its exit
  can play — see the exit-animation note below. The server renders no portal
  (there is no document to teleport into), and so neither does the client's
  hydration pass: the teleport arrives with the first update after the Portal
  mounts. Swapping `container` while open re-creates the teleport on the new
  target rather than moving it, like the React and Solid portals — the open
  sequence runs again against the new placement. `container` takes an element,
  not a selector — query it first; Vue warns when it gets a string. When
  scoped to a `container`, the scroll lock applies to that container instead
  of the page, and the backdrop/viewport must be positioned `absolute` (not
  `fixed`) so the overlay pins to the container. Because an `absolute` overlay
  can't stay fixed inside a scrolling element, a scoped container that needs a
  scrollable background should be a non-scrolling positioned boundary wrapping
  an inner scroller — portal into the boundary; the overlay fills its visible
  box and the backdrop blocks the scroller behind it (see the `scoped` story).
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
- **`Content`'s `initialFocus`** accepts an element, a component (its `$el`),
  a ref to either, or a getter, resolved at open time; `restoreFocus` takes
  the same shape, resolved at close time. A template unwraps a ref when it
  renders — before an element inside the dialog has mounted — so a template
  passes a getter: `:initial-focus="() => cancelButton"`. Script and TSX pass
  the ref itself.
- **`Content` without a `Portal`** stays mounted while closed, so its DOM
  work follows the dialog's state, not its mount — once the update that
  renders the state has applied, as a React effect runs after commit, so a
  stylesheet that hides a closed window is out of the way when focus moves
  in. The scroll lock holds while the dialog is open or closing, and the exit
  window hides the layer alone — its Viewport, or the window when it has
  none — since it sits in the page, not in a container of its own.
- **Element access**: every part renders exactly one root element, so a
  template ref on a part reaches it as `$el` (`contentPart.value.$el`). A
  non-modal Backdrop renders nothing, and the Portal renders no element of
  its own.
- **Attributes** are merged, not inherited: each part merges what you pass
  through the adapter's `mergeProps`. Your listeners run before the part's
  own, and `preventDefault()` in yours skips it; `class` and `style` merge;
  the attributes the part owns (`id`, `role`, `aria-*`, `data-state`) win.
  The root and the Portal render no element of their own and ignore extra
  attributes.
- **`Backdrop`** renders nothing when the dialog is non-modal (`:modal="false"`),
  per the core parts contract.
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
  browser's Forward reopens the dialog it closed (`forward-navigation` fires
  first; `preventDefault()` vetoes, per the core contract). Reopening
  through the trigger instead plants a fresh entry — the browser truncates
  the spent one, exactly like navigating after a Back. Two web-mechanics
  caveats: a controlled dialog's Back-close is completed by the consumer rather
  than by the press itself, so its entry is consumed and Forward has nothing to
  re-enter. A nested dialog unmounted along with the parent it was opened from
  does come back, and so does one whose page reloaded in between — the entry
  remembers the dialog's place in the stack, not the instance that planted it.
- **Dialogs that change together** — a wizard's Next closing one dialog and
  opening the next in the same update, or a stack closing at once — run their
  DOM sequences once the update has rendered, every close before any open, as
  React's commit does: the dialog opened keeps the focus it took, the last
  close returns focus to the trigger the hand-over started from, and an
  exiting layer stays inert while others open or close around it, however the
  dialogs are declared. Nested layers release innermost first and open
  outermost first.
- **`<KeepAlive>`**: a deactivated dialog's machine is paused by the adapter,
  as React's `<Activity>` pauses its effects, so its DOM work pauses too: the
  Portal parks the layers back in place, inside the cached view and off the
  document — Vue would otherwise leave teleported content painted over the
  next view — and the history guard, focus trap, and scroll lock release.
  Reactivation brings the same layers back, their content's state intact, and
  runs the open sequence again — a nested stack outermost first, as it first
  opened, so each layer's close still returns focus to the one beneath. A
  dialog mounted into a view that is already deactivated — async data
  resolving after the user left — holds still the same way until the view
  returns.
- **Server rendering** touches no DOM: the root and its Trigger render, the
  document-level work starts on mount, and the base id comes from `useId`, so
  the hydrated parts carry the ids the server rendered. `useId` counts per
  app: with several Vue apps on one page, give each its own
  `app.config.idPrefix` — dialogs share one layer stack, keyed by id.
- Everything ships headless, per the core contract's
  [Internals](../../core/dialog/SPEC.md#internals).

## API

### `Dialog`

The root: owns open/close state, renders no DOM. Accepts the core
`DialogOptions` as props; the core callbacks are its emits.

| Prop                     | Type                        | Default                                   | Description                                                                                                                                   |
| ------------------------ | --------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `open`                   | `boolean`                   | —                                         | Controlled open state (`v-model:open`) — the dialog follows it alone. Back to `undefined` hands the state over, uncontrolled in place.        |
| `defaultOpen`            | `boolean`                   | `false`                                   | Initial open state for the uncontrolled dialog.                                                                                               |
| `modal`                  | `boolean`                   | `true`                                    | `aria-modal`, focus trap, scroll lock, backdrop.                                                                                              |
| `role`                   | `'dialog' \| 'alertdialog'` | `'dialog'`                                | The ARIA pattern.                                                                                                                             |
| `closeOnEscape`          | `boolean`                   | `true`                                    | Whether Escape closes the dialog.                                                                                                             |
| `escapeScope`            | `'layer' \| 'stack'`        | `'layer'`                                 | How far an allowed Escape reaches: this dialog, or its whole stack.                                                                           |
| `closeOnInteractOutside` | `boolean`                   | `true` — `false` for `role="alertdialog"` | Whether pressing the backdrop/viewport closes the dialog.                                                                                     |
| `animated`               | `boolean`                   | `false`                                   | Keeps the dialog mounted through `data-state="closing"` while its exit animation plays.                                                       |
| `closeOnBack`            | `boolean`                   | `false`                                   | The browser's Back closes the open dialog instead of navigating (a guard entry in the session history), and Forward reopens what Back closed. |
| `id`                     | `string`                    | auto (`useId`)                            | Base id for the parts; per-part ids are derived from it.                                                                                      |

| Emit                 | Payload                         | Description                                                                            |
| -------------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| `update:open`        | `open: boolean`                 | Fired on every open/close transition with the new value; with `open`, `v-model:open`.  |
| `escape-key-down`    | `event: KeyboardPayload`        | Fired before an Escape dismissal (the `KeyboardEvent`); `preventDefault()` vetoes.     |
| `interact-outside`   | `event?: PointerPayload`        | Fired before an outside-press dismissal (the `MouseEvent`); `preventDefault()` vetoes. |
| `back-navigation`    | `event?: BackNavigationPayload` | Fired before a back-navigation dismissal; `preventDefault()` vetoes.                   |
| `forward-navigation` | `event?: BackNavigationPayload` | Fired before a forward-navigation reopen; `preventDefault()` vetoes.                   |

Default slot: the dialog's parts.

### `Dialog.Trigger`

Opens the dialog; focus returns here on close. Default slot: the button's
content.

| Prop       | Type                   | Default | Description                          |
| ---------- | ---------------------- | ------- | ------------------------------------ |
| `...attrs` | `ButtonHTMLAttributes` | —       | Merged onto the rendered `<button>`. |

### `Dialog.Portal`

Teleports the layers out of the tree while open; unmounts them while closed.
Default slot: the layers to teleport.

| Prop        | Type                  | Default         | Description                 |
| ----------- | --------------------- | --------------- | --------------------------- |
| `container` | `HTMLElement \| null` | `document.body` | The element to portal into. |

### `Dialog.Backdrop`

The layer behind the dialog window; renders nothing when `modal` is `false`.
Default slot: optional backdrop content.

| Prop       | Type             | Default | Description                       |
| ---------- | ---------------- | ------- | --------------------------------- |
| `...attrs` | `HTMLAttributes` | —       | Merged onto the rendered `<div>`. |

### `Dialog.Viewport`

The positioning + scroll layer around the dialog window. Default slot: the
Content.

| Prop       | Type             | Default | Description                       |
| ---------- | ---------------- | ------- | --------------------------------- |
| `...attrs` | `HTMLAttributes` | —       | Merged onto the rendered `<div>`. |

### `Dialog.Content`

The dialog window; renders a `<div>` with the `dialog` role. Default slot:
the window's content.

| Prop           | Type                                                                            | Default           | Description                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialFocus` | `MaybeRefOrGetter<HTMLElement \| ComponentPublicInstance \| null \| undefined>` | the dialog window | The element to focus when the dialog opens — resolved at open time.                                                                                         |
| `restoreFocus` | `MaybeRefOrGetter<HTMLElement \| ComponentPublicInstance \| null \| undefined>` | —                 | Focused on close when nothing meaningful held focus before opening (the body, or an element since removed) — resolved at close time. Typically the trigger. |
| `...attrs`     | `HTMLAttributes`                                                                | —                 | Merged onto the rendered `<div>`.                                                                                                                           |

### `Dialog.Title`

Names the dialog (wires `aria-labelledby` on Content). Default slot: the
title text.

| Prop       | Type             | Default | Description                      |
| ---------- | ---------------- | ------- | -------------------------------- |
| `...attrs` | `HTMLAttributes` | —       | Merged onto the rendered `<h2>`. |

### `Dialog.Description`

Describes the dialog (wires `aria-describedby` on Content). Default slot: the
description.

| Prop       | Type             | Default | Description                       |
| ---------- | ---------------- | ------- | --------------------------------- |
| `...attrs` | `HTMLAttributes` | —       | Merged onto the rendered `<div>`. |

### `Dialog.Close`

Dismisses the dialog from inside — the single dismissal affordance (the
corner `×`), rendered once per dialog and kept the focus cycle's last stop per
the core contract. Action buttons (Cancel/Confirm) are your own `<button>`s
driving state, so they keep their natural Tab order. Default slot: the
button's content.

| Prop       | Type                   | Default | Description                          |
| ---------- | ---------------------- | ------- | ------------------------------------ |
| `...attrs` | `ButtonHTMLAttributes` | —       | Merged onto the rendered `<button>`. |
