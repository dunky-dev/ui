---
'@dunky.dev/dialog': minor
'@dunky.dev/react-dialog': minor
'@dunky.dev/dom-focus-trap': minor
'@dunky.dev/dom-scroll-lock': minor
'@dunky.dev/react-use-focus-trap': minor
'@dunky.dev/react-use-scroll-lock': minor
---

Add the Dialog primitive — a modal dialog following the WAI-ARIA APG pattern,
shipped as an agnostic core (`@dunky.dev/dialog`) plus a React binding
(`@dunky.dev/react-dialog`), with its focus and scroll containment extracted
as reusable packages.

- Compound React API: `Dialog` + `Dialog.Trigger` / `Portal` / `Backdrop` /
  `Viewport` / `Content` / `Title` / `Description` / `Close`. `Content`
  renders the native `<dialog>` element (without `showModal()` — the behavior
  contract owns modality, consistently across browsers).
- Controlled (`open` + `onOpenChange`) and uncontrolled (`defaultOpen`) open
  state; `modal` (default `true`); `role="dialog" | "alertdialog"`.
- Configurable dismissal: `closeOnEscape`, `closeOnInteractOutside` (defaults
  `false` for alert dialogs), with per-occurrence vetoes via
  `onEscapeKeyDown` / `onInteractOutside`.
- A11y per APG: `aria-modal`, `aria-labelledby`/`aria-describedby` wired to
  the rendered Title/Description only, Tab trap while modal, focus restore on
  close, and a body scroll lock that compensates for the vanished scrollbar.
  Opening focuses the dialog's first form field when it has one (otherwise
  the dialog window itself) — or the `initialFocus` element when `Content` is
  given one.
- The page behind a modal dialog is inert: hidden from assistive technology
  and unreachable by pointer, find-in-page, or programmatic focus.
- Nested dialogs: each layer stays independent; Escape and outside presses
  dismiss the topmost first, and everything beneath it is hidden and inert.
- Containment ships as framework-free utils — `@dunky.dev/dom-focus-trap`
  (`trapFocus`) and `@dunky.dev/dom-scroll-lock` (`lockScroll`, targeting any
  scroll container — the body by default — shared and
  reference-counted) — wrapped by the React hooks
  `@dunky.dev/react-use-focus-trap` and `@dunky.dev/react-use-scroll-lock`,
  so future substrates (vue, solid, ...) reuse the same behavior.

```tsx
import { Dialog } from '@dunky.dev/react-dialog'
;<Dialog onOpenChange={console.log}>
  <Dialog.Trigger>Delete...</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Viewport>
      <Dialog.Content>
        <Dialog.Title>Delete file?</Dialog.Title>
        <Dialog.Description>This cannot be undone.</Dialog.Description>
        <Dialog.Close>Cancel</Dialog.Close>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
```
