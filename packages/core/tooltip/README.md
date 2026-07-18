# @dunky.dev/tooltip

The framework-agnostic tooltip interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/tooltip
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { tooltipMachine, tooltipConnect } from '@dunky.dev/tooltip'

// `id` is substrate-minted (SSR-safe); the connect derives the content id.
const service = machine(tooltipMachine({ ...options, id: 'my-tooltip' }))
connector(service, tooltipConnect, options) // wires the consumer callbacks
service.start()
service.send({ type: 'pointer.enter' }) // opens after openDelay
```
