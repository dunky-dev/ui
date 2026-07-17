# @dunky.dev/dom-bindings

The substrate-neutral logical-bindings vocabulary (`LogicalBindings`) and its
DOM translation (`toDomProps`). A core package's connect emits logical
bindings per part — the core decides WHAT a part carries; this package decides
HOW it lands on a DOM host (`labelledBy` -> `aria-labelledby`, `onPress` ->
`onClick`, ...). JSX-style substrates (react, vue, solid) spread the result
as-is.

Core packages never import this — they narrow the vocabulary structurally with
their own local PartBindings types. New logical keys are added here so every
substrate's translation picks them up.

## Install

```sh
npm install @dunky.dev/dom-bindings
```

## Usage

```ts
import { toDomProps } from '@dunky.dev/dom-bindings'

const props = toDomProps(api.parts.trigger)
// { 'aria-expanded': true, 'aria-controls': '...', onClick: [Function], ... }
```
