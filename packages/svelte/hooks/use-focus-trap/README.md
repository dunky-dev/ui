# @dunky.dev/svelte-use-focus-trap

Svelte binding for [`@dunky.dev/dom-focus-trap`](../../../dom/utils/focus-trap):
`useFocusTrap(target)` traps Tab / Shift+Tab within the container the getter
yields, while the calling component lives. The trap behavior itself is
framework-free — this hook only owns the Svelte lifecycle.

## Install

```sh
npm install @dunky.dev/svelte-use-focus-trap
```

## Usage

```svelte
<script lang="ts">
  import { useFocusTrap } from '@dunky.dev/svelte-use-focus-trap'

  let panel: HTMLDivElement | null = $state(null)
  useFocusTrap(() => panel, { enabled: () => isTopmost(panel) })
</script>

<div bind:this={panel} role="dialog">...</div>
```
