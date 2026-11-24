# @dunky.dev/vue-use-scroll-lock

Vue binding for [`@dunky.dev/dom-scroll-lock`](../../../dom/utils/scroll-lock):
`useScrollLock(locked, target?)` locks scrolling while the component is
mounted — on the page body, or on the `target` element when one is given (e.g.
a scoped surface locks its own container, not the page). The lock behavior
itself is framework-free — this composable only owns the Vue lifecycle.

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
