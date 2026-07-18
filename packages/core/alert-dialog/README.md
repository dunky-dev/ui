# @dunky.dev/alert-dialog

The framework-agnostic alert-dialog interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/alert-dialog
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { alertDialogMachine, alertDialogConnect } from '@dunky.dev/alert-dialog'

// `id` is substrate-minted (SSR-safe); the connect derives the per-part ids.
const service = machine(alertDialogMachine({ ...options, id: 'my-alert-dialog' }))
connector(service, alertDialogConnect, options) // wires the consumer callbacks
service.start()
service.send({ type: 'toggle' })
```
