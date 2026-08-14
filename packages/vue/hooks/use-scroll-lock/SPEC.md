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

- The lock holds while the component is mounted and `locked` is true;
  unmounting or turning `locked` off releases it. A `target` change
  releases the old container and locks the new one. Both parameters
  accept a plain value, a ref, or a getter — the lock follows them
  reactively.
- The DOM contract's shared per-container lock does the multi-holder
  arithmetic: several mounted lockers (nested modal layers) hold one lock,
  and the container restores when the last unmounts.

## API

### `useScrollLock(locked?, target?)`

Returns nothing — the lock lives and dies with the component.

| Param    | Type                                    | Default       | Description                                                                                 |
| -------- | --------------------------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `locked` | `MaybeRefOrGetter<boolean>`             | `true`        | Whether the lock is held.                                                                   |
| `target` | `MaybeRefOrGetter<HTMLElement \| null>` | the page body | The scroll container to lock (e.g. a scoped surface locks its own container, not the page). |
