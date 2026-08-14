# @dunky.dev/vue-dialog

Vue binding for [`@dunky.dev/dialog`](../../core/dialog): a compound
component — `Dialog` plus its parts — that drives the framework-free dialog
machine. The root owns the machine; parts translate the core's logical
bindings into DOM attributes and handlers, and wire the DOM-only concerns
(teleport, focus trap, scroll lock, layer stack).

Behavior contract: [`../../core/dialog/SPEC.md`](../../core/dialog/SPEC.md).
Vue-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/vue-dialog
```

## Usage

```vue
<script setup lang="ts">
import { Dialog } from '@dunky.dev/vue-dialog'
</script>

<template>
  <Dialog>
    <Dialog.Trigger>Delete...</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop />
      <Dialog.Viewport>
        <Dialog.Content>
          <Dialog.Title>Delete file?</Dialog.Title>
          <Dialog.Description>This cannot be undone.</Dialog.Description>
          <button type="button">Delete</button>
          <Dialog.Close>Cancel</Dialog.Close>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog>
</template>
```
