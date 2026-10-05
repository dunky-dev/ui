# SPEC / Vue / useScrollLock

The Vue binding of the
[DOM scroll-lock spec](../../../dom/utils/scroll-lock/SPEC.md) — the lock
behavior is framework-free; this composable owns only the Vue lifecycle.

## Install

```sh
npm install @dunky.dev/vue-use-scroll-lock
```

## Usage

```vue
<script setup lang="ts">
import { useScrollLock } from '@dunky.dev/vue-use-scroll-lock'

// Rendered while a modal layer is open, e.g. <ModalPanel v-if="open" />
useScrollLock() // the page behind can't scroll while mounted
</script>

<template>
  <div role="dialog">...</div>
</template>
```

Vue-specific notes on top of the DOM contract:

- The lock holds while the component is mounted and `locked` resolves true;
  unmounting or turning `locked` off releases it, and so does a `<KeepAlive>`
  deactivation — reactivation locks again, as React's `<Activity>` runs an
  effect's cleanup. Both parameters accept a
  `MaybeRefOrGetter` — a plain value, a ref, or a getter — so the lock
  tracks reactive state: a `target` change releases the old container and
  locks the new one.
- An omitted `target` means the page body. A target that resolves to
  `null` or `undefined` — a template ref before its element renders — means
  "no target yet" and locks nothing; the lock engages once the element
  resolves. Mounted hooks never run during server rendering, so there is no
  body to touch there.
- The DOM contract's shared per-container lock does the multi-holder
  arithmetic: several mounted lockers (nested modal layers) hold one lock,
  and the container restores when the last releases.

## API

### `useScrollLock(locked?, target?)`

Returns nothing — the lock lives and dies with the component.

| Param    | Type                                                 | Default       | Description                                                                                                                     |
| -------- | ---------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `locked` | `MaybeRefOrGetter<boolean>`                          | `true`        | Whether the lock is held.                                                                                                       |
| `target` | `MaybeRefOrGetter<HTMLElement \| null \| undefined>` | the page body | The scroll container to lock (e.g. a scoped surface locks its own container, not the page). `null` / `undefined` locks nothing. |
