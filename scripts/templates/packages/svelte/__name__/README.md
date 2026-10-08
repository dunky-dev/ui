# @dunky.dev/svelte-__name__

Svelte binding for [`@dunky.dev/__name__`](../../core/__name__): a compound
component — `__Name__` plus its parts — that drives the framework-free
machine. The root owns the machine; parts translate the core's logical
bindings into DOM attributes and handlers.

Behavior contract: [`../../core/__name__/SPEC.md`](../../core/__name__/SPEC.md).
Svelte-specific surface: [SPEC.md](./SPEC.md).

## Install

```sh
npm install @dunky.dev/svelte-__name__
```

## Usage

```svelte
<script lang="ts">
  import { __Name__ } from '@dunky.dev/svelte-__name__'
</script>

<__Name__ disable={() => {}}>
  <__Name__.Root>go</__Name__.Root>
</__Name__>
```
