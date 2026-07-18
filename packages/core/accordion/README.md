# @dunky.dev/accordion

The framework-agnostic accordion interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/accordion
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { accordionMachine, accordionConnect } from '@dunky.dev/accordion'

// `id` is substrate-minted (SSR-safe); the connect derives the per-item ids.
const service = machine(accordionMachine({ ...options, type: 'single', id: 'my-accordion' }))
connector(service, accordionConnect, options) // wires the consumer callbacks
service.start()

// Items register as they appear; registration order is the navigation order.
service.send({ type: 'item.register', value: 'shipping' })
service.send({ type: 'toggle', value: 'shipping' })
```
