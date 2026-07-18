# SPEC / Switch

## Reference

- **W3C pattern**: [APG Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/),
  over the normative
  [WAI-ARIA 1.2 `switch`](https://www.w3.org/TR/wai-aria-1.2/#switch) role
  definition.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Radix, Base UI, and Ark switches.

## Overview

A switch is a binary control that turns a setting on or off, taking effect
immediately — airplane mode, notifications, dark theme. Unlike a checkbox it
never collects a choice for later submission and never has a mixed state: it
is always exactly on or off.

## Anatomy

```
<Switch>          — root; owns checked state, renders nothing of its own
  |_ <Control>    — the interactive element: carries the switch role and checked state
  |  |_ <Thumb>   — the knob; purely visual, styled off data-state
  |_ <Label>      — names the control; pressing it toggles
```

## Behavior

Using the switch is a walkthrough of intent, not a prop list:

- The **root** owns the checked state, exposed controlled and uncontrolled,
  mirroring native patterns: an uncontrolled switch can be seeded checked,
  while a controlled consumer drives it from outside — and every toggle intent
  is reported back so the consumer stays in sync. Controlled is that sync
  contract, not a hard gate: a toggle intent takes effect immediately and is
  reported; the `checked` prop re-applies only when its value changes.
- The **control** is the single interactive element. Pressing it toggles; it
  carries the `switch` role and the checked state to assistive tech.
- The **thumb** is purely visual — the knob consumers animate between the two
  ends of the track. It carries no behavior, only the styling hooks.
- The **label** names the control. Pressing it toggles too, matching native
  label ergonomics. The control's ARIA name follows what is actually rendered
  — an omitted Label never leaves a dangling reference.
- **Disabled** blocks toggling — from the control and the label alike — and is
  exposed to assistive tech and styling. It gates user intent only: a
  controlled or programmatic change still applies while disabled, so the
  consumer's state never desyncs.

## States

| State       | Behavior                                                                 |
| ----------- | ------------------------------------------------------------------------ |
| `unchecked` | The setting is off. A toggle intent moves to `checked` unless disabled.  |
| `checked`   | The setting is on. A toggle intent moves to `unchecked` unless disabled. |

### Disabled

Disabled is a flag over both states, not a third state: the switch keeps its
checked value while disabled and resumes toggling when re-enabled. The
decision to block lives in the machine, so every substrate inherits it — a
part's press binding never second-guesses it.

### Label presence

A Label can appear or disappear at any time — the ARIA name relationship on
the Control always follows what is actually rendered.

## Accessibility

Per APG Switch:

- **Role**: the control is `switch`, with `aria-checked` always present and
  mirroring the state — `true` or `false`, never mixed (the switch is binary).
- **Name**: the control is labelled by the rendered Label, or by an accessible
  label the consumer puts on the control in the no-label case. One of the two
  must be present.
- **Keyboard**: the control is focusable and Space toggles (Enter as well on a
  substrate whose native control activates on Enter). Substrates deliver this
  by rendering a natively activatable element — activation stays a single
  "press" intent.
- **Disabled**: exposed as `aria-disabled`; every part also carries
  `data-disabled` for styling.
- **State styling**: every part carries `data-state="checked" | "unchecked"` —
  the consumer's styling and animation hook.

## Constraints

- The control must always resolve an accessible name — from a rendered Label
  or a consumer-supplied label — never neither.
- ARIA labelled-by must only reference elements that are actually rendered.
- `aria-checked` always mirrors the machine state; it is never `mixed`.
- Every checked ⇄ unchecked transition, whatever its cause, is reported to
  the consumer.
- While disabled, no user intent changes the state; controlled and
  programmatic changes still apply.
- Form integration (name/value, hidden input, form reset) is out of scope for
  v0 — the switch is a pure setting control.

## Internals

- **The Label is not a substrate-native `<label>`.** A native label forwards
  activation to its control, which would double-fire next to the part's own
  press-to-toggle binding — and not every substrate has a label element. The
  Label part instead carries its own press binding (toggling through the same
  machine intent, so the disabled guard applies) and the name flows through
  `aria-labelledby`.
- **Toggle is one event, gated in the machine.** Control press, label press,
  and keyboard activation all send the same `toggle` intent; the disabled
  guard decides. Programmatic changes (`check` / `uncheck`) bypass the guard
  on purpose — see Disabled under States.
