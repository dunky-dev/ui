# @dunky.dev/scroll-lock

Framework-free, reference-counted body scroll lock. The first holder saves the
body's inline state and the last release restores it, so overlapping holders
(e.g. nested modal layers) can release in any order. Locking pads for the
vanished scrollbar so the page doesn't shift sideways.

Substrate hooks wrap this — e.g. `@dunky.dev/react-use-scroll-lock` — so every
framework inherits identical behavior.

## Usage

```ts
import { lockBodyScroll } from '@dunky.dev/scroll-lock'

const release = lockBodyScroll()
// later
release()
```
