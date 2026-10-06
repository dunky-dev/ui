<script lang="ts">
  import type { Snippet } from 'svelte'
  import { setDialogContext, useDialogContext } from './context.js'

  // The Portal's mounted tree: the portalled parts render here, in the target.
  let { children, container }: { children?: Snippet; container: HTMLElement | null } = $props()

  const dialog = useDialogContext()
  // A component's own effects run after every effect in its tree, every
  // part's `bind:this` included — so this one marks the layer bound.
  let bound = $state(false)
  $effect(() => {
    bound = true
  })
  // Re-provide the context with the scoped container (null = page body) so
  // Content locks the right scroll surface, and with the bound flag.
  setDialogContext({
    get api() {
      return dialog.api
    },
    machine: dialog.machine,
    depth: dialog.depth,
    get container() {
      return container
    },
    backdropRef: dialog.backdropRef,
    get bound() {
      return bound
    },
  })
</script>

{@render children?.()}
