# @dunky.dev/radio

The framework-agnostic radio group interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/radio
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { radioMachine, radioConnect } from '@dunky.dev/radio'

// `id` is substrate-minted (SSR-safe); the connect derives the per-item ids.
const service = machine(radioMachine({ ...options, id: 'my-radio' }))
connector(service, radioConnect, options) // wires the consumer callbacks
service.start()

// Items register as they appear — registration order is the navigation order.
service.send({ type: 'item.register', value: 'a', disabled: false })
service.send({ type: 'item.register', value: 'b', disabled: false })
service.send({ type: 'select', value: 'b' })
```
