---
'@dunky.dev/svelte-dialog': minor
---

New substrate: the Svelte binding for `@dunky.dev/dialog`, for Svelte 5 (peer
`svelte@^5.40.0`). The same compound anatomy and behavior contract as the
React and Solid bindings — one core machine, a new host — in Svelte's native
shape: `<Dialog>` with its parts hanging off it (`<Dialog.Trigger>`,
`<Dialog.Portal>`, `<Dialog.Content>`, ...), children as snippets, the core
options as plain props, and `onOpenChange` as a callback prop.

```svelte
<script lang="ts">
  import { Dialog } from '@dunky.dev/svelte-dialog'

  let open = $state(false)
</script>

<Dialog {open} onOpenChange={next => (open = next)} onEscapeKeyDown={() => (open = false)}>
  <Dialog.Trigger onclick={() => (open = true)}>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Viewport>
      <Dialog.Content>
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Description>Description</Dialog.Description>
        <Dialog.Close onclick={() => (open = false)}>Close</Dialog.Close>
      </Dialog.Content>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog>
```

The components ship uncompiled — `.svelte` files under the `svelte` export
condition — so your own Svelte compiles them, for the client and for SSR,
instead of a build tied to this repo's Svelte internals. `open` is
deliberately not bindable: a component can't tell `bind:open` from a passed
prop, and backing it would let an unbound controlled dialog move on its own.
Hold the state as above and decide dismissals at their source, per the core
contract. Every element part takes `bind:ref`; `Content`'s `initialFocus` and
`restoreFocus` take an element or a getter (`initialFocus={() => cancelButton}`),
since `bind:this` fills after a component initializes. Everything else follows
the core spec: layer stack with assistive-tech containment, focus trap with
Close as the cycle's last stop, scroll lock (scoped to the Portal container
when given), exit animations through `data-state="closing"`, and
`closeOnBack`.
