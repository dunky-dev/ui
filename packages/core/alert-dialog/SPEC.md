# SPEC / AlertDialog

## Reference

- **W3C pattern**: [APG Alert Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/),
  over the normative
  [WAI-ARIA 1.2 `alertdialog` / `aria-modal`](https://www.w3.org/TR/wai-aria-1.2/#alertdialog)
  definitions.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Radix, Base UI, and Ark alert
  dialogs.
- **Relationship**: the [dialog](../dialog/SPEC.md) can opt into
  `role="alertdialog"`; this primitive is the standalone contract for that
  pattern — see [Constraints](#constraints) for why it is its own package.

## Overview

An alert dialog is a modal window that interrupts the user with an urgent
question and requires a response: confirm a destructive action, acknowledge an
error, approve an irreversible step. Where a plain dialog can be waved away,
an alert dialog cannot — the user must choose. Its whole contract is built
around that: it is always modal, an interaction outside it never dismisses it,
and focus lands on the least destructive answer first.

## Anatomy

```
<AlertDialog>       — root; owns open/close state, renders nothing of its own
  |_ <Trigger>      — the control that opens the alert dialog; focus returns here on close
  |_ <Backdrop>     — the layer behind the alert dialog window; never dismisses
  |_ <Viewport>     — the positioning and scroll layer around the window; never dismisses
     |_ <Content>       — the alert dialog window itself
        |_ <Title>       — names the alert dialog
        |_ <Description> — states the situation that demands a response
        |_ <Cancel>      — the least destructive answer; closes; takes initial focus
        |_ <Action>      — the confirming answer; closes
```

## Behavior

Using the alert dialog is a walkthrough of intent, not a prop list:

- The **root** owns open/close state, exposed controlled and uncontrolled,
  mirroring native patterns: an uncontrolled alert dialog can be seeded open,
  while a controlled consumer drives it from outside. Every open/close intent
  — trigger press, Escape, Cancel/Action press, imperative close — is
  reported back; a controlled alert dialog stops there and only moves when the
  `open` prop does, so ignoring a reported intent is how the consumer vetoes
  it. Whether the alert dialog is controlled is fixed at mount.
- The **trigger** toggles the alert dialog and carries the popup relationship
  to assistive tech. It is also the element focus returns to on close.
- The **backdrop** and the **viewport** area around the window dim and lay out
  the page behind the alert dialog — and that is all they do. Pressing either
  is not a dismissal: an alert dialog demands an answer, so the only ways out
  are the Cancel/Action parts and Escape.
- The **content** is the alert dialog window, labelled and described by the
  Title and Description parts when they are rendered.
- **Title / Description** name and describe the alert dialog. The ARIA name
  and description always follow what is actually rendered — an omitted part
  never leaves a dangling reference. An alert dialog should always have both:
  the title asks the question, the description states the consequence. When a
  Title genuinely can't be rendered, an accessible label goes on the content
  instead.
- **Cancel** is the least destructive answer — it closes without confirming,
  and it is where focus lands when the alert dialog opens, so an accidental
  Enter never destroys anything.
- **Action** is the confirming answer — it closes the alert dialog; the
  consumer's own handler on it performs the confirmed work.

Escape closes, and the consumer can veto a single occurrence from its
`onEscapeKeyDown` handler. Unlike the dialog, there is no dismissal
configuration: modality and the outside-press immunity are the pattern, not
options.

Alert dialogs participate in the shared overlay stack — one opened from
within a dialog (or another alert dialog) stacks on top of it, and the stack
unwinds one layer at a time, per the dialog SPEC's nesting contract and the
`@dunky.dev/dom-layer-stack` contract.

## States

| State    | Behavior                                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `closed` | Nothing is shown beyond the trigger. Open intents (trigger press, imperative open) move to `open`.                               |
| `open`   | Backdrop and content are shown. Cancel, Action, imperative close, and Escape (unless vetoed) close; outside presses never do it. |

### Title/Description presence

A Title or Description can appear or disappear at any time, open or closed —
the ARIA relationships on Content always follow what is actually rendered.

## Accessibility

Per APG Alert Dialog:

- **Roles**: Content is `alertdialog` with `aria-modal` — always; modality is
  not configurable.
- **Name and description**: the alert dialog is labelled by the rendered
  Title, or by an accessible label on Content in the no-title case — one of
  the two must be present. The rendered Description carries the message
  demanding a response; the `alertdialog` role expects one so the situation is
  announced together with the name.
- **Focus**: trapped inside the alert dialog while open. On open, focus moves
  to the consumer-designated initial-focus element when one is set; otherwise
  to Cancel — the least destructive action, per the APG. Either target, when
  it cannot take focus, falls back to the alert dialog window itself
  (focusable in script, not in the tab order). Tab and Shift+Tab wrap within
  the window; on close, focus returns to the element focused before opening
  (normally the Trigger).
- **Keyboard**: Escape closes (unless vetoed).
- **Scroll**: the page behind the alert dialog doesn't scroll while it is
  open, and hiding its scrollbar doesn't shift the page layout.
- **Nesting**: only the topmost layer of a stack exists for the user —
  everything beneath is inert and hidden from assistive tech, per the dialog
  SPEC's [nesting contract](../dialog/SPEC.md#nesting) shared through
  `@dunky.dev/dom-layer-stack`.

## Constraints

- This package stands alone even though the dialog core supports
  `role="alertdialog"` as an option: primitives never cross-import, and the
  alert dialog's guarantees — always modal, outside interaction never
  dismisses, initial focus on the least destructive action — are a contract,
  not a configuration a consumer could weaken. The dialog's alertdialog role
  remains for consumers who want dialog semantics with alert defaults; this
  package is the pattern with the guarantees built in.
- Content must always resolve an accessible name — from a rendered Title or
  an accessible label — never neither.
- ARIA labelled-by / described-by must only reference elements that are
  actually rendered.
- While open, focus stays trapped within the alert dialog; on close it
  returns to the element focused before opening.
- Every open ⇄ close intent, whatever its source, is reported to the
  consumer. A controlled alert dialog never transitions on its own — it
  follows the `open` prop alone, and a prop-driven transition is not echoed
  back.
- Out of scope in v0, deliberately: `modal`, `role`, `closeOnEscape`, and
  `closeOnInteractOutside` options (the first three are fixed by the pattern;
  the last does not exist at all — there is no outside-dismiss intent to
  configure), an outside-interaction callback, and any positioning engine —
  `data-state` on every stateful part (trigger, backdrop, viewport, content;
  the parts inside Content only exist while open) is the styling and
  animation hook.

## Design

- The machine models only the open/close graph and part presence. Escape
  reaches it as a distinct `escape` intent — separate from `close` so a
  substrate can run the consumer veto before sending, and so the intent
  vocabulary matches the dialog's — but there is no outside-interaction event:
  what must never cause a transition is not modeled as an event that could.
- The per-part ids (content/title/description/cancel) all derive from the one
  substrate-minted base id, so the trigger's `aria-controls`, Content's
  `labelledby`/`describedby`, and the initial-focus policy's Cancel lookup
  always agree. Cancel's id is the one non-ARIA member: it is how a substrate
  finds the least destructive action without holding a ref.
- `onOpenChange` fires through a connect reaction over the `openIntent`
  mailbox — the machine never calls a consumer callback. Every open/close
  intent writes the mailbox; when uncontrolled the intent rides along with
  the transition, when controlled the intent is the whole outcome and only
  the substrate's `controlled.sync` echo of the `open` prop moves the
  machine (which is why a prop-driven transition is never echoed back).
