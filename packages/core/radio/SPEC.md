# SPEC / Radio

## Reference

- **W3C pattern**: [APG Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/),
  over the normative
  [WAI-ARIA 1.2 `radiogroup` / `radio` / `aria-checked`](https://www.w3.org/TR/wai-aria-1.2/#radiogroup)
  definitions.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Radix, Base UI, and Ark radio groups.

## Overview

A radio group is a set of mutually exclusive options: checking one unchecks
whatever was checked before. It is the control for "pick exactly one" —
settings with a handful of choices, plan pickers, segmented decisions — where
every option should be visible at once rather than folded into a select.

## Anatomy

```
<Radio>                    — root; owns the checked value, renders nothing of its own
  |_ <Group>               — the radio group surface; carries the group semantics
     |_ <Item>             — one option; checked or unchecked, one item tabbable at a time
     |  |_ <ItemIndicator> — the visual checked mark; exists only while its item is checked
     |_ <ItemLabel>        — names its item; pressing it selects the item
```

## Behavior

Using the radio group is a walkthrough of intent, not a prop list:

- The **root** owns the checked value, exposed controlled and uncontrolled,
  mirroring native patterns: an uncontrolled group can be seeded with a
  default value, while a controlled consumer drives it from outside — and
  every value change is reported back so the consumer stays in sync.
- The **group** is the surface holding the items. It carries the group role,
  its orientation hint, and the group-wide disabled state.
- Each **item** represents one value. Pressing an enabled item selects it and
  moves focus onto it — not every browser focuses a pressed button, and arrow
  navigation must continue from the pressed item. Selecting one item deselects
  the others by definition — the group holds at most one checked value. Items
  announce themselves to the machine as they appear and disappear, and that
  registration order is the navigation order.
- Arrow keys walk the enabled items from the focused one, wrapping at both
  ends, and **selection follows focus**: landing on an item checks it. Space
  checks a focused item that isn't checked yet (the tab-in case, when focus
  lands on an unchecked item). Enter deliberately does nothing — per the APG,
  radio groups don't act on Enter, and suppressing it keeps an implicit form
  submission from firing under a keyboard user.
- The **item indicator** is the visual checked mark. It exists only while its
  item is checked — presence is the styling contract, on top of the
  `data-state` every part carries.
- The **item label** names its item, wired by id so assistive tech reads the
  association. Pressing the label selects the item and moves focus onto it,
  matching how a native label activates its control. The item's ARIA
  labelling always follows what is actually rendered — an omitted label never
  leaves a dangling reference.

Disabling gates everything: a disabled group selects nothing and offers no
tabbable item, and a disabled item can't be selected, isn't tabbable, and is
skipped by arrow navigation. Disabled state is carried as `data-disabled` for
styling. Programmatic control is the exception — the consumer's controlled
value is authoritative and lands even while disabled, including `null` to
clear the selection.

## States

| State  | Behavior                                                                                                                                       |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `idle` | The single machine state. Select and navigate intents are gated by guards; which value is checked is context, not a finite state (see Design). |

### Item states

Every item (and its indicator and label) is `checked` or `unchecked` —
exposed as `data-state` — derived from the one group value.

## Accessibility

Per APG Radio Group:

- **Roles**: the group surface is `radiogroup`; every item is `radio` with
  `aria-checked` reflecting whether it holds the group's value.
- **Name**: each item is labelled by its rendered ItemLabel; the group itself
  needs an accessible name from the consumer (a label or `aria-label` on the
  Group). Labelled-by must only reference elements that are actually
  rendered.
- **Roving tabindex**: exactly one item is in the tab order — the checked
  item, or the first enabled item while nothing is checked (or the checked
  item is disabled). Tab always enters the group on that item and leaves the
  group on the next press.
- **Keyboard**: ArrowDown/ArrowRight move to the next enabled item,
  ArrowUp/ArrowLeft to the previous, wrapping at both ends — moving focus and
  selecting in one step. Space checks a focused unchecked item. Arrow and
  Space presses never scroll the page.
- **Disabled**: conveyed as `aria-disabled` — the item stays perceivable to
  assistive tech, out of the tab order, with its interactions gated in the
  machine rather than by the host platform.
- **Orientation**: an optional hint (`aria-orientation`) describing the
  visual layout. It is presentational — all four arrow keys navigate
  regardless, so a layout change never breaks a learned key.

## Constraints

- The group holds at most one checked value; checking an item unchecks every
  other by construction, never by cleanup.
- Exactly one item is tabbable whenever the group is enabled and has an
  enabled item; none otherwise.
- A disabled item (or group) never selects through interaction — only the
  consumer's programmatic value can land while disabled.
- Every value change, whatever its cause, is reported to the consumer.
- ARIA labelled-by must only reference elements that are actually rendered.
- Item values must be unique within a group and safe to embed in an element
  id (no whitespace).
- An item that registers after the initial mount appends to the end of the
  navigation order, so inserting an item mid-list navigates it last —
  DOM-order-aware registration is out of scope in v0.
- Out of scope in v0: form integration (no hidden `<input>` mirroring the
  value into native form submission), required/validation states, and
  reading-direction (RTL) aware arrow keys.

## Design

- **One state, context-driven.** A radio group's interesting state is _which
  value is checked_ — a value, not a finite state — so the machine is a
  single `idle` state over context, with guards gating the `select` and
  `navigate` intents. The graph stays honest instead of inventing states.
- **Registration order is navigation order.** Items register with the
  machine as they mount (value + disabled) and unregister as they unmount; a
  disabled flip updates the entry in place. Arrow navigation walks that list,
  so the core never needs to know about the host's element tree.
- **Focus is a machine decision, delivered by mailbox.** Navigation computes
  the target item and writes a fresh focus token into a context slot; the
  substrate reacts to the token by moving real focus. The binding stays
  behavior-free — it never decides where focus goes, only executes it.
- **Ids derive from one base id.** The substrate mints a single SSR-safe id;
  the item and label ids for each value derive from it (exposed as a shared
  helper), so an item's identity and its label's cross-reference always
  agree, in every substrate.
