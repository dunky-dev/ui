# SPEC / Vue / useFocusTrap

The Vue binding of the
[DOM focus-trap spec](../../../dom/utils/focus-trap/SPEC.md) — the trap
behavior is framework-free; this composable owns only the Vue lifecycle.

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
// `enabled` follows runtime state — here, only the overlay stack's
// topmost layer traps.
useFocusTrap(panel, { enabled: () => isTopmostLayer(props.id) })
</script>

<template>
  <dialog ref="panel">...</dialog>
</template>
```

Vue-specific notes on top of the DOM contract:

- The trap follows the target ref: it binds when the ref holds an element
  (a template ref fills after setup, so the binding must follow the ref,
  not the call site), releases when it clears or the component unmounts,
  and re-arms on a new element.
- Options are read through the composable's closure on every Tab press, so
  inline `enabled` / `last` see the latest state — the per-press
  re-evaluation the DOM contract promises — without ever re-binding the
  listener.

## API

### `useFocusTrap(target, options?)`

Returns nothing — the trap lives and dies with the component.

| Param     | Type                       | Default | Description                                                                            |
| --------- | -------------------------- | ------- | -------------------------------------------------------------------------------------- |
| `target`  | `Ref<HTMLElement \| null>` | —       | The container to trap Tab / Shift+Tab within.                                          |
| `options` | `UseFocusTrapOptions`      | `{}`    | The DOM trap's options: `enabled?: () => boolean`, `last?: () => HTMLElement \| null`. |
