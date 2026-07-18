# @dunky.dev/switch

The framework-agnostic switch interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/switch
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { switchMachine, switchConnect } from '@dunky.dev/switch'

// `id` is substrate-minted (SSR-safe); the connect derives the per-part ids.
const service = machine(switchMachine({ ...options, id: 'my-switch' }))
connector(service, switchConnect, options) // wires the consumer callbacks
service.start()
service.send({ type: 'toggle' })
```
