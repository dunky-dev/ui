# @dunky.dev/dialog

The framework-agnostic dialog interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/dialog
```

## How the package works

```
src/
  types.ts     public options/callbacks types + machine context/events
  machine.ts   createDialogConfig(options, ids) -> the state graph
  connect.ts   dialogConnect (snapshot -> api) + the callback reactions
tests/
  machine.test.ts   drives the machine with raw events; asserts bindings + callbacks
```

The machine owns two states (`closed` / `open`) and gates the dismissal
intents: `escape` and `interact.outside` are distinct events from `close`, so
`closeOnEscape` / `closeOnInteractOutside` guard them without touching the
unconditional close path. Title/Description presence is tracked in context so
`dialogConnect` only emits ARIA references to parts that are actually rendered.

`dialogConnect` maps a machine snapshot to the view-facing api: one entry of
logical bindings per part (`trigger`, `backdrop`, `viewport`, `content`,
`title`, `description`, `close`). Bindings are substrate-neutral
(`labelledBy`, `onPress`, ...) — the driver translates them into its own
attribute and handler vocabulary.

## Usage

Driving the machine directly (tests, new drivers):

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { createDialogConfig, dialogConnect } from '@dunky.dev/dialog'

const ids = { content: 'c', title: 't', description: 'd' } // substrate-minted
const service = machine(createDialogConfig(options, ids))
connector(service, dialogConnect, options) // wires the consumer callbacks
service.start()
service.send({ type: 'toggle' })
```

Consumers should use a substrate driver instead of driving the machine directly.
