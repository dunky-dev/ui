# @dunky.dev/combobox

The framework-agnostic combobox interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/combobox
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { comboboxMachine, comboboxConnect } from '@dunky.dev/combobox'

// `id` is substrate-minted (SSR-safe); the connect derives the per-part ids.
const service = machine(comboboxMachine({ ...options, id: 'my-combobox' }))
connector(service, comboboxConnect, options) // wires the consumer callbacks
service.start()

// The substrate reports the rendered suggestions; the machine navigates them.
service.send({ type: 'item.register', item: { value: 'apple', label: 'Apple', disabled: false } })
service.send({ type: 'input', value: 'ap' }) // typing opens the list
service.send({ type: 'highlight.next' })
service.send({ type: 'select' }) // commits: value 'apple', input text 'Apple'
```
