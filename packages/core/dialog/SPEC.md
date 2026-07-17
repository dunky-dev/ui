# SPEC / Dialog

## Reference

- **W3C pattern**: [APG Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
  and [APG Alert Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/),
  over the normative
  [WAI-ARIA 1.2 `dialog` / `alertdialog` / `aria-modal`](https://www.w3.org/TR/wai-aria-1.2/#dialog)
  definitions.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Radix, Base UI, and Ark dialogs.

## Overview

A dialog is a window overlaid on the primary window: the app's workflow is
interrupted until the user completes or dismisses it. It is the home for
confirmations, small forms, and critical decisions — anything that must take
over interaction rather than coexist with the page or merely announce.

## Anatomy

```
<Dialog>            — root; owns open/close state, renders nothing of its own
  |_ <Trigger>      — the control that opens the dialog; focus returns here on close
  |_ <Backdrop>     — the layer behind the dialog window; only a modal dialog has one
  |_ <Viewport>     — the positioning and scroll layer around the dialog window
     |_ <Content>       — the dialog window itself
        |_ <Title>       — names the dialog
        |_ <Description> — describes the dialog
        |_ <Close>       — the in-dialog dismissal affordance
```

## Behavior

Using the dialog is a walkthrough of intent, not a prop list:

- The **root** owns open/close state, exposed controlled and uncontrolled,
  mirroring native patterns: an uncontrolled dialog can be seeded open, while a
  controlled consumer drives it from outside — and every open/close intent is
  reported back so the consumer stays in sync.
- The **trigger** toggles the dialog and carries the popup relationship to
  assistive tech. It is also the element focus returns to on close.
- Pressing the **backdrop** — or the **viewport** area around the dialog window —
  counts as an "outside interaction"; whether that dismisses follows the
  dialog's dismissal settings, whichever layer was pressed. Presses inside the
  content never count as outside.
- The **content** is the dialog window, labelled and described by the Title and
  Description parts when they are rendered.
- **Title / Description** name and describe the dialog. The dialog's ARIA name
  and description always follow what is actually rendered — an omitted part
  never leaves a dangling reference. A dialog should always have a Title (APG
  requires an accessible name); when it genuinely can't, an accessible label
  goes on the content instead.
- **Close** dismisses from inside — the visible close affordance the APG
  strongly recommends alongside Escape.

Dismissal is configurable at the root: Escape closing and outside-press closing
can each be toggled off, and the consumer can veto a single occurrence of
either from its handler. Opting into the alert-dialog role changes the defaults
for urgent, destructive interruptions — modality is inherent and outside
presses don't dismiss by default, so the user must choose an action.

Dialogs can be nested — a dialog opened from within another stacks on top of
it, and the stack unwinds one layer at a time. The full contract is
[Nesting](#nesting) under Accessibility.

## States

| State    | Behavior                                                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `closed` | Nothing is shown beyond the trigger. Open intents (trigger press, imperative open) move to `open`.                                              |
| `open`   | Backdrop and content are shown. Close intents close unconditionally; Escape and outside-press close only if their respective settings allow it. |

### Title/Description presence

A Title or Description can appear or disappear at any time, open or closed —
the ARIA relationships on Content always follow what is actually rendered.

## Accessibility

Per APG Dialog (Modal):

- **Roles**: Content is `dialog` (or `alertdialog`), with `aria-modal` when
  modal (the default). The alertdialog variant keeps its description meaningful
  by expecting a Description.
- **Name**: the dialog is labelled by the rendered Title, or by an accessible
  label on Content in the no-title case. One of the two must be present.
- **Focus**: trapped inside the dialog while open and modal — the full contract
  is [Focus trap](#focus-trap) below.
- **Keyboard**: Escape closes (unless gated/vetoed). A visible Close button is
  part of the composition guidance, not just Escape.
- **Scroll**: the page behind a modal dialog doesn't scroll while it is open,
  and hiding its scrollbar doesn't shift the page layout.
- **Nesting**: only the topmost dialog of a stack exists for the user — the
  full contract is [Nesting](#nesting) below.

### Focus trap

Per the [APG modal-dialog keyboard interaction](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboardinteraction):

- **When it applies**: while the dialog is open and modal (the default). A
  non-modal dialog never traps. In a nested stack only the topmost dialog
  traps — the ones beneath it are unreachable until it closes.
- **On open**: focus moves into the dialog — that is the strict rule. The
  consumer-designated initial-focus element wins when one is set and can take
  focus; otherwise a dialog that collects input starts at its first form field
  (input, select, textarea), and any other dialog focuses the dialog window
  itself (Content), which is focusable in script but not in the tab order.
- **While open**: Tab moves forward through the dialog's focusables and wraps
  from the last back to the first; Shift+Tab moves backward and wraps from the
  first — or from the dialog window itself — to the last. Focus never tabs out
  of the dialog.
- **No focusables**: Tab is a no-op; focus stays on the dialog window.
- **On close**: focus returns to the element focused before opening (normally
  the Trigger).

### Nesting

Follows from [WAI-ARIA 1.2 `aria-modal`](https://www.w3.org/TR/wai-aria-1.2/#aria-modal)
semantics: the modal window is the only content exposed to the user, so in a
stack of dialogs only the topmost one exists until it closes.

- **Stacking**: a dialog opened from within an open dialog stacks on top of it,
  at any depth. Each dialog in the stack stays fully independent — its own
  open/close state, role, dismissal settings, and open/close reporting.
- **Topmost only**: only the topmost dialog is interactive and exposed to
  assistive technology. Everything beneath it — the page and every dialog it
  was opened from — is hidden and unreachable, by pointer, keyboard, or screen
  reader.
- **Escape**: dismisses only the topmost dialog, subject to that dialog's own
  dismissal settings — a nested stack unwinds one layer per press.
- **Outside press**: pressing around the topmost dialog is an outside
  interaction for that dialog alone, following its own dismissal settings; the
  dialogs beneath are unaffected.
- **Unwinding**: when the topmost dialog closes, the one beneath becomes
  topmost again — re-exposed, interactive, with focus restored to the element
  focused before the closed dialog opened (normally its trigger).
- **Scroll**: the page stays scroll-locked until the last modal dialog in the
  stack closes.

## Constraints

- Content must always resolve an accessible name — from a rendered Title or an
  accessible label — never neither.
- ARIA labelled-by / described-by must only reference elements that are
  actually rendered.
- While open and modal, focus stays trapped within the dialog; on close it
  returns to the element focused before opening.
- Every open ⇄ close transition, whatever its cause, is reported to the
  consumer.
- The alertdialog role does not dismiss on outside press by default.

## Design

The dialog ships headless: parts carry behavior and ARIA wiring plus a
`data-state` attribute (`open` / `closed`) for the consumer's styling and
animation; visuals belong entirely to the consumer. Focus and scroll
containment live in shared framework-free utilities (`@dunky.dev/focus-trap`,
`@dunky.dev/scroll-lock`) so every substrate inherits identical behavior.

| Position                                        | Why                                                                                                                                                           | Status     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Native `<dialog>` element without `showModal()` | Modality, dismissal, and focus stay driven by this contract, consistent across browsers, instead of splitting authority with the browser's built-in behavior. | `adopted`  |
| No `asChild` composition in v1                  | No slot/composition infrastructure in the repo yet; parts render their natural elements. Revisit with a shared primitive.                                     | `deferred` |
