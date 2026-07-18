# @dunky.dev/controllable

Controlled/uncontrolled machinery for `@dunky.dev/state-machine` machines: the
piece every dismissible primitive (dialog, popover, tooltip) needs so a
consumer can own a value from outside.

The contract it encodes: a controlled machine never moves on its own — only
the substrate's `controlled.sync` echo of the prop transitions it, so a
change callback bound to the state fires exactly when the value actually
changes, never for an intent that changed nothing. Dismissal decisions stay
at their source (the event-level callbacks and the consumer's own handlers).
Controlled-ness follows the prop live: an `undefined` echo hands the value
back to the machine right where it stands. Uncontrolled, the same intent
event also takes the transition, so both modes share one transition table
and one set of guards. Each declared intent is recorded in the `intent`
slot — a fresh token per write, ready for machines that expose a request
channel.

## Install

```sh
npm install @dunky.dev/controllable
```

## Usage

```ts
import { controllable, intent, syncControlled, type ControlledSync } from '@dunky.dev/controllable'

// context: seed the slice from the consumer's option
const context = {
  open: controllable(options.open), // { controlled, intent }
  closeOnEscape: options.closeOnEscape ?? true,
}

// transitions: fork each intent event into controlled/uncontrolled candidates.
// Bare `intent` infers from a typed guard; unguarded events have nothing to
// infer from — pin the generics once with `.as` (the `setup.as` idiom).
const intend = intent.as<StateName, Context, MachineEvent>()
const synced = syncControlled.as<StateName, Context, MachineEvent>()

states: {
  open: {
    on: {
      close: intend('open', { target: 'closed', value: false }),
      escape: intent('open', { guard: canEscape, target: 'closed', value: false }),
      // Move on a matching echo; every echo re-derives controlled-ness.
      'controlled.sync': synced('open', { value: false, target: 'closed' }),
    },
  },
}

// connect: the consumer callback reflects the actual state
reaction(
  m => m.matches('open'),
  (open, props) => props.onOpenChange?.(open),
)
```

The substrate echoes the prop verbatim whenever it changes — the only part
that knows about props. `undefined` means uncontrolled again:

```ts
machine.send({ type: 'controlled.sync', value: props.open })
```
