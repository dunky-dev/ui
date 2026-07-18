# @dunky.dev/checkbox

The framework-agnostic checkbox interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/checkbox
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { checkboxMachine, checkboxConnect } from '@dunky.dev/checkbox'

// `id` is substrate-minted (SSR-safe); the connect derives the per-part ids.
const service = machine(checkboxMachine({ ...options, id: 'my-checkbox' }))
connector(service, checkboxConnect, options) // wires the consumer callbacks
service.start()
service.send({ type: 'toggle' })
```
