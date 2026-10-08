---
'@dunky.dev/svelte-use-focus-trap': minor
'@dunky.dev/svelte-use-scroll-lock': minor
---

New substrate: the Svelte lifecycle wrappers over the framework-free DOM
utils, in the Solid hooks' shape, for Svelte 5 — the substrate's one peer
range, `svelte` `>=5.20.0 <5.33.5 || ^5.34.5`. Both are rune modules: call
them while a component initializes, like `$effect`.
`useFocusTrap(target, options?)` takes a getter for the container — over
`$state`, a new element re-arms the trap — and `useScrollLock(locked?, target?)`
accepts a `MaybeGetter` for both parameters, so the lock tracks reactive
state. The behavior itself lives in `@dunky.dev/dom-focus-trap` and
`@dunky.dev/dom-scroll-lock`; these packages own only the lifecycle, and ship
uncompiled for your Svelte to compile.

```svelte
<script lang="ts">
  import { useFocusTrap } from '@dunky.dev/svelte-use-focus-trap'
  import { useScrollLock } from '@dunky.dev/svelte-use-scroll-lock'

  let panel: HTMLDivElement | null = $state(null)
  useFocusTrap(() => panel)
  useScrollLock()
</script>

<div bind:this={panel} role="dialog" tabindex="-1">...</div>
```
