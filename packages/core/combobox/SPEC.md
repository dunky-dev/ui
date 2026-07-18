# SPEC / Combobox

## Reference

- **W3C pattern**: [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/),
  the editable variant with list autocomplete and manual selection, over the
  normative
  [WAI-ARIA 1.2 `combobox` / `listbox` / `option`](https://www.w3.org/TR/wai-aria-1.2/#combobox)
  definitions.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Ark and Base UI comboboxes (Radix
  has none).
- **Layering**: dismissal routing follows the shared overlay layer stack —
  see `@dunky.dev/dom-layer-stack`.

## Overview

A combobox is a text input paired with a listbox of suggestions: the user
types freely, the list narrows to what matches, and picking a suggestion
commits it as the value. It is the home for search-and-pick interactions —
choosing a country, assigning a user, jumping to a file — where the option
set is too large to scan and the user knows (part of) what they're looking
for. The input text and the committed value are two different things: text is
free, the value only ever comes from a suggestion.

## Anatomy

```
<Combobox>              — root; owns value + input text + open state, renders
  |                       nothing of its own
  |_ <Input>            — the text field; DOM focus lives here the whole time
  |_ <Trigger>          — optional disclosure button; not in the tab order
  |_ <Listbox>          — the popup list of suggestions
     |_ <Item>             — one suggestion; registers itself with the machine
        |_ <ItemIndicator> — the "this one is chosen" mark, rendered only
                             inside the selected item
```

## Behavior

Using the combobox is a walkthrough of intent, not a prop list:

- The **root** owns three pieces of state, each exposed controlled and
  uncontrolled: the value (which suggestion is chosen), the input text, and
  the open state. Every change to any of them — whatever caused it — is
  reported back through its callback so a controlled consumer stays in sync.
- **Typing** updates the input text, opens the list, and clears the highlight
  (the suggestion set is about to change). Filtering is the consumer's
  responsibility: they decide which Items to render from the input text — the
  machine never filters, it navigates whatever is rendered.
- **Arrow keys** open the list when it is closed — ArrowDown starting the
  highlight from the selected suggestion (when rendered and enabled) else the
  first enabled one, ArrowUp from the selection else the last. While open they
  move the highlight across enabled suggestions: disabled ones are skipped,
  and the `loop` option decides whether the ends wrap around. Moving the
  pointer over an enabled suggestion moves the highlight there too — keyboard
  and pointer drive the same highlight.
- **Selecting** — Enter on the highlighted suggestion, or pressing one —
  commits: the value becomes the item's value, the input text becomes its
  label, and the list closes. Enter with nothing highlighted just closes.
  Free-typed text never commits itself: the value only ever comes from an
  item.
- The **trigger** is an optional disclosure button that toggles the list. It
  is not a tab stop — the input is the one place keyboard focus lives.
- **Escape** closes without selecting; so does any interaction outside the
  combobox — a press, or focus moving out (Tab included). The consumer can
  veto a single occurrence of either from its handler.
- **Items** are not configuration: each suggestion registers itself with the
  machine (value, label, disabled) when it appears, re-registers when its
  label, disabled state, or rendered position changes, and unregisters when
  it goes away — so the suggestion list always mirrors what is actually
  rendered, keystroke by keystroke. A disabled item is skipped by navigation,
  cannot be highlighted, and pressing it does nothing.
- A **disabled** combobox never opens, by any input.

The combobox participates in the shared overlay layer stack
(`@dunky.dev/dom-layer-stack`) while open: a combobox opened from within
another overlay — a dialog, a popover — stacks on top of it, Escape unwinds
one layer per press, and an interaction inside a nested layer never counts as
outside the one beneath. Being registered is also what keeps the open listbox
reachable when it floats above a modal layer.

## States

| State    | Behavior                                                                                                                                                          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closed` | Only the input (and trigger) are interactive. Open intents — typing, arrow keys, trigger press, imperative open — move to `open` unless the combobox is disabled. |
| `open`   | The listbox shows and a highlight tracks the active suggestion. Navigation moves the highlight; selection commits and closes; dismissal closes without selecting. |

### Highlight

The highlight exists only while open, and unlike a select it is optional —
the resting state while the user types is "nothing highlighted". It is seeded
by the arrow key that opens the list, moved by navigation and pointer, cleared
by typing, and cleared on every close. The highlighted suggestion
unregistering (filtered out from under the highlight) clears it, as does
re-registering as disabled.

### Input text

The input text is free-form and belongs to the user until a selection
commits: typing and controlled updates are the only things that change it
besides selection (which replaces it with the chosen item's label). Closing
without selecting — Escape, outside interaction — leaves the text exactly as
typed; syncing a controlled value from outside doesn't touch it either.

## Accessibility

Per the APG editable combobox with list autocomplete:

- **Roles**: the input is a `combobox` with `aria-autocomplete="list"`,
  `aria-expanded`, and `aria-controls` naming the listbox. The popup is a
  `listbox`; every item is an `option` carrying `aria-selected`, and
  `aria-disabled` when disabled. The trigger carries
  `aria-haspopup="listbox"` and mirrors `aria-expanded`.
- **Focus**: DOM focus stays in the input the whole time — the listbox is
  never focused. While open, `aria-activedescendant` on the input names the
  highlighted option's id, and is absent while nothing is highlighted. No
  focus moves on open/close means closing never needs a focus restore.
- **Keyboard** (on the input, since focus never leaves it):

  | Key                 | Closed                                             | Open                                         |
  | ------------------- | -------------------------------------------------- | -------------------------------------------- |
  | Printable / editing | edits the text, opens the list                     | edits the text, clears the highlight         |
  | ArrowDown           | opens, highlights the selection else first enabled | moves the highlight down (wraps when `loop`) |
  | ArrowUp             | opens, highlights the selection else last enabled  | moves the highlight up (wraps when `loop`)   |
  | Enter               | — (native: submits the form)                       | selects the highlighted suggestion, closes   |
  | Escape              | —                                                  | closes without selecting                     |
  | Home / End          | native caret movement                              | native caret movement — never the highlight  |
  | Tab                 | moves focus on                                     | focus out is an outside interaction — closes |

- **Disabled**: a disabled combobox exposes `aria-disabled`; whether the
  input also refuses text entry is the substrate's native concern.
- **Hidden while closed**: the listbox stays rendered (suggestions keep their
  registration and ids stable) but is removed from the accessibility tree.

## Constraints

- The value only ever comes from a registered, enabled item — free-typed
  input text never becomes the value.
- A disabled item can never be selected or highlighted, by any input.
- `aria-activedescendant` only ever references an option that is rendered and
  highlighted; it is absent while closed or while nothing is highlighted.
- Item values must be unique within one combobox and contain no whitespace —
  option ids are derived from them.
- Navigation order always matches the rendered order of the suggestions, even
  as the consumer's filtering unmounts and remounts items between keystrokes —
  or a keyed re-sort moves them in place without unmounting anything.
- Every value, input-text, open, and highlight change is reported: whatever
  its cause, the matching callback fires — value, then input text, then
  highlight, then open within one interaction.
- The machine never filters: which suggestions exist is decided entirely by
  what the consumer renders.
- Out of scope for v0, on purpose: multiple selection; committing free-typed
  values (the input text is free, the value is not); inline autocomplete
  (`aria-autocomplete` is always `list`); virtualization; a positioning
  engine or portal part (the consumer positions the popup — `data-state` is
  the styling hook); scrolling the highlighted option into view; a Label part
  (label the input via `aria-label`/`aria-labelledby` or a native `<label>`);
  IME composition guarding (Enter and the arrow keys reach the machine as
  regular keys while a composition session is active — needs an `isComposing`
  flag in the shared bindings vocabulary before it can land here).

## Internals

- **The highlight lives in the machine.** Navigation, pointer moves, disabled
  skipping, and loop wrapping resolve inside the machine, so every substrate
  inherits the same model instead of re-implementing it.
- **Items are machine context, kept fresh by lifecycle events — and
  registration carries the item's rendered position.** Where a suggestion
  sits among its siblings is a host fact only the substrate can observe:
  consumer filtering unmounts and remounts items, and a keyed re-sort moves
  them without unmounting, so append-order would drift from the rendered
  order. The substrate re-reports the position as the render changes; folding
  it into the navigation order — moving a registered item whose reported
  position changed, ignoring a report that changes nothing — is the
  machine's, like every other decision that reads the registry.
- **A press inside the combobox never steals focus.** The item, the listbox
  surface between items, and the trigger all cancel the pointer-down default,
  so DOM focus stays in the input through any press and the activedescendant
  model holds.
- **Callback order is a reaction-order contract.** `onValueChange`,
  `onInputValueChange`, `onHighlightChange`, and `onOpenChange` are connect
  reactions registered in that order — within one interaction they always
  fire value, then input text, then highlight, then open.
- **Dismissal is detected by the substrate, decided by the machine.** The
  combobox has no backdrop, so outside interaction is document-level
  substrate work (`@dunky.dev/dom-interact-outside`, with the input and
  trigger excused as the anchor), and Escape is a document-level listener
  gated to the topmost layer. Both report intents — the consumer's veto
  handler fires first, then `interact.outside` / `escape` is sent — and the
  machine owns what dismissal does, never a binding.
- **Selection is one transition.** Committing writes the value and the input
  text and closes in a single `select` transition, so the callbacks of one
  selection fire once each, in the contract order.
