# SPEC / Collapsible

## Reference

- **W3C pattern**: [APG Disclosure (Show/Hide)](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/),
  over the normative
  [WAI-ARIA 1.2 `aria-expanded` / `aria-controls`](https://www.w3.org/TR/wai-aria-1.2/#aria-expanded)
  definitions.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Radix, Base UI, and Ark collapsibles.

## Overview

A collapsible is a disclosure: a trigger that shows and hides an associated
content region in place. It coexists with the page rather than interrupting
it — the home for "show more", expandable panels, and collapsible sidebars.
It is the simplest open/close primitive: two states, one intent.

## Anatomy

```
<Collapsible>       — root; owns open/close state, renders nothing of its own
  |_ <Trigger>      — the control that toggles the content
  |_ <Content>      — the region that is shown or hidden
```

## Behavior

- The **root** owns open/close state, exposed controlled and uncontrolled,
  mirroring native patterns: an uncontrolled collapsible can be seeded open,
  while a controlled consumer drives it from outside — and every open/close
  intent is reported back so the consumer stays in sync.
- The **trigger** toggles the content and carries the disclosure relationship
  to assistive tech: whether the content is expanded, and which region it
  controls.
- The **content** is the disclosed region. It stays rendered in both states —
  closed means hidden, not gone — so the trigger's ARIA reference to it never
  dangles, and the consumer can animate the transition off `data-state`.
- **Disabled** switches the whole primitive off for the user: the trigger
  stops toggling and both parts carry the disabled marks for styling. It is a
  gate on user intent only — programmatic and controlled open/close still
  work, so a consumer can drive a collapsible it has locked the user out of.
  Disabled can flip at any time, in either state.

Every part carries `data-state` (`open` / `closed`), and `data-disabled` while
disabled — the styling and animation hooks.

## States

| State    | Behavior                                                                             |
| -------- | ------------------------------------------------------------------------------------ |
| `closed` | The content is hidden. Open intents (trigger press, imperative open) move to `open`. |
| `open`   | The content is shown. Close intents move back to `closed`.                           |

### Toggling while disabled

A trigger press while disabled is swallowed by the machine — no state change,
no report. Imperative `setOpen` and the controlled `open` option are not
gated: they represent the consumer's own intent, not the user's.

## Accessibility

Per APG Disclosure (Show/Hide):

- **Trigger**: a button carrying `aria-expanded` for the current state and
  `aria-controls` referencing the content region. The reference is constant —
  the content is always rendered, so it never dangles.
- **Content**: hidden from every modality while closed — visually and from
  the accessibility tree. No ARIA role is required on the region itself.
- **Keyboard**: Enter and Space activate the trigger — native button
  semantics; each substrate renders its native button rather than re-modeling
  activation.
- **Disabled**: the trigger stays focusable and announces its disabled state
  (`aria-disabled`) instead of dropping out of the tab order — the state stays
  perceivable to keyboard and screen-reader users; the machine is what blocks
  activation.

## Constraints

- Every open ⇄ close transition, whatever its cause, is reported to the
  consumer.
- Disabled blocks user toggling only; it never blocks programmatic or
  controlled open/close.
- `aria-controls` on the trigger must always reference the rendered content
  region.
- The content is never unmounted by the primitive; closed means hidden.

## Internals

- **Controlled open is follow + report, not source-of-truth.** The `open`
  option drives the machine whenever its value changes, and a user toggle
  between prop updates still moves state — reported through `onOpenChange` so
  the consumer can feed the value back into `open`. The primitive never
  suppresses a user toggle or re-asserts a constant prop: a controlled
  consumer that ignores the report drifts from its prop. This matches the
  dialog's existing controlled contract; the Radix-style source-of-truth
  semantics (state cannot move until the prop does) are an explicit non-goal
  for v0.
- **Disabled lives in the machine, not the substrate.** The trigger carries
  `aria-disabled` (focusable-when-disabled, per the accessibility note) and
  the gate on toggling is a machine guard — every substrate inherits the
  decision instead of re-implementing a native `disabled` attribute. Disabled
  is seeded into context at build time and kept fresh by the substrate through
  a `disabled.set` event, so the guard keeps working when the option flips at
  runtime.
- **No presence layer in v0.** Exit animations that need the content held
  mounted past the close (Radix's `forceMount`/presence) are out of scope;
  `data-state` is the animation hook. Likewise out of scope: unmount-on-close,
  polymorphic rendering, and measuring the content for height animations
  (`--radix-collapsible-content-height`-style variables).
