# @dunky.dev/drawer

The framework-agnostic drawer interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/drawer
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { drawerMachine, drawerConnect } from '@dunky.dev/drawer'

// `id` is substrate-minted (SSR-safe); the connect derives the per-part ids.
const service = machine(drawerMachine({ ...options, id: 'my-drawer' }))
connector(service, drawerConnect, options) // wires the consumer callbacks
service.start()
service.send({ type: 'toggle' })
```
