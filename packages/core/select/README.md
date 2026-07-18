# @dunky.dev/select

The framework-agnostic select interaction — a single-choice dropdown listbox
following the WAI-ARIA select-only combobox pattern — modeled as a state
machine on `@dunky.dev/state-machine`. Pure logic — no substrate, no
framework. Consumers pair it with a substrate driver rather than driving the
machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/select
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { selectMachine, selectConnect } from '@dunky.dev/select'

// `id` is substrate-minted (SSR-safe); the connect derives the per-part ids.
const service = machine(selectMachine({ ...options, id: 'my-select' }))
connector(service, selectConnect, options) // wires the consumer callbacks
service.start()

// The driver reports the rendered options from its item lifecycle.
service.send({ type: 'item.register', item: { value: 'apple', label: 'Apple', disabled: false } })
service.send({ type: 'toggle' })
service.send({ type: 'select', value: 'apple' })
```
