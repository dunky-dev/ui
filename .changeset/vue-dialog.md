---
'@dunky.dev/vue-dialog': minor
---

New substrate: the Vue 3 binding for `@dunky.dev/dialog`. The same compound
anatomy and behavior contract as the React binding — one core machine, a new
host — delivered in Vue's native shape: the core options are props, the core
callbacks are emits, and `v-model:open` is the controlled contract
(`update:open` reports real transitions only; per the controlled contract a
dismissal on a controlled dialog emits nothing — decide it at its source in
the dismissal emits, which carry `preventDefault()` for the veto).

```vue
<script setup lang="ts">
import { Dialog } from '@dunky.dev/vue-dialog'
</script>

<template>
  <Dialog v-model:open="open" @escape-key-down="onEscape">
    <Dialog.Trigger>Open</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop />
      <Dialog.Viewport>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
</template>
```

`Content`'s `initialFocus` accepts a `MaybeRefOrGetter<HTMLElement | null>` —
the Vue idiom for "resolve at open time", so template refs that fill after
setup work. Everything else follows the core spec: native `<dialog>` window,
layer stack with assistive-tech containment, focus trap with Close as the
cycle's last stop, scroll lock (scoped to the Portal container when given),
exit animations through `data-state="closing"`, and `closeOnBack`.
