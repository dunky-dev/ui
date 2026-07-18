# SPEC / Tabs

## Reference

- **W3C pattern**: [APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/),
  over the normative
  [WAI-ARIA 1.2 `tablist` / `tab` / `tabpanel`](https://www.w3.org/TR/wai-aria-1.2/#tablist)
  definitions.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Radix, Base UI, and Ark tabs.

## Overview

Tabs layer a set of peer content panels over the same region of the page and
show exactly one at a time. The tab strip is the switching control: selecting
a tab reveals its panel and hides the others. It is the home for peer views of
one area — settings sections, code/preview switches, grouped detail panes —
where the user moves between views without leaving the page.

## Anatomy

```
<Tabs>              — root; owns the selected value, renders nothing of its own
  |_ <List>         — the tab strip; the keyboard surface lives here
  |  |_ <Trigger>   — one tab per panel, addressed by its value
  |_ <Content>      — one panel per tab, addressed by the same value
```

## Behavior

Using the tabs is a walkthrough of intent, not a prop list:

- The **root** owns the selected value, exposed controlled and uncontrolled,
  mirroring native patterns: an uncontrolled tabs can be seeded with a default
  value, while a controlled consumer drives it from outside — and every
  selection change is reported back so the consumer stays in sync. The root
  also fixes the strip's orientation (which arrow pair navigates) and the
  activation mode (whether focus selects).
- The **list** is the keyboard surface. While focus is inside it, the arrow
  keys along the orientation's axis move focus to the next/previous enabled
  tab and wrap at the ends; Home/End jump to the first/last enabled tab.
  Disabled tabs are skipped, never landed on.
- Each **trigger** is a tab, addressed by its value. Pressing it selects it —
  unless it is disabled, in which case no user intent can select it. The
  trigger carries the selection state and the ARIA relationship to its panel.
- With **automatic activation** (the default), focusing a tab selects it —
  arrow keys select as they move. With **manual activation**, arrow keys move
  focus only, and Enter or Space selects the focused tab.
- Each **content** panel shows while its value is selected and is hidden
  otherwise. It is labelled by its tab and sits in the tab order so keyboard
  users can move from the strip into the panel.
- One tab is the strip's **roving tab stop**: the selected tab is tabbable and
  the rest are not, so tabbing into the strip lands on the active tab. When
  nothing is selected — or the selected tab is disabled or unregistered — the
  first enabled tab holds the stop so the strip stays reachable.

Selection moves by user intent (press, focus, keyboard) or programmatic
authority (the controlled value, the imperative setter). User intent is gated
— a disabled or unknown value never selects; programmatic authority always
lands. Both report through the same value callback.

## States

| State     | Behavior                                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `idle`    | Focus is outside the tab strip. Selection still moves via presses and programmatic sets; keyboard navigation events are ignored.             |
| `focused` | A tab holds keyboard focus. Arrow keys and Home/End move the focused tab (selecting in automatic mode); leaving the strip returns to `idle`. |

### Tab registration

Triggers report their presence — value and disabled flag, in DOM order — as
they appear and disappear, and a disabled flag can change in place at any
time. That registry is the machine's navigation order and the source of the
disabled gating; navigation only ever involves registered tabs.

### Selection

The selected value drives everything downstream: which trigger is marked
selected, which panel shows, where the roving tab stop sits. It only changes
through the machine — an enabled-tab intent or a programmatic set — and every
change is reported to the consumer, whatever its cause.

### Focus tracking

The machine tracks which tab holds keyboard focus by value; it never touches
real focus. A substrate reports focus landing on a tab, and moves real focus
to whichever tab the machine designates after a navigation event. Blur clears
the tracked value — it only exists while the strip is focused.

## Accessibility

Per APG Tabs:

- **Roles**: the list is `tablist` with `aria-orientation`; each trigger is a
  `tab` carrying `aria-selected` and `aria-controls` pointing at its panel;
  each panel is a `tabpanel` labelled by its tab (`aria-labelledby`).
- **Ids**: the per-tab trigger and panel ids are derived from the root's base
  id plus the tab's value, so the cross-references always agree.
- **Keyboard**: Tab enters the strip on the roving tab stop and leaves it in
  one hop (only one tab is tabbable); the arrow pair matching the orientation
  moves focus with wrap; Home/End jump to the ends. The keys the strip owns
  are consumed so the page doesn't scroll.
- **Disabled tabs**: marked disabled to assistive tech, skipped by arrow
  navigation, never selectable by user intent.
- **Panels**: the selected panel is tabbable (`tabIndex` 0) so keyboard users
  can reach its content; unselected panels are hidden entirely.

## Constraints

- At most one tab is selected; when a selection exists, exactly its panel is
  shown and every other panel is hidden.
- ARIA references (tab -> panel, panel -> tab) must always agree — both sides
  derive from the same base id and value.
- No user intent — press, focus, or keyboard — ever selects a disabled tab;
  keyboard navigation never lands on one.
- Every selection change, whatever its cause, is reported to the consumer.
- Tab values are unique within one tabs instance and id-safe (they become
  part of DOM ids).
- Registration order is navigation order: a substrate must register triggers
  in DOM order.

## Design

- **The machine decides which, the substrate moves focus.** Navigation is
  modeled entirely in the machine — next/previous/first/last over the
  registry, wrap, disabled skip, activation mode. The machine only designates
  a tab by value; moving real focus is DOM work the substrate executes in
  response. Every keyboard decision lives in one place and the bindings stay
  behavior-free.
- **Two selection channels.** `select` is user intent and is guarded (a
  disabled or unregistered value is refused); `value.set` is programmatic
  authority (the controlled value, `setValue`) and always lands. Both funnel
  into the same context field, so the value callback fires identically for
  either cause.
- **v0 exclusions**: no RTL awareness (ArrowRight is always "next"), no
  perpendicular-axis arrows, no lazy mounting or unmounting of panels (they
  stay mounted and hidden), no automatic fallback selection when the selected
  tab is removed or disabled after the fact, no re-ordering of registered
  tabs after mount (a trigger keeps its registration slot; only its disabled
  flag updates in place), and no live re-configuration — `orientation` and
  `activationMode` are read once when the machine is built.
