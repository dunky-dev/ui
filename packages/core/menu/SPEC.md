# SPEC / Menu

## Reference

- **W3C pattern**: [APG Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
  and [APG Menu and Menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/),
  over the normative
  [WAI-ARIA 1.2 `menu` / `menuitem`](https://www.w3.org/TR/wai-aria-1.2/#menu)
  definitions.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Radix DropdownMenu, Base UI Menu, and
  Ark Menu.
- **Layering**: dismissal routing across stacked overlays follows the shared
  layer-stack contract (`@dunky.dev/dom-layer-stack`).

## Overview

A menu is a list of actions opened from a button: the user opens it, picks one
action, and the menu goes away. It coexists with the page rather than
interrupting it — it is not modal, holds no form content, and every item is a
command, not a destination for focus to live in.

## Anatomy

```
<Menu>               — root; owns open/close state and the highlight, renders nothing of its own
  |_ <Trigger>       — the button that opens the menu; focus returns here on close
  |_ <Content>       — the menu surface; holds DOM focus while open
     |_ <Item>        — one action; activating it reports the selection and closes the menu
     |_ <Group>       — groups related items under a name
     |  |_ <GroupLabel> — names its group
     |  |_ <Item>
     |_ <Separator>   — divides sets of items
```

## Behavior

Using the menu is a walkthrough of intent, not a prop list:

- The **root** owns open/close state, exposed controlled and uncontrolled
  exactly like the dialog: an uncontrolled menu can be seeded open, while a
  controlled consumer drives it from outside. Every open/close intent —
  trigger press, keyboard open, Escape, Tab, outside interaction, item
  activation — is reported back through the open-change callback; a controlled
  menu stops there and only moves when the `open` prop does, so ignoring a
  reported intent is how the consumer vetoes it. Whether the menu is
  controlled is fixed at mount.
- The **trigger** toggles the menu on press and carries the popup relationship
  to assistive tech. Opening from the keyboard also aims the highlight: Enter,
  Space, and ArrowDown open with the first enabled item highlighted; ArrowUp
  opens with the last. A pointer press opens with nothing highlighted.
- The **content** is the menu surface. While open it holds real DOM focus and
  exposes the highlighted item through `aria-activedescendant` — the highlight
  is machine state, not roving DOM focus (see [Design](#design)).
- An **item** is one action, identified by a unique `value`. The highlight
  moves over enabled items — by arrow keys with wrap, Home/End jumps, pointer
  hover, or typeahead — and disabled items are always skipped. Activating an
  item (Enter or Space on the highlighted item, or a press) reports the
  selection to that item's consumer callback and then closes the menu.
  Disabled items never highlight and never activate.
- **Group / GroupLabel** name a related run of items; the group's ARIA name
  follows what is actually rendered — a group whose label is removed never
  keeps a dangling reference.
- The **separator** divides sets of items, semantically and visually.

Dismissal: Escape closes and is reported through a veto-able callback; Tab
closes and lets focus continue on its way; any interaction outside the menu —
press or focus landing elsewhere — closes it, also veto-able from its
callback. Every one of these still reports through the open-change callback.

Items register with the machine as they appear and unregister as they
disappear — value, typeahead label, and disabled state — so the highlight,
typeahead, and activation always operate on what is actually rendered. The
registry keeps mount order — document order at mount time: a prop change on a
mounted item updates it in place and never moves it, but an item mounted
mid-list while the menu is open registers at the end. Re-ordering a live
registry to match the DOM is out of scope for v0.

### Highlight

The highlight is a single value: at most one item is highlighted at a time,
and only enabled, registered items can hold it. Arrow moves wrap from either
end. Pointer hover highlights the item under the pointer and leaving it clears
the highlight. Closing the menu always clears the highlight — the next open
starts fresh.

A keyboard open aims the highlight before any item exists yet (items register
only once the menu shows), so the intent is held as pending and resolved
against the items as they register; any explicit highlight move cancels the
pending intent.

### Typeahead

While open, printable characters accumulate into a query (reset after a ~1s
pause) and the highlight jumps to the next enabled item whose label starts
with the query, searching forward from the current highlight and wrapping.
Repeating the same character cycles through the items starting with it.
Labels come from item registration.

## States

| State    | Behavior                                                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closed` | Only the trigger is shown. Open intents (trigger press, keyboard open with a highlight aim, imperative open) move to `open`.                         |
| `open`   | The content is shown and owns the highlight. Close intents (close, toggle, Escape, Tab, outside interaction, item activation) move back to `closed`. |

Controlled, the intents above only report through the open-change callback —
the `open` prop drives the actual transitions.

## Accessibility

Per APG Menu Button:

- **Roles**: the trigger is a button with `aria-haspopup="menu"` and
  `aria-expanded`; the content is `role="menu"` (vertical), labelled by the
  trigger; items are `role="menuitem"`; groups are `role="group"`, labelled by
  their rendered GroupLabel; separators are `role="separator"`.
- **Relationships**: the trigger's `aria-controls` references the content only
  while it is rendered — never a dangling id.
- **Keyboard, on the trigger**: Enter, Space, ArrowDown open and highlight the
  first enabled item; ArrowUp opens and highlights the last.
- **Keyboard, while open**: ArrowDown/ArrowUp move the highlight with wrap,
  Home/End jump to the ends, printable characters run typeahead, Enter and
  Space activate the highlighted item, Escape closes and returns focus to the
  trigger, Tab closes.
- **Focus**: opening moves DOM focus to the content; the highlighted item is
  exposed via `aria-activedescendant`; closing restores focus to the element
  focused before opening (normally the trigger).
- **Disabled items**: perceivable (`aria-disabled`) but never highlighted,
  never activated, and skipped by every navigation.
- **Layering**: the menu registers as a non-modal layer on the shared overlay
  stack — Escape and outside interactions belong to the topmost layer only,
  and a menu stacked above a modal layer stays reachable.

## Constraints

- At most one item is highlighted; `aria-activedescendant` references a
  rendered, enabled item or is absent — never a stale or disabled one.
- Item values are unique within a menu; ids are derived from them, so they
  must be usable as id fragments (no whitespace).
- Activation reports the selection before the close is observable, and the
  menu always closes after activating an enabled item.
- Every open ⇄ close intent, whatever its source, is reported to the
  consumer. A controlled menu never transitions on its own — it follows the
  `open` prop alone, and a prop-driven transition is not echoed back.
- ARIA labelled-by / controls must only reference elements that are actually
  rendered.
- Out of scope in v0: submenus, checkbox/radio items, context-menu
  (right-click) triggering, keeping the menu open after a selection, and any
  positioning engine — anchoring the content is the consumer's concern;
  `data-state` on trigger/content and `data-highlighted` / `data-disabled` on
  items are the styling hooks.

## Design

- **`aria-activedescendant` over roving DOM focus.** The highlight is machine
  state: one context value that every substrate renders as one attribute plus
  a `data-highlighted` hook. Roving focus would make each binding move real
  focus item-by-item — imperative work, ordering decisions, and blur/focus
  bookkeeping in every substrate, against "a binding adds no behavior". With
  active-descendant the binding only ever renders state, DOM focus rests on
  the content the whole time, and the core alone decides where the highlight
  goes. This is the Zag/Ark model; the trade-off is that item styling keys off
  `[data-highlighted]` rather than `:focus`.
- **Items registered as data.** Navigation, typeahead, and activation are core
  decisions, so the core must know the items: each substrate reports
  value/label/disabled as items mount and unmount, and the machine operates
  only on that registry — never on the DOM.
- **A keyboard open holds a pending highlight.** Items mount after the open
  transition, so "open with the first item highlighted" cannot resolve
  immediately; the machine stores the aim and resolves it as registrations
  arrive, keeping the decision in the core instead of leaking mount timing
  into a substrate.
- **Selection is a mailbox.** An activation names an item that the consumer
  listens to per-item, not per-root; the machine records the selection as a
  fresh token in context for the substrate to deliver to that item's callback.
  The machine never calls a consumer callback directly.
- **Typeahead cannot see keyboard modifiers.** The shared `KeyboardPayload`
  vocabulary carries only `key`, so a modifier-chorded printable (Cmd+C,
  Ctrl+F) is indistinguishable from a plain character and runs typeahead,
  where the reference libraries skip it. Accepted for v0: the fix is extending
  `KeyboardPayload` with modifier flags in
  `@dunky.dev/state-machine-bindings` — a shared-vocabulary change, not a
  menu-local workaround.
