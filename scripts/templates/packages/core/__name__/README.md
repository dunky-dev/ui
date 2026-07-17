# @dunky.dev/__name__

The framework-agnostic __name__ interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/__name__
```

## How the package works

```
src/
  index.ts     barrel: the headless public surface
  types.ts     states, context, events, options/callbacks
  machine.ts   create__Name__Config(options) -> the state graph
  connect.ts   __camelName__Connect (snapshot -> parts bindings) + reactions
tests/
  machine.test.ts   transitions, gating, bindings, reactions
```

`__camelName__Connect` maps a machine snapshot to the view-facing api: one
entry of logical bindings per part of the anatomy. Bindings are
substrate-neutral (`onPress`, `expanded`, ...) — the driver translates them
into its own attribute and handler vocabulary.

Two idioms this package is built on:

- **Reactions, not direct calls.** The machine never calls a consumer
  callback. The connect declares reactions — a selector over the machine
  paired with a callback — and the connector fires the callback when the
  selected value changes, in registration order; that order is the
  callback-order contract. A callback derivable from state selects it; an
  event that doesn't move the machine emits through a mailbox: an action
  writes a fresh token into a context slot for the reaction to select.
- **The machine never sees props.** Option defaults are resolved in
  `machine.ts` and seeded into context at build time; live callbacks flow
  through the connector. See `ARCHITECTURE.md`.

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

Consumers should use a substrate driver instead of driving the machine directly.
