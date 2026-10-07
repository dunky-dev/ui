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
  <div ref="panel" role="dialog">...</div>
</template>
```

Vue-specific notes on top of the DOM contract:

- The target is a `MaybeRefOrGetter` — a template ref, a getter, or the
  element itself; a component counts as its root element (`$el`), read when
  the target resolves — `$el` isn't reactive, so a component that swaps its
  root element needs a ref on the element instead. The trap arms when the
  component mounts (a template ref has filled by then), re-arms when the
  target yields a new element, and releases on unmount. A `<KeepAlive>`
  deactivation releases it too and reactivation arms it again, as React's
  `<Activity>` runs an effect's cleanup; mounted into a view that is already
  deactivated, it waits for the view's return, and reached by a restored
  view's activation before it has mounted (an async component under
  `<Suspense>`), it waits for its own mount. Mounted hooks never run during
  server rendering, so the trap touches no DOM there.
- The options object is read on each Tab press, so inline `enabled` / `last`
  see the latest state without re-binding the listener — the per-press
  re-evaluation the DOM contract promises.

## API

### `useFocusTrap(target, options?)`

Returns nothing — the trap lives and dies with the component.

| Param     | Type                                                                            | Default | Description                                                                            |
| --------- | ------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| `target`  | `MaybeRefOrGetter<HTMLElement \| ComponentPublicInstance \| null \| undefined>` | —       | The container to trap Tab / Shift+Tab within.                                          |
| `options` | `UseFocusTrapOptions`                                                           | `{}`    | The DOM trap's options: `enabled?: () => boolean`, `last?: () => HTMLElement \| null`. |
