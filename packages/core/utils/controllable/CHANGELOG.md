# @dunky.dev/controllable

## 0.1.0

### Minor Changes

- [#17](https://github.com/dunky-dev/ui/pull/17) [`ee163cb`](https://github.com/dunky-dev/ui/commit/ee163cbfcf57c3da3ae7bb162b6b108b1e83294d) Thanks [@ivanbanov](https://github.com/ivanbanov)! - New package: controlled/uncontrolled machinery for `@dunky.dev/state-machine`
  machines. It encodes one contract every consumer-ownable value shares: a
  controlled machine never moves on its own — only the substrate's
  `controlled.sync` echo of the prop transitions it, so a change callback bound
  to the state fires exactly when the value changes and never for an intent
  that changed nothing. Controlled-ness follows the prop live: an `undefined`
  echo hands the value back to the machine where it stands. Uncontrolled, the
  same intent event also takes the transition, so both modes share one
  transition table and one set of guards.

  ```ts
  import { controllable, intent, syncControlled } from '@dunky.dev/controllable'

  // context
  open: controllable(options.open) // { controlled, intent }

  // transitions — bare `intent` infers from a typed guard; unguarded events
  // have nothing to infer from, so pin the generics once (the `setup.as` idiom)
  const intend = intent.as<StateName, Context, MachineEvent>()
  const synced = syncControlled.as<StateName, Context, MachineEvent>()

  close: intend('open', { target: 'closed', value: false }),
  escape: intent('open', { guard: canEscape, target: 'closed', value: false }),
  'controlled.sync': synced('open', { value: false, target: 'closed' }), // every echo re-derives controlled-ness

  // connect — the consumer callback reflects the actual state
  reaction(m => m.matches('open'), (open, props) => props.onOpenChange?.(open))
  ```

  Each declared intent is also recorded in the context slice's `intent` slot —
  a fresh token per write — ready for machines that expose a request channel.

  Extracted as a shared core util (rather than dialog-private machinery) so
  every dismissible primitive — popover, tooltip, disclosure — composes the
  same contract instead of hand-rolling it.
