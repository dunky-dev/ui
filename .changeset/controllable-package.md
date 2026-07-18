---
'@dunky.dev/controllable': minor
---

New package: controlled/uncontrolled machinery for `@dunky.dev/state-machine`
machines. It encodes one contract every consumer-ownable value shares: a
controlled machine never moves on its own — only the substrate's
`controlled.sync` echo of the prop transitions it, so a change callback bound
to the state fires exactly when the value changes and never for an intent
that changed nothing. Controlled-ness follows the prop live: an `undefined`
echo hands the value back to the machine where it stands. Uncontrolled, the
same intent event also takes the transition, so both modes share one
transition table and one set of guards.

```ts
import { controllable, intent, recontrol, syncControlled } from '@dunky.dev/controllable'

// context
open: controllable(options.open) // { controlled, intent }

// transitions — bare `intent` infers from a typed guard; unguarded events
// have nothing to infer from, so pin the generics once (the `setup.as` idiom)
const request = intent.as<StateName, Context, MachineEvent>()
const resync = recontrol.as<Context, MachineEvent>()

close: request('open', { target: 'closed', value: false }),
escape: intent('open', { guard: canEscape, target: 'closed', value: false }),
'controlled.sync': [
  { guard: syncControlled(false), target: 'closed', actions: resync('open') },
  { actions: resync('open') }, // every echo re-derives controlled-ness
],

// connect — the consumer callback reflects the actual state
reaction(m => m.matches('open'), (open, props) => props.onOpenChange?.(open))
```

Each declared intent is also recorded in the context slice's `intent` slot —
a fresh token per write — ready for machines that expose a request channel.

Extracted as a shared core util (rather than dialog-private machinery) so
every dismissible primitive — popover, tooltip, disclosure — composes the
same contract instead of hand-rolling it.
