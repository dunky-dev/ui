# SPEC / Controllable

## Reference

- **Prior art**: the controlled/uncontrolled duality of native form elements
  (`value` / `defaultValue`), as adopted across Radix, Base UI, and Ark.
- **State machine**: helpers for `@dunky.dev/state-machine` machines — this
  package expands into transitions; it is not a machine of its own.

## Overview

The controlled contract, written once: the machinery a primitive uses so a
consumer can own one of its values from outside (a dialog's `open`, a future
popover's, a tooltip's). Every primitive with an ownable value declares its
intents through this package, so "controlled" means exactly the same thing
across the codebase — and both modes share one transition table and one set
of guards.

## Behavior

The contract it encodes:

- **Uncontrolled**, an intent event (close, escape, trigger press) takes its
  transition directly — the machine owns the value.
- **Controlled**, the machine never moves on its own. An intent only records
  itself; the substrate echoes the consumer's prop as `controlled.sync`, and
  a matching echo is the only thing that transitions the machine. The
  consumer vetoes by ignoring the intent.
- A **behavior gate** (e.g. `closeOnEscape`) applies in both modes — who owns
  the value never changes whether an intent is allowed.
- **Controlled-ness follows the prop live**: an `undefined` echo hands the
  value back to the machine right where it stands; a value takes control.
  Every echo — matching, opposite, or `undefined` — re-derives who owns the
  value.
- Every declared intent lands in the **`intent` slot** as a fresh token, so a
  reaction on the slot fires even when the same intent repeats — the request
  channel for machines that expose one (e.g. the dialog's stack-scoped
  close).
- A change callback binds to the **state**, not to intents: it fires exactly
  when the value actually changes, never for an intent that changed nothing.

## API

| Export                                   | Description                                                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `controllable(value)`                    | Seeds a `Controllable` context slice from the consumer's option — `undefined` means uncontrolled.                            |
| `Controllable<Value>`                    | The slice: `controlled` (who owns the value right now) and `intent` (the last declared intent, a fresh token per write).     |
| `ControlledSync<Value>`                  | The echo event a substrate sends on prop change; `undefined` = the prop is gone.                                             |
| `intent(key, { guard?, target, value })` | Expands an intent event into its controlled/uncontrolled candidates — first guard wins.                                      |
| `syncControlled(key, { value, target })` | The full `controlled.sync` handling for one state: a matching echo moves to `target`; every echo re-derives controlled-ness. |

Both helpers infer their generics from a typed `guard`; an unguarded call has
nothing to infer from, so each carries `.as<State, Context, Event>()` to pin
the types once (the `setup.as` idiom):

```ts
escape: intent('open', { guard: canEscape, target: 'closed', value: false })

const intend = intent.as<DialogStateName, DialogContext, DialogMachineEvent>()
close: intend('open', { target: 'closed', value: false })
```

## Constraints

- A controlled machine transitions only on `controlled.sync` — never on an
  intent, whatever the intent's source.
- The `intent` slot drives no callback and takes no transition of its own;
  it is a record, written fresh on every declaration.
- Dismissal decisions stay at their source — the event-level callbacks and
  the consumer's own handlers — not in this package.

## Internals

| Position                                                                                                              | Why                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| An intent expands to two candidates, first guard wins: controlled writes only `intent`, uncontrolled also transitions | Both modes share one transition table and one set of guards — the modes can't drift apart.           |
| `intent` is written as a fresh token even for a repeated value                                                        | A mailbox reaction must fire on every declaration, not only on value change.                         |
| `.as()` is type-level only — the same implementation with generics pinned                                             | Inference needs a typed guard; pinning keeps unguarded call sites just as safe with no runtime cost. |
