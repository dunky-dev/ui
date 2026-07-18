# SPEC / Tooltip

## Reference

- **W3C pattern**: [APG Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/),
  over the normative
  [WAI-ARIA 1.2 `tooltip`](https://www.w3.org/TR/wai-aria-1.2/#tooltip)
  definition.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Radix, Base UI, and Ark tooltips.

## Overview

A tooltip is a small, non-interactive popup that describes the element it is
attached to. It never takes over interaction: it appears on hover or keyboard
focus, disappears the moment it stops being relevant, and only ever
supplements the trigger — the interface must remain fully usable without it.

## Anatomy

```
<Tooltip>           — root; owns the open lifecycle, renders nothing of its own
  |_ <Trigger>      — the element the tooltip describes; hover/focus opens it
  |_ <Content>      — the tooltip popup itself (role=tooltip)
```

## Behavior

Using the tooltip is a walkthrough of intent, not a prop list:

- The **root** owns the open lifecycle, exposed controlled and uncontrolled: an
  uncontrolled tooltip can be seeded open, a controlled consumer drives it from
  outside — and every show/hide is reported back so the consumer stays in sync.
- **Hover is intent, not an accident.** Pointer enter on the trigger doesn't
  show the tooltip immediately — it starts the open delay, and only a pointer
  that stays past it opens the tooltip. Pointer leave symmetrically starts the
  close delay; re-entering the trigger — or moving the pointer into the content
  — while the close delay runs cancels it and the tooltip stays open. Leaving
  the content follows the same leave rules as leaving the trigger. Both delays
  are configurable per tooltip.
- **Keyboard focus skips the delays.** Focusing the trigger shows the tooltip
  immediately; blurring hides it immediately — a keyboard user never waits.
- **The tooltip yields instantly on dismissal.** Escape and a trigger press —
  pointerdown, or the activation (click) a keyboard Enter/Space fires — hide it
  immediately, whatever state it is in — pressing the trigger means the user is
  acting, and the tooltip must not linger over the action. The focus the
  trigger receives from a press does not re-open it (see [Design](#design));
  the next deliberate focus or hover does.
- The **content** carries `role="tooltip"` and describes the trigger via
  `aria-describedby` while it is shown — never while hidden, so the reference
  never dangles.

## States

| State     | Behavior                                                                                                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closed`  | Nothing is shown. Pointer enter starts the open delay (`opening`); focus or an imperative open shows the tooltip immediately.                                                                                             |
| `opening` | The open delay is running; nothing is shown yet. The delay elapsing — or focus, or an imperative open — shows the tooltip; pointer leave, blur, Escape, a trigger press, or an imperative close cancels back to `closed`. |
| `open`    | The tooltip is shown. Pointer leave starts the close delay (`closing`); blur, Escape, a trigger press, or an imperative close hides it immediately.                                                                       |
| `closing` | The close delay is running; the tooltip is still shown. The delay elapsing — or blur, Escape, a trigger press, or an imperative close — hides it; pointer enter (trigger or content) or focus cancels back to `open`.     |

The consumer-facing `open` value — what `onOpenChange` reports and what
substrates use to mount/unmount the popup — is "the tooltip is shown":
`open` or `closing`. The full four-state lifecycle is exposed as `data-state`
on every part, the styling and animation hook for delayed-open and fade-out
treatments.

## Accessibility

Per APG Tooltip:

- **Role**: Content is `tooltip`. It is a description, not a name — the
  trigger references it with `aria-describedby`, only while shown.
- **Keyboard**: the tooltip shows on focus without delay and hides on blur, on
  Escape, and on activating the trigger (Enter/Space press it — a keyboard user
  acting is dismissal too). Escape works wherever focus is — it is a
  document-level dismissal, not a trigger keybinding.
- **Hover persistence**: the pointer can move from the trigger into the
  content without the tooltip disappearing (WCAG 1.4.13 — hoverable), and the
  close delay gives the pointer time to cross the gap (dismissable comes from
  Escape).
- **Trigger focusability**: the tooltip only works on a focusable trigger —
  keyboard users reach it through focus. The substrate's trigger part renders
  a focusable element by default.

## Constraints

- Content must be non-interactive, supplementary text — a tooltip is never the
  only way to reach an action or information (it is unreachable on touch).
- `aria-describedby` on the trigger must only reference the content while the
  tooltip is shown.
- Every show ⇄ hide transition, whatever its cause, is reported to the
  consumer exactly once — the `open`/`closing` pair counts as one shown phase.
- Escape and a trigger press always dismiss — dismissal is not configurable.
- Out of scope in v0: positioning (the consumer positions the content
  relative to the trigger) and cross-tooltip skip-delay coordination (moving
  between adjacent triggers always re-runs the open delay).

## Design

- **Timers live in the machine.** `opening`/`closing` are explicit states whose
  durations (`openDelay`/`closeDelay`, defaults 700/300 ms) are seeded into
  context at build time; the timed transitions are declared on the states via
  the runtime's `after`, which schedules on state entry and auto-cancels on
  exit. Substrates add no timer logic — a binding stays behavior-free, and a
  new substrate inherits the delay behavior whole.
- **A press suppresses the focus it causes.** Pointerdown on the trigger closes
  the tooltip, but in the DOM that same press focuses the trigger, and a naive
  focus-opens rule would instantly re-open it. The machine arms a context flag
  on `pointer.down`; the next `focus` consumes the flag and stays closed
  instead of opening. The flag's lifetime is bounded to the press interaction:
  not every press produces a focus (Safari and Firefox on macOS never focus a
  clicked button, touch taps don't either), so the `press` (click) that ends
  every activation sequence disarms a flag no focus consumed — click is the
  one event that always arrives after any focus the press caused — and `blur`
  disarms it too (a press on an already-focused trigger, followed by tabbing
  away). Without that bound, a stale flag would swallow the next deliberate
  keyboard focus.
