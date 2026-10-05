# SPEC / Svelte / useFocusTrap

The Svelte binding of the
[DOM focus-trap spec](../../../dom/utils/focus-trap/SPEC.md) — the trap
behavior is framework-free; this hook owns only the Svelte lifecycle.

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

Svelte-specific notes on top of the DOM contract:

- A rune module: call it while a component initializes, like `$effect`
  itself (or inside an `$effect.root`). The trap arms after mount — once
  `bind:this` has filled — and releases when the component is destroyed.
- The target is a getter, the same shape as the Solid hook's accessor: over
  `$state`, a new element re-arms the trap on it; over a plain variable, the
  element is read once, after mount. It is a hook rather than an attachment
  for that shared shape — and for the dialog, whose trap target is a part it
  already renders.
- Options are read per Tab press, so inline `enabled` / `last` getters see the
  latest state without re-binding the listener — the per-press re-evaluation
  the DOM contract promises.

## API

### `useFocusTrap(target, options?)`

Returns nothing — the trap lives and dies with the calling component.

| Param     | Type                                     | Default | Description                                                                            |
| --------- | ---------------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| `target`  | `() => HTMLElement \| null \| undefined` | —       | Getter for the container to trap Tab / Shift+Tab within.                               |
| `options` | `UseFocusTrapOptions`                    | `{}`    | The DOM trap's options: `enabled?: () => boolean`, `last?: () => HTMLElement \| null`. |
