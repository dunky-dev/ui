# @dunky.dev/scroll-lock

Framework-free, reference-counted scroll lock for any scroll container — the
page body by default. The first holder saves the target's inline state and the
last release restores it, so overlapping holders (e.g. nested modal layers)
can release in any order. Locking pads for the vanished scrollbar so the
layout doesn't shift sideways.

Substrate hooks wrap this — e.g. `@dunky.dev/react-use-scroll-lock` — so every
framework inherits identical behavior.

## Install

```sh
npm install @dunky.dev/scroll-lock
```

## Usage

```ts
import { lockScroll } from '@dunky.dev/scroll-lock'

const releaseBody = lockScroll() // the page body
const releasePanel = lockScroll(panelElement) // any scroll container

// later — order doesn't matter, each target restores with its last holder
releaseBody()
releasePanel()
```
