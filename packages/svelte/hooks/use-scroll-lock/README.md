# @dunky.dev/svelte-use-scroll-lock

Svelte binding for [`@dunky.dev/dom-scroll-lock`](../../../dom/utils/scroll-lock):
`useScrollLock(locked, target?)` locks scrolling while the calling component
lives — on the page body, or on the `target` element when one is given (e.g. a
scoped surface locks its own container, not the page). The lock behavior
itself is framework-free — this hook only owns the Svelte lifecycle.

## Install

```sh
npm install @dunky.dev/svelte-use-scroll-lock
```

## Usage

```svelte
<!-- Rendered while a modal layer is open, e.g. {#if open}<ModalPanel />{/if} -->
<script lang="ts">
  import { useScrollLock } from '@dunky.dev/svelte-use-scroll-lock'

  useScrollLock() // the page behind can't scroll while mounted
</script>

<div role="dialog">...</div>
```
