# @dunky.dev/merge-props

Merge consumer props with behavior props: behavior values win, except
handlers, which chain (consumer first, then behavior) so a consumer's
`onClick` still runs alongside the part's. Pure — no DOM, no framework;
usable from any substrate.

## Install

```sh
npm install @dunky.dev/merge-props
```

## Usage

```ts
import { mergeProps } from '@dunky.dev/merge-props'

const merged = mergeProps(consumerProps, toDomProps(api.parts.trigger))
```
