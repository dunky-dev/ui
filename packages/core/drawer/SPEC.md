# SPEC / Drawer

## Reference

- **W3C pattern**: [APG Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/),
  over the normative
  [WAI-ARIA 1.2 `dialog` / `aria-modal`](https://www.w3.org/TR/wai-aria-1.2/#dialog)
  definitions — a drawer is semantically a modal dialog with a placement.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Ark and Chakra drawers; the shared
  dialog conventions follow the Radix, Base UI, and Ark dialogs.

## Overview

A drawer is a modal panel that slides in from an edge of the screen and takes
over interaction until the user completes or dismisses it. Semantically it is
a dialog; what makes it a drawer is the placement — the panel is anchored to
one edge (left, right, top, or bottom) instead of floating over the center.
It is the home for edge-anchored workflows: settings panels, filters, carts,
and navigation that need the page kept visually in context behind them.

## Anatomy

```
<Drawer>            — root; owns open/close state, renders nothing of its own
  |_ <Trigger>      — the control that opens the drawer; focus returns here on close
  |_ <Backdrop>     — the layer behind the drawer panel, covering the page
  |_ <Viewport>     — the positioning layer that anchors the panel to its edge
     |_ <Content>       — the drawer panel itself
        |_ <Title>       — names the drawer
        |_ <Description> — describes the drawer
        |_ <Close>       — the in-drawer dismissal affordance
```

## Behavior

Using the drawer is a walkthrough of intent, not a prop list:

- The **root** owns open/close state, exposed controlled and uncontrolled,
  mirroring native patterns: an uncontrolled drawer can be seeded open, while a
  controlled consumer drives it from outside. Every open/close intent —
  trigger press, Escape, outside press, imperative close — is reported back;
  a controlled drawer stops there and only moves when the `open` prop does,
  so ignoring a reported intent is how the consumer vetoes it. Whether the
  drawer is controlled is fixed at mount. The root also fixes the
  **placement**: which edge the panel is anchored to, defaulting to the right
  (the trailing-edge convention drawers share). Placement is configuration,
  not state — it never changes while the drawer is open, and every visual part
  carries it as a `data-placement` styling hook next to `data-state`.
- The **trigger** toggles the drawer and carries the popup relationship to
  assistive tech. It is also the element focus returns to on close.
- Pressing the **backdrop** — or the **viewport** area around the panel —
  counts as an "outside interaction"; whether that dismisses follows the
  drawer's dismissal settings, whichever layer was pressed. Presses inside the
  content never count as outside.
- The **content** is the drawer panel, labelled and described by the Title and
  Description parts when they are rendered.
- **Title / Description** name and describe the drawer. The drawer's ARIA name
  and description always follow what is actually rendered — an omitted part
  never leaves a dangling reference. A drawer should always have a Title (APG
  requires an accessible name); when it genuinely can't, an accessible label
  goes on the content instead.
- **Close** dismisses from inside — the visible close affordance the APG
  strongly recommends alongside Escape.

Dismissal is configurable at the root: Escape closing and outside-press closing
can each be toggled off, and the consumer can veto a single occurrence of
either from its handler.

Drawers stack with other overlay layers — a dialog opened from within a drawer
(or a drawer from a dialog) sits on top of it, and the stack unwinds one layer
at a time. The full contract is [Nesting](#nesting) under Accessibility.

## States

| State    | Behavior                                                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `closed` | Nothing is shown beyond the trigger. Open intents (trigger press, imperative open) move to `open`.                                              |
| `open`   | Backdrop and content are shown. Close intents close unconditionally; Escape and outside-press close only if their respective settings allow it. |

### Title/Description presence

A Title or Description can appear or disappear at any time, open or closed —
the ARIA relationships on Content always follow what is actually rendered.

## Accessibility

Per APG Dialog (Modal) — a drawer is always modal:

- **Roles**: Content is `dialog` with `aria-modal`.
- **Name**: the drawer is labelled by the rendered Title, or by an accessible
  label on Content in the no-title case. One of the two must be present.
- **Focus**: trapped inside the drawer while open — the full contract is
  [Focus trap](#focus-trap) below.
- **Keyboard**: Escape closes (unless gated/vetoed). A visible Close button is
  part of the composition guidance, not just Escape.
- **Scroll**: the page behind an open drawer doesn't scroll, and hiding its
  scrollbar doesn't shift the page layout.
- **Nesting**: only the topmost layer of a stack exists for the user — the
  full contract is [Nesting](#nesting) below.

### Focus trap

Per the [APG modal-dialog keyboard interaction](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/#keyboardinteraction):

- **When it applies**: while the drawer is open. In a stack only the topmost
  layer traps — the ones beneath it are unreachable until it closes.
- **On open**: focus moves into the drawer — that is the strict rule. The
  consumer-designated initial-focus element wins when one is set and can take
  focus; otherwise a drawer that collects input starts at its first form field
  (input, select, textarea), and any other drawer focuses the panel itself
  (Content), which is focusable in script but not in the tab order.
- **While open**: Tab moves forward through the drawer's focusables and wraps
  from the last back to the first; Shift+Tab moves backward and wraps from the
  first — or from the panel itself — to the last. Focus never tabs out of the
  drawer.
- **No focusables**: Tab is a no-op; focus stays on the panel.
- **On close**: focus returns to the element focused before opening (normally
  the Trigger).

### Nesting

Drawers join the shared overlay layer stack (`@dunky.dev/dom-layer-stack`), so
they stack with any overlay primitive — another drawer, a dialog — under one
contract. Each layer stays fully independent: its own open/close state,
dismissal settings, and open/close reporting.

- **Topmost only**: only the topmost layer is interactive and exposed to
  assistive technology; everything beneath the topmost modal layer is hidden
  and unreachable, by pointer, keyboard, or screen reader.
- **Escape**: dismisses only the topmost layer, subject to that layer's own
  dismissal settings — a stack unwinds one layer per press.
- **Outside press**: pressing around the topmost layer is an outside
  interaction for that layer alone; the layers beneath are unaffected.
- **Unwinding**: when the topmost layer closes, the one beneath becomes
  topmost again — re-exposed, interactive, with focus restored to the element
  focused before the closed layer opened.
- **Scroll**: the page stays scroll-locked until the last modal layer in the
  stack closes.

## Constraints

- Content must always resolve an accessible name — from a rendered Title or an
  accessible label — never neither.
- ARIA labelled-by / described-by must only reference elements that are
  actually rendered.
- While open, focus stays trapped within the drawer; on close it returns to
  the element focused before opening.
- Every open ⇄ close intent, whatever its source, is reported to the
  consumer. A controlled drawer never transitions on its own — it follows the
  `open` prop alone, and a prop-driven transition is not echoed back.
- Placement is fixed configuration: it selects an edge and rides along as a
  styling hook; it never gates behavior.
- Out of scope for v0, by decision: snap points, swipe/drag gestures, and a
  non-modal mode. A drawer is always modal — `aria-modal`, focus trap, scroll
  lock, backdrop — until a future version says otherwise.

## Design

- **A drawer is a dialog with placement, not a dialog option.** The overlap
  with the dialog core is intentional and the packages stay independent —
  primitives never cross-import; the shared mechanics (layer stack, focus
  trap, scroll lock) live in the shared DOM utils instead.
- **Placement lives in context, not in the state graph.** It changes nothing
  about transitions or gating; the connect stamps it on the visual parts
  (backdrop, viewport, content) as `data-placement` so styling and slide
  animations key off it.
- **Always modal.** Dropping the `modal` and `role` switches keeps the v0
  surface honest: there is no non-modal drawer to configure, and the panel is
  always a plain `dialog` (urgent interruptions are the alert dialog's job).
