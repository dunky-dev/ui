# @dunky.dev/vue-__name__

Vue binding for [`@dunky.dev/__name__`](../../core/__name__): a compound
component — `__Name__` plus its parts — that drives the framework-free
machine. The root owns the machine; parts translate the core's logical
bindings into DOM attributes and handlers.

Behavior contract: [`../../core/__name__/SPEC.md`](../../core/__name__/SPEC.md).
Vue-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/vue-__name__
```

## Usage

```vue
<script setup lang="ts">
import { __Name__ } from '@dunky.dev/vue-__name__'
</script>

<template>
  <__Name__ @disable="() => {}">
    <__Name__.Root>go</__Name__.Root>
  </__Name__>
</template>
```
