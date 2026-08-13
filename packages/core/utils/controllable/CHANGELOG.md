# @dunky.dev/controllable

## 0.1.1

### Patch Changes

- [#36](https://github.com/dunky-dev/ui/pull/36) [`827c079`](https://github.com/dunky-dev/ui/commit/827c079716e6dcb5d78e9341285627137cf0ade3) Thanks [@ivanbanov](https://github.com/ivanbanov)! - Ship `SPEC.md` and the TypeScript sources in the published package, alongside
  the built `dist`.

  The tarball used to carry `dist` and `README.md` only, so the two things you
  actually want when a behavior surprises you — the spec that defines the contract
  and the code that implements it — were reachable only by finding the repo and
  guessing which tag matches the installed version. Both now sit in
  `node_modules/<pkg>/`, pinned to the exact version installed.

  Nothing about resolution changes: `publishConfig` still points `main`, `types`,
  and `exports` at `dist`, and the sources are inert payload — read them, don't
  import them.

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
