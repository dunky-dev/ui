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
  import { isTopmostLayer } from '@dunky.dev/dom-overlay'
  import { useFocusTrap } from '@dunky.dev/svelte-use-focus-trap'

  let { id }: { id: string } = $props()
  let panel: HTMLDivElement | null = $state(null)
  // `enabled` follows runtime state — here, only the overlay stack's
  // topmost layer traps.
  useFocusTrap(() => panel, { enabled: () => isTopmostLayer(id) })
</script>

<div bind:this={panel} role="dialog">...</div>
```
