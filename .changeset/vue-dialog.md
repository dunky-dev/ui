---
'@dunky.dev/vue-dialog': minor
---

New substrate: the Vue binding for `@dunky.dev/dialog`, targeting Vue 3.5+
(peer `vue@^3.5.0` — the base id comes from `useId`, so server-rendered ids
survive hydration). The same compound anatomy and behavior contract as the
React and Solid bindings — one core machine, a new host — delivered in Vue's
native shape: the core options are props, the core callbacks are emits, and
`v-model:open` binds the controlled pair. Listeners run synchronously, so
`preventDefault()` on a dismissal payload still vetoes it. `update:open`
reports a change, it never requests one: per the controlled contract a
controlled dialog — `v-model:open` included — doesn't move on its own Trigger,
Escape, or outside press, so wire each intent at its source.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Dialog } from '@dunky.dev/vue-dialog'

const open = ref(false)
</script>

<template>
  <Dialog v-model:open="open" @escape-key-down="open = false">
    <Dialog.Trigger @click="open = true">Open</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop />
      <Dialog.Viewport>
        <Dialog.Content>
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Description>Description</Dialog.Description>
          <Dialog.Close @click="open = false">Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
</template>
```

An uncontrolled `<Dialog>` needs none of that: its own parts open and close
it, and an absent boolean prop keeps the core default rather than Vue's
`false` cast — `<Dialog>` is modal and uncontrolled, `<Dialog default-open>`
starts open. `Content`'s `initialFocus` and `restoreFocus` accept an element,
a ref, or a getter, resolved at open and close time; a template unwraps refs
before the element mounts, so it passes a getter
(`:initial-focus="() => cancelButton"`). The Portal renders nothing on the
server and teleports once mounted, so hydration matches; under `<KeepAlive>`
a cached dialog parks its layers off the page, state intact, until the view
returns. Everything else
follows the core spec: a `div` window with the dialog role, layer stack with
assistive-tech containment, focus trap with Close as the cycle's last stop,
scroll lock (scoped to the Portal container when given), exit animations
through `data-state="closing"`, and `closeOnBack` with the Forward reopen.
