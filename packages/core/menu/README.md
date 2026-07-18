# @dunky.dev/menu

The framework-agnostic menu interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/menu
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { menuMachine, menuConnect } from '@dunky.dev/menu'

// `id` is substrate-minted (SSR-safe); the connect derives the per-part ids.
const service = machine(menuMachine({ ...options, id: 'my-menu' }))
connector(service, menuConnect, options) // wires the consumer callbacks
service.start()

// The driver reports rendered items as data; navigation stays in the core.
service.send({ type: 'item.register', item: { value: 'copy', label: 'Copy', disabled: false } })
service.send({ type: 'open', highlight: 'first' })
service.send({ type: 'item.activate' })
```
