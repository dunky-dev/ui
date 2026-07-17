# @dunky.dev/dom-scroll-lock

Framework-free, reference-counted scroll lock for any scroll container — the
page body by default. The first holder saves the target's inline state and the
last release restores it, so overlapping holders (e.g. nested modal layers)
can release in any order. Locking pads for the vanished scrollbars with
logical properties — `padding-inline-end` for the vertical one, so RTL (where
the scrollbar sits left) is handled for free, and `padding-block-end` for the
horizontal one — so the layout doesn't shift.

Substrate hooks wrap this — e.g. `@dunky.dev/react-use-scroll-lock` — so every
framework inherits identical behavior.

## Install

```sh
npm install @dunky.dev/dom-scroll-lock
```

## Usage

```ts
import { lockScroll } from '@dunky.dev/dom-scroll-lock'

const releaseBody = lockScroll() // the page body
const releasePanel = lockScroll(panelElement) // any scroll container

// later — order doesn't matter, each target restores with its last holder
releaseBody()
releasePanel()
```
