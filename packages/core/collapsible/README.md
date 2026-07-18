# @dunky.dev/collapsible

The framework-agnostic collapsible interaction — a disclosure that shows and
hides a content region — modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/collapsible
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { collapsibleMachine, collapsibleConnect } from '@dunky.dev/collapsible'

// `id` is substrate-minted (SSR-safe); the connect derives the content id.
const service = machine(collapsibleMachine({ ...options, id: 'my-collapsible' }))
connector(service, collapsibleConnect, options) // wires the consumer callbacks
service.start()
service.send({ type: 'toggle' })
```
