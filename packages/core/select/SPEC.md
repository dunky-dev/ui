# SPEC / Select

## Reference

- **W3C pattern**: [APG Select-Only Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/)
  (a combobox trigger driving a [Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)
  popup), over the normative
  [WAI-ARIA 1.2 `combobox` / `listbox` / `option`](https://www.w3.org/TR/wai-aria-1.2/#combobox)
  definitions.
- **State machine**: built on `@dunky.dev/state-machine`.
- **Prior art**: API shape modeled on the Radix, Zag, and Ark selects.

## Overview

A select is a single-choice control: a button that shows the current choice
and opens a listbox of options to pick from. It replaces the native
`<select>` where the options need real markup — icons, descriptions, custom
styling — while keeping the native control's keyboard model and its
screen-reader contract.

## Anatomy

```
<Select>                   — root; owns value + open state, renders nothing of its own
  |_ <Trigger>             — the button that shows the choice and opens the list;
  |  |                       keyboard focus lives here the whole time
  |  |_ <Value>            — the selected option's label, or a placeholder
  |_ <Listbox>             — the popup list of options
     |_ <Item>             — one option; registers itself with the machine
        |_ <ItemIndicator> — the "this one is chosen" mark, rendered only
                             inside the selected item
```

## Behavior

Using the select is a walkthrough of intent, not a prop list:

- The **root** owns two pieces of state, each exposed controlled and
  uncontrolled: the value (which option is chosen) and the open state (whether
  the listbox shows). Every change to either — whatever caused it — is
  reported back through its callback so a controlled consumer stays in sync.
- The **trigger** opens the list: press, Enter, Space, ArrowDown, or ArrowUp.
  Opening highlights the selected option so the user continues from their
  choice; with no selection (or a disabled one) the first enabled option is
  highlighted. Home and End open too, pinning the highlight to the first /
  last enabled option instead. A disabled select never opens.
- While open, a **highlight** tracks the active option. Arrow keys move it
  across enabled options — disabled options are skipped, and the `loop` option
  decides whether the ends wrap around. Home and End jump to the first and
  last enabled option. Moving the pointer over an enabled option moves the
  highlight there too — keyboard and pointer drive the same highlight.
- **Typing** while open runs a typeahead: printable characters accumulate into
  a search buffer (reset after a one-second pause) and the highlight moves to
  the next enabled option whose label matches. Repeating one character cycles
  through the options starting with it. Space joins the buffer only while a
  typeahead is in progress; otherwise Space selects, like Enter.
- **Selecting** — Enter or Space on the highlighted option, or pressing an
  option — commits the value and closes the list. Escape closes without
  selecting; so do Tab and any interaction outside the trigger and listbox.
  Closing always clears the highlight.
- **Items** are not configuration: each option registers itself with the
  machine (value, label, disabled) when it appears, re-registers when its
  label or disabled state changes (updating in place, keeping its position),
  and unregisters when it goes away — so the option list always mirrors what
  is actually rendered. Navigation order is registration order. A disabled
  item is skipped by navigation and typeahead, cannot be highlighted, and
  pressing it does nothing.
- The **value part** renders the selected option's label — resolved from the
  registered items — or the consumer's placeholder while nothing is chosen.
- Selection changes fire `onValueChange`, open/close fires `onOpenChange`, and
  every highlight move fires `onHighlightChange`. Within one interaction they
  fire in that order: value, then highlight, then open.

## States

| State    | Behavior                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closed` | Only the trigger is interactive. Open intents (trigger press, Enter/Space/Arrow keys, imperative open) move to `open` unless the select is disabled.          |
| `open`   | The listbox shows and a highlight tracks the active option. Navigation moves the highlight; selection commits and closes; dismissal closes without selecting. |

### Highlight

The highlight exists only while open: it is set on open (selected option,
else first enabled), moved by navigation, pointer, and typeahead, and cleared
to "nothing" on every close. A new option registering while the list is open
supplies the missing highlight — and the selected option registering late
takes it — so a list whose options mount after opening still starts from the
selection. An option re-registering in place (label or disabled changed)
never steals the highlight, but disabling the highlighted option clears it —
as does the highlighted option unregistering.

### Typeahead

The buffer belongs to the machine, not the substrate, so every host gets the
same matching: case-insensitive prefix match over the registered labels,
starting after the current highlight and wrapping. A buffer of one repeated
character degrades to cycling through the options that start with it. The
buffer resets one second after the last keystroke.

## Accessibility

Per the APG select-only combobox:

- **Roles**: the trigger is a `combobox` with `aria-haspopup="listbox"`,
  `aria-expanded`, and `aria-controls` naming the listbox. The popup is a
  `listbox`; every item is an `option` carrying `aria-selected`, and
  `aria-disabled` when disabled.
- **Focus**: DOM focus stays on the trigger the whole time — the listbox is
  never focused. While open, `aria-activedescendant` on the trigger names the
  highlighted option's id. This is the APG select-only combobox model, chosen
  deliberately: one tab stop, no focus jumps on open/close (so closing never
  needs a focus restore), and the model screen readers already know from the
  native `<select>`.
- **Keyboard** (on the trigger, since focus never leaves it):

  | Key                 | Closed                                    | Open                                                  |
  | ------------------- | ----------------------------------------- | ----------------------------------------------------- |
  | Enter               | opens                                     | selects the highlighted option, closes                |
  | Space               | opens                                     | selects — or joins the typeahead buffer mid-typeahead |
  | ArrowDown / ArrowUp | opens                                     | moves the highlight down / up (wraps when `loop`)     |
  | Home / End          | opens, highlights the first / last option | jumps to the first / last enabled option              |
  | Escape              | —                                         | closes without selecting                              |
  | Tab                 | moves focus on                            | closes without selecting; focus moves on              |
  | Printable character | —                                         | typeahead: highlights the next matching option        |

- **Disabled**: a disabled select keeps its trigger focusable and exposes
  `aria-disabled` rather than removing it from the tab order — the state is
  announced instead of the control vanishing.
- **Hidden while closed**: the listbox stays rendered (options keep their
  registration and ids stable) but is removed from the accessibility tree.

## Constraints

- The value and open state are always reported: every change, whatever its
  cause, fires the matching callback — value, then highlight, then open
  within one interaction.
- A disabled option can never be selected or highlighted, by any input.
- `aria-activedescendant` only ever references an option that is rendered and
  highlighted; it is absent while closed or while nothing is highlighted.
- Option values must be unique within one select and contain no whitespace —
  option ids are derived from them.
- Navigation order is registration order; a new option registering later
  joins at the end regardless of its visual position, while a known one
  re-registering updates in place.
- Out of scope for v0, on purpose: multi-select; a positioning engine (the
  consumer positions the popup — `data-state` is the styling hook); form /
  hidden-input integration; a Label part (label the trigger via
  `aria-label`/`aria-labelledby`); typeahead while closed; modifier-key
  chords (a printable key is a typeahead key regardless of held modifiers).

## Internals

- **The highlight and typeahead live in the machine.** Both are context, not
  substrate state: navigation, pointer moves, and the typeahead buffer (with
  its one-second reset) resolve inside the machine, so every substrate
  inherits the same matching and timing instead of re-implementing it.
- **Items are machine context, kept fresh by lifecycle events.** Options
  register, re-register in place, and unregister through machine events sent
  by the substrate as they mount and change; every decision that reads the
  registry — first/last enabled, disabled skipping, late-registration
  highlight repair — is the machine's.
- **Callback order is a reaction-order contract.** `onValueChange`,
  `onHighlightChange`, and `onOpenChange` are connect reactions registered in
  that order — within one interaction they always fire value, then highlight,
  then open.
- **The listbox never unmounts.** Closing hides it (`hidden` + `aria-hidden`)
  rather than removing it, so option registration and derived ids stay stable
  across open/close and `aria-activedescendant` can never name a
  not-yet-rendered node.
