# @dunky.dev/toast

The framework-agnostic toast interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations (including
the timer wiring the substrate owns) — lives in [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/toast
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { toastMachine, toastConnect } from '@dunky.dev/toast'

// `id` is substrate-minted (SSR-safe); the connect derives the per-part ids.
const service = machine(toastMachine({ ...options, id: 'my-toast' }))
connector(service, toastConnect, options) // wires the consumer callbacks
service.start()
// the substrate's timer sends this when `context.duration` elapses in `open`
service.send({ type: 'timer.elapsed' })
```
