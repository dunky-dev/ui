# SPEC / Svelte / useScrollLock

The Svelte binding of the
[DOM scroll-lock spec](../../../dom/utils/scroll-lock/SPEC.md) — the lock
behavior is framework-free; this hook owns only the Svelte lifecycle.

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

Svelte-specific notes on top of the DOM contract:

- A rune module: call it while a component initializes, like `$effect`
  itself (or inside an `$effect.root`). The lock holds after mount while
  `locked` resolves true; destroying the component or turning `locked` off
  releases it.
- Both parameters accept a `MaybeGetter` — a static value or a getter — so the
  lock tracks reactive state: a getter over `$state` re-runs it, and a
  `target` change releases the old container and locks the new one.
- An omitted `target` means the page body; `null` means "no target yet" and
  locks nothing — a getter over a `bind:this` element engages the lock once
  the node resolves.
- The DOM contract's shared per-container lock does the multi-holder
  arithmetic: several live lockers (nested modal layers) hold one lock, and
  the container restores when the last releases.

## API

### `useScrollLock(locked?, target?)`

Returns nothing — the lock lives and dies with the calling component.

| Param    | Type                                            | Default       | Description                                                                                                       |
| -------- | ----------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `locked` | `MaybeGetter<boolean>`                          | `true`        | Whether the lock is held.                                                                                         |
| `target` | `MaybeGetter<HTMLElement \| null \| undefined>` | the page body | The scroll container to lock (e.g. a scoped surface locks its own container, not the page). `null` locks nothing. |
