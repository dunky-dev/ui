# SPEC / Checkbox

## Reference

- **W3C pattern**: [APG Checkbox](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)
  (dual-state and mixed-state), over the normative
  [WAI-ARIA 1.2 `checkbox` / `aria-checked`](https://www.w3.org/TR/wai-aria-1.2/#checkbox)
  definitions.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Radix, Base UI, and Ark checkboxes.

## Overview

A checkbox is a binary choice the user toggles: checked or unchecked, with a
third `indeterminate` display state for "partially" — a parent whose group is
partly selected, or a value not yet resolved. It is the building block for
option lists, consent prompts, and bulk-selection headers.

## Anatomy

```
<Checkbox>          — root; owns the checked state, renders nothing of its own
  |_ <Control>      — the interactive element carrying the checkbox role
  |_ <Indicator>    — the visual mark; exists only while checked or indeterminate
  |_ <Label>        — names the control; pressing it toggles too
```

## Behavior

Using the checkbox is a walkthrough of intent, not a prop list:

- The **root** owns the checked state — `true`, `false`, or `"indeterminate"` —
  exposed controlled and uncontrolled, mirroring native patterns: an
  uncontrolled checkbox can be seeded checked, while a controlled consumer
  drives the value from outside — and every change the consumer didn't write
  itself is reported back so the consumer stays in sync without hearing its own
  controlled writes echoed (see [Design](#design)).
- The **control** is the element the user operates. Pressing it — pointer or
  keyboard — toggles: unchecked becomes checked, checked becomes unchecked, and
  indeterminate resolves to checked (the APG mixed-state cycle, minus the mixed
  stop: `indeterminate` is a consumer-set display state, never a stop the user
  cycles through).
- The **indicator** is the check mark's home. It exists only while the checkbox
  is checked or indeterminate, so showing/hiding the mark needs no conditional
  styling — though which glyph to render (check vs. dash) is the consumer's,
  keyed off `data-state`.
- The **label** names the control and is itself an interaction surface:
  pressing it toggles, matching the native label affordance.
- **Disabled** turns interaction off: no press — control or label — moves the
  machine, while the current value stays visible. Programmatic and controlled
  updates still apply; disabled gates the user, not the consumer.

Indeterminate is never entered by interaction — only the consumer puts the
checkbox there (controlled `checked="indeterminate"`, a programmatic set, or
seeding). A press always leaves it, to checked.

## States

| State           | Behavior                                                                          |
| --------------- | --------------------------------------------------------------------------------- |
| `unchecked`     | The option is off. A toggle intent moves to `checked` unless disabled.            |
| `checked`       | The option is on. A toggle intent moves to `unchecked` unless disabled.           |
| `indeterminate` | The option is "partially" on. A toggle intent moves to `checked` unless disabled. |

Every state carries `data-state` (`checked` / `unchecked` / `indeterminate`) on
every part, and `data-disabled` on every part while disabled — the styling
hooks.

## Accessibility

Per APG Checkbox:

- **Role**: the control is `checkbox`, with `aria-checked` reflecting the value
  — `true`, `false`, or `mixed` for indeterminate.
- **Name**: the control is labelled by the rendered Label via `aria-labelledby`
  (see [Design](#design)); with no Label, an accessible label goes on the
  control itself.
- **Keyboard**: Space toggles. Enter does not activate a checkbox — the core
  suppresses the substrate's default so a button-backed control doesn't toggle
  on Enter.
- **Disabled**: conveyed as `aria-disabled` (plus `data-disabled` for styling)
  rather than a native disabled attribute, so the control stays focusable and
  discoverable to assistive tech; the machine — not the host — blocks the
  toggle.

## Constraints

- The user can never reach `indeterminate` by interacting; a toggle from it
  always lands on `checked`.
- While disabled, no user intent — control press, label press, keyboard —
  changes the value; programmatic and controlled updates still do.
- Every value transition is reported to the consumer, except the one the
  consumer wrote itself: re-syncing the controlled `checked` prop never echoes
  back through `onCheckedChange`.
- `aria-labelledby` must only reference a Label that is actually rendered.
- Out of scope for v0: native form integration (hidden input, `name` / `value` /
  `required`, form reset) and checkbox groups (select-all wiring stays the
  consumer's).

## Internals

- **Label association is ARIA, not the native `<label for>`.** The core mints
  the control and label ids from the one root id and wires `aria-labelledby`,
  and the label's toggle is a machine event like any other. A native label's
  click-forwarding is host behavior the machine can't gate — it would bypass
  the disabled guard and double-toggle a nested control — and it exists on only
  one substrate; the ARIA relationship behaves identically everywhere. The
  trade: a label press toggles but does not move focus to the control the way
  `<label for>` forwarding does — accepted for v0. Forwarding focus would need
  a core-sanctioned focus intent (a binding adds no behavior of its own), a
  candidate for a later iteration.
- **`checked` / `defaultChecked` accept `boolean | "indeterminate"`** — one
  value models the whole display state, so a bulk-selection parent is driven by
  a single controlled prop instead of a separate indeterminate flag.
