# @dunky.dev/tabs

The framework-agnostic tabs interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/tabs
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { tabsMachine, tabsConnect } from '@dunky.dev/tabs'

// `id` is substrate-minted (SSR-safe); the connect derives the per-tab ids.
const service = machine(tabsMachine({ ...options, id: 'my-tabs' }))
connector(service, tabsConnect, options) // wires the consumer callbacks
service.start()

// The driver registers each trigger in DOM order...
service.send({ type: 'tab.register', value: 'account', disabled: false })
service.send({ type: 'tab.register', value: 'security', disabled: false })
// ...and forwards user intent.
service.send({ type: 'select', value: 'security' })
```
