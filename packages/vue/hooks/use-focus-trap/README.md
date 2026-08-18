# @dunky.dev/vue-use-focus-trap

Vue binding for [`@dunky.dev/dom-focus-trap`](../../../dom/utils/focus-trap):
`useFocusTrap(ref)` traps Tab / Shift+Tab within the referenced container while
it exists. The trap behavior itself is framework-free — this composable only
owns the Vue lifecycle.

## Install

```sh
npm install @dunky.dev/vue-use-focus-trap
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useFocusTrap } from '@dunky.dev/vue-use-focus-trap'

const panel = ref<HTMLElement | null>(null)
useFocusTrap(panel, { enabled: () => isTopmost(panel.value) })
</script>

<template>
  <dialog ref="panel">...</dialog>
</template>
```
