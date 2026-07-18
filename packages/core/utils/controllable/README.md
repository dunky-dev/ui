# @dunky.dev/controllable

Controlled/uncontrolled machinery for `@dunky.dev/state-machine` machines: the
piece every dismissible primitive (dialog, popover, tooltip) needs so a
consumer can own a value from outside.

The contract it encodes: a controlled machine never moves on its own. Every
intent is reported through an `intent` mailbox in context — a reaction turns
it into the consumer callback — and only the substrate's `controlled.sync`
echo of the prop transitions the machine. Ignoring a reported intent is how
the consumer vetoes it. Uncontrolled, the same intent also takes the
transition, so both modes share one transition table and one set of guards.

## Install

```sh
npm install @dunky.dev/controllable
```

## Usage

```ts
import { controllable, makeGated, syncTo, type ControlledSync } from '@dunky.dev/controllable'

// context: seed the slice from the consumer's option
const context = {
  open: controllable(options.open), // { controlled, intent }
  closeOnEscape: options.closeOnEscape ?? true,
}

// transitions: fork each intent event into controlled/uncontrolled candidates
const gated = makeGated<StateName, Context, MachineEvent>()

states: {
  open: {
    on: {
      escape: gated('open', { guard: canEscape, target: 'closed', value: false }),
      'controlled.sync': { target: 'closed', guard: syncTo(false) },
    },
  },
}

// connect: the consumer callback reads the mailbox, not the state
reaction(
  m => m.context.open.intent,
  (intent, props) => {
    if (intent !== null) props.onOpenChange?.(intent.value)
  },
)
```

The substrate sends the echo when the controlled prop changes — the only
part that knows about props:

```ts
if (props.open !== undefined && props.open !== machine.matches('open')) {
  machine.send({ type: 'controlled.sync', value: props.open })
}
```
