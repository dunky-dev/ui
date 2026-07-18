# @dunky.dev/popover

The framework-agnostic popover interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/popover
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { popoverMachine, popoverConnect } from '@dunky.dev/popover'

// `id` is substrate-minted (SSR-safe); the connect derives the per-part ids.
const service = machine(popoverMachine({ ...options, id: 'my-popover' }))
connector(service, popoverConnect, options) // wires the consumer callbacks
service.start()
service.send({ type: 'toggle' })
```
