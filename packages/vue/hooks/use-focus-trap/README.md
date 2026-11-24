# @dunky.dev/vue-use-focus-trap

Vue binding for [`@dunky.dev/dom-focus-trap`](../../../dom/utils/focus-trap):
`useFocusTrap(target)` traps Tab / Shift+Tab within the target container while
the component is mounted. The trap behavior itself is framework-free — this
composable only owns the Vue lifecycle.

## Install

```sh
npm install @dunky.dev/vue-use-focus-trap
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { isTopmostLayer } from '@dunky.dev/dom-overlay'
import { useFocusTrap } from '@dunky.dev/vue-use-focus-trap'

const props = defineProps<{ id: string }>()
const panel = ref<HTMLElement | null>(null)
// Only the overlay stack's topmost layer traps.
useFocusTrap(panel, { enabled: () => isTopmostLayer(props.id) })
</script>

<template>
  <div ref="panel" role="dialog">...</div>
</template>
```
