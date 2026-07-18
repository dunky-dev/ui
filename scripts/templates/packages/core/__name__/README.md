# @dunky.dev/__name__

The framework-agnostic __name__ interaction, modeled as a state machine on
`@dunky.dev/state-machine`. Pure logic — no substrate, no framework. Consumers
pair it with a substrate driver rather than driving the machine directly.

The behavior contract — scenarios, guarantees, driver obligations — lives in
[SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/__name__
```

## Usage

```ts
import { machine, connector } from '@dunky.dev/state-machine'
import { __camelName__Machine, __camelName__Connect } from '@dunky.dev/__name__'

const service = machine(__camelName__Machine(options))
connector(service, __camelName__Connect, options) // wires the consumer callbacks
service.start()
service.send({ type: 'SET_DISABLED', disabled: true })
```
