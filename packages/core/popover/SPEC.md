# SPEC / Popover

## Reference

- **W3C pattern**: there is no dedicated APG popover pattern — a popover is a
  non-modal dialog, so it draws on the
  [APG Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
  pattern where applicable, over the normative
  [WAI-ARIA 1.2 `dialog`](https://www.w3.org/TR/wai-aria-1.2/#dialog) and
  [`aria-haspopup`](https://www.w3.org/TR/wai-aria-1.2/#aria-haspopup)
  definitions.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Radix, Base UI, and Ark popovers.

## Overview

A popover is a floating panel opened from a trigger that coexists with the
page instead of interrupting it: the user can keep working around it, and it
gets out of the way on its own — an interaction anywhere outside dismisses it.
It is the home for filters, pickers, quick settings, and other secondary UI
that supplements the page rather than taking it over. Where a dialog demands a
decision, a popover offers one.

## Anatomy

```
<Popover>           — root; owns open/close state, renders nothing of its own
  |_ <Trigger>      — the control that toggles the popover; the panel is
  |                   anchored to it and focus returns here on close
  |_ <Content>          — the floating panel itself
     |_ <Title>         — names the popover
     |_ <Description>   — describes the popover
     |_ <Close>         — the in-panel dismissal affordance
```

## Behavior

Using the popover is a walkthrough of intent, not a prop list:

- The **root** owns open/close state, exposed controlled and uncontrolled,
  mirroring native patterns: an uncontrolled popover can be seeded open, while
  a controlled consumer drives it from outside. Every open/close intent —
  trigger press, Escape, outside interaction, imperative close — is reported
  back; a controlled popover stops there and only moves when the `open` prop
  does, so ignoring a reported intent is how the consumer vetoes it. Whether
  the popover is controlled is fixed at mount.
- The **trigger** toggles the popover and carries the popup relationship to
  assistive tech. It is also the element focus returns to on close. A press on
  the trigger while the popover is open is a toggle, never an outside
  interaction: it closes in one motion, with no dismiss-then-reopen flicker.
- The **content** is the floating panel, labelled and described by the Title
  and Description parts when they are rendered. The popover is non-modal by
  default: the page around it stays fully interactive, and any interaction
  landing outside the panel — a press, or focus moving out — counts as an
  outside interaction and dismisses it (subject to the dismissal settings).
  Opting into `modal` flips that: focus is trapped inside and everything
  outside is hidden from assistive tech until the popover closes.
- **Title / Description** name and describe the popover. The panel's ARIA name
  and description always follow what is actually rendered — an omitted part
  never leaves a dangling reference. When no Title is rendered, an accessible
  label goes on the content instead.
- **Close** dismisses from inside — the visible close affordance alongside
  Escape.

Dismissal is configurable at the root: Escape closing and outside-interaction
closing can each be toggled off, and the consumer can veto a single occurrence
of either from its handler.

Popovers participate in the shared overlay layer stack
(`@dunky.dev/dom-layer-stack`): a popover opened from within another overlay —
a popover, a dialog — stacks on top of it, Escape unwinds one layer per press,
and an interaction inside a nested layer never counts as outside the one
beneath. Being registered is also what keeps a non-modal popover reachable
when it floats above a modal layer.

## States

| State    | Behavior                                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closed` | Nothing is shown beyond the trigger. Open intents (trigger press, imperative open) move to `open`.                                                              |
| `open`   | The panel is shown. Close intents close unconditionally; Escape and outside interaction close only if their respective settings allow it and no handler vetoes. |

### Title/Description presence

A Title or Description can appear or disappear at any time, open or closed —
the ARIA relationships on Content always follow what is actually rendered.

## Accessibility

- **Roles**: Content is `dialog`, without `aria-modal` unless the popover opts
  into `modal`. The trigger carries `aria-haspopup="dialog"`, `aria-expanded`,
  and — only while open — `aria-controls` referencing the panel.
- **Name**: the popover is labelled by the rendered Title, or by an accessible
  label on Content in the no-title case. One of the two must be present.
- **Focus, on open**: focus moves into the panel. The consumer-designated
  initial-focus element wins when one is set and can take focus; otherwise the
  first focusable element in the panel; otherwise the panel itself, which is
  focusable in script but not in the tab order.
- **Focus, while open**: non-modal, focus is not trapped — Tab flows naturally
  out of the panel, and focus landing outside is an outside interaction (it
  dismisses, subject to the dismissal settings). Modal, focus is trapped
  inside the panel while it is the topmost layer, and everything outside is
  hidden from assistive tech.
- **Focus, on close**: returns to the element focused before opening (normally
  the Trigger) — except after a focus-out dismissal, where focus stays where
  the user sent it.
- **Keyboard**: Escape closes (unless gated/vetoed) — the topmost layer of a
  stack first, one layer per press.

## Constraints

- Content must always resolve an accessible name — from a rendered Title or an
  accessible label — never neither.
- ARIA labelled-by / described-by must only reference elements that are
  actually rendered.
- A trigger press while open toggles closed — it must never be treated as an
  outside interaction (no dismiss-then-reopen).
- A non-modal popover never blocks the page: no focus trap, no scroll lock,
  nothing hidden from assistive tech.
- Every open ⇄ close intent, whatever its source, is reported to the
  consumer. A controlled popover never transitions on its own — it follows
  the `open` prop alone, and a prop-driven transition is not echoed back.
- Out of scope in v0: positioning (no engine, no anchor or arrow part — the
  consumer positions the panel; `data-state` and the ARIA wiring are the
  hooks) and scroll locking (even a modal popover leaves the page scrollable).

## Design

- **Outside interaction is detected by the substrate, decided by the machine.**
  A popover has no backdrop to catch presses, so detection is document-level
  substrate work (`@dunky.dev/dom-interact-outside`). The detection reports an
  intent through the api's `onInteractOutside`, which fires the consumer's
  veto handler first and then sends `interact.outside` — whether that
  dismisses is gated in the machine, never in a binding.
- **The toggle contract is an exclusion, not a race.** The trigger is excused
  from outside detection (alongside nested layers), so a trigger press reaches
  the machine exactly once, as `toggle`.
- **Non-modal is the default** — the inverse of the dialog. A popover that
  must take over interaction is usually a dialog wearing the wrong hat;
  `modal` exists for the exceptions.
- **Focus-out dismissal falls out of outside detection**: focus landing
  outside the panel is the same `interact.outside` intent as a press, so the
  two can't drift apart.
