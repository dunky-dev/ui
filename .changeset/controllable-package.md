---
'@dunky.dev/controllable': minor
---

New package: controlled/uncontrolled machinery for `@dunky.dev/state-machine`
machines. It encodes one contract every consumer-ownable value shares: a
controlled machine never moves on its own — intents are reported through a
mailbox the consumer may veto by ignoring, and only the substrate's
`controlled.sync` echo of the prop transitions it. Uncontrolled, the same
intent also takes the transition, so both modes share one transition table
and one set of guards.

```ts
import { controllable, gated, syncTo } from '@dunky.dev/controllable'

// context
open: controllable(options.open) // { controlled, intent }

// transitions — bare `gated` infers from a typed guard; unguarded events
// have nothing to infer from, so pin the generics once (the `setup.as` idiom)
const gate = gated.as<StateName, Context, MachineEvent>()

close: gate('open', { target: 'closed', value: false }),
escape: gated('open', { guard: canEscape, target: 'closed', value: false }),
'controlled.sync': { target: 'closed', guard: syncTo(false) },

// connect — the consumer callback reads the mailbox, not the state
reaction(m => m.context.open.intent, (intent, props) => {
  if (intent !== null) props.onOpenChange?.(intent.value)
})
```

Extracted as a shared core util (rather than dialog-private machinery) so
every dismissible primitive — popover, tooltip, disclosure — composes the
same contract instead of hand-rolling it.
