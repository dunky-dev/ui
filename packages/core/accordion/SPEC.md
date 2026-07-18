# SPEC / Accordion

## Reference

- **W3C pattern**: [APG Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/),
  over the normative
  [WAI-ARIA 1.2 `button` / `region` / `aria-expanded` / `aria-controls`](https://www.w3.org/TR/wai-aria-1.2/)
  definitions.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Radix, Base UI, and Ark accordions.

## Overview

An accordion is a vertically (or horizontally) stacked set of headers, each
controlling a section of content that expands or collapses beneath it. It
condenses long or optional content into scannable headings — settings groups,
FAQs, progressive disclosure — where the user chooses what to read instead of
scrolling past everything.

## Anatomy

```
<Accordion>          — root; owns the open value and keyboard focus, renders nothing of its own
  |_ <Item>          — one disclosure: identified by its value, disableable
     |_ <Header>     — the heading wrapper that gives the trigger its outline level
     |  |_ <Trigger> — the button that toggles the item and hosts keyboard navigation
     |_ <Content>    — the section the trigger expands and collapses; hidden while closed
```

## Behavior

Using the accordion is a walkthrough of intent, not a prop list:

- The **root** owns which items are open, exposed controlled and uncontrolled.
  The `type` discriminant picks the value shape: `single` holds at most one
  open item and its value is one string (or `null`), `multiple` holds any
  number and its value is a string array — the value's type follows what the
  mode can express, so an impossible state (two open items in single mode) is
  unrepresentable rather than merely rejected. Every change to the open set is
  reported back through the value callback. A controlled `value` is
  authoritative: a press reports the value it asked for and the open set
  follows the prop — a change the consumer declines leaves the accordion
  exactly where the prop says.
- In `single` mode the accordion is **non-collapsible by default**: re-pressing
  the open item's trigger keeps it open, so one section stays expanded. Opting
  into `collapsible` lets that re-press close it. In `multiple` mode every item
  toggles freely — collapsibility is inherent, not an option.
- An **item** is identified by its `value` — the unit the open set, the ids,
  and the callbacks all speak in. Items register with the machine as they
  appear and unregister as they leave; registration order is the keyboard
  navigation order. A disabled item (its own flag, or the whole accordion's)
  ignores toggle intents and is skipped by keyboard navigation.
- The **trigger** toggles its item and carries the disclosure relationship to
  assistive tech. All triggers sit in the page tab order; the arrow keys move
  focus between them without touching the open state.
- The **content** is the region the trigger controls, labelled by it, and
  hidden while the item is closed. It stays part of the anatomy whether open
  or closed — visibility is state, not existence.

Keyboard interaction, per the APG pattern:

- **Enter / Space** on a trigger toggles its item (the trigger is a native
  button, so activation is inherited, not re-implemented).
- **Arrow keys** move focus across enabled triggers, wrapping at both ends.
  The axis follows `orientation`: a vertical accordion (the default) uses
  ArrowDown / ArrowUp, a horizontal one ArrowRight / ArrowLeft; the cross-axis
  keys are left alone.
- **Home / End** jump to the first / last enabled trigger.

The machine decides which trigger holds focus; the substrate only carries that
decision to the platform. Navigation that lands nowhere (every item disabled,
or the whole accordion disabled) moves nothing — and a disabled accordion does
not consume the keys at all, so their page defaults survive.

## States

The machine's states track where keyboard focus is; the open set lives in
context and changes in any state.

| State     | Behavior                                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| `idle`    | No trigger holds focus. Toggle intents and item registration work; keyboard navigation has no anchor and is ignored. |
| `focused` | A trigger holds focus. Arrow / Home / End intents move the focused trigger across enabled items, wrapping.           |

### Toggle gating

A toggle intent is gated in the machine, not the substrate: it is ignored when
the accordion or the item is disabled, and — in single non-collapsible mode —
when it would close the open item. An allowed toggle in `single` mode replaces
the open set; in `multiple` mode it adds or removes just that item. Under a
controlled `value` an allowed toggle moves nothing: it reports the open set it
asked for through the value callback, and the machine follows the prop when
the driver re-syncs it.

### Focus movement

Arrow / Home / End intents resolve against the registration order, skipping
disabled items and wrapping at the ends. The machine records the new focused
value and emits a focus request through a mailbox slot — a fresh token per
move, so the substrate reacts to every move, even one that lands on the same
trigger. DOM focus then follows the machine; the trigger's own focus/blur
events report back where focus actually is.

## Accessibility

Per APG Accordion:

- **Trigger**: a button carrying `aria-expanded` for the item's state and
  `aria-controls` referencing its content. Disabled items expose
  `aria-disabled` — the machine ignores their toggles, so the trigger stays
  focusable and discoverable rather than vanishing from the tab order. In
  single non-collapsible mode the open item's trigger also announces
  `aria-disabled` (per APG: a visible panel that cannot be collapsed disables
  its header) — presentation only, so keyboard navigation still visits it and
  the item's `data-disabled` is untouched.
- **Header**: a heading wrapping the trigger, giving it a place in the page
  outline.
- **Content**: `role="region"` labelled by its trigger (`aria-labelledby`), so
  an expanded section is a navigable landmark announced by its heading.
- **Ids**: every trigger/content id derives from the root's substrate-minted
  id plus the item's value, so the cross-references always agree and stay
  SSR-safe. The value is URI-encoded into the id, so any value — whitespace
  included — yields a valid HTML id and a single resolvable IDREF.
- **Styling hooks**: every part carries `data-state` (`open` / `closed`),
  `data-disabled` when disabled, and `data-orientation`.

## Constraints

- `aria-expanded` / `aria-controls` / `aria-labelledby` always describe the
  actual open state and reference ids that resolve.
- In `single` mode at most one item is ever open; non-collapsible `single`
  never reaches all-closed through user interaction (a controlled value or
  default can still express it).
- Toggle and navigation intents on disabled items are ignored in the machine —
  no substrate may re-implement the gate.
- Every change to the open set — or, under a controlled `value`, every change
  a press asked for — is reported to the consumer; the controlled prop itself
  is never echoed back through the callback.
- Keyboard navigation order is registration order: an item mounted later
  appends to the order even if it renders earlier in the document.
- `type`, `collapsible`, and controlled-ness are fixed at build time;
  `disabled`, `orientation`, and the controlled `value` re-sync from props
  through machine events.
- Horizontal navigation is LTR-fixed in v0: `orientation="horizontal"` always
  maps next to ArrowRight and previous to ArrowLeft. RTL awareness (a `dir`
  option flipping the horizontal arrows, as Radix / Base UI / Ark do) is a
  deliberate v0 exclusion, to be added with the wider direction story.

## Internals

- **Value shape follows the mode** (Radix's discriminant, over Ark's
  always-array): `single` speaks `string | null`, `multiple` speaks
  `string[]`. Internally the machine holds one canonical `string[]` — the
  connect and the substrate translate at the edges, so the machine has a
  single code path.
- **Registration order over DOM order**: the machine cannot see a DOM, so
  navigation order is the order items report themselves. This keeps the core
  substrate-free at the cost of the reorder caveat under Constraints.
- **`aria-disabled` over native `disabled`** on the trigger: the binding
  vocabulary maps logical `disabled` to the ARIA attribute, keeping disabled
  triggers perceivable to assistive tech; the actual gate lives in the
  machine's guards.
- **Focus is a mailbox, not derived state**: which trigger should receive DOM
  focus is an event-shaped decision (it can re-fire with the same target), so
  it flows through a fresh-token context slot rather than being derived from
  `focusedValue`.
- **The root renders no element of its own** — a deliberate v0 deviation from
  the Radix / Base UI / Ark root `div`. The accordion needs no container for
  behavior or accessibility (keyboard handling lives on the triggers, and no
  ARIA relationship binds the items to a wrapper), so the root owns only state
  and a root element would exist purely for consumer layout — which the
  consumer supplies. Revisited together with the polymorphic-rendering
  decision.
- **A controlled value is authoritative** (the Radix semantics): controlled-ness
  is seeded into context at build time, and an allowed toggle then emits the
  open set it asked for through an intent mailbox instead of moving the value —
  the machine moves only when the driver re-syncs the prop. Uncontrolled
  accordions move immediately and report from the value itself, so a rejected
  update can never leave the UI drifted from the prop.
