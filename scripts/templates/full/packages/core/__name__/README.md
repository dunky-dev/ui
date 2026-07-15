# @dunky.dev/__name__

The framework-agnostic __name__ interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no DOM, no framework. Pair it with a
driver: [`@dunky.dev/dom-__name__`](../../dom/__name__) for any web framework,
[`@dunky.dev/react-__name__`](../../react/__name__) for the React hook.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## How the package works

```
src/
  types.ts     public options/callbacks types + machine context/events
  machine.ts   create__Name__Config(options) -> the state graph
  connect.ts   __camelName__Connect (snapshot -> api) + the callback reactions
tests/
  machine.test.ts   drives the machine with raw events; asserts callbacks
```

Two idioms this package is built on (kept identical to `press`):

- **Emission mailboxes.** The machine never sees consumer callbacks. Context
  carries one nullable slot per callback; an action fires a callback by writing
  a NEW value into its slot and suppresses it by keeping the OLD reference.
  `connect.ts` registers one reaction per slot; reactions run in registration
  order, so that order IS the callback-order contract. Consequence: every
  action performs exactly one `setContext`.
- **The machine never sees props.** Config flags are seeded into context at
  build time; callbacks fire through the connector. See `ARCHITECTURE.md`.

## Usage

Driving the machine directly (tests, new drivers):

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { create__Name__Config, __camelName__Connect } from '@dunky.dev/__name__'

const service = machine(create__Name__Config(options))
connector(service, __camelName__Connect, options) // wires the consumer callbacks
service.start()
service.send({ type: 'ACTIVATE' })
```

Consumers should use a driver instead — see
[`@dunky.dev/dom-__name__`](../../dom/__name__) and
[`@dunky.dev/react-__name__`](../../react/__name__).
