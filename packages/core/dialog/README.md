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

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { dialogMachine, dialogConnect } from '@dunky.dev/dialog'

// `id` is substrate-minted (SSR-safe); the connect derives the per-part ids.
const service = machine(dialogMachine({ ...options, id: 'my-dialog' }))
connector(service, dialogConnect, options) // wires the consumer callbacks
service.start()
service.send({ type: 'toggle' })
```
